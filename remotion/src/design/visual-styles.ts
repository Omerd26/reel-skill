/**
 * Visual Style Library — 8 named visual identities.
 *
 * Ported from HyperFrames `skills/hyperframes/visual-styles.md` and adapted
 * to the omer.digital token system. Each style is a complete mood: palette
 * + typography role + motion signature + transition default + GSAP-style
 * easing pair.
 *
 * Pick a style at the project level (project DESIGN.md → visual_style: "X")
 * or per-scene for a register shift inside the same piece.
 */

import { COLORS, FONTS, type EaseName } from "./tokens";

export type VisualStyleId =
  | "velvet-standard"   // Premium, timeless — DEFAULT for omer.digital
  | "swiss-pulse"       // Clinical, precise — for SaaS/data beats
  | "shadow-cut"        // Dark cinematic — dramatic reveals
  | "soft-signal"       // Warm, intimate — wellness, personal
  | "maximalist-type"   // Loud, kinetic — launches, hype
  | "data-drift"        // Futuristic, immersive — AI/ML
  | "deconstructed"     // Industrial, raw — punk energy
  | "folk-frequency";   // Cultural, vivid — consumer apps

export interface VisualStyle {
  id: VisualStyleId;
  name: string;
  mood: string;
  bestFor: string;

  /** 2-3 hex values that own the piece. */
  palette: {
    bg: string;
    fg: string;
    accent: string;
    accentSecondary?: string;
  };

  /** Type role assignments for this style. */
  typography: {
    display: string;          // headlines
    body: string;             // body / supporting copy
    caps?: boolean;           // headlines all caps?
    tracking: string;         // headline tracking
  };

  /** Motion signature — defines the FEELING. */
  motion: {
    entrance: EaseName;       // primary entrance ease
    secondary: EaseName;      // secondary entrance ease (for variety)
    ambient: EaseName;        // breathing / drift loops
    transition: EaseName;     // scene-to-scene
    /** Average scene length in seconds — pacing target. */
    avgSceneSec: number;
    /** Entrance duration band [min, max] in seconds. */
    entranceDurSec: [number, number];
  };

  /** Default scene-to-scene transition for this style. */
  defaultTransition: "push-slide" | "blur-crossfade" | "whip-streak" | "hard-cut";

  /** Anti-patterns specific to this style — never do these. */
  avoids: string[];
}

// ── 8 Styles ─────────────────────────────────────────────────────────────────

export const VISUAL_STYLES: Record<VisualStyleId, VisualStyle> = {
  // ── 1 · Velvet Standard (Vignelli) — DEFAULT ──────────────────────────────
  "velvet-standard": {
    id: "velvet-standard",
    name: "Velvet Standard",
    mood: "Premium, timeless",
    bestFor: "Luxury products, enterprise software, keynotes, investor decks, high-end personal brand",
    palette: {
      bg: COLORS.bg,           // near-black
      fg: COLORS.text,         // white
      accent: COLORS.accentBrand, // warm orange
    },
    typography: {
      display: FONTS.display,
      body: FONTS.body,
      caps: false,
      tracking: "-0.02em",
    },
    motion: {
      entrance: "glass-rise",      // expo.out
      secondary: "confident",      // power3.out
      ambient: "silk",             // sine.inOut
      transition: "glide",         // power2.inOut
      avgSceneSec: 2.4,
      entranceDurSec: [0.50, 0.80],
    },
    defaultTransition: "blur-crossfade",
    avoids: [
      "frantic motion",
      "neon accents",
      "chaotic stagger",
      "low-tracking type",
    ],
  },

  // ── 2 · Swiss Pulse (Müller-Brockmann) ────────────────────────────────────
  "swiss-pulse": {
    id: "swiss-pulse",
    name: "Swiss Pulse",
    mood: "Clinical, precise",
    bestFor: "SaaS dashboards, dev tools, APIs, metrics-driven beats, technical proof",
    palette: {
      bg: "#1A1A1A",
      fg: "#FFFFFF",
      accent: COLORS.accentBrand,
    },
    typography: {
      display: FONTS.display,
      body: FONTS.body,
      caps: false,
      tracking: "-0.01em",
    },
    motion: {
      entrance: "confident",       // power3.out — snap into place
      secondary: "bounce-firm",    // back.out(2.4)
      ambient: "linear",           // none — Swiss is still
      transition: "glide",
      avgSceneSec: 1.6,
      entranceDurSec: [0.30, 0.45],
    },
    defaultTransition: "hard-cut",
    avoids: [
      "decorative gradients",
      "overshoot on headlines",
      "asymmetric layouts",
      "ambient drift",
    ],
  },

  // ── 3 · Shadow Cut (Hillmann) ─────────────────────────────────────────────
  "shadow-cut": {
    id: "shadow-cut",
    name: "Shadow Cut",
    mood: "Dark, cinematic",
    bestFor: "Dramatic reveals, security/privacy products, exposé, intense launches",
    palette: {
      bg: COLORS.bgDeep,
      fg: COLORS.text,
      accent: COLORS.danger,        // blood red
      accentSecondary: COLORS.success, // toxic green for contrast moment
    },
    typography: {
      display: FONTS.display,
      body: FONTS.body,
      caps: true,
      tracking: "0.04em",
    },
    motion: {
      entrance: "glass-rise",       // emerges from black
      secondary: "whip-out",        // power2.out for dramatic reveals
      ambient: "silk",
      transition: "glide",          // power2.inOut — slow creeping
      avgSceneSec: 3.0,             // slow creeping push-ins
      entranceDurSec: [0.70, 1.20],
    },
    defaultTransition: "blur-crossfade",
    avoids: [
      "playful overshoot",
      "bright pastels",
      "fast pacing",
      "rounded type",
    ],
  },

  // ── 4 · Soft Signal (Sagmeister) ──────────────────────────────────────────
  "soft-signal": {
    id: "soft-signal",
    name: "Soft Signal",
    mood: "Intimate, warm",
    bestFor: "Wellness, personal stories, lifestyle, human-centered apps",
    palette: {
      bg: "#F5A623",
      fg: "#3A2E1F",
      accent: "#C4A3A3",
      accentSecondary: "#8FAF8C",
    },
    typography: {
      display: FONTS.body,          // humanist
      body: FONTS.body,
      caps: false,
      tracking: "-0.005em",
    },
    motion: {
      entrance: "silk",
      secondary: "glass-rise",
      ambient: "silk",
      transition: "glide",
      avgSceneSec: 3.5,             // slow drifts, never snap
      entranceDurSec: [0.80, 1.40],
    },
    defaultTransition: "blur-crossfade",
    avoids: [
      "snapping motion",
      "high-contrast type",
      "industrial fonts",
      "fast cuts",
    ],
  },

  // ── 5 · Maximalist Type (Scher) ───────────────────────────────────────────
  "maximalist-type": {
    id: "maximalist-type",
    name: "Maximalist Type",
    mood: "Loud, kinetic",
    bestFor: "Big launches, milestone announcements, hype videos",
    palette: {
      bg: "#0A0A0C",
      fg: "#FFFFFF",
      accent: "#E63946",            // bold red
      accentSecondary: "#FFD60A",   // sun yellow
    },
    typography: {
      display: FONTS.display,
      body: FONTS.body,
      caps: true,
      tracking: "-0.04em",          // tight, screaming
    },
    motion: {
      entrance: "glass-rise",       // expo.out — hard arrival
      secondary: "bounce-firm",
      ambient: "silk",
      transition: "whip-out",
      avgSceneSec: 1.4,             // 2-3s rapid-fire
      entranceDurSec: [0.20, 0.35],
    },
    defaultTransition: "whip-streak",
    avoids: [
      "empty backgrounds",
      "thin type",
      "calm holds",
      "subtle accents",
    ],
  },

  // ── 6 · Data Drift (Anadol) ───────────────────────────────────────────────
  "data-drift": {
    id: "data-drift",
    name: "Data Drift",
    mood: "Futuristic, immersive",
    bestFor: "AI products, ML platforms, data companies, speculative tech",
    palette: {
      bg: COLORS.bg,
      fg: COLORS.text,
      accent: "#7C3AED",            // electric purple
      accentSecondary: "#06B6D4",   // cyan
    },
    typography: {
      display: FONTS.display,
      body: FONTS.body,
      caps: false,
      tracking: "0.02em",           // weightless, floating
    },
    motion: {
      entrance: "silk",             // sine.inOut — fluid, organic
      secondary: "confident",
      ambient: "silk",
      transition: "silk",           // sine.inOut — fluid hand-offs
      avgSceneSec: 2.8,
      entranceDurSec: [0.60, 1.00],
    },
    defaultTransition: "blur-crossfade",
    avoids: [
      "snap motion",
      "warm colors",
      "heavy type weights",
      "hard cuts",
    ],
  },

  // ── 7 · Deconstructed (Brody) ─────────────────────────────────────────────
  "deconstructed": {
    id: "deconstructed",
    name: "Deconstructed",
    mood: "Industrial, raw",
    bestFor: "Tech launches, security products, punk energy reveals",
    palette: {
      bg: "#1A1A1A",
      fg: "#F0F0F0",
      accent: "#D4501E",            // rust orange
    },
    typography: {
      display: FONTS.display,
      body: FONTS.mono,
      caps: true,
      tracking: "0.06em",
    },
    motion: {
      entrance: "bounce-firm",      // back.out(2.5)
      secondary: "whip-in",
      ambient: "linear",
      transition: "whip-out",
      avgSceneSec: 1.2,
      entranceDurSec: [0.25, 0.40],
    },
    defaultTransition: "whip-streak",
    avoids: [
      "polished glass",
      "soft pastels",
      "elegant tracking",
      "calm pacing",
    ],
  },

  // ── 8 · Folk Frequency (Terrazas) ─────────────────────────────────────────
  "folk-frequency": {
    id: "folk-frequency",
    name: "Folk Frequency",
    mood: "Cultural, vivid",
    bestFor: "Consumer apps, food platforms, community products, festive launches",
    palette: {
      bg: "#FF1493",
      fg: "#FFFFFF",
      accent: "#FFE000",
      accentSecondary: "#0047AB",
    },
    typography: {
      display: FONTS.display,
      body: FONTS.body,
      caps: true,
      tracking: "-0.02em",
    },
    motion: {
      entrance: "bounce-firm",      // overshoots intentional
      secondary: "bounce-soft",
      ambient: "silk",
      transition: "whip-out",
      avgSceneSec: 1.8,
      entranceDurSec: [0.35, 0.55],
    },
    defaultTransition: "whip-streak",
    avoids: [
      "muted colors",
      "thin type",
      "minimal layouts",
      "dark canvases",
    ],
  },
};

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getVisualStyle(id: VisualStyleId | undefined): VisualStyle {
  return VISUAL_STYLES[id ?? "velvet-standard"];
}

export const DEFAULT_STYLE: VisualStyleId = "velvet-standard";

/**
 * Mood → style suggestion. Used by the planner to pick a style automatically
 * when the user gives a mood word ("dark", "premium", "techy", etc.).
 */
export function suggestStyleForMood(mood: string): VisualStyleId {
  const m = mood.toLowerCase();
  if (/dark|drama|exposé|reveal|noir|cinematic/.test(m))     return "shadow-cut";
  if (/tech|saas|data|metric|dashboard|api/.test(m))         return "swiss-pulse";
  if (/launch|hype|loud|big|milestone/.test(m))              return "maximalist-type";
  if (/ai|ml|future|neural|generative/.test(m))              return "data-drift";
  if (/wellness|warm|personal|story|intimate/.test(m))       return "soft-signal";
  if (/punk|raw|industrial|gritty|rebel/.test(m))            return "deconstructed";
  if (/folk|festive|consumer|cultural|vivid/.test(m))        return "folk-frequency";
  // Default: premium / timeless / Apple-like.
  return "velvet-standard";
}
