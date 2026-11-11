import React from 'react';

export interface VectorIconProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}

/**
 * Custom Medical & Navigation Vector SVG Icon Suite for DAWAYA | دوايا
 * Designed specifically for the Deep Navy (#0D1F38), Warm Sage-Gold (#CFD29D),
 * and Emerald Green (#138866) brand identity.
 */
export function NavHomeVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.6 10.4L11.1 3.8C11.62 3.35 12.38 3.35 12.9 3.8L20.4 10.4C20.78 10.74 21 11.22 21 11.73V19.2C21 20.19 20.19 21 19.2 21H14.8V15.4C14.8 14.63 14.17 14 13.4 14H10.6C9.83 14 9.2 14.63 9.2 15.4V21H4.8C3.81 21 3 20.19 3 19.2V11.73C3 11.22 3.22 10.74 3.6 10.4Z"
        fill={color}
      />
    </svg>
  );
}

export function NavDashboardVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3.5" fill={color} fillOpacity="0.92" />
      <rect x="6.5" y="10" width="2.4" height="7.5" rx="1" fill="#0D1F38" />
      <rect x="10.8" y="12.5" width="2.4" height="5" rx="1" fill="#0D1F38" />
      <rect x="15.1" y="7" width="2.4" height="10.5" rx="1" fill="#0D1F38" />
    </svg>
  );
}

export function NavCapsuleVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="rotate(-45 12 12)">
        <rect x="4" y="7.5" width="16" height="9" rx="4.5" stroke={color} strokeWidth="2" />
        <path d="M12 7.5H15.5C17.9853 7.5 20 9.51472 20 12C20 14.4853 17.9853 16.5 15.5 16.5H12V7.5Z" fill={color} />
      </g>
    </svg>
  );
}

export function NavRadarVectorIcon({ size = 24, color = 'currentColor', accentColor = '#138866' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.9" />
      <circle cx="12" cy="12" r="5.4" stroke={color} strokeWidth="1.7" strokeOpacity="0.85" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <path d="M12 12L17.8 6.2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="15.2" cy="14.8" r="1.8" fill={accentColor} />
    </svg>
  );
}

export function NavShieldSafetyVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L4.5 6.2V11.6C4.5 16.45 7.68 20.88 12 22C16.32 20.88 19.5 16.45 19.5 11.6V6.2L12 3Z"
        stroke={color}
        strokeWidth="1.9"
        fill={color}
        fillOpacity="0.14"
      />
      <path d="M9.2 12.2L11.1 14.1L15.2 10" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NavLeafCareVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.5 4.5C12.5 4.5 6 8.2 6 15.2C6 17.3 7.7 19 9.8 19C16.8 19 20.5 12.5 19.5 4.5Z"
        stroke={color}
        strokeWidth="1.9"
        fill={color}
        fillOpacity="0.15"
      />
      <path d="M6 19L14.5 10.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function NavAiSimVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="4" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.14" />
      <circle cx="9.2" cy="12" r="1.5" fill={color} />
      <circle cx="14.8" cy="12" r="1.5" fill={color} />
      <path d="M12 3V6M8 3H16" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function NavBookSourcesVectorIcon({ size = 24, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5C4 4.4 4.9 3.5 6 3.5H11.2C12.2 3.5 13 4.3 13 5.3V19.5C13 18.7 12.3 18 11.5 18H6C4.9 18 4 17.1 4 16V5.5Z"
        stroke={color}
        strokeWidth="1.8"
        fill={color}
        fillOpacity="0.14"
      />
      <path
        d="M20 5.5C20 4.4 19.1 3.5 18 3.5H12.8C11.8 3.5 11 4.3 11 5.3V19.5C11 18.7 11.7 18 12.5 18H18C19.1 18 20 17.1 20 16V5.5Z"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function CapsuleGlobeLangIcon({ code = 'AR', size = 28 }: { code?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11.5" stroke="#E2E8F0" strokeWidth="1.75" />
      <path d="M3 10.2H25M3 17.8H25" stroke="#E2E8F0" strokeWidth="1.4" strokeOpacity="0.85" />
      <path
        d="M14 2.5C16.9 5.6 18.4 9.6 18.4 14C18.4 18.4 16.9 22.4 14 25.5C11.1 22.4 9.6 18.4 9.6 14C9.6 9.6 11.1 5.6 14 2.5Z"
        stroke="#E2E8F0"
        strokeWidth="1.4"
        strokeOpacity="0.85"
      />
      <rect x="4.2" y="9.4" width="19.6" height="9.2" rx="4.6" fill="#0D1F38" stroke="#CFD29D" strokeWidth="1.2" />
      <text
        x="14"
        y="15.8"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="7.8"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {code.toUpperCase()}
      </text>
    </svg>
  );
}

export function CapsuleMoonIcon({ isDark = true, size = 22 }: { isDark?: boolean; size?: number }) {
  if (!isDark) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.6" fill="#CFD29D" />
        <path
          d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.3 5.3L7.1 7.1M16.9 16.9L18.7 18.7M18.7 5.3L16.9 7.1M7.1 16.9L5.3 18.7"
          stroke="#CFD29D"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.2 14.6C19.1 15.1 17.8 15.4 16.5 15.4C11.5 15.4 7.5 11.4 7.5 6.4C7.5 5.1 7.8 3.8 8.3 2.7C4.8 4.1 2.4 7.5 2.4 11.5C2.4 16.8 6.7 21.1 12 21.1C16 21.1 19.4 18.7 20.2 14.6Z"
        fill="#E2E8F0"
      />
    </svg>
  );
}

export function CapsuleSignOutIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 4H7.2C5.98 4 5 4.98 5 6.2V17.8C5 19.02 5.98 20 7.2 20H14"
        stroke="#E2E8F0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 12H20M20 12L16.5 8.5M20 12L16.5 15.5"
        stroke="#CFD29D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CapsuleUserGuestIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.8" fill="#CFD29D" />
      <path
        d="M5.2 19.4C5.9 15.9 8.6 13.8 12 13.8C15.4 13.8 18.1 15.9 18.8 19.4"
        stroke="#CFD29D"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Renders a crisp vector icon for any clinical tool key or dosage form
 */
export function DosageFormVectorBadge({ form, size = 20 }: { form?: string; size?: number }) {
  const f = (form || 'tablet').toLowerCase();
  if (f.includes('capsule')) {
    return <NavCapsuleVectorIcon size={size} color="#138866" />;
  }
  if (f.includes('syrup') || f.includes('suspension') || f.includes('solution') || f.includes('drops')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="8.5" y="3" width="7" height="3.2" rx="1" stroke="#138866" strokeWidth="1.8" />
        <path
          d="M7 9.5C7 7.8 8.3 6.2 10 6.2H14C15.7 6.2 17 7.8 17 9.5V18.8C17 20 16 21 14.8 21H9.2C8 21 7 20 7 18.8V9.5Z"
          stroke="#138866"
          strokeWidth="1.8"
          fill="#138866"
          fillOpacity="0.12"
        />
        <path d="M9.5 13.5H14.5M12 11V16" stroke="#0D1F38" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (f.includes('ampoule') || f.includes('vial') || f.includes('infusion') || f.includes('injection')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 3L21 6M14.5 6.5L17.5 9.5M6 15L14.5 6.5L17.5 9.5L9 18H6V15Z" stroke="#138866" strokeWidth="1.8" fill="#138866" fillOpacity="0.14" />
        <path d="M3 21L6 18" stroke="#0D1F38" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (f.includes('cream') || f.includes('ointment') || f.includes('topical')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 5H17L15.5 17.5C15.4 18.4 14.6 19 13.7 19H10.3C9.4 19 8.6 18.4 8.5 17.5L7 5Z" stroke="#138866" strokeWidth="1.8" fill="#138866" fillOpacity="0.12" />
        <rect x="9.5" y="19" width="5" height="2.5" rx="0.8" fill="#0D1F38" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="#138866" strokeWidth="1.8" fill="#138866" fillOpacity="0.12" />
      <path d="M7.5 16.5L16.5 7.5" stroke="#0D1F38" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}


export function HeroSearchVectorIcon({ size = 20, color = '#138866' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.1" />
      <path d="M16.2 16.2L20.5 20.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function HeroMicVectorIcon({ size = 19, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.16" />
      <path d="M5.5 11C5.5 14.59 8.41 17.5 12 17.5C15.59 17.5 18.5 14.59 18.5 11M12 17.5V21M8.5 21H15.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function HeroScannerVectorIcon({ size = 20, color = 'currentColor' }: VectorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8V6C4 4.9 4.9 4 6 4H8M16 4H18C19.1 4 20 4.9 20 6V8M20 16V18C20 19.1 19.1 20 18 20H16M8 20H6C4.9 20 4 19.1 4 18V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.18" />
    </svg>
  );
}

/**
 * Universal Duotone Medical SVG Vector Icon resolver for all 25+ DAWAYA routes and tools
 */
export function DawayaRouteVectorIcon({
  route,
  size = 22,
  color = 'currentColor',
}: {
  route: string;
  size?: number;
  color?: string;
}) {
  const r = (route || '').toLowerCase();

  if (r === '/' || r === 'home') {
    return <NavHomeVectorIcon size={size} color={color} />;
  }
  if (r.includes('patient-dashboard') || r.includes('research')) {
    return <NavDashboardVectorIcon size={size} color={color} />;
  }
  if (r.includes('medicines') || r.includes('drug-directory')) {
    return <NavCapsuleVectorIcon size={size} color={color} />;
  }
  if (r.includes('prescription-radar')) {
    return <NavRadarVectorIcon size={size} color={color} accentColor="#138866" />;
  }
  if (r.includes('passport') || r.includes('health-profile')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.12" />
        <circle cx="8.5" cy="11" r="2.2" fill={color} />
        <path d="M5.5 16C6.1 14.3 7.2 13.5 8.5 13.5C9.8 13.5 10.9 14.3 11.5 16" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M14 9.5H18M14 13H17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (r.includes('complete-checkup') || r.includes('interactions')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2.5L4.5 13.5H11.5L10.5 21.5L19.5 10.5H12.5L13 2.5Z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" fill={color} fillOpacity="0.16" />
      </svg>
    );
  }
  if (r.includes('cost-saver')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12.5 3H6C4.34 3 3 4.34 3 6V12.5C3 13.3 3.32 14.06 3.88 14.62L10.38 21.12C11.55 22.29 13.45 22.29 14.62 21.12L21.12 14.62C22.29 13.45 22.29 11.55 21.12 10.38L14.62 3.88C14.06 3.32 13.3 3 12.5 3Z" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.14" />
        <circle cx="7.8" cy="7.8" r="1.6" fill={color} />
      </svg>
    );
  }
  if (r.includes('pediatric-helper') || r === 'mother') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.12" />
        <circle cx="9.3" cy="10.8" r="1.2" fill={color} />
        <circle cx="14.7" cy="10.8" r="1.2" fill={color} />
        <path d="M9.2 14.6C10 15.8 11 16.3 12 16.3C13 16.3 14 15.8 14.8 14.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 3.5C13.4 3.5 14.2 4.6 13.5 5.8C12.9 6.8 11.2 6.8 11.2 5.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (r.includes('green-prescription') || r.includes('treatment-care') || r.includes('safe-disposal')) {
    return <NavLeafCareVectorIcon size={size} color={color} />;
  }
  if (r.includes('allergy-checker') || r.includes('clinical-safety') || r === 'patient') {
    return <NavShieldSafetyVectorIcon size={size} color={color} />;
  }
  if (r.includes('daily-schedule') || r.includes('tracker')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.12" />
        <path d="M8 3V6.5M16 3V6.5M3.5 9.5H20.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="12" cy="15" r="2.8" stroke={color} strokeWidth="1.7" />
      </svg>
    );
  }
  if (r.includes('compare')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3V21M5 7H19M5 7L2.5 13.5H7.5L5 7ZM19 7L16.5 13.5H21.5L19 7Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (r.includes('cold-shot') || r.includes('side-effects')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 3L21 6M14.5 6.5L17.5 9.5M6 15L14.5 6.5L17.5 9.5L9 18H6V15Z" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.15" />
        <path d="M3 21L6 18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }
  if (r.includes('scan')) {
    return <HeroScannerVectorIcon size={size} color={color} />;
  }
  if (r.includes('games') || r.includes('interactive-sim') || r.includes('assistant')) {
    return <NavAiSimVectorIcon size={size} color={color} />;
  }
  if (r.includes('partners') || r === 'doctor') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3.5" stroke={color} strokeWidth="1.9" fill={color} fillOpacity="0.12" />
        <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return <NavBookSourcesVectorIcon size={size} color={color} />;
}

/**
 * 3D High-Detail Realistic Medicine Packaging & Dosage Form Illustration
 * Matches the realistic 3D product box + pills/bottle mockup aesthetic.
 */
export function Realistic3DMedicineThumb({
  form,
  size = 64,
}: {
  form?: string;
  size?: number;
}) {
  const f = (form || 'tablet').toLowerCase();

  // 1. Syrup / Suspension / Drops -> 3D Amber Bottle + Product Box
  if (
    f.includes('syrup') ||
    f.includes('suspension') ||
    f.includes('solution') ||
    f.includes('drops') ||
    f.includes('شراب') ||
    f.includes('نقط')
  ) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          background: 'linear-gradient(145deg, #e6f7f2 0%, #d1f2e8 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 10px rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.22)',
        }}
      >
        <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          {/* Medicine Box in background */}
          <rect x="28" y="10" width="24" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M28 18H52V28H28V18Z" fill="#7c3aed" fillOpacity="0.85" />
          <rect x="32" y="33" width="16" height="3" rx="1.5" fill="#94a3b8" />
          <rect x="32" y="39" width="11" height="2.5" rx="1.2" fill="#cbd5e1" />

          {/* 3D Amber Syrup Bottle in foreground */}
          <rect x="15" y="12" width="12" height="6" rx="2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <path
            d="M12 24C12 20.5 14.5 18 18 18H24C27.5 18 30 20.5 30 24V49C30 51.2 28.2 53 26 53H16C13.8 53 12 51.2 12 49V24Z"
            fill="url(#amberBottleGrad)"
            stroke="#92400e"
            strokeWidth="1.5"
          />
          {/* Bottle White & Orange Label */}
          <rect x="13" y="29" width="16" height="15" rx="1.5" fill="#ffffff" />
          <rect x="13" y="29" width="16" height="5" fill="#f97316" />
          <rect x="15.5" y="37" width="11" height="2" rx="1" fill="#64748b" />
          <rect x="15.5" y="40.5" width="7" height="1.8" rx="0.9" fill="#94a3b8" />
          {/* Bottle Glass Highlight */}
          <path d="M15 22V48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.45" />
          <defs>
            <linearGradient id="amberBottleGrad" x1="12" y1="18" x2="30" y2="53" gradientUnits="userSpaceOnUse">
              <stop stopColor="#d97706" />
              <stop offset="0.5" stopColor="#b45309" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // 2. Ampoule / Vial / Injection -> 3D Vial + Syringe + Box
  if (
    f.includes('ampoule') ||
    f.includes('vial') ||
    f.includes('infusion') ||
    f.includes('injection') ||
    f.includes('حقن') ||
    f.includes('أمبول') ||
    f.includes('فيال')
  ) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          background: 'linear-gradient(145deg, #e0f2fe 0%, #bae6fd 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 10px rgba(2, 132, 199, 0.14)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
        }}
      >
        <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          {/* Vial Box */}
          <rect x="12" y="14" width="22" height="38" rx="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="12" y="21" width="22" height="8" fill="#0284c7" />
          <rect x="16" y="34" width="14" height="2.5" rx="1.2" fill="#64748b" />
          {/* Glass Vial */}
          <rect x="33" y="20" width="12" height="5" rx="1.5" fill="#0ea5e9" />
          <rect x="31" y="25" width="16" height="27" rx="3" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.6" />
          <rect x="32.5" y="34" width="13" height="12" rx="1" fill="#38bdf8" fillOpacity="0.35" />
          <rect x="34" y="33" width="10" height="8" rx="1" fill="#ffffff" stroke="#bae6fd" />
          {/* Diagonal Syringe accent */}
          <path d="M46 12L54 20M49 15L39 25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 3. Cream / Ointment / Gel -> 3D Medical Tube + Box
  if (
    f.includes('cream') ||
    f.includes('ointment') ||
    f.includes('gel') ||
    f.includes('topical') ||
    f.includes('كريم') ||
    f.includes('مرهم')
  ) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          background: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 10px rgba(217, 119, 6, 0.14)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
        }}
      >
        <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="12" y="20" width="40" height="18" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="12" y="20" width="12" height="18" rx="2" fill="#f59e0b" />
          <path d="M18 42L42 42L46 34H14L18 42Z" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <rect x="46" y="35.5" width="6" height="5" rx="1" fill="#0d9488" />
          <rect x="22" y="36.5" width="16" height="3" rx="1.5" fill="#10b981" />
        </svg>
      </div>
    );
  }

  // Default: 3D Medicine Box + Silver Blister Pack + Red/White & Purple/Blue Capsules (Matches Image 1 Augmentin Card!)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        background: 'linear-gradient(145deg, #e6f7f2 0%, #d1f2e8 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.85), 0 4px 10px rgba(16, 185, 129, 0.14)',
        border: '1px solid rgba(16, 185, 129, 0.22)',
      }}
    >
      <svg width={size * 0.86} height={size * 0.86} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        {/* 3D White & Purple Medicine Box */}
        <path
          d="M10 18C10 15.7909 11.7909 14 14 14H38C40.2091 14 42 15.7909 42 18V42C42 44.2091 40.2091 46 38 46H14C11.7909 46 10 44.2091 10 42V18Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        {/* Box Purple Brand Stripe */}
        <path d="M10 18C10 15.7909 11.7909 14 14 14H20V46H14C11.7909 46 10 44.2091 10 42V18Z" fill="#7c3aed" />
        <rect x="24" y="21" width="13" height="3" rx="1.5" fill="#334155" />
        <rect x="24" y="26.5" width="9" height="2.2" rx="1.1" fill="#94a3b8" />

        {/* Silver Blister Pack on Right */}
        <rect
          x="35"
          y="18"
          width="19"
          height="28"
          rx="3.5"
          transform="rotate(6 35 18)"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="1.4"
        />
        <circle cx="41" cy="24" r="2.6" fill="#94a3b8" />
        <circle cx="49" cy="25" r="2.6" fill="#94a3b8" />
        <circle cx="40" cy="32" r="2.6" fill="#94a3b8" />
        <circle cx="48" cy="33" r="2.6" fill="#94a3b8" />
        <circle cx="39" cy="40" r="2.6" fill="#94a3b8" />
        <circle cx="47" cy="41" r="2.6" fill="#94a3b8" />

        {/* Foreground 3D Red/White Capsule */}
        <g transform="rotate(-18 18 48)">
          <rect x="11" y="44" width="16" height="7.5" rx="3.75" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
          <path d="M11 47.75C11 45.6789 12.6789 44 14.75 44H19V51.5H14.75C12.6789 51.5 11 49.8211 11 47.75Z" fill="#ef4444" />
        </g>

        {/* Foreground 3D Blue/Purple Capsule */}
        <g transform="rotate(14 36 49)">
          <rect x="28" y="45" width="16" height="7.5" rx="3.75" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.2" />
          <path d="M36 45H40.25C42.3211 45 44 46.6789 44 48.75C44 50.8211 42.3211 52.5 40.25 52.5H36V45Z" fill="#4f46e5" />
        </g>
      </svg>
    </div>
  );
}
