export interface VoiceDescriptor {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
}

const PT_PT_VOICE_NAME_HINTS = [
  'portugal',
  'pt-pt',
  'pt_pt',
  'raquel',
  'duarte',
  'joana',
  'cristiano',
  'catarina',
  'helia',
  'hélia',
  'ines',
  'inês',
];

const PT_BR_EXCLUSION_HINTS = [
  'brazil',
  'brasil',
  'pt-br',
  'pt_br',
  'luciana',
  'felipe',
  'fernanda',
  'francisca',
  'thalita',
  'antonio',
  'antónio',
  'humberto',
  'leila',
  'leticia',
  'letícia',
  'yara',
];

export function normalizeVoiceLang(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, '-');
}

export function isPtPtVoice(voice: VoiceDescriptor): boolean {
  const lang = normalizeVoiceLang(voice.lang);
  const name = voice.name.trim().toLowerCase();

  if (lang === 'pt-br' || lang.startsWith('pt-br-')) {
    return false;
  }
  if (PT_BR_EXCLUSION_HINTS.some((hint) => name.includes(hint))) {
    return false;
  }

  if (lang === 'pt-pt' || lang.startsWith('pt-pt-')) {
    return true;
  }

  if (lang === 'pt' || lang.startsWith('pt-')) {
    return PT_PT_VOICE_NAME_HINTS.some((hint) => name.includes(hint));
  }

  return false;
}

export function scorePtPtVoice(voice: VoiceDescriptor): number {
  const lang = normalizeVoiceLang(voice.lang);
  const name = voice.name.trim().toLowerCase();
  let score = 0;

  if (lang === 'pt-pt') score += 50;
  else if (lang.startsWith('pt-pt-')) score += 45;

  if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
    score += 30;
  }
  if (name.includes('enhanced') || name.includes('premium') || name.includes('siri')) {
    score += 20;
  }
  if (name.includes('google') && name.includes('portugal')) {
    score += 18;
  }
  if (
    name.includes('raquel') ||
    name.includes('duarte') ||
    name.includes('joana') ||
    name.includes('cristiano')
  ) {
    score += 15;
  }
  if (voice.localService === false) {
    score += 5;
  }
  return score;
}

export function getPtPtVoices<T extends VoiceDescriptor>(voices: T[]): T[] {
  return voices
    .filter((v) => isPtPtVoice(v))
    .sort((a, b) => scorePtPtVoice(b) - scorePtPtVoice(a));
}

export function selectPtPtVoice<T extends VoiceDescriptor>(
  voices: T[],
  preferredName?: string | null
): T | null {
  const ptPt = getPtPtVoices(voices);
  if (ptPt.length === 0) return null;

  if (preferredName) {
    const exact = ptPt.find((v) => v.name === preferredName);
    if (exact) return exact;
  }

  return ptPt[0];
}

/**
 * Splits long Portuguese paragraphs into sentence chunks (<= ~180 chars)
 * so Web Speech synthesis does not stall on long utterances in Chromium.
 */
export function splitTextIntoSpeechChunks(text: string, maxLength = 180): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLength) return [cleaned];

  const sentences = cleaned.split(/(?<=[.!?…;:])\s+/);
  const chunks: string[] = [];
  let buffer = '';

  for (const sentence of sentences) {
    if (!sentence) continue;
    if (buffer && buffer.length + 1 + sentence.length > maxLength) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else if (!buffer && sentence.length > maxLength) {
      // Split overly long sentence at commas or spaces
      const words = sentence.split(' ');
      let part = '';
      for (const word of words) {
        if (part && part.length + 1 + word.length > maxLength) {
          chunks.push(part.trim());
          part = word;
        } else {
          part = part ? `${part} ${word}` : word;
        }
      }
      if (part) buffer = part;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }

  if (buffer.trim()) {
    chunks.push(buffer.trim());
  }

  return chunks;
}
