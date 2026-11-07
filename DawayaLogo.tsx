import { CSSProperties, useId } from 'react';

export type DawayaLogoVariant =
  | 'horizontal'
  | 'bilingual'
  | 'icon'
  | 'wordmark-card'
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
  const badgeFill = monochrome ? '#FFFFFF' : '#D2D1A3';
  const inkColor = '#101E36';
  const heartLeft = monochrome ? '#101E36' : '#128765';
  const heartRight = monochrome ? '#101E36' : '#0A7C5A';
  const heartCenter = monochrome ? '#101E36' : '#055A40';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block', borderRadius: '50%', ...style }}
    >
      <circle
        cx="100"
        cy="100"
        r="98"
        fill={badgeFill}
        stroke={inkColor}
        strokeWidth={monochrome ? '5' : '3'}
        strokeOpacity={monochrome ? 0.9 : 0.25}
      />
      <g transform="translate(100, 100) scale(0.82) translate(-106, -106)">
        {/* Two-Tone Geometric Emerald Heart inside Earpieces */}
        <g transform="translate(75, 87)">
          <path
            d="M 0 -7 C -5.5 -14.5, -16.5 -14.5, -20.5 -7.5 C -24.5 -0.5, -19.5 8.5, 0 22 L 8 6 Z"
            fill={heartLeft}
          />
          <path
            d="M 0 -7 C 5.5 -14.5, 16.5 -14.5, 20.5 -7.5 C 24.5 -0.5, 19.5 8.5, 0 22 Z"
            fill={heartRight}
          />
          <path
            d="M 0 -7 L 9 3 L 0 22 L -9 3 Z"
            fill={heartCenter}
            opacity="0.75"
          />
        </g>

        {/* Binaural Earpiece Tubes */}
        <path
          d="M 27 62 C 25 43, 43 31, 60 31 C 76 31, 95 43, 111 56 C 122 65, 127 75, 127 84"
          stroke={inkColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 27 106 C 25 125, 43 137, 60 137 C 76 137, 95 125, 111 112 C 122 103, 127 93, 127 84"
          stroke={inkColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 88 42 C 108 54, 125 70, 125 84 C 125 98, 108 114, 88 126 C 104 112, 115 98, 115 84 C 115 70, 104 56, 88 42 Z"
          fill={inkColor}
        />

        {/* Earpiece Tips */}
        <circle cx="27" cy="63" r="8" fill={inkColor} />
        <circle cx="27" cy="105" r="8" fill={inkColor} />

        {/* Stethoscope Tube Forming the 'D' Loop */}
        <path
          d="M 125 84 H 146 C 168.5 84, 186 101.9, 186 124 C 186 146.1, 168.5 164, 146 164 H 107"
          stroke={inkColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Stethoscope Chest-piece (Diaphragm Circle) */}
        <circle
          cx="89"
          cy="164"
          r="18"
          fill={badgeFill}
          stroke={inkColor}
          strokeWidth="8"
        />
      </g>
    </svg>
  );
}

export function DawayaFullWordmark({
  width = 320,
  theme = 'sage',
  style,
}: {
  width?: number;
  theme?: 'sage' | 'dark' | 'transparent-dark';
  style?: CSSProperties;
}) {
  const uid = useId().replace(/:/g, '');
  const clipId = `dawayaAwayaClip_${uid}`;
  const height = Math.round((width * 200) / 510);

  const isDark = theme === 'dark' || theme === 'transparent-dark';
  const bgFill = theme === 'sage' ? '#D2D1A3' : theme === 'dark' ? '#101E36' : 'transparent';
  const stethoscopeColor = isDark ? '#D2D1A3' : '#101E36';
  const lettersColor = isDark ? '#FFFFFF' : '#101E36';
  const chestFill = isDark ? '#101E36' : '#D2D1A3';
  const subColor = isDark ? '#D2D1A3' : '#101E36';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 510 200"
      width={width}
      height={height}
      fill="none"
      role="img"
      aria-label="DAWAYA | دوايا"
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: theme === 'transparent-dark' ? undefined : '18px',
        boxShadow:
          theme === 'sage'
            ? '0 8px 24px rgba(16, 30, 54, 0.22)'
            : undefined,
        ...style,
      }}
    >
      {bgFill !== 'transparent' && (
        <rect width="510" height="200" rx="22" fill={bgFill} />
      )}
      <defs>
        <clipPath id={clipId}>
          <rect x="130" y="58" width="365" height="70" />
        </clipPath>
      </defs>

      {/* Typography: AWAYA */}
      <g
        clipPath={`url(#${clipId})`}
        stroke={lettersColor}
        strokeWidth="8.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M 143 130 L 174 58 L 205 130" />
        <path d="M 153 106 H 195" strokeLinecap="butt" />
        <path d="M 208 56 L 231 128 L 256 59 L 281 128 L 304 56" />
        <path d="M 306 130 L 337 58 L 368 130" />
        <path d="M 316 106 H 358" strokeLinecap="butt" />
        <path d="M 371 56 L 397 97 L 423 56" />
        <path d="M 397 95 V 130" />
        <path d="M 421 130 L 452 58 L 483 130" />
        <path d="M 431 106 H 473" strokeLinecap="butt" />
      </g>

      {/* Two-Tone Geometric Emerald Heart inside Earpieces */}
      <g transform="translate(75, 87)">
        <path
          d="M 0 -7 C -5.5 -14.5, -16.5 -14.5, -20.5 -7.5 C -24.5 -0.5, -19.5 8.5, 0 22 L 8 6 Z"
          fill="#128765"
        />
        <path
          d="M 0 -7 C 5.5 -14.5, 16.5 -14.5, 20.5 -7.5 C 24.5 -0.5, 19.5 8.5, 0 22 Z"
          fill="#0A7C5A"
        />
        <path
          d="M 0 -7 L 9 3 L 0 22 L -9 3 Z"
          fill="#055A40"
          opacity="0.75"
        />
      </g>

      {/* Binaural Earpiece Tubes */}
      <path
        d="M 27 62 C 25 43, 43 31, 60 31 C 76 31, 95 43, 111 56 C 122 65, 127 75, 127 84"
        stroke={stethoscopeColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 27 106 C 25 125, 43 137, 60 137 C 76 137, 95 125, 111 112 C 122 103, 127 93, 127 84"
        stroke={stethoscopeColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 88 42 C 108 54, 125 70, 125 84 C 125 98, 108 114, 88 126 C 104 112, 115 98, 115 84 C 115 70, 104 56, 88 42 Z"
        fill={stethoscopeColor}
      />

      {/* Earpiece Tips */}
      <circle cx="27" cy="63" r="8" fill={stethoscopeColor} />
      <circle cx="27" cy="105" r="8" fill={stethoscopeColor} />

      {/* Stethoscope Tube Forming the 'D' Loop */}
      <path
        d="M 125 84 H 146 C 168.5 84, 186 101.9, 186 124 C 186 146.1, 168.5 164, 146 164 H 107"
        stroke={stethoscopeColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stethoscope Chest-piece (Diaphragm Circle) */}
      <circle
        cx="89"
        cy="164"
        r="18"
        fill={chestFill}
        stroke={stethoscopeColor}
        strokeWidth="8"
      />

      {/* Subtitle Underneath WAYA */}
      <text
        x="194"
        y="156"
        fill={subColor}
        fontFamily="'IBM Plex Sans Arabic', 'Inter', system-ui, sans-serif"
        fontSize="15.5"
        fontWeight="800"
        letterSpacing="1.4"
      >
        دوايا | HEALTHCARE PLATFORM
      </text>
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

  if (variant === 'wordmark-card') {
    return <DawayaFullWordmark width={Math.round(size * 6.5)} theme="sage" style={style} />;
  }

  const isLight = variant === 'light';
  const isMono = variant === 'mono';
  const primaryTextColor = isLight || isMono ? '#101E36' : '#FFFFFF';
  const arTextColor = isMono ? '#101E36' : isLight ? '#0A7C5A' : '#D2D1A3';
  const taglineColor = isMono ? '#101E36' : isLight ? '#0A7C5A' : '#D2D1A3';

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
            ? '1px solid rgba(210, 209, 163, 0.35)'
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
          <span style={{ color: '#D2D1A3', fontWeight: 700 }}>|</span>
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
