import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_PT_PT_VOICES = new Set([
  'pt-PT-RaquelNeural',
  'pt-PT-DuarteNeural',
]);

type PtPtVoiceId = 'pt-PT-RaquelNeural' | 'pt-PT-DuarteNeural';

const ttsCache = new Map<string, Buffer>();
const MAX_TTS_CACHE = 150;

function setCacheEntry(key: string, buf: Buffer) {
  if (ttsCache.has(key)) {
    ttsCache.delete(key);
  } else if (ttsCache.size >= MAX_TTS_CACHE) {
    const oldestKey = ttsCache.keys().next().value;
    if (oldestKey) ttsCache.delete(oldestKey);
  }
  ttsCache.set(key, buf);
}

async function synthesizeWithEdgePtPt(text: string, voice: PtPtVoiceId): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buf = Buffer.concat(chunks);
    if (buf.length === 0) {
      throw new Error('Empty audio stream from Edge TTS');
    }
    return buf;
  } finally {
    try {
      tts.close();
    } catch {
      // Ignore close errors
    }
  }
}

async function synthesizeWithGooglePtPt(text: string): Promise<Buffer> {
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-PT&q=' +
    encodeURIComponent(text);
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    throw new Error(`Fallback pt-PT TTS failed with status ${res.status}`);
  }
  const arr = await res.arrayBuffer();
  const buf = Buffer.from(arr);
  if (buf.length === 0) {
    throw new Error('Empty audio from fallback pt-PT TTS');
  }
  return buf;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '1mb' }));

  const createGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  const isTransientGeminiError = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err ?? '');
    return /503|UNAVAILABLE|high demand|overloaded|temporarily|ECONNRESET|ETIMEDOUT/i.test(msg);
  };

  const formatGeminiErrorPt = (err: unknown, fallbackMessage: string): { status: number; message: string } => {
    const msg = err instanceof Error ? err.message : String(err ?? '');
    if (/403|PERMISSION_DENIED|API_KEY_INVALID/i.test(msg)) {
      return {
        status: 403,
        message: 'A chave da API Gemini não tem permissão ou é inválida. Verifique Settings > Secrets.',
      };
    }
    if (/429|RESOURCE_EXHAUSTED/i.test(msg)) {
      return {
        status: 429,
        message: 'Limite temporário de pedidos atingido. Aguarde alguns segundos e tente novamente.',
      };
    }
    if (isTransientGeminiError(err)) {
      return {
        status: 503,
        message: 'O serviço de estudo bíblico está com elevada procura neste instante. Tente novamente dentro de alguns segundos.',
      };
    }
    return { status: 502, message: fallbackMessage };
  };

  const generateWithFallback = async (
    ai: GoogleGenAI,
    contents: string,
    config: {
      systemInstruction: string;
      responseMimeType?: string;
      responseSchema?: Record<string, unknown>;
    }
  ) => {
    const attempts: Array<{ model: string; useThinking: boolean; delayMs: number }> = [
      { model: 'gemini-4-hydrogen', useThinking: true, delayMs: 0 },
      { model: 'gemini-4-hydrogen', useThinking: true, delayMs: 700 },
      { model: 'gemini-3.1-flash-lite', useThinking: false, delayMs: 300 },
    ];

    let lastErr: unknown;
    for (const attempt of attempts) {
      if (attempt.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, attempt.delayMs));
      }
      try {
        return await ai.models.generateContent({
          model: attempt.model,
          contents,
          config: {
            ...config,
            ...(attempt.useThinking
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });
      } catch (err) {
        lastErr = err;
        if (!isTransientGeminiError(err)) {
          throw err;
        }
      }
    }
    throw lastErr;
  };

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, language: 'pt-PT' });
  });

  app.post('/api/bible-study', async (req: Request, res: Response) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'A chave GEMINI_API_KEY não está configurada neste servidor. Verifique Settings > Secrets.',
      });
      return;
    }

    const body = (req.body ?? {}) as {
      scope?: unknown;
      bookName?: unknown;
      testament?: unknown;
      totalChapters?: unknown;
      chapter?: unknown;
      verse?: unknown;
      verseCount?: unknown;
      version?: unknown;
      verseText?: unknown;
      chapterText?: unknown;
      selectedExcerpt?: unknown;
      surroundingContext?: unknown;
    };

    const scope =
      body.scope === 'book' ? 'book' : body.scope === 'chapter' ? 'chapter' : 'verse';
    const bookName = typeof body.bookName === 'string' ? body.bookName.trim() : '';
    const testament =
      body.testament === 'NT'
        ? 'Novo Testamento'
        : body.testament === 'AT'
          ? 'Antigo Testamento'
          : '';
    const totalChapters = Number(body.totalChapters);
    const chapter = Number(body.chapter);
    const verse = Number(body.verse);
    const verseCount = Number(body.verseCount);
    const version = typeof body.version === 'string' ? body.version.trim() : 'NVI';
    const verseText = typeof body.verseText === 'string' ? body.verseText.trim() : '';
    const chapterText =
      typeof body.chapterText === 'string' ? body.chapterText.trim().slice(0, 8000) : '';
    const selectedExcerpt =
      typeof body.selectedExcerpt === 'string' ? body.selectedExcerpt.trim() : '';
    const surroundingContext =
      typeof body.surroundingContext === 'string' ? body.surroundingContext.trim() : '';

    if (scope === 'book') {
      if (!bookName) {
        res.status(400).json({
          error: 'Indique o livro bíblico que pretende estudar.',
        });
        return;
      }
    } else if (scope === 'chapter') {
      if (!bookName || !Number.isFinite(chapter) || chapter < 1) {
        res.status(400).json({
          error: 'Indique o livro e o capítulo que pretende estudar.',
        });
        return;
      }
    } else if (!bookName || !Number.isFinite(chapter) || !Number.isFinite(verse) || !verseText) {
      res.status(400).json({
        error: 'Dados insuficientes para estudar a passagem selecionada.',
      });
      return;
    }

    const systemInstruction = [
      'És um estudioso bíblico, teólogo evangélico histórico-ortodoxo e professor de exegese de referência.',
      'Responde SEMPRE em Português de Portugal (PT-PT) culto, claro, pastoral e rigoroso.',
      'Segue o método histórico-gramatical e canónico (semelhante a estudos bíblicos aprofundados com acesso às línguas originais).',
      'Analisa com precisão o texto bíblico indicado, distinguindo factos textuais/linguísticos de interpretações debatidas.',
      'Quando houver palavras relevantes em Hebraico, Aramaico ou Grego (BHS / NA28), inclui o termo original, a transliteração e o valor semântico.',
      'Na aplicação prática, evita moralismo superficial ou alegorização arbitrária: liga sempre a aplicação ao ponto teológico legítimo do texto no contexto da Bíblia inteira.',
      'Indica fontes e referências verificáveis (passagens bíblicas paralelas, léxicos clássicos como BDAG/HALOT/Strong quando aplicável, ou tradições exegéticas reconhecidas). Nunca inventes citações falsas.',
    ].join(' ');

    const userPrompt =
      scope === 'book'
        ? [
            `Livro bíblico completo em estudo: ${bookName}${testament ? ` (${testament})` : ''}${Number.isFinite(totalChapters) && totalChapters > 0 ? ` — ${totalChapters} capítulos` : ''} (versão de referência: ${version})`,
            'Produz um estudo panorâmico e exegético COMPLETO de todo este livro bíblico, preenchendo OBRIGATORIAMENTE todos os campos:',
            '1) mainPoint: Tema central, tese principal e propósito do livro inteiro (3 a 5 frases).',
            '2) theologicalExplanation: Grandes temas teológicos do livro — o que este livro revela sobre Deus, a salvação, o ser humano e a vida do povo de Deus.',
            '3) historicalContext: Autoria (incluindo evidências internas e tradição), data aproximada, destinatários originais e situação histórica/cultural em que o livro foi escrito.',
            '4) literaryContext: Género literário, características de estilo e um ESBOÇO ESTRUTURAL completo do livro por blocos de capítulos (com lista clara de secções e intervalos de capítulos).',
            '5) canonicalContext: Papel do livro na narrativa bíblica global, ecos intertextuais e como aponta para Cristo e para a Nova Aliança.',
            '6) keyWords: 3 a 4 termos-chave recorrentes no idioma original do livro (Hebraico, Aramaico ou Grego) com transliteração, significado lexical e importância teológica na obra toda.',
            '7) interpretiveQuestions: 2 a 4 questões interpretativas importantes, debates clássicos ou cuidados hermenêuticos essenciais para ler este livro com fidelidade.',
            '8) practicalApplication: Aplicação prática responsável da mensagem do livro inteiro para a igreja e a vida cristã hoje.',
            '9) sources: 4 a 5 passagens-chave do próprio livro, textos originais (BHS/NA28) e obras de introdução/comentários bíblicos reconhecidos.',
          ].join('\n\n')
        : scope === 'chapter'
          ? [
              `Capítulo bíblico completo em estudo: ${bookName} ${chapter}${testament ? ` (${testament})` : ''}${Number.isFinite(verseCount) && verseCount > 0 ? ` — ${verseCount} versículos` : ''} (versão ${version})`,
              chapterText ? `Texto completo do capítulo:\n${chapterText}` : '',
              'Produz um estudo exegético COMPLETO de todo este capítulo bíblico, preenchendo OBRIGATORIAMENTE todos os campos:',
              '1) mainPoint: Mensagem central e tese unificadora de todo o capítulo (3 a 4 frases).',
              '2) theologicalExplanation: Exposição teológica completa do capítulo — o que o capítulo inteiro ensina sobre Deus, a obra de Cristo, a salvação e a vida de fé.',
              '3) historicalContext: Contexto histórico, cultural, geográfico e situação dos destinatários neste momento específico do livro.',
              '4) literaryContext: Género literário e ESTRUTURA PASSO A PASSO do capítulo por blocos de versículos (ex.: v. 1–2, v. 3–5, etc.), explicando o desenvolvimento do pensamento do início ao fim do capítulo.',
              '5) canonicalContext: Como este capítulo se liga aos capítulos vizinhos, ao argumento do livro inteiro e à teologia bíblica de toda a Escritura / Cristo.',
              '6) keyWords: 3 a 4 palavras-chave importantes no idioma original (Hebraico, Aramaico ou Grego) presentes neste capítulo, com transliteração, significado e papel no texto.',
              '7) interpretiveQuestions: 2 a 3 questões interpretativas, nuances de tradução ou pontos debatidos relevantes neste capítulo.',
              '8) practicalApplication: Aplicação prática responsável nascida da leitura do capítulo completo, evitando isolar versículos fora do seu fluxo.',
              '9) sources: 3 a 5 passagens bíblicas paralelas, textos originais (BHS/NA28) e léxicos/comentários de referência.',
            ]
              .filter(Boolean)
              .join('\n\n')
          : [
              `Passagem: ${bookName} ${chapter}:${verse} (versão ${version})`,
              `Texto do versículo: «${verseText}»`,
              selectedExcerpt ? `Trecho destacado pelo utilizador: «${selectedExcerpt}»` : '',
              surroundingContext ? `Contexto imediato no capítulo:\n${surroundingContext}` : '',
              'Produz um estudo exegético completo desta passagem preenchendo OBRIGATORIAMENTE todos os campos: ponto principal, explicação teológica, contexto histórico, contexto literário, contexto canónico, pelo menos 2 a 3 palavras-chave no idioma original (Hebraico/Aramaico/Grego com transliteração e significado), 2 a 3 questões interpretativas relevantes, aplicação prática responsável e 3 a 4 fontes/referências bíblicas e léxicas verificáveis.',
            ]
              .filter(Boolean)
              .join('\n\n');

    try {
      const response = await generateWithFallback(ai, userPrompt, {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'mainPoint',
            'theologicalExplanation',
            'historicalContext',
            'literaryContext',
            'canonicalContext',
            'keyWords',
            'interpretiveQuestions',
            'practicalApplication',
            'sources',
          ],
          properties: {
            mainPoint: {
              type: Type.STRING,
              description:
                scope === 'book'
                  ? 'Tema central e propósito global do livro inteiro (3-5 frases).'
                  : scope === 'chapter'
                    ? 'Mensagem central e tese unificadora do capítulo completo (3-4 frases).'
                    : 'Resumo claro e direto do ponto principal da passagem (2-4 frases).',
            },
            theologicalExplanation: {
              type: Type.STRING,
              description:
                scope === 'book'
                  ? 'Grandes doutrinas e mensagem teológica principal de todo o livro.'
                  : scope === 'chapter'
                    ? 'Exposição teológica completa do capítulo inteiro.'
                    : 'Explicação teológica fiel ao texto, explicando o que o texto revela sobre Deus, a salvação e a vida cristã.',
            },
            historicalContext: {
              type: Type.STRING,
              description:
                scope === 'book'
                  ? 'Autoria, data aproximada, destinatários originais e contexto histórico-cultural do livro.'
                  : 'Contexto histórico, cultural, geográfico e situação dos destinatários originais.',
            },
            literaryContext: {
              type: Type.STRING,
              description:
                scope === 'book'
                  ? 'Género literário, recursos de estilo e esboço estrutural completo do livro por blocos de capítulos.'
                  : scope === 'chapter'
                    ? 'Género literário e estrutura passo a passo do capítulo por blocos de versículos.'
                    : 'Género literário, estrutura argumentativa do livro e ligação com os versículos anteriores e seguintes.',
            },
            canonicalContext: {
              type: Type.STRING,
              description:
                'Como este texto, capítulo ou livro se insere na teologia bíblica de toda a Escritura e aponta para Cristo ou para a Nova Aliança.',
            },
            keyWords: {
              type: Type.ARRAY,
              description:
                'Pelo menos 2 a 4 palavras-chave no texto original (Hebraico, Aramaico ou Grego).',
              items: {
                type: Type.OBJECT,
                required: ['originalWord', 'transliteration', 'language', 'meaning', 'significance'],
                properties: {
                  originalWord: {
                    type: Type.STRING,
                    description: 'Palavra no alfabeto original (hebraico/aramaico/grego).',
                  },
                  transliteration: {
                    type: Type.STRING,
                    description: 'Transliteração legível.',
                  },
                  language: {
                    type: Type.STRING,
                    description: 'Hebraico, Aramaico ou Grego.',
                  },
                  meaning: {
                    type: Type.STRING,
                    description: 'Significado lexical principal.',
                  },
                  significance: {
                    type: Type.STRING,
                    description: 'Importância gramatical ou teológica específica.',
                  },
                },
              },
            },
            interpretiveQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                'Pelo menos 2 questões interpretativas relevantes, nuances gramaticais ou leituras teológicas comparadas com equilíbrio.',
            },
            practicalApplication: {
              type: Type.STRING,
              description:
                'Aplicação prática responsável, ancorada no sentido original do texto, capítulo ou livro, evitando tirar passagens de contexto.',
            },
            sources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                'Lista de 3 a 5 passagens bíblicas paralelas/chave, textos originais (BHS/NA28) e obras léxicas/comentários de referência.',
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiErrorPt(
        err,
        'Não foi possível gerar o estudo bíblico neste momento. Tente novamente.'
      );
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/bible-study/chat', async (req: Request, res: Response) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'A chave GEMINI_API_KEY não está configurada neste servidor. Verifique Settings > Secrets.',
      });
      return;
    }

    const body = (req.body ?? {}) as {
      target?: {
        scope?: string;
        bookName?: string;
        testament?: string;
        totalChapters?: number;
        chapter?: number;
        verse?: number;
        verseCount?: number;
        version?: string;
        verseText?: string;
        chapterText?: string;
        selectedExcerpt?: string;
        surroundingContext?: string;
      };
      history?: Array<{ role?: string; text?: string }>;
      question?: unknown;
    };

    const target = body.target ?? {};
    const scope =
      target.scope === 'book' ? 'book' : target.scope === 'chapter' ? 'chapter' : 'verse';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question || !target.bookName || (scope === 'verse' && !target.verseText)) {
      res.status(400).json({ error: 'Escreva uma pergunta sobre o estudo selecionado.' });
      return;
    }

    const historyLines = Array.isArray(body.history)
      ? body.history
          .slice(-8)
          .map((m) => `${m.role === 'assistant' ? 'Professor' : 'Utilizador'}: ${String(m.text ?? '')}`)
          .join('\n')
      : '';

    const systemInstruction = [
      'És um tutor especializado em Teologia Bíblica, Línguas Originais (Hebraico, Aramaico e Grego) e Hermenêutica.',
      'Responde sempre em Português de Portugal (PT-PT), de forma clara, estruturada, fiel ao texto bíblico e respeitosa.',
      scope === 'book'
        ? 'Fundamenta a tua resposta no panorama completo do livro bíblico em estudo (estrutura, autoria, propósito, temas centrais, termos originais e lugar no cânone), citando capítulos e versículos do livro para orientar a leitura.'
        : scope === 'chapter'
          ? 'Fundamenta a tua resposta no capítulo bíblico completo em estudo (fluxo por blocos de versículos, contexto histórico e literário, termos no original e ligação com o livro), citando versículos específicos do capítulo.'
          : 'Fundamenta a tua resposta no contexto imediato, literário, histórico e canónico da passagem selecionada, citando palavras no original e referências bíblicas quando útil.',
    ].join(' ');

    const testamentLabel =
      target.testament === 'NT'
        ? 'Novo Testamento'
        : target.testament === 'AT'
          ? 'Antigo Testamento'
          : '';

    const prompt =
      scope === 'book'
        ? [
            `Livro bíblico inteiro em estudo: ${target.bookName}${testamentLabel ? ` (${testamentLabel})` : ''}${target.totalChapters ? ` — ${target.totalChapters} capítulos` : ''} (${target.version ?? 'NVI'})`,
            historyLines ? `Histórico recente da conversa:\n${historyLines}` : '',
            `Pergunta do utilizador sobre o livro: ${question}`,
          ]
            .filter(Boolean)
            .join('\n\n')
        : scope === 'chapter'
          ? [
              `Capítulo bíblico completo em estudo: ${target.bookName} ${target.chapter ?? 1}${testamentLabel ? ` (${testamentLabel})` : ''}${target.verseCount ? ` — ${target.verseCount} versículos` : ''} (${target.version ?? 'NVI'})`,
              target.chapterText ? `Texto do capítulo:\n${String(target.chapterText).slice(0, 7500)}` : '',
              historyLines ? `Histórico recente da conversa:\n${historyLines}` : '',
              `Pergunta do utilizador sobre o capítulo: ${question}`,
            ]
              .filter(Boolean)
              .join('\n\n')
          : [
              `Passagem em estudo: ${target.bookName} ${target.chapter}:${target.verse} (${target.version ?? 'NVI'})`,
              `Texto completo do versículo: «${target.verseText}»`,
              target.selectedExcerpt ? `Trecho focado pelo utilizador: «${target.selectedExcerpt}»` : '',
              target.surroundingContext ? `Contexto ao redor:\n${target.surroundingContext}` : '',
              historyLines ? `Histórico recente da conversa:\n${historyLines}` : '',
              `Pergunta do utilizador: ${question}`,
            ]
              .filter(Boolean)
              .join('\n\n');

    try {
      const response = await generateWithFallback(ai, prompt, {
        systemInstruction,
      });
      res.json({ answer: (response.text ?? '').trim() });
    } catch (err) {
      const formatted = formatGeminiErrorPt(
        err,
        'Não foi possível responder à sua pergunta neste momento. Tente novamente.'
      );
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.get('/api/tts', async (req: Request, res: Response) => {
    const rawText = typeof req.query.text === 'string' ? req.query.text.trim() : '';
    const rawVoice = typeof req.query.voice === 'string' ? req.query.voice.trim() : 'pt-PT-RaquelNeural';

    if (!rawText) {
      res.status(400).json({ error: 'Parâmetro "text" em falta.' });
      return;
    }

    const text = rawText.slice(0, 480);
    const voice: PtPtVoiceId = ALLOWED_PT_PT_VOICES.has(rawVoice)
      ? (rawVoice as PtPtVoiceId)
      : 'pt-PT-RaquelNeural';

    const cacheKey = `${voice}::${text}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-TTS-Locale', 'pt-PT');
      res.setHeader('X-TTS-Voice', voice);
      res.send(cached);
      return;
    }

    try {
      let audioBuf: Buffer;
      try {
        audioBuf = await synthesizeWithEdgePtPt(text, voice);
      } catch {
        audioBuf = await synthesizeWithGooglePtPt(text);
      }
      setCacheEntry(cacheKey, audioBuf);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-TTS-Locale', 'pt-PT');
      res.setHeader('X-TTS-Voice', voice);
      res.send(audioBuf);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao sintetizar áudio pt-PT';
      res.status(502).json({ error: msg });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.webmanifest')) {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          }
        },
      })
    );
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IEB Horta server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
