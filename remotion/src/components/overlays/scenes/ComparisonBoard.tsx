/**
 * ComparisonBoard — split "this vs that" on solid dark panels.
 *
 * Rebuilt 2026-08-09 against the OVERLAY QUALITY LAWS:
 *   - Law 1 (legibility on ANY background): panels are the approved
 *     #1C1D24→#15161C dark gradient (the MetricLockup tease chrome the owner
 *     praised) — never translucent glass. The `material` prop is still
 *     accepted (planner back-compat) but no longer selects a see-through
 *     surface; both sides always read over a white ceiling.
 *   - Law 7 (ONE accent): only the `highlight` side carries the accent —
 *     tone-colored edge bar + border + breathing glow + tinted title. The
 *     other side stays neutral and dims. No highlight → both neutral.
 *   - Divider label is FREE TYPOGRAPHY (Heebo 900 + dark shadow) between two
 *     hairline strokes — the old translucent DividerVS pill is gone (Law 2).
 *   - Law 3 (BIG): titles 46px, body 25px, divider 38px — pre the global
 *     ×1.3 anchor scale.
 *   - Width 800 (was 980): 980×1.3 = 1274px overflowed the 1080 frame.
 *   - Law 5: renders null without both side titles; empty eyebrow/body omit.
 *
 * Motion: left panel (stack-cascade/confident, 0ms) → divider (depth-pop/
 * bounce-soft, +90ms) → right panel (stack-cascade/confident, +180ms); the
 * winner's accent ignites as a separate beat after both panels land, then
 * breathes for the hold (deterministic sine — the "always alive" element).
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient, staggerOffset } from "../motion";
import { ChromeText, resolveAnchor } from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";
import type { ComparisonBoardScene, ComparisonSide } from "../types";

interface Props {
  scene: ComparisonBoardScene;
}

// The approved dark-panel chrome (MetricLockup reference).
const PANEL_BG = "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)";
const PANEL_BORDER = "1px solid rgba(255,255,255,0.14)";
const PANEL_SHADOW =
  "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)";

// 800 = CONTENT_W. The global ×1.3 anchor scale pushes this to 1040 < 1080.
const BOARD_W = 800;

export const ComparisonBoard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = scene.rtl ?? true;
  // Wide board → top zone, above the face. Planner may set "center" for
  // full-screen takeovers.
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  // Law 5 — a comparison without two named sides is meaningless.
  if (!scene.left?.title?.trim() || !scene.right?.title?.trim()) return null;

  const highlight =
    scene.highlight === "left" || scene.highlight === "right"
      ? scene.highlight
      : undefined;

  // Winner-accent ignition — its own beat AFTER both panels are in
  // (right panel lands ~0.18s + 0.55s ≈ 0.73s).
  const accentT = interpolate(
    frame,
    [Math.round(0.75 * fps), Math.round(1.05 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );
  // Breathing glow — deterministic sine, the scene's "alive" element.
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 3.6);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          ...anchor,
          width: BOARD_W,
          direction: rtl ? "rtl" : "ltr",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch", gap: 18 }}>
          <ComparisonPanel
            side={scene.left}
            state={
              highlight === "left" ? "winner" : highlight ? "dimmed" : "neutral"
            }
            accentT={accentT}
            breath={breath}
            offsetFrames={0}
            rtl={rtl}
          />

          <FreeDivider
            label={scene.divider_label}
            offsetFrames={staggerOffset(1, fps, 90)}
          />

          <ComparisonPanel
            side={scene.right}
            state={
              highlight === "right" ? "winner" : highlight ? "dimmed" : "neutral"
            }
            accentT={accentT}
            breath={breath}
            offsetFrames={staggerOffset(2, fps, 90)}
            rtl={rtl}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Panel ────────────────────────────────────────────────────────────────────

interface PanelProps {
  side: ComparisonSide;
  state: "winner" | "dimmed" | "neutral";
  /** Winner-accent ignition progress 0..1 (shared, single beat). */
  accentT: number;
  /** Deterministic breathing phase 0..1 for the winner glow. */
  breath: number;
  offsetFrames: number;
  rtl: boolean;
}

const ComparisonPanel: React.FC<PanelProps> = ({
  side,
  state,
  accentT,
  breath,
  offsetFrames,
  rtl,
}) => {
  const entrance = useEntrance({
    signature: "stack-cascade",
    ease: "confident",
    durationSec: 0.5,
    offsetFrames,
  });
  const ambient = useAmbient({
    startAfterSec: 0.9,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.5,
  });

  const isWinner = state === "winner";
  const tone: Tone = isWinner ? side.tone ?? "brand" : "neutral";
  const accent = toneColor(tone);
  const glow = toneGlow(tone);

  // The dimmed loser fades a notch as the winner's accent ignites —
  // one state change, no rebuild.
  const dimOpacity = state === "dimmed" ? 1 - 0.4 * accentT : 1;
  const winnerGlowAlpha = isWinner ? accentT * (0.5 + 0.35 * breath) : 0;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        ...entrance,
        opacity: (entrance.opacity as number) * dimOpacity,
        transform: mergeTransforms(entrance.transform, ambient.transform),
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          padding: "30px 30px 34px",
          borderRadius: RADIUS.lg,
          background: PANEL_BG,
          border: isWinner
            ? `1.5px solid ${withAlpha(accent, 0.25 + 0.6 * accentT)}`
            : PANEL_BORDER,
          boxShadow: isWinner
            ? `${PANEL_SHADOW}, 0 0 ${Math.round(24 + 22 * breath)}px ${withAlpha(
                accent,
                0.28 * winnerGlowAlpha,
              )}`
            : PANEL_SHADOW,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Winner accent edge — THE single accent element (Law 7). */}
        {isWinner && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 18,
              bottom: 18,
              [rtl ? "right" : "left"]: 0,
              width: 5,
              borderRadius: 3,
              background: accent,
              opacity: accentT,
              boxShadow: `0 0 ${Math.round(14 + 10 * breath)}px ${glow}`,
            }}
          />
        )}

        {side.eyebrow?.trim() && (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: isWinner
                ? withAlpha(accent, 0.55 + 0.45 * accentT)
                : COLORS.textTertiary,
              ...bidiFor(side.eyebrow),
            }}
          >
            {side.eyebrow}
          </div>
        )}

        <ChromeText
          role="displayHeadline"
          tone={isWinner && accentT > 0.5 ? tone : "neutral"}
          style={{
            ...TYPE.displayHeadline,
            fontSize: 46,
            lineHeight: 1.12,
            textAlign: rtl ? "right" : "left",
            ...bidiFor(side.title),
          }}
        >
          {side.title}
        </ChromeText>

        {side.body?.trim() && (
          <div
            style={{
              ...TYPE.body,
              fontSize: 25,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.78)",
              textAlign: rtl ? "right" : "left",
              ...bidiFor(side.body),
            }}
          >
            {side.body}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Free-typography divider (no pill, no box — Law 2) ────────────────────────

const FreeDivider: React.FC<{
  label?: string;
  offsetFrames: number;
}> = ({ label, offsetFrames }) => {
  const entrance = useEntrance({
    signature: "depth-pop",
    ease: "bounce-soft",
    durationSec: 0.45,
    offsetFrames,
  });
  const text = label?.trim() || "VS";

  return (
    <div
      style={{
        ...entrance,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        alignSelf: "stretch",
        flexShrink: 0,
        width: 76,
        justifyContent: "center",
      }}
    >
      <DividerStroke />
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: isHebrew(text) ? "0em" : "0.04em",
          color: COLORS.text,
          textShadow:
            "0 4px 26px rgba(0,0,0,0.85), 0 1px 6px rgba(0,0,0,0.6), 0 0 22px rgba(255,255,255,0.30)",
          whiteSpace: "nowrap",
          ...bidiFor(text),
        }}
      >
        {text}
      </div>
      <DividerStroke />
    </div>
  );
};

const DividerStroke: React.FC = () => (
  <div
    aria-hidden
    style={{
      width: 2,
      flexGrow: 1,
      minHeight: 32,
      background:
        "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)",
      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))",
    }}
  />
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergeTransforms(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  }
  return hex;
}

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

/** Latin/number runs inside the RTL board get an isolated LTR run (Law 8). */
function bidiFor(s: string): React.CSSProperties {
  return isHebrew(s)
    ? {}
    : { direction: "ltr", unicodeBidi: "isolate" as const };
}
