import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectPtPtVoice, splitTextIntoSpeechChunks } from '../utils/speechVoice';

export interface SpeechItem {
  id: string;
  text: string;
}

export interface PtPtVoiceOption {
  id: 'pt-PT-RaquelNeural' | 'pt-PT-DuarteNeural';
  name: string;
}

export const PT_PT_NEURAL_VOICES: PtPtVoiceOption[] = [
  { id: 'pt-PT-RaquelNeural', name: 'Raquel (Portugal)' },
  { id: 'pt-PT-DuarteNeural', name: 'Duarte (Portugal)' },
];

const VOICE_STORAGE_KEY = 'iebhorta_ptpt_neural_voice';

function readStoredVoiceId(): PtPtVoiceOption['id'] {
  try {
    const saved =
      typeof window !== 'undefined' ? window.localStorage.getItem(VOICE_STORAGE_KEY) : null;
    if (saved === 'pt-PT-DuarteNeural' || saved === 'pt-PT-RaquelNeural') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'pt-PT-RaquelNeural';
}

export function useSpeechReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [selectedVoiceId, setSelectedVoiceId] = useState<PtPtVoiceOption['id']>(readStoredVoiceId);

  const itemsRef = useRef<SpeechItem[]>([]);
  const indexRef = useRef<number>(0);
  const rateRef = useRef<number>(rate);
  const voiceIdRef = useRef<PtPtVoiceOption['id']>(selectedVoiceId);
  const isPlayingRef = useRef(false);
  const sessionRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  // In-memory Blob URL cache keyed by `${voiceId}::${text}`
  const audioBlobUrlCacheRef = useRef<Map<string, string>>(new Map());
  const inFlightCacheRef = useRef<Map<string, Promise<string>>>(new Map());

  useEffect(() => {
    rateRef.current = rate;
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, [rate]);

  useEffect(() => {
    voiceIdRef.current = selectedVoiceId;
  }, [selectedVoiceId]);

  const activePtPtVoice = useMemo(
    () => PT_PT_NEURAL_VOICES.find((v) => v.id === selectedVoiceId) ?? PT_PT_NEURAL_VOICES[0],
    [selectedVoiceId]
  );

  const cleanupPlaybackResources = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      } catch {
        // Ignore audio cleanup errors
      }
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }, []);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setActiveId(null);
    cleanupPlaybackResources();
  }, [cleanupPlaybackResources]);

  const fetchPtPtAudioUrl = useCallback(
    async (text: string, voiceId: PtPtVoiceOption['id'], signal?: AbortSignal): Promise<string> => {
      const cacheKey = `${voiceId}::${text}`;
      const cached = audioBlobUrlCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const existingPromise = inFlightCacheRef.current.get(cacheKey);
      if (existingPromise && !signal) return existingPromise;

      const url = `/api/tts?voice=${encodeURIComponent(voiceId)}&text=${encodeURIComponent(text)}`;
      const loadPromise = fetch(url, { signal })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          // Bound cache size cleanly
          if (audioBlobUrlCacheRef.current.size >= 80) {
            const oldest = audioBlobUrlCacheRef.current.entries().next().value;
            if (oldest) {
              URL.revokeObjectURL(oldest[1]);
              audioBlobUrlCacheRef.current.delete(oldest[0]);
            }
          }
          audioBlobUrlCacheRef.current.set(cacheKey, objectUrl);
          return objectUrl;
        })
        .finally(() => {
          inFlightCacheRef.current.delete(cacheKey);
        });

      if (!signal) {
        inFlightCacheRef.current.set(cacheKey, loadPromise);
      }
      return loadPromise;
    },
    []
  );

  const speakOfflinePtPtOnly = useCallback(
    (text: string, playbackRate: number, session: number, onFinish: () => void): boolean => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        typeof SpeechSynthesisUtterance === 'undefined'
      ) {
        return false;
      }
      const voices = window.speechSynthesis.getVoices();
      const verifiedPtPt = selectPtPtVoice(voices);
      // Strict guard: never allow fallback to pt-BR or non-pt-PT voices
      if (!verifiedPtPt) {
        return false;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = verifiedPtPt;
        utterance.lang = 'pt-PT';
        utterance.rate = playbackRate;

        let done = false;
        utterance.onend = () => {
          if (done || sessionRef.current !== session || !isPlayingRef.current) return;
          done = true;
          onFinish();
        };
        utterance.onerror = () => {
          if (done || sessionRef.current !== session || !isPlayingRef.current) return;
          done = true;
          onFinish();
        };
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const speakAtIndex = useCallback(
    async (
      idx: number,
      playbackRate: number,
      voiceId: PtPtVoiceOption['id'],
      session: number
    ) => {
      if (!isPlayingRef.current || sessionRef.current !== session) return;

      const items = itemsRef.current;
      if (idx >= items.length) {
        stop();
        return;
      }

      const current = items[idx];
      indexRef.current = idx;
      setActiveId(current.id);
      setAudioError(null);
      cleanupPlaybackResources();

      // Prefetch next chunk in background while current plays
      const nextItem = items[idx + 1];
      if (nextItem) {
        fetchPtPtAudioUrl(nextItem.text, voiceId).catch(() => {});
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoadingAudio(true);

      try {
        const audioUrl = await fetchPtPtAudioUrl(current.text, voiceId, controller.signal);
        if (!isPlayingRef.current || sessionRef.current !== session) return;
        setIsLoadingAudio(false);

        const audio = new Audio(audioUrl);
        audio.playbackRate = playbackRate;
        audioRef.current = audio;

        let settled = false;
        const advance = () => {
          if (settled || sessionRef.current !== session || !isPlayingRef.current) return;
          settled = true;
          speakAtIndex(idx + 1, rateRef.current, voiceIdRef.current, session);
        };

        audio.onended = advance;
        audio.onerror = () => {
          if (settled || sessionRef.current !== session || !isPlayingRef.current) return;
          settled = true;
          setAudioError('Não foi possível reproduzir o áudio em Português de Portugal.');
          stop();
        };

        await audio.play();
      } catch (err) {
        if (controller.signal.aborted || sessionRef.current !== session || !isPlayingRef.current) {
          return;
        }
        setIsLoadingAudio(false);

        // Offline / network fallback strictly restricted to verified pt-PT OS voices (never pt-BR)
        const spokeLocalPtPt = speakOfflinePtPtOnly(current.text, playbackRate, session, () => {
          speakAtIndex(idx + 1, rateRef.current, voiceIdRef.current, session);
        });
        if (!spokeLocalPtPt) {
          const message =
            err instanceof Error && err.message.includes('HTTP')
              ? 'Serviço de voz em Português de Portugal temporariamente indisponível.'
              : 'Sem ligação para carregar a voz em Português de Portugal.';
          setAudioError(message);
          isPlayingRef.current = false;
          setIsPlaying(false);
          setActiveId(null);
        }
      }
    },
    [cleanupPlaybackResources, fetchPtPtAudioUrl, speakOfflinePtPtOnly, stop]
  );

  const playSequence = useCallback(
    (items: SpeechItem[], startIndex = 0) => {
      if (items.length === 0) return;

      const expanded: SpeechItem[] = [];
      let mappedStartIndex = 0;

      items.forEach((item, originalIdx) => {
        if (originalIdx === startIndex) {
          mappedStartIndex = expanded.length;
        }
        const chunks = splitTextIntoSpeechChunks(item.text, 220);
        if (chunks.length === 0) return;
        for (const chunk of chunks) {
          expanded.push({ id: item.id, text: chunk });
        }
      });

      if (expanded.length === 0) return;

      const nextSession = sessionRef.current + 1;
      sessionRef.current = nextSession;
      itemsRef.current = expanded;
      isPlayingRef.current = true;
      setIsPlaying(true);
      setAudioError(null);

      void speakAtIndex(mappedStartIndex, rateRef.current, voiceIdRef.current, nextSession);
    },
    [speakAtIndex]
  );

  const changeRate = useCallback((nextRate: number) => {
    setRate(nextRate);
    rateRef.current = nextRate;
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, []);

  const selectVoice = useCallback(
    (voiceNameOrId: string) => {
      const matched =
        PT_PT_NEURAL_VOICES.find((v) => v.id === voiceNameOrId || v.name === voiceNameOrId) ??
        PT_PT_NEURAL_VOICES[0];

      setSelectedVoiceId(matched.id);
      voiceIdRef.current = matched.id;
      try {
        window.localStorage.setItem(VOICE_STORAGE_KEY, matched.id);
      } catch {
        // Ignore storage errors
      }
      if (isPlayingRef.current) {
        const nextSession = sessionRef.current + 1;
        sessionRef.current = nextSession;
        void speakAtIndex(indexRef.current, rateRef.current, matched.id, nextSession);
      }
    },
    [speakAtIndex]
  );

  useEffect(() => {
    const cache = audioBlobUrlCacheRef.current;
    return () => {
      stop();
      for (const objectUrl of cache.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      cache.clear();
    };
  }, [stop]);

  return {
    isPlaying,
    isLoadingAudio,
    audioError,
    activeId,
    rate,
    ptPtVoices: PT_PT_NEURAL_VOICES,
    activePtPtVoice,
    hasPtPtVoice: true,
    voicesLoaded: true,
    playSequence,
    stop,
    changeRate,
    selectVoice,
  };
}
