/**
 * AppIconNetwork — visual metaphor for "tools connected", "system setup",
 * "MCP / integrations / stack".
 *
 * Direct reference: @softgirlnocode reel (2026-04-25), frames at 14.5–24s.
 * Anatomy: a wide glass card with N small "app icons" (rounded squares
 * with a single letter or short label) laid out in a constellation. A
 * central "hub" icon sits in the middle. Optional dotted lines from
 * leaf icons → hub light up sequentially as if the system is connecting.
 *
 * Layout: 2×2, 3×1, or "constellation" (1 center + N around).
 *
 * Use cases:
 *   - "המערכת מחוברת ל-Notion, Drive, Gmail" → 3 leaves + hub
 *   - "כל הכלים שלך במקום אחד" → 4 leaves + hub
 *   - "MCP setup" → matches the reel reference exactly
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance } from "../motion";
import {
  CornerBadge,
  Eyebrow,
  GlassCard,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  WARM,
  easeFn,
  toneColor,
  toneGlow,
  type GlassMaterial,
  type Tone,
} from "../../../design/tokens";

export interface AppIconLeaf {
  /** Single letter / glyph displayed inside the icon. e.g. "D", "@", "N". */
  glyph: string;
  /** Display name of the app. e.g. "GDrive", "Gmail", "Notion". */
  name: string;
  /** Small label below the name. e.g. "tool", "files & docs". */
  sublabel?: string;
  /** Tone — colors the icon background. Default rotates by index. */
  tone?: Tone;
}

export interface AppIconNetworkScene {
  type: "app_icon_network";
  id: string;
  start: number;
  end: number;
  /** Center hub icon. e.g. { glyph: "M", name: "MCP" }. */
  hub: AppIconLeaf;
  /** Surrounding leaf apps. 2-4 work best. */
  leaves: AppIconLeaf[];
  /** Card title. e.g. "Cowork setup". */
  title?: string;
  /** Card eyebrow. e.g. "CONNECTED THROUGH MCP". */
  eyebrow?: string;
  /** Optional corner badge. e.g. "MCP TAX". */
  corner_badge?: string;
  corner_badge_tone?: Tone;
  /** Show animated connector lines? Default true. */
  connectors?: boolean;
  /** Material. Default "warm". */
  material?: GlassMaterial;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: AppIconNetworkScene;
}

// Default tone rotation for leaves when not specified
const DEFAULT_TONES: Tone[] = ["brand", "info", "success", "warn"];

export const AppIconNetwork: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const material = scene.material ?? "warm";
  const isWarm = material === "warm";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const showConnectors = scene.connectors ?? true;
  const leaves = scene.leaves.slice(0, 4);

  const cardEntrance = useEntrance({
    signature: "stack-cascade",
    ease: "glass-rise",
    durationSec: 0.50,
  });

  // Layout geometry — center hub at (cx, cy), leaves at fixed angles.
  // Card body: 540×260 ish (responsive to # of leaves)
  const W = 540;
  const H = leaves.length >= 4 ? 320 : 260;
  const cx = W / 2;
  const cy = H / 2 - 10; // slight upward bias for visual balance
  const hubSize = 76;
  const leafSize = 64;
  const orbitRadius = 130;

  // Position leaves on a circle starting at the top, evenly spaced
  const leafPositions = leaves.map((_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / leaves.length;
    return {
      x: cx + orbitRadius * Math.cos(angle),
      y: cy + orbitRadius * Math.sin(angle) * 0.55, // squash vertically
    };
  });

  // Sequenced reveal — hub first, then leaves cascade
  const hubT = interpolate(
    frame,
    [Math.round(0.55 * fps), Math.round(0.85 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={cardEntrance}>
          <GlassCard
            material={material}
            padding="24px 28px"
            rtl={false}
            style={{ width: W, position: "relative" }}
          >
            {/* Header */}
            {scene.eyebrow && (
              <Eyebrow
                tone="neutral"
                script="latin"
                style={{
                  fontSize: 18,
                  marginBottom: 4,
                  color: isWarm ? WARM.textTertiary : COLORS.textTertiary,
                  letterSpacing: "0.16em",
                }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}
            {scene.title && (
              <div
                style={{
                  ...TYPE.sectionTitle,
                  fontSize: 32,
                  fontWeight: 800,
                  color: isWarm ? WARM.text : COLORS.text,
                  marginBottom: 6,
                }}
              >
                {scene.title}
              </div>
            )}

            {/* Network stage */}
            <div style={{ position: "relative", width: W - 56, height: H - 8 }}>
              {/* Connectors */}
              {showConnectors && (
                <svg
                  width={W - 56}
                  height={H - 8}
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                >
                  {leafPositions.map((p, i) => {
                    const tone: Tone = leaves[i].tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length];
                    const accent = toneColor(tone);
                    // Connector animates AFTER hub, leaf-by-leaf
                    const connectorStart = Math.round((0.85 + i * 0.20) * fps);
                    const cT = interpolate(
                      frame,
                      [connectorStart, connectorStart + Math.round(0.30 * fps)],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide") },
                    );
                    // Line from leaf → hub
                    const dx = cx - p.x;
                    const dy = cy - p.y;
                    return (
                      <line
                        key={`c-${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={p.x + dx * cT}
                        y2={p.y + dy * cT}
                        stroke={accent}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        opacity={0.55}
                        style={{ filter: `drop-shadow(0 0 4px ${toneGlow(tone)})` }}
                      />
                    );
                  })}
                </svg>
              )}

              {/* Hub icon (center) */}
              <IconBlock
                glyph={scene.hub.glyph}
                name={scene.hub.name}
                sublabel={scene.hub.sublabel}
                size={hubSize}
                tone={scene.hub.tone ?? "brand"}
                center={{ x: cx, y: cy }}
                isHub
                isWarm={isWarm}
                t={hubT}
              />

              {/* Leaf icons */}
              {leaves.map((leaf, i) => {
                const tone: Tone = leaf.tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length];
                const leafStart = Math.round((1.05 + i * 0.20) * fps);
                const lT = interpolate(
                  frame,
                  [leafStart, leafStart + Math.round(0.30 * fps)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
                );
                return (
                  <IconBlock
                    key={`l-${i}`}
                    glyph={leaf.glyph}
                    name={leaf.name}
                    sublabel={leaf.sublabel}
                    size={leafSize}
                    tone={tone}
                    center={leafPositions[i]}
                    isWarm={isWarm}
                    t={lT}
                  />
                );
              })}
            </div>

            {scene.corner_badge && (
              <CornerBadge
                label={scene.corner_badge}
                corner="top-right"
                tone={scene.corner_badge_tone ?? "brand"}
                theme={isWarm ? "warm" : "dark"}
              />
            )}
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── IconBlock ───────────────────────────────────────────────────────────────

const IconBlock: React.FC<{
  glyph: string;
  name: string;
  sublabel?: string;
  size: number;
  tone: Tone;
  center: { x: number; y: number };
  isHub?: boolean;
  isWarm: boolean;
  t: number; // 0..1 reveal progress
}> = ({ glyph, name, sublabel, size, tone, center, isHub, isWarm, t }) => {
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const labelColor = isWarm ? WARM.text : COLORS.text;
  const sublabelColor = isWarm ? WARM.textTertiary : COLORS.textTertiary;

  return (
    <div
      style={{
        position: "absolute",
        left: center.x - size / 2,
        top: center.y - size / 2,
        width: size,
        height: size,
        opacity: t,
        transform: `scale(${0.6 + 0.4 * t})`,
        willChange: "transform, opacity",
      }}
    >
      {/* The icon block itself */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: isHub
            ? `linear-gradient(135deg, ${accent}, ${darken(accent, 0.30)})`
            : isWarm
            ? "rgba(255,255,255,0.65)"
            : "rgba(255,255,255,0.06)",
          border: isHub
            ? "1px solid rgba(255,255,255,0.30)"
            : isWarm
            ? "1px solid rgba(120,100,75,0.18)"
            : `1px solid ${COLORS.borderHairline}`,
          boxShadow: isHub
            ? `inset 0 1px 0 rgba(255,255,255,0.30), 0 6px 16px rgba(0,0,0,0.30), 0 0 ${14 * t}px ${accentGlow}`
            : isWarm
            ? "0 4px 10px rgba(40,30,15,0.10), inset 0 1px 0 rgba(255,255,255,0.55)"
            : "0 2px 6px rgba(0,0,0,0.30)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: size * 0.32,
            fontWeight: 800,
            color: isHub ? "#FFFFFF" : isWarm ? accent : COLORS.text,
            textShadow: isHub ? `0 0 8px ${accentGlow}` : "none",
            letterSpacing: glyph.length > 1 ? "0.04em" : "0",
          }}
        >
          {glyph.toUpperCase()}
        </span>
      </div>

      {/* Label below the icon */}
      <div
        style={{
          position: "absolute",
          top: size + 6,
          left: -20,
          right: -20,
          textAlign: "center",
          fontFamily: FONTS.body,
        }}
      >
        <div
          style={{
            fontSize: isHub ? 14 : 13,
            fontWeight: isHub ? 800 : 700,
            color: labelColor,
            letterSpacing: "-0.005em",
          }}
        >
          {name}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: sublabelColor,
              marginTop: 1,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// silence unused imports
export const _UNUSED: unknown = { RADIUS };
