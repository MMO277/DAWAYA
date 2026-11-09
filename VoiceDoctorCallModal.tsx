import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n';
import { tr } from './types';
import {
  isVoiceRecognitionSupported,
  speakText,
  startVoiceRecognition,
  stopSpeech,
  VoiceRecognitionHandle,
} from './speechService';
import { askGemini } from './geminiApi';
import { generateContextualSiteReply, getSeedMedicinesFallback } from './aiConversationContext';
import { useSyncedHealthProfile } from './allergyData';
import { respond, buildPassages } from './assistantLogic';

export interface VoiceDoctorCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type CallState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused';

export default function VoiceDoctorCallModal({ isOpen, onClose }: VoiceDoctorCallModalProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { profile } = useSyncedHealthProfile();

  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [lastDoctorReply, setLastDoctorReply] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioPulse, setAudioPulse] = useState<number>(1);

  const recogRef = useRef<VoiceRecognitionHandle | null>(null);
  const timerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  // Initialize Call
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
      recogRef.current?.stop();
      stopSpeech();
      return;
    }

    setCallDuration(0);
    setTranscript('');
    setCallState('connecting');

    // Start duration timer
    timerRef.current = window.setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Audio Visualizer pulse simulation
    pulseTimerRef.current = window.setInterval(() => {
      setAudioPulse(0.85 + Math.random() * 0.4);
    }, 150);

    // Doctor Greeting after connection
    const connectTimer = setTimeout(() => {
      setCallState('speaking');
      const greeting = isAr
        ? 'أهلاً بحضرتك في عيادة دوايا الطبية الذكية. أنا طبيبك الصيدلاني وسامعك بكل وضوح، اتفضل قول لي بتشتكي من إيه أو إيه استفسارك الصحي؟'
        : 'Welcome to DAWAYA Voice Clinic. I am your smart medical doctor listening live. How can I help you today?';
      setLastDoctorReply(greeting);
      speakText(greeting, lang, () => {
        startListeningCycle();
      });
    }, 1200);

    return () => {
      clearTimeout(connectTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
      recogRef.current?.stop();
      stopSpeech();
    };
  }, [isOpen, isAr, lang]);

  const startListeningCycle = () => {
    if (isMuted) return;
    setCallState('listening');
    setTranscript('');

    if (!isVoiceRecognitionSupported()) {
      setLastDoctorReply(
        isAr
          ? 'المتصفح لا يدعم الميكروفون المباشر حالياً. يمكنك استخدام شات المساعد الذكي بالكتابة.'
          : 'Microphone not supported on this browser. Please use text chat.'
      );
      setCallState('paused');
      return;
    }

    recogRef.current?.stop();
    recogRef.current = startVoiceRecognition(
      lang,
      (text) => {
        if (text && text.trim()) {
          setTranscript(text.trim());
          handlePatientSpeech(text.trim());
        }
      },
      () => {
        // Error or timeout, retry if still listening
        if (callState === 'listening') {
          setTimeout(() => startListeningCycle(), 800);
        }
      },
      () => {
        // onEnd
      }
    );
  };

  const handlePatientSpeech = async (patientText: string) => {
    recogRef.current?.stop();
    setCallState('thinking');

    try {
      // 1. Fast contextual check
      const meds = getSeedMedicinesFallback();
      const localReply = respond(buildPassages(meds), meds, patientText);
      const contextual = generateContextualSiteReply({
        userText: patientText,
        msgs: [],
        meds,
        profile,
        lang,
        localReply,
      });

      let reply = contextual.handledFast ? contextual.replyText : '';

      // 2. Fallback to Gemini with concise conversational voice instruction
      if (!reply) {
        const voicePrompt =
          `أنت طبيب استشاري صيدلاني في مكالمة هاتفية صوتية مباشرة مع مريض مصري. المريض قال لك بصوته: "${patientText}". ` +
          `أجب عليه باختصار شديد باللغة العامية المصرية الدافئة والمطمئنة (في 2 إلى 3 جمل قصيرة واضحة يسهل سماعها)، وقدم النصيحة السريرية المباشرة وحذره من أي خطر.`;
        reply = await askGemini(voicePrompt, [], patientText);
      }

      setLastDoctorReply(reply);
      setCallState('speaking');
      speakText(reply, lang, () => {
        // Loop back to listen for patient response
        startListeningCycle();
      });
    } catch {
      const fallbackMsg = isAr
        ? 'تمام، سامعك. أنصحك بالراحة وشرب ماء كافٍ ومراجعة الطبيب لو الأعراض مستمرة، وقول لي لو في أي عرض تاني مقلقك.'
        : 'Understood. Please rest, hydrate, and let me know if you experience other symptoms.';
      setLastDoctorReply(fallbackMsg);
      setCallState('speaking');
      speakText(fallbackMsg, lang, () => {
        startListeningCycle();
      });
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      recogRef.current?.stop();
      stopSpeech();
      setIsMuted(true);
      setCallState('paused');
    } else {
      setIsMuted(false);
      startListeningCycle();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #07111e 0%, #0D1F38 45%, #051d18 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '30px 20px env(safe-area-inset-bottom, 24px)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Top Bar: Clinic Name & Live Call Timer */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.84rem', fontWeight: 800 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: callState === 'paused' ? '#f59e0b' : '#10b981', display: 'inline-block' }} />
          <span>{callState === 'connecting' ? 'جارٍ الاتصال...' : formatSeconds(callDuration)}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{isAr ? 'مكالمة هاتفية مباشرة مع طبيب دوايا' : 'Live Voice Doctor Call'}</span>
        </div>
      </div>

      {/* Central Calling Avatar & Audio Waves */}
      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
        <div
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Animated Glow Rings */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: callState === 'listening' ? '#10b981' : callState === 'speaking' ? '#38bdf8' : '#64748b',
              opacity: 0.25,
              transform: `scale(${audioPulse * 1.35})`,
              transition: 'transform 0.15s ease-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '12px',
              borderRadius: '50%',
              background: callState === 'listening' ? '#059669' : callState === 'speaking' ? '#0284c7' : '#475569',
              opacity: 0.35,
              transform: `scale(${audioPulse * 1.15})`,
              transition: 'transform 0.15s ease-out',
            }}
          />

          {/* Central Doctor Avatar */}
          <div
            style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
              border: '4px solid #CFD29D',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.6rem',
            }}
          >
            👨‍⚕️
          </div>
        </div>

        {/* State Label */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 6px', color: '#ffffff' }}>
          {isAr ? 'د. دوايا — الاستشاري الطبي الصيدلاني' : 'Dr. DAWAYA — Clinical Consultant'}
        </h2>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color:
              callState === 'listening'
                ? '#34d399'
                : callState === 'thinking'
                ? '#fde047'
                : callState === 'speaking'
                ? '#38bdf8'
                : '#94a3b8',
            marginBottom: '16px',
          }}
        >
          {callState === 'connecting'
            ? '⏳ جارٍ بدء الاتصال الصوتي...'
            : callState === 'listening'
            ? '🎙️ الطبيب يستمع لك الآن.. تفضل بالتحدث'
            : callState === 'thinking'
            ? '⚡ جارٍ تجهيز الرأي الطبي السريري...'
            : callState === 'speaking'
            ? '🔊 الطبيب يتحدث معك الآن...'
            : '⏸️ المكالمة متوقفة مؤقتاً'}
        </div>

        {/* Live Subtitles Box (Transcript & Doctor Reply) */}
        <div
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            padding: '16px 20px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            textAlign: 'center',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {transcript && (
            <div style={{ fontSize: '0.92rem', color: '#86efac', fontWeight: 800, marginBottom: '6px' }}>
              🗣️ أنت: "{transcript}"
            </div>
          )}
          <div style={{ fontSize: '1.02rem', lineHeight: 1.6, color: '#f8fafc', fontWeight: 700 }}>
            {lastDoctorReply || 'تحدث الآن وسيجيبك الطبيب فوراً...'}
          </div>
        </div>
      </div>

      {/* Call Controls: Mute + End Call */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '28px', marginBottom: '16px' }}>
        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isMuted ? '#f59e0b' : 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            fontSize: '1.6rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
          title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
        >
          {isMuted ? '🔇' : '🎙️'}
        </button>

        {/* Red End Call Button */}
        <button
          type="button"
          onClick={() => {
            recogRef.current?.stop();
            stopSpeech();
            onClose();
          }}
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: '#dc2626',
            border: '3px solid #ffffff',
            color: '#ffffff',
            fontSize: '2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.5)',
          }}
          title="إنهاء المكالمة"
        >
          📞
        </button>
      </div>
    </div>
  );
}
