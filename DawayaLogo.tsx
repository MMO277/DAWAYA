import { CSSProperties } from 'react';

export type DawayaLogoVariant =
  | 'horizontal'
  | 'bilingual'
  | 'icon'
  | 'dark'
  | 'light'
  | 'mono';

export function DawayaIconMark({
  size = 40,
  monochrome = false,
  style,
}: {
  size?: number;
  monochrome?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block', ...style }}
    >
      <defs>
        <linearGradient id="dawayaNavyGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#101E36" />
          <stop offset="100%" stopColor="#162A4A" />
        </linearGradient>
        <linearGradient id="dawayaCyanGrad" x1="20" y1="18" x2="100" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00BFD0" />
          <stop offset="60%" stopColor="#24C8B8" />
          <stop offset="100%" stopColor="#9AE8E8" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="112"
        height="112"
        rx="28"
        fill={monochrome ? '#101E36' : 'url(#dawayaNavyGrad)'}
        stroke={monochrome ? '#FFFFFF' : '#00BFD0'}
        strokeWidth="2.5"
        strokeOpacity={monochrome ? 0.8 : 0.45}
      />
      <path
        d="M36 32V62C36 78.5685 49.4315 92 66 92C82.5685 92 96 78.5685 96 62C96 45.4315 82.5685 32 66 32H48"
        stroke={monochrome ? '#FFFFFF' : 'url(#dawayaCyanGrad)'}
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 24C34 24 36 27 36 32"
        stroke={monochrome ? '#FFFFFF' : '#9AE8E8'}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M54 24C50 24 48 27 48 32"
        stroke={monochrome ? '#FFFFFF' : '#9AE8E8'}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="29" cy="24" r="4" fill="#FFFFFF" />
      <circle cx="55" cy="24" r="4" fill="#FFFFFF" />
      <path
        d="M48 62H56L61 50L69 74L74 62H82"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="96"
        cy="62"
        r="8"
        fill="#101E36"
        stroke={monochrome ? '#FFFFFF' : '#00BFD0'}
        strokeWidth="4.5"
      />
      <circle cx="96" cy="62" r="3" fill={monochrome ? '#FFFFFF' : '#9AE8E8'} />
    </svg>
  );
}

export default function DawayaLogo({
  variant = 'horizontal',
  size = 40,
  showTagline = true,
  style,
}: {
  variant?: DawayaLogoVariant;
  size?: number;
  showTagline?: boolean;
  style?: CSSProperties;
}) {
  if (variant === 'icon') {
    return <DawayaIconMark size={size} style={style} />;
  }

  const isLight = variant === 'light';
  const isMono = variant === 'mono';
  const primaryTextColor = isLight || isMono ? '#101E36' : '#FFFFFF';
  const arTextColor = isMono ? '#101E36' : isLight ? '#008B99' : '#9AE8E8';
  const taglineColor = isMono ? '#101E36' : isLight ? '#008B99' : '#00BFD0';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.round(size * 0.26)}px`,
        padding: variant === 'dark' || variant === 'light' ? '8px 14px' : 0,
        borderRadius: variant === 'dark' || variant === 'light' ? '14px' : undefined,
        background:
          variant === 'dark'
            ? '#101E36'
            : variant === 'light'
            ? '#F3F7FC'
            : 'transparent',
        border:
          variant === 'light'
            ? '1px solid #D3E4EA'
            : variant === 'dark'
            ? '1px solid rgba(0, 191, 208, 0.3)'
            : undefined,
        ...style,
      }}
    >
      <DawayaIconMark size={size} monochrome={isMono} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 800,
            fontSize: `${Math.max(15, Math.round(size * 0.44))}px`,
            letterSpacing: '0.5px',
          }}
        >
          <span style={{ color: primaryTextColor, letterSpacing: '1.2px' }}>DAWAYA</span>
          <span style={{ color: '#00BFD0', fontWeight: 700 }}>|</span>
          <span style={{ color: arTextColor }}>دوايا</span>
        </div>
        {showTagline && (
          <small
            style={{
              color: taglineColor,
              fontSize: `${Math.max(10, Math.round(size * 0.27))}px`,
              fontWeight: 600,
              opacity: 0.95,
              whiteSpace: 'nowrap',
            }}
          >
            Your Health. Smarter. • صحتك.. بذكاء أكتر
          </small>
        )}
      </div>
    </div>
  );
}
