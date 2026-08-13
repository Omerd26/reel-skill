/**
 * MagnetPull — audience attraction made physical: a brand-colored magnet
 * PULLS a scatter of avatar dots toward it along curved paths; each dot
 * that arrives makes the magnet pulse and a counter tick. For "מושך קהל",
 * "התוכן עובד בשבילך".
 *
 * NEW TYPE 2026-08-09. Deterministic paths (seeded by index).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface MagnetPullScene {
  type: "magnet_pull";
  id: string;
  start: number;
  end: number;
  /** Label under the magnet — e.g. "התוכן שלך". */
  label?: string;
  /** How many audience dots fly in. Default 8, max 12. */
  dot_count?: number;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: MagnetPullScene;
}

// Deterministic pseudo-random from index.
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const DOT_COLORS = ["#E8B04B", "#5BA8E8", "#6BC77B", "#C77BC1", "#E8875B", "#7BC7C1"];

export const MagnetPull: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const n = Math.min(scene.dot_count ?? 8, 12);

  const W = 620;
  const H = 300;
  const MX = W / 2;
  const MY = H - 70;

  let arrived = 0;
  const dots = Array.from({ length: n }, (_, i) => {
    const startAngle = rnd(i, 1) * Math.PI; // upper half
    const dist = 220 + rnd(i, 2) * 140;
    const x0 = MX + Math.cos(startAngle) * dist * (rnd(i, 3) > 0.5 ? 1 : -1);
    const y0 = MY - 90 - rnd(i, 4) * 170;
    const delay = Math.round((0.3 + rnd(i, 5) * 1.1) * fps);
    const t = interpolate(frame, [delay, delay + Math.round(0.65 * fps)], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out"),
    });
    if (t >= 1) arrived++;
    // Curved pull: quadratic toward the magnet with a sideways bow.
    const bowX = (x0 + MX) / 2 + (rnd(i, 6) - 0.5) * 120;
    const bowY = Math.min(y0, MY) - 60;
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * bowX + t * t * MX;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * bowY + t * t * (MY - 14);
    return { x, y, t, color: DOT_COLORS[i % DOT_COLORS.length], size: 26 + rnd(i, 7) * 14 };
  });

  const pulse = 1 + 0.05 * Math.sin((frame / (1.1 * fps)) * Math.PI * 2) + 0.03 * arrived / n;
  const magnetEnter = interpolate(frame, [0, Math.round(0.35 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ position: "relative", width: W, height: H + 60 }}>
          {/* field lines */}
          {[0, 1, 2].map((r) => (
            <div
              key={r}
              style={{
                position: "absolute",
                left: MX - (70 + r * 46),
                top: MY - (70 + r * 46),
                width: (70 + r * 46) * 2,
                height: (70 + r * 46) * 2,
                borderRadius: "50%",
                border: `1.5px dashed rgba(255,255,255,${0.16 - r * 0.045})`,
                transform: `scale(${1 + 0.03 * Math.sin((frame / (2.0 * fps)) * Math.PI * 2 + r)})`,
              }}
            />
          ))}
          {/* dots flying in (drawn under the magnet) */}
          {dots.map((d, i) =>
            d.t >= 1 ? null : (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: d.x - d.size / 2,
                  top: d.y - d.size / 2,
                  width: d.size,
                  height: d.size,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 30%, ${d.color}, #333)`,
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  opacity: Math.min(1, d.t * 3),
                }}
              />
            ),
          )}
          {/* magnet (horseshoe, drawn SVG) */}
          <div
            style={{
              position: "absolute",
              left: MX - 70,
              top: MY - 70,
              transform: `scale(${magnetEnter * pulse})`,
              filter: `drop-shadow(0 10px 26px rgba(0,0,0,0.55)) drop-shadow(0 0 ${16 + arrived * 2}px ${accentGlow})`,
            }}
          >
            <svg width="140" height="140" viewBox="0 0 100 100">
              <path
                d="M 25 15 L 25 55 A 25 25 0 0 0 75 55 L 75 15"
                fill="none"
                stroke={accent}
                strokeWidth="20"
                strokeLinecap="butt"
              />
              <rect x="15" y="10" width="20" height="16" rx="3" fill="#E8E9ED" />
              <rect x="65" y="10" width="20" height="16" rx="3" fill="#E8E9ED" />
            </svg>
          </div>
          {/* arrived counter chip */}
          {arrived > 0 && (
            <div
              style={{
                position: "absolute",
                left: MX + 52,
                top: MY - 88,
                padding: "5px 14px",
                borderRadius: 999,
                background: accent,
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 24,
                color: "#FFF",
                direction: "ltr",
                boxShadow: `0 8px 18px rgba(0,0,0,0.5), 0 0 14px ${accentGlow}`,
              }}
            >
              +{arrived}
            </div>
          )}
          {scene.label && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: MY + 66,
                textAlign: "center",
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 30,
                color: "#FFFFFF",
                direction: "rtl",
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              }}
            >
              {scene.label}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
