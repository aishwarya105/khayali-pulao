import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Minimal typing for the Web Speech API (only what we use).
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (Platform.OS !== 'web') return null;
  const w = globalThis as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface VoiceCapture {
  supported: boolean;
  listening: boolean;
  /** Transcript accumulated during the current/last session. */
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Speech-to-text using the browser's Web Speech API when the app runs on web.
 * On native (Expo Go / device) live STT needs a custom dev build, so we report
 * `supported: false` and the UI guides the user to type instead.
 */
export function useVoiceCapture(): VoiceCapture {
  const Ctor = getRecognitionCtor();
  const [supported] = useState(!!Ctor);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor) {
      setError('Voice input needs a browser with the Web Speech API.');
      return;
    }
    setError(null);
    finalRef.current = '';
    setTranscript('');

    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += chunk + ' ';
        else interim += chunk;
      }
      setTranscript((finalRef.current + interim).replace(/\s+/g, ' ').trimStart());
    };
    rec.onerror = (e: any) => {
      setError(e?.error ? String(e.error) : 'Voice capture error');
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start microphone');
    }
  }, [Ctor]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
