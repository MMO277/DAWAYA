import { EgyptGovernorateRamadanCountdown } from './ramadanPrayerTimes';
import { Link } from 'react-router-dom';
import type { CampaignVisualKind, WhoHealthCampaign } from './whoHealthCampaigns';

function CuteSheepSvg({
  flip = false,
  ribbonColor = '#ef4444',
  className = '',
}: {
  flip?: boolean;
  ribbonColor?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 110 95"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
      }}
    >
      <rect x="26" y="64" width="7" height="22" rx="3" fill="#1e293b" />
      <rect x="42" y="64" width="7" height="22" rx="3" fill="#1e293b" />
      <rect x="64" y="64" width="7" height="22" rx="3" fill="#1e293b" />
      <rect x="78" y="64" width="7" height="22" rx="3" fill="#1e293b" />
      <circle cx="38" cy="42" r="22" fill="#ffffff" />
      <circle cx="58" cy="34" r="24" fill="#ffffff" />
      <circle cx="78" cy="44" r="21" fill="#ffffff" />
      <circle cx="58" cy="54" r="22" fill="#f8fafc" />
      <ellipse cx="92" cy="42" rx="16" ry="18" fill="#1e293b" />
      <ellipse cx="77" cy="36" rx="7" ry="4" fill="#334155" transform="rotate(-25 77 36)" />
      <ellipse cx="107" cy="36" rx="7" ry="4" fill="#334155" transform="rotate(25 107 36)" />
      <circle cx="92" cy="24" r="9" fill="#ffffff" />
      <circle cx="87" cy="40" r="3" fill="#ffffff" />
      <circle cx="97" cy="40" r="3" fill="#ffffff" />
      <circle cx="88" cy="40" r="1.5" fill="#0f172a" />
      <circle cx="98" cy="40" r="1.5" fill="#0f172a" />
      <path d="M88,49 Q92,53 96,49" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="76" cy="57" r="4.5" fill={ribbonColor} />
    </svg>
  );
}

function HangingFanousSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 110"
      className={className}
      style={{ display: 'block', filter: 'drop-shadow(0 0 10px rgba(253,224,71,0.55))' }}
    >
      <line x1="30" y1="0" x2="30" y2="26" stroke="#fde68a" strokeWidth="2.5" />
      <circle cx="30" cy="26" r="4" fill="#fbbf24" />
      <polygon points="18,30 42,30 49,44 11,44" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" />
      <polygon points="11,44 49,44 43,84 17,84" fill="rgba(253, 224, 71, 0.9)" stroke="#fbbf24" strokeWidth="2" />
      <ellipse cx="30" cy="64" rx="8" ry="13" fill="#ffffff" opacity="0.85" />
      <polygon points="17,84 43,84 37,96 23,96" fill="#d97706" stroke="#fde68a" strokeWidth="1" />
    </svg>
  );
}

function BalloonClusterSvg({
  colors,
  className = '',
}: {
  colors: [string, string, string];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 90 120"
      className={className}
      style={{ display: 'block', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}
    >
      <path d="M25,68 Q28,92 38,116" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <path d="M55,58 Q50,86 42,116" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <path d="M72,74 Q62,96 46,116" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <ellipse cx="25" cy="42" rx="18" ry="23" fill={colors[0]} />
      <ellipse cx="19" cy="34" rx="4" ry="7" fill="#ffffff" opacity="0.45" />
      <ellipse cx="55" cy="30" rx="19" ry="24" fill={colors[1]} />
      <ellipse cx="49" cy="22" rx="4" ry="7" fill="#ffffff" opacity="0.45" />
      <ellipse cx="72" cy="50" rx="15" ry="20" fill={colors[2]} />
      <ellipse cx="67" cy="43" rx="3.5" ry="6" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

function PinkRibbonDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 90 105"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 12px rgba(244, 114, 182, 0.45))',
      }}
    >
      <circle cx="45" cy="44" r="34" fill="rgba(251, 207, 232, 0.16)" stroke="rgba(251, 207, 232, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M32,88 L56,44 C66,22 54,8 42,8 C30,8 18,22 28,44 L54,90" fill="none" stroke="#fbcfe8" strokeWidth="11" strokeLinecap="round" />
      <path d="M52,88 L28,44 C18,22 30,8 42,8" fill="none" stroke="#f472b6" strokeWidth="11" strokeLinecap="round" />
      <circle cx="72" cy="24" r="6" fill="#fde047" />
      <circle cx="18" cy="64" r="4.5" fill="#fbcfe8" />
    </svg>
  );
}

function HeartEcgDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 95"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 14px rgba(239, 68, 68, 0.48))',
      }}
    >
      <path
        d="M50,82 C50,82 14,58 14,32 C14,18 25,10 37,10 C44,10 48,14 50,19 C52,14 56,10 63,10 C75,10 86,18 86,32 C86,58 50,82 50,82 Z"
        fill="#ef4444"
        stroke="#fecaca"
        strokeWidth="2.5"
      />
      <polyline
        points="18,44 36,44 43,26 51,62 58,36 64,44 82,44"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="82" cy="18" r="5" fill="#fde047" />
    </svg>
  );
}

function DiabetesRingDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 14px rgba(56, 189, 248, 0.5))',
      }}
    >
      <circle cx="48" cy="48" r="32" fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" strokeWidth="9" />
      <circle cx="48" cy="48" r="24" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="4 4" />
      {/* Protective Drop Inside the Blue Ring */}
      <path
        d="M48,26 C48,26 34,43 34,54 C34,62 40.3,68 48,68 C55.7,68 62,62 62,54 C62,43 48,26 48,26 Z"
        fill="#f43f5e"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <ellipse cx="43" cy="51" rx="3" ry="5" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

function KidneyCareDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 95"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 12px rgba(20, 184, 166, 0.45))',
      }}
    >
      {/* Left Kidney Shape + Water Drop */}
      <path
        d="M36,20 C20,20 14,35 16,52 C18,68 28,78 40,74 C48,71 48,60 43,54 C39,49 39,43 43,38 C48,32 47,20 36,20 Z"
        fill="#f43f5e"
        stroke="#fecdd3"
        strokeWidth="2.2"
      />
      {/* Right Water Droplet Shield */}
      <path
        d="M72,18 C72,18 56,38 56,52 C56,61 63,68 72,68 C81,68 88,61 88,52 C88,38 72,18 72,18 Z"
        fill="#38bdf8"
        stroke="#e0f2fe"
        strokeWidth="2.2"
      />
      <ellipse cx="67" cy="48" rx="3.5" ry="6" fill="#ffffff" opacity="0.6" />
      <circle cx="52" cy="18" r="4" fill="#fde047" />
    </svg>
  );
}

function LungsBreathDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 105 95"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 12px rgba(45, 212, 191, 0.45))',
      }}
    >
      {/* Trachea */}
      <path d="M52,12 V36 M52,28 L40,38 M52,28 L64,38" stroke="#e0f2fe" strokeWidth="4.5" strokeLinecap="round" />
      {/* Left Lung */}
      <path
        d="M44,24 C28,24 16,40 16,60 C16,74 26,80 38,76 C45,74 47,66 47,54 V30 C47,26 46,24 44,24 Z"
        fill="#38bdf8"
        stroke="#bae6fd"
        strokeWidth="2.2"
      />
      {/* Right Lung */}
      <path
        d="M60,24 C76,24 88,40 88,60 C88,74 78,80 66,76 C59,74 57,66 57,54 V30 C57,26 58,24 60,24 Z"
        fill="#38bdf8"
        stroke="#bae6fd"
        strokeWidth="2.2"
      />
      {/* Bronchial Tree Highlights */}
      <path d="M38,42 Q30,50 28,62 M66,42 Q74,50 76,62" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function BabyMomDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 105"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 12px rgba(56, 189, 248, 0.42))',
      }}
    >
      {/* Pastel Balloons + Baby Feeding Bottle & Star */}
      <ellipse cx="28" cy="34" rx="15" ry="19" fill="#f472b6" />
      <ellipse cx="23" cy="28" rx="3" ry="5" fill="#ffffff" opacity="0.5" />
      <path d="M28,53 Q32,74 40,92" fill="none" stroke="#e2e8f0" strokeWidth="1.6" />
      {/* Baby Bottle */}
      <g transform="rotate(12 64 54)">
        <path d="M58,18 C58,12 68,12 68,18 L70,26 H56 L58,18 Z" fill="#fbbf24" />
        <rect x="52" y="26" width="22" height="7" rx="3" fill="#38bdf8" />
        <rect x="50" y="33" width="26" height="46" rx="8" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
        <rect x="53" y="46" width="20" height="28" rx="5" fill="#e0f2fe" />
        <line x1="66" y1="44" x2="72" y2="44" stroke="#0284c7" strokeWidth="2" />
        <line x1="66" y1="54" x2="72" y2="54" stroke="#0284c7" strokeWidth="2" />
        <line x1="66" y1="64" x2="72" y2="64" stroke="#0284c7" strokeWidth="2" />
      </g>
    </svg>
  );
}

function BrainCareDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 95"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 14px rgba(168, 85, 247, 0.48))',
      }}
    >
      <circle cx="50" cy="48" r="36" fill="rgba(192, 132, 252, 0.16)" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Stylized Neural Brain & Heart */}
      <path
        d="M48,24 C34,22 24,32 26,44 C20,48 22,62 32,66 C34,74 46,76 48,68 Z"
        fill="#c084fc"
        stroke="#f3e8ff"
        strokeWidth="2.2"
      />
      <path
        d="M52,24 C66,22 76,32 74,44 C80,48 78,62 68,66 C66,74 54,76 52,68 Z"
        fill="#a855f7"
        stroke="#f3e8ff"
        strokeWidth="2.2"
      />
      <circle cx="38" cy="42" r="3" fill="#fde047" />
      <circle cx="62" cy="42" r="3" fill="#fde047" />
      <circle cx="50" cy="16" r="4" fill="#fde047" />
    </svg>
  );
}

function ShieldHealthDecorSvg({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 102"
      className={className}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        display: 'block',
        filter: 'drop-shadow(0 6px 14px rgba(16, 185, 129, 0.45))',
      }}
    >
      <path
        d="M48,10 L16,23 V48 C16,70 30,86 48,93 C66,86 80,70 80,48 V23 L48,10 Z"
        fill="#10b981"
        stroke="#fde68a"
        strokeWidth="3"
      />
      <path
        d="M48,18 L23,28 V48 C23,65 34,78 48,84 C62,78 73,65 73,48 V28 L48,18 Z"
        fill="#059669"
      />
      {/* Medical Cross + Capsule Star */}
      <rect x="43" y="33" width="10" height="32" rx="3" fill="#ffffff" />
      <rect x="32" y="44" width="32" height="10" rx="3" fill="#ffffff" />
      <circle cx="78" cy="18" r="4.5" fill="#fde047" />
    </svg>
  );
}

function TopSeasonalGarlandSvg({ visualKind }: { visualKind: CampaignVisualKind }) {
  const palette: [string, string, string, string, string] =
    visualKind === 'pink_ribbon'
      ? ['#f472b6', '#fbcfe8', '#ec4899', '#fde047', '#f9a8d4']
      : visualKind === 'heart_ecg'
        ? ['#ef4444', '#fca5a5', '#f59e0b', '#fecaca', '#fb7185']
        : visualKind === 'diabetes_ring' || visualKind === 'baby_mom'
          ? ['#38bdf8', '#bae6fd', '#fbbf24', '#7dd3fc', '#f472b6']
          : visualKind === 'brain_mental'
            ? ['#a855f7', '#d8b4fe', '#fbbf24', '#818cf8', '#c084fc']
            : ['#ef4444', '#10b981', '#f59e0b', '#38bdf8', '#ec4899'];

  return (
    <svg viewBox="0 0 400 28" preserveAspectRatio="none" className="dawaya-bunting">
      <path d="M0,2 Q100,18 200,4 Q300,18 400,2" fill="none" stroke="#fde68a" strokeWidth="2" />
      <polygon points="18,6 32,9 24,23" fill={palette[0]} />
      <polygon points="52,10 66,12 58,26" fill={palette[1]} />
      <polygon points="88,12 102,12 94,27" fill={palette[2]} />
      <polygon points="124,10 138,9 131,24" fill={palette[3]} />
      <polygon points="160,7 174,6 167,21" fill={palette[4]} />
      <polygon points="226,6 240,7 233,21" fill={palette[4]} />
      <polygon points="262,9 276,10 269,24" fill={palette[3]} />
      <polygon points="298,12 312,12 306,27" fill={palette[2]} />
      <polygon points="334,12 348,10 342,26" fill={palette[1]} />
      <polygon points="368,9 382,6 376,23" fill={palette[0]} />
    </svg>
  );
}

export function SeasonalHeroDecorLayer({ visualKind }: { visualKind: CampaignVisualKind }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 2,
      }}
    >
      <style>{`
        @keyframes dawayaSwing { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes dawayaFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
        @keyframes dawayaTwinkle { 0%, 100% { opacity: 0.45; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.12); } }
        @keyframes dawayaHop { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-7px) rotate(-2deg); } }
        .dawaya-swing { transform-origin: top center; animation: dawayaSwing 3.2s ease-in-out infinite; }
        .dawaya-swing-slow { transform-origin: top center; animation: dawayaSwing 4.1s ease-in-out infinite reverse; }
        .dawaya-float { animation: dawayaFloat 3.1s ease-in-out infinite; }
        .dawaya-float-slow { animation: dawayaFloat 4.2s ease-in-out infinite reverse; }
        .dawaya-twinkle { animation: dawayaTwinkle 2.2s ease-in-out infinite; }
        .dawaya-hop { animation: dawayaHop 2.4s ease-in-out infinite; }

        /* Mobile-first sizing */
        .dawaya-bunting { position: absolute; top: 0; left: 0; right: 0; width: 100%; height: 26px; }
        .dawaya-pos-left { position: absolute; left: 4px; }
        .dawaya-pos-right { position: absolute; right: 4px; }
        .dawaya-pos-left-secondary { position: absolute; left: 54px; top: 28px; display: none; }
        .dawaya-pos-right-secondary { position: absolute; right: 54px; top: 28px; display: none; }
        .dawaya-fanous-svg { width: 44px; height: 80px; }
        .dawaya-sheep-wrap { top: 44px; }
        .dawaya-sheep-svg { width: 56px; height: 48px; }
        .dawaya-balloon-svg { width: 56px; height: 76px; }
        .dawaya-decor-svg { width: 54px; height: 58px; }
        .dawaya-desktop-only { display: none; }

        /* Tablet & Desktop (>= 768px) */
        @media (min-width: 768px) {
          .dawaya-bunting { height: 34px; }
          .dawaya-pos-left { left: clamp(20px, 4.5vw, 72px); }
          .dawaya-pos-right { right: clamp(20px, 4.5vw, 72px); }
          .dawaya-pos-left-secondary { display: block; left: clamp(92px, 11vw, 170px); top: 40px; }
          .dawaya-pos-right-secondary { display: block; right: clamp(92px, 11vw, 170px); top: 40px; }
          .dawaya-fanous-svg { width: 68px; height: 124px; }
          .dawaya-sheep-wrap { top: 108px; }
          .dawaya-sheep-svg { width: 96px; height: 84px; }
          .dawaya-balloon-svg { width: 92px; height: 122px; }
          .dawaya-decor-svg { width: 88px; height: 92px; }
          .dawaya-desktop-only { display: block; }
        }
      `}</style>

      {/* Universal Top Garland / Bunting Flags for ALL 11 Visual Themes */}
      <TopSeasonalGarlandSvg visualKind={visualKind} />

      {/* 1. RAMADAN: Hanging Glowing Lanterns on Left & Right + Crescent/Stars */}
      {visualKind === 'ramadan' && (
        <>
          <div className="dawaya-swing dawaya-pos-left" style={{ top: '4px' }}>
            <HangingFanousSvg className="dawaya-fanous-svg" />
          </div>
          <div className="dawaya-swing-slow dawaya-pos-right" style={{ top: '4px' }}>
            <HangingFanousSvg className="dawaya-fanous-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ fontSize: '1.35rem' }}>✨</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ fontSize: '1.35rem' }}>🌙</div>
        </>
      )}

      {/* 2. EID AL-ADHA: Two Cute Animated Sheep on Left & Right + Hanging Lanterns */}
      {visualKind === 'eid_adha' && (
        <>
          <div className="dawaya-hop dawaya-pos-left dawaya-sheep-wrap">
            <CuteSheepSvg flip={false} ribbonColor="#ef4444" className="dawaya-sheep-svg" />
          </div>
          <div className="dawaya-hop dawaya-pos-right dawaya-sheep-wrap" style={{ animationDelay: '0.6s' }}>
            <CuteSheepSvg flip={true} ribbonColor="#10b981" className="dawaya-sheep-svg" />
          </div>
          <div className="dawaya-swing dawaya-pos-left dawaya-desktop-only" style={{ top: '4px' }}>
            <HangingFanousSvg className="dawaya-fanous-svg" />
          </div>
          <div className="dawaya-swing-slow dawaya-pos-right dawaya-desktop-only" style={{ top: '4px' }}>
            <HangingFanousSvg className="dawaya-fanous-svg" />
          </div>
        </>
      )}

      {/* 3. EID AL-FITR: Floating Colorful Balloon Clusters on Left & Right */}
      {visualKind === 'eid_fitr' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '20px' }}>
            <BalloonClusterSvg colors={['#f43f5e', '#fbbf24', '#38bdf8']} className="dawaya-balloon-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '20px' }}>
            <BalloonClusterSvg colors={['#a855f7', '#38bdf8', '#10b981']} className="dawaya-balloon-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '125px', fontSize: '1.4rem' }}>🎆</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '125px', fontSize: '1.4rem' }}>🎉</div>
        </>
      )}

      {/* 4. PINK OCTOBER / WORLD CANCER DAY: 3D Glowing Pink Ribbons + Blossoms */}
      {visualKind === 'pink_ribbon' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '26px' }}>
            <PinkRibbonDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '26px' }}>
            <PinkRibbonDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🌸</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🎀</div>
        </>
      )}

      {/* 5. WORLD DIABETES DAY: Official Blue Ring + Glucose Drop Shield */}
      {visualKind === 'diabetes_ring' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '26px' }}>
            <DiabetesRingDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '26px' }}>
            <DiabetesRingDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🩸</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>💙</div>
        </>
      )}

      {/* 6. WORLD HEART / HYPERTENSION / BLOOD DONOR DAY: Animated 3D Heart + ECG Pulse */}
      {visualKind === 'heart_ecg' && (
        <>
          <div className="dawaya-hop dawaya-pos-left" style={{ top: '26px' }}>
            <HeartEcgDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-hop dawaya-pos-right" style={{ top: '26px', animationDelay: '0.5s' }}>
            <HeartEcgDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>💓</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🩺</div>
        </>
      )}

      {/* 7. WORLD KIDNEY DAY: Animated Kidneys & Hydration Water Droplets */}
      {visualKind === 'kidney_care' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '26px' }}>
            <KidneyCareDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '26px' }}>
            <KidneyCareDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>💧</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🫘</div>
        </>
      )}

      {/* 8. WORLD ASTHMA / NO TOBACCO DAY: Animated Healthy Lungs & Oxygen Breeze */}
      {visualKind === 'lungs_breath' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '26px' }}>
            <LungsBreathDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '26px' }}>
            <LungsBreathDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🌬️</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🫁</div>
        </>
      )}

      {/* 9. IMMUNIZATION WEEK / BREASTFEEDING WEEK: Animated Baby Bottle, Pastel Balloons & Shield */}
      {visualKind === 'baby_mom' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '22px' }}>
            <BabyMomDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '22px' }}>
            <BabyMomDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>👶</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🍼</div>
        </>
      )}

      {/* 10. WORLD ALZHEIMER'S & GERIATRIC DAY: Animated Neural Brain & Memory Halo */}
      {visualKind === 'brain_mental' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '26px' }}>
            <BrainCareDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '26px' }}>
            <BrainCareDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🧠</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>✨</div>
        </>
      )}

      {/* 11. WORLD HEALTH / PATIENT SAFETY / WAAW / HEARING / ORAL / HEPATITIS: 3D Medical Shield */}
      {visualKind === 'shield_health' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '26px' }}>
            <ShieldHealthDecorSvg flip={false} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '26px' }}>
            <ShieldHealthDecorSvg flip={true} className="dawaya-decor-svg" />
          </div>
          <div className="dawaya-twinkle dawaya-pos-left-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>🛡️</div>
          <div className="dawaya-twinkle dawaya-pos-right-secondary" style={{ top: '115px', fontSize: '1.3rem' }}>💊</div>
        </>
      )}
    </div>
  );
}

export function SeasonalAwarenessBasketCard({
  campaign,
  isAr,
}: {
  campaign: WhoHealthCampaign;
  isAr: boolean;
}) {
  const tips = isAr ? campaign.tipsAr : campaign.tipsEn;
  return (
    <section
      className="card stack"
      style={{
        border: `2.5px solid ${campaign.accentColor}`,
        borderRadius: '20px',
        padding: '16px 18px',
        background: '#ffffff',
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div className="row wrapRow" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: campaign.accentColor }}>
          {isAr ? campaign.basketTitleAr : campaign.basketTitleEn}
        </h2>
        <span
          className="badge"
          style={{
            background: `${campaign.accentColor}1A`,
            color: campaign.accentColor,
            border: `1px solid ${campaign.accentColor}55`,
            fontWeight: 800,
          }}
        >
          {isAr ? campaign.badgeAr : campaign.badgeEn}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {tips.map((tip, idx) => (
          <div
            key={idx}
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '10px 12px',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#1e293b',
              borderInlineStart: `4px solid ${campaign.accentColor}`,
            }}
          >
            {tip}
          </div>
        ))}
      </div>

      {campaign.visualKind === 'ramadan' && (
        <EgyptGovernorateRamadanCountdown isAr={isAr} compact={true} />
      )}

      <div className="row wrapRow" style={{ gap: '8px', alignItems: 'center' }}>
        <Link
          to={campaign.targetRoute}
          className="btn small"
          style={{
            background: campaign.accentColor,
            borderColor: campaign.accentColor,
            color: '#ffffff',
            fontWeight: 900,
          }}
        >
          {isAr ? campaign.ctaAr : campaign.ctaEn}
        </Link>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            isAr
              ? `${campaign.icon} *${campaign.titleAr}*\n\n💡 *${campaign.basketTitleAr}:*\n${campaign.tipsAr.map((t) => `• ${t}`).join('\n')}\n\n💊 فحص الأدوية والبدائل الأرخص وتوقيت الصيام على منصة دوايا:\nhttps://dawaya.pages.dev`
              : `${campaign.icon} *${campaign.titleEn}*\n\n💡 *${campaign.basketTitleEn}:*\n${campaign.tipsEn.map((t) => `• ${t}`).join('\n')}\n\n💊 DAWAYA Platform:\nhttps://dawaya.pages.dev`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn small ghost"
          style={{
            borderColor: '#16a34a',
            color: '#15803d',
            background: 'rgba(22, 163, 74, 0.08)',
            fontWeight: 800,
          }}
        >
          📲 {isAr ? 'مشاركة التهنئة والنصيحة عبر واتساب' : 'Share Greeting & Tip on WhatsApp'}
        </a>
      </div>
    </section>
  );
}
