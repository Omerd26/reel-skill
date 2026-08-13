/**
 * Design tokens — single source of truth for every overlay scene.
 *
 * Every value here is documented in design/DESIGN.md. Do not invent colors,
 * easings, or type sizes inside scene files — pull them from this module.
 */

// ── Colors ───────────────────────────────────────────────────────────────────

export const COLORS = {
  bg:              "#0A0A0C",
  bgDeep:          "#050608",
  surface:         "#15161A",
  glassTint:       "#1A1A1F",
  borderHairline:  "rgba(255,255,255,0.10)",
  borderGlass:     "rgba(255,255,255,0.22)",

  text:            "#FFFFFF",
  textSecondary:   "rgba(255,255,255,0.72)",
  textTertiary:    "rgba(255,255,255,0.45)",

  accentBrand:     "#E0701E",
  accentGlow:      "rgba(224,112,30,0.45)",
  accentCool:      "#4FC3F7",

  success:         "#4ADE80",
  warn:            "#FBBF24",
  danger:          "#EF4444",
} as const;

export type ColorToken = keyof typeof COLORS;

// ── Tone → color resolver ────────────────────────────────────────────────────

export type Tone =
  | "neutral"
  | "brand"
  | "info"
  | "success"
  | "warn"
  | "danger";

export function toneColor(tone: Tone | undefined): string {
  switch (tone) {
    case "brand":   return COLORS.accentBrand;
    case "info":    return COLORS.accentCool;
    case "success": return COLORS.success;
    case "warn":    return COLORS.warn;
    case "danger":  return COLORS.danger;
    case "neutral":
    default:        return COLORS.text;
  }
}

export function toneGlow(tone: Tone | undefined): string {
  switch (tone) {
    case "brand":   return "rgba(224,112,30,0.45)";
    case "info":    return "rgba(79,195,247,0.45)";
    case "success": return "rgba(74,222,128,0.45)";
    case "warn":    return "rgba(251,191,36,0.45)";
    case "danger":  return "rgba(239,68,68,0.45)";
    case "neutral":
    default:        return "rgba(255,255,255,0.40)";
  }
}

// ── Typography ───────────────────────────────────────────────────────────────

// FONT STACKS — ONLY fonts that are actually bundled may be named first.
// 2026-07-30: `display` led with 'Rubik' and `mono` with 'JetBrains Mono',
// neither of which is installed (package.json has @fontsource/heebo only).
// On a Mac that happens to have Rubik locally the studio preview measured
// text in Rubik while the Hetzner render measured it in Heebo — different
// advance widths, so headlines wrapped at a different word in the MP4 than
// in preview. That is exactly the shape of "looked fine, came out cut off".
// Heebo is the bundled Hebrew face; keep it first everywhere.
export const FONTS = {
  display:  "'Heebo', -apple-system, BlinkMacSystemFont, sans-serif",
  body:     "'Heebo', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:     "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

/**
 * Type roles — pulled from DESIGN.md. Each role has a fixed size band, weight,
 * tracking, line-height combo. Do not riff on these inside scene files.
 */
export const TYPE = {
  heroKinetic: {
    fontFamily: FONTS.display,
    fontSize: 180,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.92,
  },
  displayHeadline: {
    fontFamily: FONTS.display,
    fontSize: 96,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 64,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    lineHeight: 1.12,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 30,
    fontWeight: 400,
    letterSpacing: "normal",
    lineHeight: 1.4,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "0.18em",
    lineHeight: 1.3,
    textTransform: "uppercase" as const,
  },
  eyebrowHebrew: {
    fontFamily: FONTS.body,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "0.18em",
    lineHeight: 1.3,
  },
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: "0.04em",
    lineHeight: 1.3,
  },
  numberLockup: {
    fontFamily: FONTS.display,
    fontSize: 340,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 0.9,
    fontVariantNumeric: "tabular-nums" as const,
  },
} as const;

// ── Spacing / radii ──────────────────────────────────────────────────────────

export const RADIUS = {
  pill: 999,
  sm: 14,
  md: 22,
  lg: 30,
  xl: 38,
} as const;

export const SPACE = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 36,
  xl: 56,
  xxl: 88,
} as const;

// ── Liquid glass (the iOS-26 recipe) ─────────────────────────────────────────

import type { CSSProperties } from "react";

export const GLASS_LIQUID: CSSProperties = {
  background:
    "linear-gradient(135deg," +
    " rgba(255,255,255,0.075) 0%," +
    " rgba(255,255,255,0.025) 35%," +
    " rgba(255,255,255,0.010) 65%," +
    " rgba(255,255,255,0.055) 100%)",
  backdropFilter: "blur(14px) saturate(1.12)",
  WebkitBackdropFilter: "blur(14px) saturate(1.12)",
  border: `1px solid ${COLORS.borderGlass}`,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.22)", // iOS-26 inner highlight
    "0 30px 60px -20px rgba(0,0,0,0.55)",
    "0 8px 16px -8px rgba(0,0,0,0.30)",
  ].join(", "),
};

export const GLASS_FROSTED: CSSProperties = {
  background: "rgba(20,20,22,0.72)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: `1px solid ${COLORS.borderHairline}`,
  boxShadow: "0 24px 48px -16px rgba(0,0,0,0.55)",
};

export const GLASS_SOLID_DARK: CSSProperties = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.borderHairline}`,
  boxShadow: "0 24px 48px -16px rgba(0,0,0,0.6)",
};

export const GLASS_OUTLINED: CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1.5px solid rgba(255,255,255,0.45)",
  boxShadow: "none",
};

/**
 * Warm/cream theme — magazine-editorial inversion of the dark canvas.
 * Dark text on cream backdrop, used for "data-card" / "schema-card" / "settings"
 * contexts where light theme reads more premium than dark glass. Inspired by
 * the @softgirlnocode reel reference (2026-05-07): cream surface with
 * structured rows, app icons, and ring metrics.
 */
export const GLASS_WARM: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(245,239,228,0.94), rgba(232,225,212,0.90))",
  backdropFilter: "blur(18px) saturate(1.05)",
  WebkitBackdropFilter: "blur(18px) saturate(1.05)",
  border: "1px solid rgba(180,165,140,0.30)",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.55)",
    "0 24px 48px -16px rgba(40,30,15,0.30)",
    "0 8px 16px -8px rgba(40,30,15,0.18)",
  ].join(", "),
};

export type GlassMaterial =
  | "liquid"
  | "frosted"
  | "solid-dark"
  | "outlined"
  | "warm";

export function glassStyle(material: GlassMaterial = "liquid"): CSSProperties {
  switch (material) {
    case "frosted":    return GLASS_FROSTED;
    case "solid-dark": return GLASS_SOLID_DARK;
    case "outlined":   return GLASS_OUTLINED;
    case "warm":       return GLASS_WARM;
    case "liquid":
    default:           return GLASS_LIQUID;
  }
}

/** Tokens specific to the warm theme — dark text on cream. */
export const WARM = {
  text:           "#1B1B1F",            // near-black for body text
  textSecondary:  "rgba(27,27,31,0.68)",
  textTertiary:   "rgba(27,27,31,0.42)",
  pillBg:         "rgba(255,255,255,0.55)",
  pillBorder:     "rgba(120,100,75,0.18)",
  divider:        "rgba(120,100,75,0.18)",
  inputBg:        "rgba(255,255,255,0.65)",
  rowBg:          "rgba(255,255,255,0.42)",
} as const;

// ── Chrome gradient + halo for hero text ─────────────────────────────────────

export const CHROME_TEXT: CSSProperties = {
  background:
    "linear-gradient(180deg, #FFFFFF 0%, #C7C7CC 60%, #E5E5E7 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow:
    "0 0 24px rgba(255,255,255,0.45), 0 0 48px rgba(255,255,255,0.18)",
};

/**
 * Tone-tinted chrome — for accent text (numbers, hero punchline). Drives the
 * gradient toward the tone color so the orange brand tint reads as "lit".
 */
export function chromeText(tone: Tone = "neutral"): CSSProperties {
  if (tone === "neutral") return CHROME_TEXT;
  const accent = toneColor(tone);
  const glow = toneGlow(tone);
  return {
    background: `linear-gradient(180deg, ${accent} 0%, ${darken(accent, 0.25)} 70%, ${accent} 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    textShadow: `0 0 28px ${glow}, 0 0 56px ${glow.replace("0.45", "0.20")}`,
  };
}

function darken(hex: string, amount: number): string {
  // Lightweight darken — clamps each channel toward 0 by `amount` (0..1).
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Easing library — the named easings from DESIGN.md ────────────────────────
//
// Each easing is a pure JS function (t in [0,1] → eased value). These are
// hand-tuned bezier-equivalents so we don't depend on GSAP at runtime.

export type EaseName =
  | "glass-rise"
  | "confident"
  | "bounce-soft"
  | "bounce-firm"
  | "silk"
  | "glide"
  | "whip-in"
  | "whip-out"
  | "linear";

const EASES: Record<EaseName, (t: number) => number> = {
  // expo.out — quick start, gentle settle. Apple-keynote feel.
  "glass-rise":  (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

  // power3.out — confident, default headline entrance.
  "confident":   (t) => 1 - Math.pow(1 - t, 3),

  // back.out(1.4) — soft overshoot, lands gently. For numbers, badges.
  "bounce-soft": (t) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // back.out(2.4) — firm overshoot, stamp/punch energy.
  "bounce-firm": (t) => {
    const c1 = 2.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // sine.inOut — breathing, drift, ambient.
  "silk":        (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // power2.inOut — camera-style pan, scene transitions.
  "glide":       (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  // power3.in — accelerating exit (whip-streak's exit half).
  "whip-in":     (t) => t * t * t,

  // power2.out — decelerating arrival (whip-streak's entry half).
  "whip-out":    (t) => 1 - Math.pow(1 - t, 2),

  "linear":      (t) => t,
};

export function ease(name: EaseName, t: number): number {
  return EASES[name](Math.max(0, Math.min(1, t)));
}

export function easeFn(name: EaseName): (t: number) => number {
  return EASES[name];
}

// ── Safe zones (1080×1920 portrait) ──────────────────────────────────────────

export const SAFE_ZONES = {
  /** Speaker face zone — overlays must not occlude. */
  face: { top: 420, bottom: 1300, left: 200, right: 880 },
  /** Caption zone — overlays must avoid (karaoke captions live here). */
  caption: { top: 1500, bottom: 1820, left: 60, right: 1020 },
  /** Default anchor for info cards: y from bottom. */
  aboveCaptions: 480,
} as const;
