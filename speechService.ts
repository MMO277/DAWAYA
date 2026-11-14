import { Lang } from './types';

export interface SpeechState {
  supported: boolean;
  hasVoice: boolean;
  playing: boolean;
  paused: boolean;
  rate: number;
  currentParagraphIndex: number;
}

export interface VoiceRecognitionHandle {
  stop: () => void;
  abort?: () => void;
}

const BCP47_MAP: Record<Lang, string> = {
  ar: 'ar-EG',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAndroidVoiceBridge(): any | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = (window as any).AndroidAlarmBridge;
  return b || null;
}

export function isSpeechSupported(): boolean {
  const b = getAndroidVoiceBridge();
  if (b && typeof b.speakNativeText === 'function') return true;
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function isVoiceRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const b = getAndroidVoiceBridge();
  if (b && typeof b.startNativeVoiceRecognition === 'function') return true;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const b = getAndroidVoiceBridge();
  if (b && typeof b.requestMicPermission === 'function') {
    try {
      b.requestMicPermission();
    } catch {
      /* ignore */
    }
  }
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return Boolean(b && typeof b.startNativeVoiceRecognition === 'function');
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        /* ignore */
      }
    });
    return true;
  } catch (err) {
    console.warn('Microphone permission request error:', err);
    return Boolean(b && typeof b.startNativeVoiceRecognition === 'function');
  }
}

export function startVoiceRecognition(
  lang: Lang,
  onResult: (transcript: string, isFinal?: boolean) => void,
  onError?: (err: string) => void,
  onEnd?: () => void,
  options?: { interim?: boolean; continuous?: boolean }
): VoiceRecognitionHandle | null {
  const bcp47 = BCP47_MAP[lang] || 'ar-EG';
  const bridge = getAndroidVoiceBridge();

  // Helper to launch Native Android Speech Recognizer when running inside APK
  const launchAndroidNativeRecognizer = (): VoiceRecognitionHandle | null => {
    if (!bridge || typeof bridge.startNativeVoiceRecognition !== 'function') return null;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__onAndroidVoiceResult = (resText: string) => {
      if (cancelled) return;
      if (!resText || resText === '__CANCELLED__' || resText === '__ERROR__') {
        onEnd?.();
        return;
      }
      onResult(resText.trim(), true);
      onEnd?.();
    };
    try {
      const ok = bridge.startNativeVoiceRecognition(bcp47);
      if (!ok) {
        onError?.('not-allowed');
        onEnd?.();
        return null;
      }
      return {
        stop: () => {
          cancelled = true;
        },
        abort: () => {
          cancelled = true;
        },
      };
    } catch {
      onError?.('start-failed');
      onEnd?.();
      return null;
    }
  };

  // Prefer Native Android Speech Recognizer directly inside the APK if available
  if (bridge && typeof bridge.startNativeVoiceRecognition === 'function') {
    return launchAndroidNativeRecognizer();
  }

  if (!isVoiceRecognitionSupported()) {
    const errMsg =
      lang === 'ar'
        ? 'المتصفح لا يدعم الإدخال الصوتي المباشر.'
        : 'Voice recognition not supported in this browser.';
    onError?.(errMsg);
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = bcp47;
    recognition.interimResults = Boolean(options?.interim);
    recognition.continuous = Boolean(options?.continuous);
    recognition.maxAlternatives = 1;

    let hasReceivedResult = false;
    let stoppedManually = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0]?.transcript || '';
        } else {
          interimTranscript += item[0]?.transcript || '';
        }
      }

      const cleanFinal = finalTranscript.trim();
      const cleanInterim = interimTranscript.trim();

      if (cleanFinal) {
        hasReceivedResult = true;
        onResult(cleanFinal, true);
      } else if (cleanInterim && options?.interim) {
        hasReceivedResult = true;
        onResult(cleanInterim, false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const errType = event?.error || 'voice-error';
      if (errType === 'no-speech' && hasReceivedResult) {
        return;
      }
      // If WebView blocks Web Speech API, try native Android bridge automatically
      if ((errType === 'not-allowed' || errType === 'service-not-allowed') && bridge && typeof bridge.startNativeVoiceRecognition === 'function') {
        launchAndroidNativeRecognizer();
        return;
      }
      onError?.(errType);
    };

    recognition.onend = () => {
      if (!stoppedManually) {
        onEnd?.();
      }
    };

    recognition.start();

    return {
      stop: () => {
        stoppedManually = true;
        try {
          recognition.stop();
        } catch {
          /* ignore */
        }
      },
      abort: () => {
        stoppedManually = true;
        try {
          recognition.abort();
        } catch {
          /* ignore */
        }
      },
    };
  } catch (err: any) {
    console.warn('Failed to start speech recognition:', err);
    onError?.(err?.message || 'start-failed');
    onEnd?.();
    return null;
  }
}

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const handler = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

export function findVoiceForLang(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  if (lang === 'ar') {
    const eg = voices.find((v) => v.lang === 'ar-EG' || v.lang === 'ar_EG');
    if (eg) return eg;
    const sa = voices.find((v) => v.lang === 'ar-SA' || v.lang === 'ar_SA');
    if (sa) return sa;
    return voices.find((v) => v.lang.toLowerCase().startsWith('ar')) || null;
  }
  if (lang === 'de') {
    const de = voices.find((v) => v.lang === 'de-DE' || v.lang === 'de_DE' || v.lang === 'de-AT' || v.lang === 'de-CH');
    if (de) return de;
    return voices.find((v) => v.lang.toLowerCase().startsWith('de')) || null;
  }
  if (lang === 'fr') {
    const fr = voices.find((v) => v.lang === 'fr-FR' || v.lang === 'fr_FR');
    if (fr) return fr;
    return voices.find((v) => v.lang.toLowerCase().startsWith('fr')) || null;
  }
  if (lang === 'es') {
    const es = voices.find((v) => v.lang === 'es-ES' || v.lang === 'es_ES' || v.lang === 'es-MX');
    if (es) return es;
    return voices.find((v) => v.lang.toLowerCase().startsWith('es')) || null;
  }
  const us = voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
  if (us) return us;
  const gb = voices.find((v) => v.lang === 'en-GB' || v.lang === 'en_GB');
  if (gb) return gb;
  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
}

export class SpeechPlayer {
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public onStateChange?: (state: { playing: boolean; paused: boolean }) => void;
  public onParagraphStart?: (index: number) => void;
  public onFinished?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public onError?: (err: any) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      getVoices().then((v) => {
        this.voices = v;
      });
    }
  }

  public stop(): void {
    const bridge = getAndroidVoiceBridge();
    if (bridge && typeof bridge.stopNativeSpeech === 'function') {
      try {
        bridge.stopNativeSpeech();
      } catch {
        /* ignore */
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    this.utterance = null;
    this.onStateChange?.({ playing: false, paused: false });
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {
        /* ignore */
      }
    }
    this.onStateChange?.({ playing: false, paused: true });
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
    }
    this.onStateChange?.({ playing: true, paused: false });
  }

  public speak(
    text: string,
    lang: Lang,
    rate = 1.0,
    onEnd?: () => void
  ): Promise<boolean> {
    return this.speakText(text, lang, rate, onEnd);
  }

  public async speakText(
    text: string,
    lang: Lang,
    rate = 1.0,
    onEnd?: () => void
  ): Promise<boolean> {
    if (!text.trim()) {
      onEnd?.();
      return false;
    }

    this.stop();

    const bridge = getAndroidVoiceBridge();
    const estimatedSafetyMs = Math.min(20000, Math.max(3000, Math.ceil(text.length / 11) * 1000));

    // If running inside Android APK with native TTS bridge, use Android native TTS
    if (bridge && typeof bridge.speakNativeText === 'function') {
      try {
        const started = bridge.speakNativeText(text, BCP47_MAP[lang] || 'ar-EG');
        if (started) {
          this.onStateChange?.({ playing: true, paused: false });
          setTimeout(() => {
            this.onStateChange?.({ playing: false, paused: false });
            onEnd?.();
          }, estimatedSafetyMs);
          return true;
        }
      } catch {
        /* fallback to web speechSynthesis below */
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      onEnd?.();
      return false;
    }

    if (this.voices.length === 0) {
      this.voices = await getVoices();
    }

    const voice = findVoiceForLang(this.voices, lang);
    const u = new SpeechSynthesisUtterance(text);
    this.utterance = u;
    u.lang = BCP47_MAP[lang] || 'ar-EG';
    u.rate = rate;
    if (voice) {
      u.voice = voice;
    }

    let isDone = false;
    let safetyTimer: any = null;

    const finalize = () => {
      if (isDone) return;
      isDone = true;
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      this.onStateChange?.({ playing: false, paused: false });
      try {
        onEnd?.();
      } catch (err) {
        console.warn('Speech onEnd handler error:', err);
      }
    };

    safetyTimer = setTimeout(() => {
      finalize();
    }, estimatedSafetyMs);

    u.onstart = () => {
      this.onStateChange?.({ playing: true, paused: false });
    };

    u.onend = () => {
      finalize();
    };

    u.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', e);
        this.onError?.(e);
      }
      finalize();
    };

    try {
      window.speechSynthesis.speak(u);
    } catch (speakErr) {
      console.warn('SpeechSynthesis.speak failed:', speakErr);
      finalize();
    }

    return true;
  }
}

const sharedPlayer = new SpeechPlayer();

export function speakText(
  text: string,
  lang: Lang,
  rate = 1.0,
  onEnd?: () => void
): Promise<boolean> {
  return sharedPlayer.speakText(text, lang, rate, onEnd);
}

export function stopSpeech(): void {
  sharedPlayer.stop();
}
