/**
 * LowerThirdPremium — speaker identity: free typography name + handle.
 *
 * Rebuilt per the overlay quality laws (owner feedback, 7 review rounds):
 *   - Law 2 (no boxes around plain text): a name + handle is PLAIN TEXT, not
 *     a UI object — the default render is free typography in the de-boxed
 *     TitlePill language (Heebo 900, dark text-shadow, one accent + glow).
 *     The translucent pill is DEAD. A panel renders ONLY when the planner
 *     explicitly asks for `variant: "card"` — and then it is the approved
 *     dark panel (#1C1D24→#15161C), never white-on-translucent-glass (Law 1).
 *   - Law 3 (big): name 54px / handle 30px pre-scale (was 30/22).
 *   - Law 5 (real content only): empty `primary` ⇒ render null.
 *   - Law 8: Hebrew RTL; latin handles get direction:ltr + isolate.
 *
 * Anchored above-captions by convention — the ONE legitimate use of that
 * anchor (speaker name tag below the face, per DESIGN.md).
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient } from "../motion";
import { GlassCard, resolveAnchor } from "../primitives";
import { COLORS, FONTS, RADIUS, easeFn } from "../../../design/tokens";
import type { LowerThirdPremiumScene } from "../types";

interface Props {
  scene: LowerThirdPremiumScene;
}

/** The approved dark-panel material (MetricLockup reference look). */
const DARK_PANEL: React.CSSProperties = {
  background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)",
};

/** Heavy dark shadow — free typography carries its OWN contrast (Law 1). */
const DARK_TEXT_SHADOW =
  "0 4px 30px rgba(0,0,0,0.85), 0 1px 6px rgba(0,0,0,0.6)";

export const LowerThirdPremium: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = scene.variant ?? "pill";
  // LowerThirdPremium is the ONE legitimate use of above-captions —
  // it's the speaker's name tag, by convention placed below the face.
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const accent = scene.avatar_color ?? COLORS.accentBrand;
  const accentGlow = withAlpha(accent, 0.5);

  // Name entrance — rises from below like it belongs to the speaker.
  const nameEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.5,
    fromEdge: "bottom",
  });
  // Handle arrives a beat later, calm blur-reveal (2nd ease).
  const handleEntrance = useEntrance({
    signature: "blur-reveal",
    ease: "confident",
    durationSec: 0.45,
    offsetFrames: Math.round(0.28 * fps),
  });
  // Accent underline sweeps center-out after the name lands (3rd ease).
  const underlineStart = Math.round(0.5 * fps);
  const underlineT = interpolate(
    frame,
    [underlineStart, underlineStart + Math.round(0.3 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("whip-out"),
    },
  );
  const ambient = useAmbient({
    startAfterSec: 1.0,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.5,
  });

  // Law 5 — real content only: no name, no scene.
  if (!scene.primary || !scene.primary.trim()) return null;

  const rtl = isHebrew(scene.primary);
  const secondary = scene.secondary?.trim() || undefined;
  const secondaryLatin =
    secondary !== undefined && /[A-Za-z@]/.test(secondary) && !isHebrew(secondary);

  // ── Default: FREE TYPOGRAPHY (no box) ─────────────────────────────────────
  const freeTypography = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      {/* Name — big, white, self-contrasting */}
      <div style={{ position: "relative", ...nameEntrance }}>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 54,
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            color: COLORS.text,
            textAlign: "center",
            textShadow: DARK_TEXT_SHADOW,
          }}
        >
          {scene.primary}
        </div>
        {/* Accent underline — the ONE accent, sweeping center-out */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -10,
            left: "14%",
            right: "14%",
            height: 5,
            borderRadius: 3,
            background: accent,
            boxShadow: `0 0 16px ${accentGlow}, 0 0 40px ${withAlpha(accent, 0.25)}`,
            transform: `scaleX(${underlineT})`,
            transformOrigin: "center",
          }}
        />
      </div>

      {/* Handle — accent-colored, its own glow + dark shadow */}
      {secondary && (
        <div
          style={{
            ...handleEntrance,
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: 30,
            lineHeight: 1.2,
            color: accent,
            textAlign: "center",
            marginTop: 8,
            textShadow: `0 0 22px ${accentGlow}, 0 2px 12px rgba(0,0,0,0.85)`,
            // Handles/URLs ("@omer.digital") read LTR even in RTL context.
            direction: secondaryLatin ? "ltr" : undefined,
            unicodeBidi: secondaryLatin ? "isolate" : undefined,
          }}
        >
          {secondary}
        </div>
      )}
    </div>
  );

  // ── variant="card": the identity as a UI OBJECT — approved dark panel ─────
  const cardVariant = (
    <div style={nameEntrance}>
      <GlassCard
        material="solid-dark"
        padding="24px 34px"
        rtl={rtl}
        radius={RADIUS.lg}
        style={{
          ...DARK_PANEL,
          display: "flex",
          alignItems: "center",
          gap: 24,
          minWidth: 440,
        }}
      >
        {/* Avatar circle — the accent carrier */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.3)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 6px 24px ${withAlpha(accent, 0.45)}`,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 42,
              fontWeight: 800,
              color: COLORS.text,
              textTransform: "uppercase",
            }}
          >
            {scene.avatar_letter ?? scene.primary.slice(0, 1)}
          </span>
        </div>

        {/* Text block — white on dark panel, always legible */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.12,
              color: COLORS.text,
            }}
          >
            {scene.primary}
          </div>
          {secondary && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 26,
                fontWeight: 600,
                lineHeight: 1.2,
                color: accent,
                textShadow: `0 0 16px ${accentGlow}`,
                direction: secondaryLatin ? "ltr" : undefined,
                unicodeBidi: secondaryLatin ? "isolate" : undefined,
              }}
            >
              {secondary}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ transform: ambient.transform }}>
          {variant === "card" ? cardVariant : freeTypography}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return hex;
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
