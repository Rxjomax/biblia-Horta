import type { IncomingMessage, ServerResponse } from 'node:http';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const ALLOWED_PT_PT_VOICES = new Set([
  'pt-PT-RaquelNeural',
  'pt-PT-DuarteNeural',
]);

type PtPtVoiceId = 'pt-PT-RaquelNeural' | 'pt-PT-DuarteNeural';

const ttsCache = new Map<string, Buffer>();
const MAX_TTS_CACHE = 100;

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

type VercelLikeRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

export default async function handler(req: VercelLikeRequest, res: ServerResponse) {
  const fullUrl = new URL(req.url ?? '/api/tts', 'http://localhost');
  const queryText =
    typeof req.query?.text === 'string'
      ? req.query.text
      : fullUrl.searchParams.get('text') ?? '';
  const queryVoice =
    typeof req.query?.voice === 'string'
      ? req.query.voice
      : fullUrl.searchParams.get('voice') ?? 'pt-PT-RaquelNeural';

  const rawText = queryText.trim();
  if (!rawText) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Parâmetro "text" em falta.' }));
    return;
  }

  const text = rawText.slice(0, 480);
  const voice: PtPtVoiceId = ALLOWED_PT_PT_VOICES.has(queryVoice.trim())
    ? (queryVoice.trim() as PtPtVoiceId)
    : 'pt-PT-RaquelNeural';

  const cacheKey = `${voice}::${text}`;
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('X-TTS-Locale', 'pt-PT');
    res.setHeader('X-TTS-Voice', voice);
    res.end(cached);
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

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('X-TTS-Locale', 'pt-PT');
    res.setHeader('X-TTS-Voice', voice);
    res.end(audioBuf);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao sintetizar áudio pt-PT';
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: msg }));
  }
}
