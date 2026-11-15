import { Link } from 'react-router-dom';
import type { CampaignVisualKind, WhoHealthCampaign } from './whoHealthCampaigns';

export function SeasonalHeroDecorLayer({ visualKind }: { visualKind: CampaignVisualKind }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <style>{`
        @keyframes dawayaSwing { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
        @keyframes dawayaFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
        @keyframes dawayaTwinkle { 0%, 100% { opacity: 0.35; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.12); } }
        @keyframes dawayaHop { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-6px) rotate(-2deg); } }
        .dawaya-swing { animation: dawayaSwing 3.2s ease-in-out infinite; }
        .dawaya-swing-slow { animation: dawayaSwing 4.1s ease-in-out infinite reverse; }
        .dawaya-float { animation: dawayaFloat 3.1s ease-in-out infinite; }
        .dawaya-float-slow { animation: dawayaFloat 4.2s ease-in-out infinite reverse; }
        .dawaya-twinkle { animation: dawayaTwinkle 2.2s ease-in-out infinite; }
        .dawaya-hop { animation: dawayaHop 2.6s ease-in-out infinite; }
      `}</style>

      {visualKind === 'ramadan' && (
        <svg viewBox="0 0 900 320" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">
          <path d="M0,12 Q225,58 450,16 Q675,58 900,12" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <polygon points="45,23 68,27 54,55" fill="#ef4444" />
          <polygon points="105,34 128,37 115,65" fill="#10b981" />
          <polygon points="165,39 188,40 175,68" fill="#f59e0b" />
          <polygon points="235,36 258,34 246,62" fill="#38bdf8" />
          <polygon points="305,28 328,24 318,52" fill="#ec4899" />
          <polygon points="575,24 598,28 586,54" fill="#ec4899" />
          <polygon points="645,34 668,36 655,63" fill="#38bdf8" />
          <polygon points="715,40 738,39 726,67" fill="#f59e0b" />
          <polygon points="775,36 798,33 787,60" fill="#10b981" />
          <polygon points="835,26 858,22 848,49" fill="#ef4444" />

          <circle className="dawaya-twinkle" cx="150" cy="115" r="3" fill="#fde68a" />
          <circle className="dawaya-twinkle" cx="310" cy="85" r="2.5" fill="#fef08a" />
          <circle className="dawaya-twinkle" cx="590" cy="85" r="3" fill="#fde68a" />
          <circle className="dawaya-twinkle" cx="750" cy="115" r="2.5" fill="#fef08a" />

          <g className="dawaya-swing" style={{ transformOrigin: '95px 0px' }}>
            <line x1="95" y1="0" x2="95" y2="55" stroke="#fde68a" strokeWidth="2" />
            <polygon points="83,55 107,55 115,72 75,72" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" />
            <polygon points="75,72 115,72 109,116 81,116" fill="rgba(253, 224, 71, 0.85)" stroke="#fbbf24" strokeWidth="2" />
            <ellipse cx="95" cy="94" rx="8" ry="13" fill="#ffffff" opacity="0.75" />
            <polygon points="81,116 109,116 102,128 88,128" fill="#d97706" />
          </g>

          <g className="dawaya-swing-slow" style={{ transformOrigin: '805px 0px' }}>
            <line x1="805" y1="0" x2="805" y2="55" stroke="#fde68a" strokeWidth="2" />
            <polygon points="793,55 817,55 825,72 785,72" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" />
            <polygon points="785,72 825,72 819,116 791,116" fill="rgba(253, 224, 71, 0.85)" stroke="#fbbf24" strokeWidth="2" />
            <ellipse cx="805" cy="94" rx="8" ry="13" fill="#ffffff" opacity="0.75" />
            <polygon points="791,116 819,116 812,128 798,128" fill="#d97706" />
          </g>

          <g className="dawaya-float">
            <path d="M464,16 A22,22 0 1,0 484,46 A17,17 0 1,1 464,16 Z" fill="#fde047" />
          </g>
        </svg>
      )}

      {visualKind === 'eid_fitr' && (
        <svg viewBox="0 0 900 320" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">
          <circle className="dawaya-twinkle" cx="180" cy="60" r="5" fill="#fde047" />
          <circle className="dawaya-twinkle" cx="290" cy="40" r="4" fill="#38bdf8" />
          <circle className="dawaya-twinkle" cx="610" cy="45" r="5" fill="#f472b6" />
          <circle className="dawaya-twinkle" cx="720" cy="70" r="4" fill="#a7f3d0" />

          <g className="dawaya-float">
            <path d="M80,130 Q80,165 92,190" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <ellipse cx="80" cy="95" rx="22" ry="28" fill="#f43f5e" />
            <ellipse cx="73" cy="86" rx="5" ry="9" fill="#ffffff" opacity="0.4" />
            <path d="M118,145 Q118,175 108,205" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <ellipse cx="118" cy="112" rx="20" ry="25" fill="#fbbf24" />
          </g>

          <g className="dawaya-float-slow">
            <path d="M820,130 Q820,165 808,190" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <ellipse cx="820" cy="95" rx="22" ry="28" fill="#38bdf8" />
            <ellipse cx="813" cy="86" rx="5" ry="9" fill="#ffffff" opacity="0.4" />
            <path d="M782,145 Q782,175 792,205" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <ellipse cx="782" cy="112" rx="20" ry="25" fill="#a855f7" />
          </g>
        </svg>
      )}

      {visualKind === 'eid_adha' && (
        <svg viewBox="0 0 900 320" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">
          <path d="M0,12 Q225,50 450,16 Q675,50 900,12" fill="none" stroke="#fde047" strokeWidth="2" />
          <circle className="dawaya-twinkle" cx="220" cy="48" r="4" fill="#fde047" />
          <circle className="dawaya-twinkle" cx="680" cy="48" r="4" fill="#fde047" />

          {/* Left Cartoon Eid Sheep */}
          <g className="dawaya-hop" transform="translate(46, 175)">
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
            <circle cx="76" cy="57" r="4" fill="#ef4444" />
          </g>

          {/* Right Cartoon Eid Sheep */}
          <g className="dawaya-hop" style={{ animationDelay: '0.6s' }} transform="translate(734, 175)">
            <rect x="26" y="64" width="7" height="22" rx="3" fill="#1e293b" />
            <rect x="42" y="64" width="7" height="22" rx="3" fill="#1e293b" />
            <rect x="64" y="64" width="7" height="22" rx="3" fill="#1e293b" />
            <rect x="78" y="64" width="7" height="22" rx="3" fill="#1e293b" />
            <circle cx="42" cy="44" r="21" fill="#ffffff" />
            <circle cx="62" cy="34" r="24" fill="#ffffff" />
            <circle cx="82" cy="42" r="22" fill="#ffffff" />
            <circle cx="62" cy="54" r="22" fill="#f8fafc" />
            <ellipse cx="28" cy="42" rx="16" ry="18" fill="#1e293b" />
            <ellipse cx="13" cy="36" rx="7" ry="4" fill="#334155" transform="rotate(-25 13 36)" />
            <ellipse cx="43" cy="36" rx="7" ry="4" fill="#334155" transform="rotate(25 43 36)" />
            <circle cx="28" cy="24" r="9" fill="#ffffff" />
            <circle cx="23" cy="40" r="3" fill="#ffffff" />
            <circle cx="33" cy="40" r="3" fill="#ffffff" />
            <circle cx="24" cy="40" r="1.5" fill="#0f172a" />
            <circle cx="34" cy="40" r="1.5" fill="#0f172a" />
            <path d="M24,49 Q28,53 32,49" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
            <circle cx="44" cy="57" r="4" fill="#10b981" />
          </g>
        </svg>
      )}

      {visualKind === 'pink_ribbon' && (
        <svg viewBox="0 0 900 320" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">
          <g className="dawaya-float" transform="translate(68, 70)">
            <path d="M25,75 L42,40 C50,20 42,5 28,5 C14,5 6,20 14,40 L35,80" fill="none" stroke="#fbcfe8" strokeWidth="10" strokeLinecap="round" />
            <path d="M32,75 L15,40 C7,20 15,5 28,5" fill="none" stroke="#f472b6" strokeWidth="10" strokeLinecap="round" />
          </g>
          <g className="dawaya-float-slow" transform="translate(772, 70)">
            <path d="M25,75 L42,40 C50,20 42,5 28,5 C14,5 6,20 14,40 L35,80" fill="none" stroke="#fbcfe8" strokeWidth="10" strokeLinecap="round" />
            <path d="M32,75 L15,40 C7,20 15,5 28,5" fill="none" stroke="#f472b6" strokeWidth="10" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {visualKind === 'diabetes_ring' && (
        <svg viewBox="0 0 900 320" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">
          <g className="dawaya-float" transform="translate(72, 75)">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#7dd3fc" strokeWidth="8" />
          </g>
          <g className="dawaya-float-slow" transform="translate(768, 75)">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#7dd3fc" strokeWidth="8" />
          </g>
          <path d="M0,265 L280,265 L300,235 L320,285 L340,220 L360,275 L380,265 L900,265" fill="none" stroke="rgba(186,230,253,0.32)" strokeWidth="3" />
        </svg>
      )}

      {visualKind === 'heart_ecg' && (
        <svg viewBox="0 0 900 320" width="100%" height="100%" preserveAspectRatio="xMidYMin slice">
          <path d="M0,265 L310,265 L335,230 L355,290 L380,210 L405,275 L425,265 L900,265" fill="none" stroke="rgba(254,202,202,0.4)" strokeWidth="3.5" />
        </svg>
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

      <Link
        to={campaign.targetRoute}
        className="btn small"
        style={{
          alignSelf: 'flex-start',
          background: campaign.accentColor,
          borderColor: campaign.accentColor,
          color: '#ffffff',
          fontWeight: 900,
        }}
      >
        {isAr ? campaign.ctaAr : campaign.ctaEn}
      </Link>
    </section>
  );
}
