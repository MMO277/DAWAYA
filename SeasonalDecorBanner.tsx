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

        /* Mobile-first sizing (fits cleanly inside 67px side margins around 255px logo) */
        .dawaya-bunting { position: absolute; top: 0; left: 0; right: 0; width: 100%; height: 26px; }
        .dawaya-pos-left { position: absolute; left: 4px; }
        .dawaya-pos-right { position: absolute; right: 4px; }
        .dawaya-pos-left-secondary { position: absolute; left: 54px; top: 28px; display: none; }
        .dawaya-pos-right-secondary { position: absolute; right: 54px; top: 28px; display: none; }
        .dawaya-fanous-svg { width: 44px; height: 80px; }
        .dawaya-sheep-wrap { top: 44px; }
        .dawaya-sheep-svg { width: 56px; height: 48px; }
        .dawaya-balloon-svg { width: 56px; height: 76px; }
        .dawaya-ribbon-svg { width: 40px; height: 56px; }
        .dawaya-ring-svg { width: 38px; height: 38px; }
        .dawaya-desktop-only { display: none; }

        /* Tablet & Desktop (>= 768px): ample side margins around 780px hero container */
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
          .dawaya-ribbon-svg { width: 58px; height: 82px; }
          .dawaya-ring-svg { width: 56px; height: 56px; }
          .dawaya-desktop-only { display: block; }
        }
      `}</style>

      {/* Top Bunting Flags (Sits cleanly along the very top edge above the logo on both Mobile & Desktop) */}
      {(visualKind === 'ramadan' || visualKind === 'eid_adha' || visualKind === 'eid_fitr') && (
        <svg viewBox="0 0 400 28" preserveAspectRatio="none" className="dawaya-bunting">
          <path d="M0,2 Q100,18 200,4 Q300,18 400,2" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <polygon points="18,6 32,9 24,23" fill="#ef4444" />
          <polygon points="52,10 66,12 58,26" fill="#10b981" />
          <polygon points="88,12 102,12 94,27" fill="#f59e0b" />
          <polygon points="124,10 138,9 131,24" fill="#38bdf8" />
          <polygon points="160,7 174,6 167,21" fill="#ec4899" />
          <polygon points="226,6 240,7 233,21" fill="#ec4899" />
          <polygon points="262,9 276,10 269,24" fill="#38bdf8" />
          <polygon points="298,12 312,12 306,27" fill="#f59e0b" />
          <polygon points="334,12 348,10 342,26" fill="#10b981" />
          <polygon points="368,9 382,6 376,23" fill="#ef4444" />
        </svg>
      )}

      {/* RAMADAN: Hanging Glowing Lanterns on Left & Right + Crescent/Stars on Desktop */}
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

      {/* EID AL-ADHA: Two Cute Animated Sheep on Left & Right (Next to logo on mobile, full size on desktop + lanterns) */}
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

      {/* EID AL-FITR: Floating Colorful Balloon Clusters on Left & Right */}
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

      {/* PINK OCTOBER: Ribbons on Left & Right Corners */}
      {visualKind === 'pink_ribbon' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '28px' }}>
            <svg viewBox="0 0 60 85" className="dawaya-ribbon-svg">
              <path d="M25,75 L42,40 C50,20 42,5 28,5 C14,5 6,20 14,40 L35,80" fill="none" stroke="#fbcfe8" strokeWidth="9" strokeLinecap="round" />
              <path d="M32,75 L15,40 C7,20 15,5 28,5" fill="none" stroke="#f472b6" strokeWidth="9" strokeLinecap="round" />
            </svg>
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '28px' }}>
            <svg viewBox="0 0 60 85" className="dawaya-ribbon-svg">
              <path d="M25,75 L42,40 C50,20 42,5 28,5 C14,5 6,20 14,40 L35,80" fill="none" stroke="#fbcfe8" strokeWidth="9" strokeLinecap="round" />
              <path d="M32,75 L15,40 C7,20 15,5 28,5" fill="none" stroke="#f472b6" strokeWidth="9" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}

      {/* DIABETES / HEART: Rings & ECG */}
      {visualKind === 'diabetes_ring' && (
        <>
          <div className="dawaya-float dawaya-pos-left" style={{ top: '30px' }}>
            <svg viewBox="0 0 60 60" className="dawaya-ring-svg">
              <circle cx="30" cy="30" r="22" fill="none" stroke="#7dd3fc" strokeWidth="7" />
            </svg>
          </div>
          <div className="dawaya-float-slow dawaya-pos-right" style={{ top: '30px' }}>
            <svg viewBox="0 0 60 60" className="dawaya-ring-svg">
              <circle cx="30" cy="30" r="22" fill="none" stroke="#7dd3fc" strokeWidth="7" />
            </svg>
          </div>
        </>
      )}

      {visualKind === 'heart_ecg' && (
        <>
          <div className="dawaya-twinkle dawaya-pos-left" style={{ top: '30px', fontSize: '1.8rem' }}>❤️</div>
          <div className="dawaya-twinkle dawaya-pos-right" style={{ top: '30px', fontSize: '1.8rem' }}>💓</div>
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
