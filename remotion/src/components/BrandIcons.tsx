/**
 * BrandIcons.tsx
 * SVG-based brand/platform icons for B-Roll overlays.
 * Use brandIcon() helper to get the right icon by name.
 */
import React from "react";

interface IconProps {
  size?: number;
  color?: string;
}

// ── Platform icons ──────────────────────────────────────────────────────────

export const InstagramIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="4" y="4" width="40" height="40" rx="12" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="24" cy="24" r="9" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="35.5" cy="12.5" r="2.5" fill={color}/>
  </svg>
);

export const TikTokIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M34 10c0 0-1 6-7 8v6c3 0 6-1 8-3v14c0 5-5 9-11 9s-11-4-11-9 5-9 11-9c1 0 2 0 3 1V21c-1 0-2-0.1-3-0.1C15 21 8 27 8 34s7 10 16 10 16-3 16-10V18c2 1 4 1 4 1V10h-10z"
      fill={color}
    />
  </svg>
);

export const YoutubeIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="3" y="10" width="42" height="28" rx="8" stroke={color} strokeWidth="3" fill="none"/>
    <path d="M20 17l14 7-14 7V17z" fill={color}/>
  </svg>
);

export const LinkedInIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="3" y="3" width="42" height="42" rx="8" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="15" cy="16" r="3" fill={color}/>
    <rect x="12" y="22" width="6" height="18" rx="2" fill={color}/>
    <path d="M24 22h6v2.5c1.5-2 3.5-3 6-3 5 0 6 4 6 8V40h-6V31c0-2-0.5-4-3-4s-3 2-3 4v9h-6V22z" fill={color}/>
  </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="3" fill="none"/>
    <path d="M28 14h-3c-2.5 0-4 1.5-4 4v3h-3v5h3v12h5V26h3.5l1-5H29v-3c0-1 0.5-1.5 1.5-1.5H31V14h-3z" fill={color}/>
  </svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="3" fill="none"/>
    <path
      d="M32 28.5c-0.5-0.3-3-1.5-3.5-1.7s-0.8-0.3-1.2 0.3-1.3 1.7-1.6 2-0.6 0.3-1.1 0.1c-1.5-0.8-3.5-2-5-4.5-0.4-0.6 0.4-0.6 1-1.8 0.1-0.3 0-0.5-0.1-0.7L18 19.5c-0.3-0.8-0.6-0.7-0.8-0.7H16c-0.4 0-1 0.1-1.5 0.7C14 20 12 22 12 25.5c0 3.5 2.6 6.9 3 7.4 0.4 0.5 5 8 12.3 11 4.6 1.8 6.4 1.5 7.5 1.3 1.5-0.3 4.7-1.9 5.4-3.8s0.7-3.5 0.5-3.8C40.5 37.3 38 29 32 28.5z"
      fill={color}
    />
  </svg>
);

export const XTwitterIcon: React.FC<IconProps> = ({ size = 48, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M8 8l13 14L8 40h5l10-12 9 12h10L29 26 42 8h-5L27 20 18 8H8z" fill={color}/>
  </svg>
);

// ── Generic icon map ─────────────────────────────────────────────────────────

const BRAND_MAP: Record<string, React.FC<IconProps>> = {
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  Youtube: YoutubeIcon,
  YouTube: YoutubeIcon,
  LinkedIn: LinkedInIcon,
  Linkedin: LinkedInIcon,
  Facebook: FacebookIcon,
  WhatsApp: WhatsAppIcon,
  Twitter: XTwitterIcon,
  X: XTwitterIcon,
};

/**
 * Returns the brand icon component for a given name, or null if not found.
 * Usage: const Icon = getBrandIcon("Instagram"); if (Icon) <Icon size={48} color="#fff" />
 */
export function getBrandIcon(name: string): React.FC<IconProps> | null {
  return BRAND_MAP[name] || null;
}
