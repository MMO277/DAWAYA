import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n';
import {
  isVoiceRecognitionSupported,
  requestMicrophonePermission,
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

export type CallState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error';

// Synthesize pleasant call sound effects via Web Audio API without external files
function playCallAudioTone(type: 'ring' | 'listen' | 'send') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'ring') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'listen') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    /* ignore audio errors */
  }
}

export default function VoiceDoctorCallModal({ isOpen, onClose }: VoiceDoctorCallModalProps) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const { profile } = useSyncedHealthProfile();

  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [lastDoctorReply, setLastDoctorReply] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [audioWaveLevel, setAudioWaveLevel] = useState<number>(1);

  const recogRef = useRef<VoiceRecognitionHandle | null>(null);
  const timerRef = useRef<number | null>(null);
  const waveTimerRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const currentTranscriptRef = useRef<string>('');

  // Stop everything safely
  const cleanupAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    recogRef.current = null;
    stopSpeech();
  };

  // Main lifecycle when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupAll();
      return;
    }

    setCallDuration(0);
    setTranscript('');
    setInterimText('');
    setMicError(null);
    setManualText('');
    setCallState('connecting');

    // Ring tone
    playCallAudioTone('ring');

    // Call duration timer
    timerRef.current = window.setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Audio Visualizer waveform pulse
    waveTimerRef.current = window.setInterval(() => {
      setAudioWaveLevel(0.7 + Math.random() * 0.6);
    }, 120);

    // Request microphone permission proactively
    requestMicrophonePermission().catch(() => {});

    // Doctor greeting after short connection simulation
    const greetingTimeout = setTimeout(() => {
      setCallState('speaking');
      const patientName = profile.name ? `يا أستاذ ${profile.name.split(' ')[0]}` : 'يا فندم';
      const greeting = isAr
        ? `أهلاً بحضرتك ${patientName} في عيادة دوايا الطبية الذكية. أنا طبيبك الصيدلاني وسامعك بكل وضوح، اتفضل قول لي بتشتكي من إيه أو إيه استفسارك الصحي؟`
        : `Welcome ${patientName} to DAWAYA Live Clinic. I am your smart clinical doctor listening live. How can I help you today?`;

      setLastDoctorReply(greeting);

      // Speak greeting with automatic transition to listening
      speakText(greeting, lang, 1.0, () => {
        startListeningCycle();
      });
    }, 1100);

    return () => {
      clearTimeout(greetingTimeout);
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Start speech recognition cycle
  const startListeningCycle = () => {
    if (isMuted) return;

    cleanupSpeechEngine();
    setCallState('listening');
    setMicError(null);
    setInterimText('');
    currentTranscriptRef.current = '';

    playCallAudioTone('listen');

    if (!isVoiceRecognitionSupported()) {
      setMicError(
        isAr
          ? 'المتصفح لا يدعم المايكروفون الصوتي المباشر. يمكنك استخدام خانة الكتابة السريعة أدناه.'
          : 'Voice recognition is not supported in this browser. Please type your message below.'
      );
      setCallState('paused');
      return;
    }

    try {
      recogRef.current = startVoiceRecognition(
        lang,
        (text, isFinal) => {
          if (!text) return;

          if (isFinal) {
            currentTranscriptRef.current = text;
            setTranscript(text);
            setInterimText('');
            // Auto submit speech after user finishes sentence
            handlePatientSpeech(text);
          } else {
            // Live interim feedback as user speaks
            currentTranscriptRef.current = text;
            setInterimText(text);

            // Auto-send debounce: if user stops speaking for 2.2 seconds, submit
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = window.setTimeout(() => {
              if (currentTranscriptRef.current.trim()) {
                handlePatientSpeech(currentTranscriptRef.current.trim());
              }
            }, 2200);
          }
        },
        (err) => {
          console.warn('Voice recognition error:', err);
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            setMicError(
              isAr
                ? 'يرجى السماح بالوصول للمايكروفون من إعدادات المتصفح لتتمكن من التحدث مع الطبيب.'
                : 'Please allow microphone access in your browser settings to speak.'
            );
            setCallState('error');
          } else if (err === 'no-speech') {
            // User did not speak yet, stay ready for tap
            setCallState('paused');
          } else if (err === 'network') {
            setMicError(
              isAr
                ? 'تعذر الاتصال بخدمة التعرف على الصوت. تحقق من الإنترنت أو استخدم خانة الكتابة أدناه.'
                : 'Speech recognition network error. Please check connection or type below.'
            );
            setCallState('error');
          }
        },
        () => {
          // onEnd: if finished listening without speech, set to ready state
          if (currentTranscriptRef.current.trim()) {
            handlePatientSpeech(currentTranscriptRef.current.trim());
          }
        },
        { interim: true, continuous: false }
      );
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
      setMicError(isAr ? 'تعذر تشغيل المايكروفون. اضغط على الزر للتجربة مرة أخرى.' : 'Microphone error. Tap to retry.');
      setCallState('error');
    }
  };

  const cleanupSpeechEngine = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    recogRef.current = null;
  };

  // Handle patient speech or written input
  const handlePatientSpeech = async (patientText: string) => {
    const cleanText = patientText.trim();
    if (!cleanText) return;

    cleanupSpeechEngine();
    playCallAudioTone('send');
    setTranscript(cleanText);
    setInterimText('');
    setCallState('thinking');
    setMicError(null);

    try {
      // 1. Build context with occupation & health profile
      const meds = getSeedMedicinesFallback();
      const localReply = respond(buildPassages(meds), meds, cleanText);

      const contextual = generateContextualSiteReply({
        userText: cleanText,
        msgs: [],
        meds,
        profile,
        lang,
        localReply,
      });

      let reply = contextual.handledFast ? contextual.replyText : '';

      // 2. Fallback to Gemini with clinical consultation instruction
      if (!reply) {
        const occTitle = profile.occupation === 'other' ? (profile.customOccupationTitle || 'مهنة خاصة')
          : profile.occupation === 'driver_transport' ? 'سائق طريق ومواصلات'
          : profile.occupation === 'machinery_factory' ? 'عامل مصنع وماكينات'
          : profile.occupation === 'office_desk' ? 'عمل مكتبي'
          : profile.occupation === 'student' ? 'طالب'
          : profile.occupation === 'homemaker' ? 'ربت منزل'
          : 'عام';

        const factoryNotice = (profile.occupation === 'machinery_factory' && (profile.factoryEnvironmentHazards?.length || profile.workEnvironmentNotes))
          ? `بيئة عمل المريض في المصنع: يتعرض لـ (${profile.factoryEnvironmentHazards?.map((h: string) => h === 'dust_powder' ? 'أتربة وبودرة وغبار (تأثير على الصدر والربو)' : h === 'chemicals_fumes' ? 'كيماويات وأبخرة' : h === 'textile_cotton' ? 'ألياف قطن' : h).join('، ')}). تفاصيل: "${profile.workEnvironmentNotes || ''}". نبّهه صراحة إذا كان الدواء يسبب سعالاً أو ضيق تنفس أو يتعارض مع حساسية الصدر والربو.`
          : '';

        const occNotice = `وظيفة المريض: "${occTitle}". ${factoryNotice}`;
        const medsNotice = profile.currentMeds?.length ? `الأدوية الحالية: ${profile.currentMeds.join('، ')}.` : '';
        const allergyNotice = profile.allergies?.length ? `الحساسيات المسجلة: ${profile.allergies.join('، ')}.` : '';

        const voicePrompt =
          `أنت دكتور صيدلاني استشاري في مكالمة هاتفية صوتية مباشرة مع مريض مصري.\n` +
          `${occNotice} ${medsNotice} ${allergyNotice}\n` +
          `المريض قال لك بصوته في المكالمة: "${cleanText}".\n` +
          `أجب عليه باللهجة المصرية الدافئة والمطمئنة والمهنية (في 2 إلى 3 جمل قصيرة وسريعة وواضحة جداً يسهل سماعها هاتفياً).\n` +
          `لو كان سؤاله عن دواء يؤثر على القيادة أو العمل (خاصة لو وظيفته سائق أو عامل)، نبهه بوضوح للأمان مع شغله.`;

        reply = await askGemini(voicePrompt, [], cleanText);
      }

      setLastDoctorReply(reply);
      setCallState('speaking');

      // Speak reply and loop back to listen
      speakText(reply, lang, 1.0, () => {
        startListeningCycle();
      });
    } catch (err) {
      console.warn('Call handling error:', err);
      const fallbackMsg = isAr
        ? 'تمام يا فندم، أنا سامعك بوضوح. أنصحك بالراحة وشرب ماء دافئ، وقولي لو بتشتكي من أي عرض تاني أو بتاخد أي دواء حالياً.'
        : 'I hear you clearly. Please stay hydrated, rest, and let me know if you have any other symptoms.';
      setLastDoctorReply(fallbackMsg);
      setCallState('speaking');
      speakText(fallbackMsg, lang, 1.0, () => {
        startListeningCycle();
      });
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;
    const text = manualText.trim();
    setManualText('');
    handlePatientSpeech(text);
  };

  const toggleMute = () => {
    if (!isMuted) {
      cleanupSpeechEngine();
      stopSpeech();
      setIsMuted(true);
      setCallState('paused');
    } else {
      setIsMuted(false);
      startListeningCycle();
    }
  };

  const handleMicButtonTap = () => {
    if (callState === 'listening') {
      // User tapped while listening -> finish and submit current text immediately
      if (currentTranscriptRef.current.trim()) {
        handlePatientSpeech(currentTranscriptRef.current.trim());
      } else {
        // Stop listening
        cleanupSpeechEngine();
        setCallState('paused');
      }
    } else if (callState === 'speaking') {
      // User tapped to interrupt doctor and speak
      stopSpeech();
      startListeningCycle();
    } else {
      // Tap to start listening
      startListeningCycle();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const quickQuestions = isAr
    ? [
        'عندي صداع وسخونية',
        'هل الدواء ده آمن مع السواقة والشغل؟',
        'مغص ووجع شديد في المعدة',
        'جرعة المضاد الحيوي المناسبة',
      ]
    : [
        'I have headache and fever',
        'Is this medication safe while driving?',
        'Stomach pain and nausea',
        'Proper antibiotic dosage',
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #07111e 0%, #0d2238 45%, #051d18 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px env(safe-area-inset-bottom, 20px)',
        backdropFilter: 'blur(20px)',
        overflowY: 'auto',
      }}
    >
      {/* Top Bar: Live Call Status & Timer */}
      <div style={{ textAlign: 'center', marginTop: '6px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            padding: '8px 18px',
            borderRadius: '30px',
            fontSize: '0.86rem',
            fontWeight: 800,
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background:
                callState === 'listening'
                  ? '#10b981'
                  : callState === 'speaking'
                  ? '#38bdf8'
                  : callState === 'thinking'
                  ? '#facc15'
                  : '#f59e0b',
              display: 'inline-block',
              boxShadow: callState === 'listening' ? '0 0 10px #10b981' : undefined,
            }}
          />
          <span>{callState === 'connecting' ? (isAr ? 'جارٍ الاتصال بالدكتور...' : 'Connecting...') : formatSeconds(callDuration)}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>{isAr ? 'مكالمة هاتفية مع دكتور دوايا الذكي' : 'DAWAYA Live Doctor Call'}</span>
        </div>
      </div>

      {/* Center Calling Area */}
      <div style={{ textAlign: 'center', margin: 'auto 0', padding: '10px 0' }}>
        {/* Animated Avatar */}
        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '0 auto 16px',
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
              background:
                callState === 'listening'
                  ? '#10b981'
                  : callState === 'speaking'
                  ? '#38bdf8'
                  : callState === 'thinking'
                  ? '#f59e0b'
                  : '#64748b',
              opacity: 0.25,
              transform: `scale(${audioWaveLevel * 1.3})`,
              transition: 'transform 0.12s ease-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '10px',
              borderRadius: '50%',
              background:
                callState === 'listening'
                  ? '#059669'
                  : callState === 'speaking'
                  ? '#0284c7'
                  : callState === 'thinking'
                  ? '#d97706'
                  : '#475569',
              opacity: 0.35,
              transform: `scale(${audioWaveLevel * 1.12})`,
              transition: 'transform 0.12s ease-out',
            }}
          />

          {/* Central Doctor Avatar */}
          <div
            style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D1F38 0%, #138866 100%)',
              border: '3.5px solid #CFD29D',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.4rem',
            }}
          >
            👨‍⚕️
          </div>
        </div>

        {/* Doctor Name & Occupation context */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 4px', color: '#ffffff' }}>
          {isAr ? 'د. دوايا — الاستشاري الصيدلاني الذكي' : 'Dr. DAWAYA — AI Clinical Doctor'}
        </h2>

        {profile.occupation && (
          <div style={{ fontSize: '0.84rem', color: '#93c5fd', fontWeight: 700, marginBottom: '6px' }}>
            👔 {isAr ? `بيراعي متطلبات مهنتك: (${profile.occupation})` : `Customized for: (${profile.occupation})`}
          </div>
        )}

        {/* State Indicator */}
        <div
          style={{
            fontSize: '0.96rem',
            fontWeight: 800,
            color:
              callState === 'listening'
                ? '#34d399'
                : callState === 'thinking'
                ? '#fde047'
                : callState === 'speaking'
                ? '#38bdf8'
                : '#94a3b8',
            marginBottom: '14px',
          }}
        >
          {callState === 'connecting'
            ? isAr
              ? 'جارٍ الاتصال وفتح قناة الصوت...'
              : 'Connecting audio line...'
            : callState === 'listening'
            ? isAr
              ? '🎙️ الطبيب يستمع لك الآن.. اتكلم براحتك'
              : '🎙️ Doctor is listening live... Speak freely'
            : callState === 'thinking'
            ? isAr
              ? 'الطبيب يدرس حالتك ويجهز الرد...'
              : 'Analyzing clinical context...'
            : callState === 'speaking'
            ? isAr
              ? '🔊 الطبيب يتحدث معك الآن...'
              : '🔊 Doctor is speaking...'
            : isAr
              ? '⏸️ المكالمة جاهزة.. اضغط على الزر للتحدث'
              : '⏸️ Ready.. Tap button to speak'}
        </div>

        {/* Interactive Main Tap-to-Speak Button */}
        <div style={{ marginBottom: '14px' }}>
          <button
            type="button"
            onClick={handleMicButtonTap}
            style={{
              padding: '12px 24px',
              borderRadius: '35px',
              border: '2px solid rgba(255,255,255,0.3)',
              background:
                callState === 'listening'
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : callState === 'speaking'
                  ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
                  : 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow:
                callState === 'listening'
                  ? '0 0 20px rgba(16, 185, 129, 0.7)'
                  : '0 6px 18px rgba(0,0,0,0.35)',
              transform: callState === 'listening' ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            {callState === 'listening' ? (
              <>
                <span style={{ fontSize: '1.25rem' }}>⏹️</span>
                <span>{isAr ? 'سامعك.. دوس هنا للإرسال' : 'Listening.. Tap to send'}</span>
              </>
            ) : callState === 'speaking' ? (
              <>
                <span style={{ fontSize: '1.25rem' }}>🎙️</span>
                <span>{isAr ? 'دوس هنا لو عايز تقاطع وتتكلم' : 'Tap to interrupt and speak'}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.25rem' }}>🎙️</span>
                <span>{isAr ? 'اضغط هنا للتحدث مع الدكتور' : 'Tap here to speak'}</span>
              </>
            )}
          </button>
        </div>

        {/* Sound Wave Animation Bars */}
        {(callState === 'listening' || callState === 'speaking') && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              height: '24px',
              marginBottom: '12px',
            }}
          >
            {[0.4, 0.8, 1.2, 0.6, 1.1, 0.5, 0.9].map((multiplier, idx) => (
              <span
                key={idx}
                style={{
                  width: '4px',
                  borderRadius: '3px',
                  background: callState === 'listening' ? '#34d399' : '#38bdf8',
                  height: `${Math.max(6, Math.min(22, 14 * audioWaveLevel * multiplier))}px`,
                  transition: 'height 0.1s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Live Subtitles & Doctor Reply Display */}
        <div
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '14px 18px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            textAlign: 'center',
            minHeight: '85px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Patient live interim / final speech */}
          {(interimText || transcript) && (
            <div
              style={{
                fontSize: '0.92rem',
                color: '#86efac',
                fontWeight: 800,
                marginBottom: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '6px 12px',
                borderRadius: '10px',
              }}
            >
              🗣️ {isAr ? 'أنت' : 'You'}: "{interimText || transcript}"
              {callState === 'listening' && (
                <span style={{ opacity: 0.6, fontSize: '0.8rem', marginRight: '6px' }}>
                  {isAr ? ' (جاري الاستماع...)' : ' (listening...)'}
                </span>
              )}
            </div>
          )}

          {/* Doctor spoken response */}
          <div style={{ fontSize: '1rem', lineHeight: 1.6, color: '#f8fafc', fontWeight: 700 }}>
            {lastDoctorReply || (isAr ? 'تحدث الآن وسيجيبك الطبيب فوراً...' : 'Speak now and the doctor will reply instantly...')}
          </div>
        </div>

        {/* Microphone Error / Warning Banner */}
        {micError && (
          <div
            style={{
              maxWidth: '520px',
              margin: '10px auto 0',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span>⚠️ {micError}</span>
            <button
              type="button"
              onClick={startListeningCycle}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {isAr ? 'إعادة المحاولة 🔄' : 'Retry 🔄'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: Quick Fallback Inputs & Controls */}
      <div style={{ maxWidth: '540px', width: '100%', margin: '0 auto' }}>
        {/* Quick Suggestion Chips */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '8px',
            scrollbarWidth: 'none',
          }}
        >
          {quickQuestions.map((qText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePatientSpeech(qText)}
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#e2e8f0',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              💬 {qText}
            </button>
          ))}
        </div>

        {/* Emergency Text Input Bar */}
        <form
          onSubmit={handleManualSubmit}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={
              isAr
                ? 'أو اكتب استفسارك هنا للدكتور مباشرة...'
                : 'Or type your question for the doctor...'
            }
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '25px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!manualText.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: '25px',
              border: 'none',
              background: manualText.trim() ? '#10b981' : 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: manualText.trim() ? 'pointer' : 'default',
            }}
          >
            {isAr ? 'إرسال' : 'Send'}
          </button>
        </form>

        {/* Bottom Call Controls: Mute + End Call */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '28px', marginBottom: '8px' }}>
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: isMuted ? '#f59e0b' : 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              fontSize: '1.5rem',
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
              cleanupAll();
              onClose();
            }}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#dc2626',
              border: '3px solid #ffffff',
              color: '#ffffff',
              fontSize: '1.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.55)',
            }}
            title={isAr ? 'إنهاء المكالمة' : 'End Call'}
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
