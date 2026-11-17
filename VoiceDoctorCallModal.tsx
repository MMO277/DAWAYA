import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from './i18n';
import type { ReplyLink } from './types';
import {
  DirectAudioRecorderHandle,
  isDirectAudioRecordingSupported,
  requestMicrophonePermission,
  speakText,
  startDirectAudioRecording,
  stopSpeech,
} from './speechService';
import { askGemini, askGeminiWithAudio, cleanAssistantMarkdown } from './geminiApi';
import {
  buildOpenEgyptianOfflineFallback,
  generateContextualSiteReply,
  getSeedMedicinesFallback,
  matchSpecialtyClinicLinks,
  matchInteractiveTriagePrompts,
  InteractiveTriagePrompt,
} from './aiConversationContext';
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
  const navigate = useNavigate();
  const { profile } = useSyncedHealthProfile();

  const [callState, setCallState] = useState<CallState>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [lastDoctorReply, setLastDoctorReply] = useState<string>('');
  const [recommendedLinks, setRecommendedLinks] = useState<ReplyLink[]>([]);
  const [followUpPrompts, setFollowUpPrompts] = useState<InteractiveTriagePrompt[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [audioWaveLevel, setAudioWaveLevel] = useState<number>(1);

  const directRecorderRef = useRef<DirectAudioRecorderHandle | null>(null);
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
      directRecorderRef.current?.cancel();
    } catch {
      /* ignore */
    }
    directRecorderRef.current = null;
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
    setRecommendedLinks([]);
    setFollowUpPrompts([]);
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

  // Start direct audio recording cycle (no Google Speech popup dialog)
  const startListeningCycle = async () => {
    if (isMuted) return;

    cleanupSpeechEngine();
    setCallState('listening');
    setMicError(null);
    setInterimText(isAr ? '🎙️ أنا سامعك دايركت... اتكلم براحتك وأول ما تسكت هرد عليك فوراً' : '🎙️ Listening directly... Speak naturally');
    currentTranscriptRef.current = '';

    playCallAudioTone('listen');

    if (!isDirectAudioRecordingSupported()) {
      setMicError(
        isAr
          ? 'المتصفح لا يدعم تسجيل المايكروفون المباشر. يمكنك استخدام خانة الكتابة السريعة أدناه.'
          : 'Direct microphone recording is not supported in this browser. Please type below.'
      );
      setCallState('paused');
      return;
    }

    try {
      directRecorderRef.current = await startDirectAudioRecording({
        autoStopOnSilence: true,
        silenceDelayMs: 1750,
        maxDurationMs: 45000,
        onVolumeLevel: (lvl) => {
          setAudioWaveLevel(Math.max(1, Math.min(5, Math.ceil(lvl / 20))));
        },
        onSpeechDetected: () => {
          setInterimText(isAr ? '🎙️ جاري الاستماع لصوتك مباشرة...' : '🎙️ Capturing your voice...');
        },
        onAudioReady: (audioBase64, audioMimeType) => {
          directRecorderRef.current = null;
          handlePatientAudio(audioBase64, audioMimeType);
        },
        onError: (err) => {
          directRecorderRef.current = null;
          if (err === 'NotAllowedError' || err === 'PermissionDeniedError' || err === 'not-allowed') {
            setMicError(
              isAr
                ? 'يرجى السماح بالوصول للمايكروفون من إعدادات التطبيق أو المتصفح للتحدث دايركت.'
                : 'Please allow microphone access to speak directly.'
            );
            setCallState('error');
          } else if (err === 'no-speech') {
            setCallState('paused');
            setInterimText('');
          } else {
            setMicError(isAr ? 'تعذر التقاط الصوت. اضغط على المايك للتجربة مرة أخرى.' : 'Audio capture error. Tap mic to retry.');
            setCallState('paused');
          }
        },
      });
    } catch {
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
      directRecorderRef.current?.cancel();
    } catch {
      /* ignore */
    }
    directRecorderRef.current = null;
  };

  const handlePatientAudio = async (audioBase64: string, audioMimeType: string) => {
    playCallAudioTone('send');
    setInterimText('');
    setCallState('thinking');
    setMicError(null);
    try {
      const medsNotice = profile.currentMeds?.length ? `الأدوية الحالية: ${profile.currentMeds.join('، ')}.` : '';
      const allergyNotice = profile.allergies?.length ? `الحساسيات المسجلة: ${profile.allergies.join('، ')}.` : '';
      const ctx = [medsNotice, allergyNotice].filter(Boolean).join(' ');
      const { transcript: heardText, reply } = await askGeminiWithAudio(audioBase64, audioMimeType, [], ctx, lang);
      if (heardText) {
        setTranscript(heardText);
        setRecommendedLinks(matchSpecialtyClinicLinks(heardText).slice(0, 4));
        setFollowUpPrompts(matchInteractiveTriagePrompts(heardText).slice(0, 3));
      }
      const cleanedReply = cleanAssistantMarkdown(reply);
      setLastDoctorReply(cleanedReply);
      setCallState('speaking');
      speakText(cleanedReply, lang, 1.0, () => {
        startListeningCycle();
      });
    } catch {
      const msg = isAr
        ? 'معلش معرفتش أسمع الرسالة الصوتية بوضوح أو الاتصال بالإنترنت ضعيف. ممكن تتكلم تاني أو تكتبلي تحت؟'
        : 'Sorry, could not process your voice message clearly. Please speak again or type below.';
      setLastDoctorReply(msg);
      setCallState('paused');
    }
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

      const clinicLinks = matchSpecialtyClinicLinks(cleanText);
      const seenPaths = new Set<string>();
      const mergedLinks: ReplyLink[] = [];
      for (const l of [...(contextual.links || []), ...clinicLinks]) {
        if (l && l.to && !seenPaths.has(l.to)) {
          seenPaths.add(l.to);
          mergedLinks.push(l);
        }
      }
      setRecommendedLinks(mergedLinks.slice(0, 4));
      setFollowUpPrompts(matchInteractiveTriagePrompts(cleanText).slice(0, 3));

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
          `أجب عليه باللهجة المصرية الدافئة والمطمئنة والمهنية (في 2 إلى 3 جمل قصيرة وسريعة وواضحة جداً يسهل سماعها هاتفياً) ووجهه للعيادة المختصة.\n` +
          `لو كان سؤاله عن دواء يؤثر على القيادة أو العمل (خاصة لو وظيفته سائق أو عامل)، نبهه بوضوح للأمان مع شغله.`;

        reply = await askGemini(voicePrompt, [], cleanText);
      }

      const cleanedReply = cleanAssistantMarkdown(reply);
      setLastDoctorReply(cleanedReply);
      setCallState('speaking');

      // Speak reply and loop back to listen
      speakText(cleanedReply, lang, 1.0, () => {
        startListeningCycle();
      });
    } catch (err) {
      console.warn('Call handling fallback to smart local engine:', err);
      const fallbackMsg = cleanAssistantMarkdown(buildOpenEgyptianOfflineFallback(cleanText, lang));
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
      // User tapped while listening -> stop recording and send audio immediately to AI
      if (directRecorderRef.current) {
        const rec = directRecorderRef.current;
        directRecorderRef.current = null;
        rec.stopAndSend();
      } else {
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
        'انا حاسس بوجع في جنب الشمال',
        'عندي نغزة في الصدر ونهجان',
        'مغص ووجع شديد في البطن والمعدة',
        'عندي صداع ودوخة وزغللة',
        'ضهري ورقبتي بيوجعوني',
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
          <div
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.65,
              color: '#f8fafc',
              fontWeight: 700,
              whiteSpace: 'pre-line',
              textAlign: isAr ? 'right' : 'left',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px 2px',
            }}
          >
            {lastDoctorReply || (isAr ? 'تحدث الآن وسيجيبك الطبيب فوراً...' : 'Speak now and the doctor will reply instantly...')}
          </div>

          {/* Direct Specialty Clinic Navigation Buttons inside Voice Call */}
          {recommendedLinks.length > 0 && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#fde68a', fontWeight: 800 }}>
                🏥 {isAr ? 'العيادة المختصة لحالتك (اضغط للانتقال فوراً):' : 'Recommended Specialty Clinic (Tap to open):'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {recommendedLinks.map((lnk, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      cleanupAll();
                      onClose();
                      navigate(lnk.to);
                    }}
                    style={{
                      background:
                        idx === 0
                          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                          : 'rgba(255,255,255,0.14)',
                      color: '#ffffff',
                      border:
                        idx === 0
                          ? '1px solid #34d399'
                          : '1px solid rgba(255,255,255,0.28)',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: idx === 0 ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                    }}
                  >
                    {isAr ? lnk.label.ar : lnk.label.en} ⬅️
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Symptom Triage Follow-up Buttons inside Voice Call */}
          {followUpPrompts.length > 0 && (
            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(255,255,255,0.14)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 800 }}>
                🩺 {isAr ? 'حدد وصف الوجع بدقة أكتر:' : 'Refine your symptom:'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {followUpPrompts.map((fp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePatientSpeech(isAr ? fp.queryAr : fp.queryEn)}
                    style={{
                      background: 'rgba(14, 165, 233, 0.16)',
                      color: '#e0f2fe',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '10px',
                      padding: '7px 11px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textAlign: isAr ? 'right' : 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? fp.labelAr : fp.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={startListeningCycle}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'إعادة المحاولة 🔄' : 'Retry 🔄'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const b = (window as any).AndroidAlarmBridge;
                  if (b && typeof b.openAppPermissionSettings === 'function') {
                    b.openAppPermissionSettings();
                  } else {
                    requestMicrophonePermission().then(() => startListeningCycle());
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ⚙️ {isAr ? 'فتح أذونات التطبيق' : 'App Permissions'}
              </button>
            </div>
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
