/**
 * Visual primitives — the iOS-26 liquid-glass system.
 *
 *   - GlassCard            — workhorse translucent surface (4-stop diagonal).
 *   - ChromeText           — chrome-gradient + halo text wrapper.
 *   - AccentEdge           — vertical accent bar on a card's leading edge.
 *   - Eyebrow              — uppercase mono label.
 *   - DividerVS            — typographic divider for comparison boards.
 *   - HaloGlow             — soft radial accent glow behind elements.
 *   - SafeZoneFrame        — dev-only outline for face + caption zones.
 *
 * Every visual decision in this file traces back to design/DESIGN.md or the
 * MOTION_PHILOSOPHY.md liquid-glass recipe (Section 2.1 #9).
 */
import React, { CSSProperties, ReactNode } from "react";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  glassStyle,
  chromeText,
  toneColor,
  toneGlow,
  type GlassMaterial,
  type Tone,
} from "../../design/tokens";

// CornerBadge font — shared across primitives.
const FONT = FONTS.body;

// ── GlassCard ────────────────────────────────────────────────────────────────

interface GlassCardProps {
  /** Material — drives the look. Default "liquid". */
  material?: GlassMaterial;
  /** Padding override. Default tasteful. */
  padding?: number | string;
  /** Width — explicit px or "auto" or undefined (children-driven). */
  width?: number | string;
  /** Optional accent bar on the leading edge (tone-driven). */
  accentTone?: Tone;
  /** RTL flips the accent edge. Default true (Hebrew-first project). */
  rtl?: boolean;
  /** Border radius override. */
  radius?: number;
  /** Pass-through style. */
  style?: CSSProperties;
  children: ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  material = "liquid",
  padding = "32px 36px",
  width,
  accentTone,
  rtl = true,
  radius = RADIUS.md,
  style,
  children,
}) => {
  const surface = glassStyle(material);
  const accentColor = accentTone ? toneColor(accentTone) : undefined;

  return (
    <div
      style={{
        position: "relative",
        width,
        padding,
        borderRadius: radius,
        direction: rtl ? "rtl" : "ltr",
        ...surface,
        ...style,
      }}
    >
      {/* Specular top highlight — separate from the inset shadow so it can
          extend past corner radius without bleeding. The iOS-26 "rim light". */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: radius / 2,
          right: radius / 2,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.42) 50%, transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Accent edge (tone-driven leading bar) */}
      {accentColor && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 16,
            bottom: 16,
            [rtl ? "right" : "left"]: 0,
            width: 4,
            background: accentColor,
            borderRadius: 2,
            boxShadow: `0 0 18px ${toneGlow(accentTone)}`,
          }}
        />
      )}

      {children}
    </div>
  );
};

// ── ChromeText — hero text with chrome gradient + halo ───────────────────────

interface ChromeTextProps {
  /** Tone. Default "neutral" = white chrome. "brand" = warm orange chrome. */
  tone?: Tone;
  /** Type role from tokens.TYPE. */
  role?: keyof typeof TYPE;
  /** Pass-through. */
  style?: CSSProperties;
  children: ReactNode;
  className?: string;
  /** Render as a span (inline) instead of div. */
  inline?: boolean;
}

export const ChromeText: React.FC<ChromeTextProps> = ({
  tone = "neutral",
  role = "displayHeadline",
  style,
  children,
  className,
  inline = false,
}) => {
  const Tag = inline ? "span" : "div";
  const baseType = TYPE[role];
  return (
    <Tag
      className={className}
      style={{
        ...baseType,
        ...chromeText(tone),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

// ── Eyebrow — uppercase label above a headline ───────────────────────────────

interface EyebrowProps {
  /** Tone-tinted color. Default "neutral" = secondary text. */
  tone?: Tone;
  /** Hebrew or Latin? Hebrew uses heavier sans, Latin uses mono. */
  script?: "hebrew" | "latin";
  /** Pass-through. */
  style?: CSSProperties;
  children: ReactNode;
}

export const Eyebrow: React.FC<EyebrowProps> = ({
  tone,
  script = "hebrew",
  style,
  children,
}) => {
  const baseType = script === "hebrew" ? TYPE.eyebrowHebrew : TYPE.eyebrow;
  const color = tone ? toneColor(tone) : COLORS.textTertiary;
  return (
    <div
      style={{
        ...baseType,
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── CornerBadge — small annotation pill that floats at a card corner ────────
//
// Inspired by the @softgirlnocode reel: small uppercase pills like
// "● MCP TAX", "Cleaner state", "Injected into context" sitting at the
// top-left or top-right of a glass card to annotate it without taking up
// hierarchy. Pair with the new "warm" material for the editorial look.

interface CornerBadgeProps {
  /** Label text. Keep short — ≤ 3 words. */
  label: string;
  /** Where on the parent card. Default "top-right". */
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Tone — colors the leading dot. Default "brand". */
  tone?: Tone;
  /** Show a leading status dot? Default true. */
  dot?: boolean;
  /** Theme — "dark" (frosted on dark canvas) or "warm" (cream pill). */
  theme?: "dark" | "warm";
  /** Pass-through. */
  style?: CSSProperties;
}

export const CornerBadge: React.FC<CornerBadgeProps> = ({
  label,
  corner = "top-right",
  tone = "brand",
  dot = true,
  theme = "dark",
  style,
}) => {
  const accent = toneColor(tone);
  // Position: 12px outside the card so it visually overlaps the edge.
  const pos: CSSProperties =
    corner === "top-left"   ? { top: -10, left: 16 } :
    corner === "top-right"  ? { top: -10, right: 16 } :
    corner === "bottom-left" ? { bottom: -10, left: 16 } :
                              { bottom: -10, right: 16 };

  const surface: CSSProperties = theme === "warm"
    ? {
        background: "rgba(255,235,210,0.85)",
        border: "1px solid rgba(180,140,80,0.30)",
        color: "rgba(120,80,30,0.95)",
        boxShadow: "0 2px 8px rgba(40,30,15,0.18)",
      }
    : {
        background: "rgba(20,20,22,0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${COLORS.borderHairline}`,
        color: COLORS.text,
        boxShadow: "0 2px 10px rgba(0,0,0,0.30)",
      };

  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        padding: "6px 12px",
        borderRadius: RADIUS.pill,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        ...surface,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </div>
  );
};

// ── DividerVS — typographic divider for comparison boards ────────────────────

interface DividerVSProps {
  label?: string;
  /** Direction of the divider strokes. Default "vertical" (for L/R panels). */
  orientation?: "vertical" | "horizontal";
}

export const DividerVS: React.FC<DividerVSProps> = ({
  label = "VS",
  orientation = "vertical",
}) => {
  const strokeStyle: CSSProperties =
    orientation === "vertical"
      ? {
          width: 2,
          flexGrow: 1,
          minHeight: 40,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 100%)",
        }
      : {
          height: 2,
          flexGrow: 1,
          minWidth: 40,
          background:
            "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 100%)",
        };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <div style={strokeStyle} />
      <div
        style={{
          ...TYPE.eyebrow,
          color: COLORS.text,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: `1px solid ${COLORS.borderHairline}`,
          borderRadius: RADIUS.pill,
          padding: "8px 16px",
        }}
      >
        {label}
      </div>
      <div style={strokeStyle} />
    </div>
  );
};

// ── HaloGlow — soft radial accent behind hero elements ───────────────────────

interface HaloGlowProps {
  tone?: Tone;
  /** Diameter in px. Default 600. */
  size?: number;
  /** Opacity multiplier 0..1. Default 0.55. */
  intensity?: number;
  /** Pass-through. */
  style?: CSSProperties;
}

export const HaloGlow: React.FC<HaloGlowProps> = ({
  tone = "brand",
  size = 600,
  intensity = 0.55,
  style,
}) => {
  const accent = toneColor(tone);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at center, ${accent} 0%, transparent 60%)`,
        opacity: intensity * 0.6,
        filter: "blur(40px)",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

// ── AccentUnderline — animated underline for a label ─────────────────────────

interface AccentUnderlineProps {
  tone?: Tone;
  /** Width in px. Default 100% of parent. */
  width?: number | string;
  /** Animated reveal progress 0..1. */
  progress?: number;
  thickness?: number;
}

export const AccentUnderline: React.FC<AccentUnderlineProps> = ({
  tone = "brand",
  width = "100%",
  progress = 1,
  thickness = 4,
}) => {
  const color = toneColor(tone);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -10,
        height: thickness,
        width,
        background: color,
        borderRadius: thickness / 2,
        boxShadow: `0 0 14px ${toneGlow(tone)}`,
        transform: `scaleX(${progress})`,
        transformOrigin: "left center",
      }}
    />
  );
};

// ── SafeZoneFrame — dev-only visualization ───────────────────────────────────

interface SafeZoneFrameProps {
  show?: boolean;
}

export const SafeZoneFrame: React.FC<SafeZoneFrameProps> = ({ show }) => {
  if (!show) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 420,
          bottom: 620,
          left: 200,
          right: 200,
          border: "1.5px dashed rgba(0,255,200,0.45)",
          borderRadius: 24,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 60,
          right: 60,
          height: 320,
          border: "1.5px dashed rgba(255,180,0,0.45)",
          borderRadius: 24,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// ── Anchor resolver ──────────────────────────────────────────────────────────
//
// 1080×1920 portrait. The speaker's face occupies the centered band
// y=420→1300, x=200→880. Captions live at y=1500→1820. Therefore overlays
// MUST default to the upper area (y < 380) or to side rails that hug the
// frame edge (x ≤ 56 or x ≥ 1024).
//
// "center" is reserved for full-screen takeover scenes (no face visible).
// Plain centered placement on a talking-head video covers the speaker —
// never the right default.

export type OverlayAnchor =
  // Preferred — top zone (y=80-380), upper third of frame, never over face
  | "top-left"           // x=56, top=80
  | "top-right"          // x=1024, top=80
  | "top-center"         // x=540, top=80 — only if title is short and < 60% width
  // Side rails — vertical strips that hug the frame edge, beside the face
  | "left-rail"          // x=40, vertically centered — for tall narrow content
  | "right-rail"         // x=1024, vertically centered
  // Reserved — only for full-screen takeover (no face visible)
  | "center"
  // Legacy — DO NOT use as default. Sits between face and captions.
  | "above-captions"
  | "above-captions-left"
  | "above-captions-right"
  // Legacy — DO NOT use; collides with caption zone.
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// ── Horizontal content budget ────────────────────────────────────────────────
// 1080 - 2*72 = 936. A centred anchor is `left:50% + translateX(-50%)`, and an
// absolutely-positioned box with NO explicit width shrinks-to-fit inside the
// space remaining to its right — i.e. 1080-540 = 540px, half the frame. Long
// Hebrew headlines therefore wrapped early or overflowed their card. Giving the
// centred anchors an explicit width keeps their geometric centre at x=540, so
// every HaloGlow (which positions itself at 50% of this wrapper) lands
// pixel-identically, while the text budget goes 540 -> 936.
const CONTENT_W = 800; // was 936 — narrowed so ×1.3 overlay scale fits 1080

// The caption block renders at `bottom: 400` with `minHeight: 200`
// (Captions.tsx:102,111) so it occupies 400..600px up from the frame bottom.
// `above-captions` used to be 480 — i.e. INSIDE that band, overlapping the
// captions it claims to sit above. 620 clears it with a 20px breath.
const ABOVE_CAPTIONS = 620;

const centredBox = (extra: CSSProperties): CSSProperties => ({
  ...extra,
  left: "50%",
  width: CONTENT_W,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

/**
 * Global overlay scale (2026-08-08, owner: "זה היה קטן מאוד — חייב להגדיל
 * בהרבה, את כל ה-overlays"). Applied at this single anchor choke point so
 * every scene grows around its PINNED edge and never drifts off-anchor.
 * CONTENT_W was narrowed 936→800 in the same change so the widest scaled
 * box (800×1.3=1040) still fits the 1080 frame.
 */
const OVERLAY_SCALE = 1.3;

const scaledAnchor = (styles: CSSProperties, origin: string): CSSProperties => ({
  ...styles,
  transform:
    `${typeof styles.transform === "string" && styles.transform ? styles.transform + " " : ""}` +
    `scale(${OVERLAY_SCALE})`,
  transformOrigin: origin,
});

export function resolveAnchor(anchor: OverlayAnchor | undefined): CSSProperties {
  switch (anchor) {
    // ── Preferred top zone ────────────────────────────────────────────────
    case "top-left":             return scaledAnchor({ top: 200, left: 56, maxWidth: CONTENT_W }, "top left");
    case "top-right":            return scaledAnchor({ top: 200, right: 56, maxWidth: CONTENT_W }, "top right");
    case "top-center":           return scaledAnchor(centredBox({ top: 200, transform: "translateX(-50%)" }), "top center");
    // ── Side rails — between top and face zone, hugging the edge ──────────
    case "left-rail":            return scaledAnchor({ top: 220, left: 40, maxWidth: CONTENT_W }, "top left");
    case "right-rail":           return scaledAnchor({ top: 220, right: 40, maxWidth: CONTENT_W }, "top right");
    // ── Full-screen-only ───────────────────────────────────────────────────
    case "center":               return scaledAnchor(centredBox({ top: "50%", transform: "translate(-50%, -50%)" }), "center");
    // ── Legacy ─────────────────────────────────────────────────────────────
    case "above-captions":       return scaledAnchor(centredBox({ bottom: ABOVE_CAPTIONS, transform: "translateX(-50%)" }), "bottom center");
    case "above-captions-left":  return scaledAnchor({ bottom: ABOVE_CAPTIONS, left: 56, maxWidth: CONTENT_W }, "bottom left");
    case "above-captions-right": return scaledAnchor({ bottom: ABOVE_CAPTIONS, right: 56, maxWidth: CONTENT_W }, "bottom right");
    case "bottom-left":          return scaledAnchor({ bottom: 360, left: 56, maxWidth: CONTENT_W }, "bottom left");
    case "bottom-center":        return scaledAnchor(centredBox({ bottom: 360, transform: "translateX(-50%)" }), "bottom center");
    case "bottom-right":         return scaledAnchor({ bottom: 360, right: 56, maxWidth: CONTENT_W }, "bottom right");
    // ── Default: centred top zone. Was top-right, the anchor with ZERO left
    //    margin and therefore the tightest text budget — a bad default for a
    //    scene that forgot to declare one.
    default:                     return scaledAnchor(centredBox({ top: 200, transform: "translateX(-50%)" }), "top center");
  }
}
