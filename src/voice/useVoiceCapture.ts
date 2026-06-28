import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

// Speech-to-text that works on both native and web:
//   • Native (iOS / Android) → on-device recognition via @react-native-voice/voice
//     (Apple Speech framework / Android SpeechRecognizer). Requires a dev build —
//     it is not available in Expo Go.
//   • Web → the browser's Web Speech API.
// Every path degrades gracefully: if a backend is missing, `supported` is false
// and the UI guides the user to type instead.

export interface VoiceCapture {
  supported: boolean;
  listening: boolean;
  /** Transcript accumulated during the current/last session. */
  transcript: string;
  error: string | null;
  /** Which backend is in use, for UI copy. */
  backend: 'native' | 'web' | 'none';
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// ── Web Speech API ────────────────────────────────────────────────────────────

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

function getWebRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (Platform.OS !== 'web') return null;
  const w = globalThis as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ── Native (@react-native-voice/voice) ────────────────────────────────────────

type NativeVoice = any;

function loadNativeVoice(): NativeVoice | null {
  if (Platform.OS === 'web') return null;
  try {
    // Lazy require so the web bundle never evaluates the native module.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-voice/voice');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

async function ensureAndroidMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone access',
        message: 'Khayali Pulao needs your microphone to capture spoken thoughts.',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function useVoiceCapture(): VoiceCapture {
  const webCtor = getWebRecognitionCtor();
  const nativeVoice = useRef<NativeVoice | null>(null);
  if (nativeVoice.current === null && Platform.OS !== 'web') {
    nativeVoice.current = loadNativeVoice();
  }

  const backend: VoiceCapture['backend'] =
    Platform.OS === 'web' ? (webCtor ? 'web' : 'none') : nativeVoice.current ? 'native' : 'none';

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const webRec = useRef<SpeechRecognitionLike | null>(null);
  const webFinal = useRef('');

  // Wire up native event handlers once.
  useEffect(() => {
    if (backend !== 'native') return;
    const Voice = nativeVoice.current;

    Voice.onSpeechStart = () => setListening(true);
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechError = (e: any) => {
      setError(e?.error?.message ?? 'Voice capture error');
      setListening(false);
    };
    const onResults = (e: any) => {
      const best = Array.isArray(e?.value) ? e.value[0] : undefined;
      if (typeof best === 'string') setTranscript(best);
    };
    Voice.onSpeechResults = onResults;
    Voice.onSpeechPartialResults = onResults;

    return () => {
      try {
        Voice.destroy().then(() => Voice.removeAllListeners());
      } catch {
        /* ignore */
      }
    };
  }, [backend]);

  // Stop web recognition on unmount.
  useEffect(() => {
    return () => {
      try {
        webRec.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const startWeb = useCallback(() => {
    if (!webCtor) return;
    setError(null);
    webFinal.current = '';
    setTranscript('');

    const rec = new webCtor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) webFinal.current += chunk + ' ';
        else interim += chunk;
      }
      setTranscript((webFinal.current + interim).replace(/\s+/g, ' ').trimStart());
    };
    rec.onerror = (e: any) => {
      setError(e?.error ? String(e.error) : 'Voice capture error');
      setListening(false);
    };
    rec.onend = () => setListening(false);

    webRec.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start microphone');
    }
  }, [webCtor]);

  const startNative = useCallback(async () => {
    const Voice = nativeVoice.current;
    if (!Voice) return;
    setError(null);
    setTranscript('');
    const ok = await ensureAndroidMicPermission();
    if (!ok) {
      setError('Microphone permission denied.');
      return;
    }
    try {
      await Voice.start('en-US');
      setListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start microphone');
      setListening(false);
    }
  }, []);

  const start = useCallback(() => {
    if (backend === 'web') startWeb();
    else if (backend === 'native') void startNative();
    else setError('Voice input isn’t available here — type your thought instead.');
  }, [backend, startWeb, startNative]);

  const stop = useCallback(() => {
    if (backend === 'web') {
      try {
        webRec.current?.stop();
      } catch {
        /* ignore */
      }
    } else if (backend === 'native') {
      try {
        void nativeVoice.current?.stop();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
  }, [backend]);

  const reset = useCallback(() => {
    webFinal.current = '';
    setTranscript('');
    setError(null);
  }, []);

  return { supported: backend !== 'none', listening, transcript, error, backend, start, stop, reset };
}
