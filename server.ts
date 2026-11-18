import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, language: 'pt-PT' });
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
