/**
 * FollowerCountUp — visual metaphor for "audience size", "social proof",
 * "growth on social".
 *
 * An IG/TikTok-style identity badge: avatar circle, handle line, followers
 * count that ticks up from `from` to `to`, optional "Follow" pill that
 * highlights at the end. Defaults to brand orange theme.
 *
 * Use cases:
 *   - "100K followers on Instagram" → avatar + handle + 0 → 100,000
 *   - "הקהילה חצתה את ה-50 אלף" → ticker animation
 *   - "joined this week" → followers + "+ 2K this week" sublabel
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient } from "../motion";
import {
  GlassCard,
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
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

export interface FollowerCountUpScene {
  type: "follower_count_up";
  id: string;
  start: number;
  end: number;
  /** Final follower count. */
  count_to: number;
  /** Starting count. Default 0. */
  count_from?: number;
  /** Handle to display. e.g. "@omer.digital". */
  handle: string;
  /** Avatar letter (single char). Defaults to first letter of handle. */
  avatar_letter?: string;
  /** Avatar gradient color. Defaults to tone color. */
  avatar_color?: string;
  /** Platform label below. e.g. "Instagram", "TikTok", "YouTube". */
  platform?: string;
  /** Eyebrow above. e.g. "FOLLOWERS", "עוקבים". */
  eyebrow?: string;
  /** Optional bottom sublabel. e.g. "+2K this week". */
  delta_text?: string;
  /** Tone. Default "brand". */
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
}

interface Props {
  scene: FollowerCountUpScene;
}

export const FollowerCountUp: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const avatarColor = scene.avatar_color ?? accent;
  const countFrom = scene.count_from ?? 0;

  const cardEntrance = useEntrance({
    signature: "glass-rise",
    durationSec: 0.50,
  });
  const ambient = useAmbient({
    startAfterSec: 1.2,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.0,
  });

  // Counter ramp
  const t = interpolate(
    frame,
    [Math.round(0.60 * fps), Math.round(1.80 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("confident"),
    },
  );
  const currentCount = Math.round(countFrom + (scene.count_to - countFrom) * t);

  // Delta text fades in last
  const deltaT = interpolate(
    frame,
    [Math.round(1.50 * fps), Math.round(1.80 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            ...cardEntrance,
            transform: mergeT(cardEntrance.transform, ambient.transform),
          }}
        >
          <GlassCard
            material="liquid"
            padding="22px 30px"
            rtl={false}
            style={{ minWidth: 380 }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone={tone}
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{ fontSize: 14, marginBottom: 12, textAlign: "center" }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${avatarColor}, ${darken(avatarColor, 0.30)})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 6px 18px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  border: "2px solid rgba(255,255,255,0.20)",
                }}
              >
                <span
                  style={{
                    ...TYPE.displayHeadline,
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#FFFFFF",
                  }}
                >
                  {scene.avatar_letter ?? scene.handle.replace("@", "").slice(0, 1).toUpperCase()}
                </span>
              </div>

              {/* Handle + counter */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 18,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  {scene.handle}
                </div>
                <div
                  style={{
                    ...TYPE.numberLockup,
                    fontSize: 48,
                    fontWeight: 900,
                    color: COLORS.text,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {formatCount(currentCount)}
                </div>
                {scene.platform && (
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 12,
                      color: COLORS.textTertiary,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    {scene.platform} followers
                  </div>
                )}
              </div>
            </div>

            {scene.delta_text && (
              <div
                style={{
                  marginTop: 12,
                  padding: "6px 12px",
                  borderRadius: RADIUS.pill,
                  background: `${accent}22`,
                  border: `1px solid ${accent}44`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  fontWeight: 700,
                  color: accent,
                  opacity: deltaT,
                  willChange: "opacity",
                }}
              >
                <span style={{ fontSize: 12 }}>↑</span>
                {scene.delta_text}
              </div>
            )}
          </GlassCard>

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.35 + t * 0.2,
              pointerEvents: "none",
            }}
          >
            <HaloGlow
              tone={tone}
              size={500}
              intensity={0.4}
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function mergeT(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
