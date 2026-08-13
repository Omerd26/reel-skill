/**
 * LockReveal — the strong unlock metaphor: a padlock SHAKES against its
 * shackle (locked tension), snaps OPEN with a flash, and the secret text
 * pops out from behind it. For "הדרך נפתחת", "הפיצ'ר הנעול", "הסוד".
 *
 * NEW TYPE 2026-08-09. Drawn SVG padlock — no emoji.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface LockRevealScene {
  type: "lock_reveal";
  id: string;
  start: number;
  end: number;
  /** The text revealed when the lock opens. */
  revealed_text: string;
  /** Small label while locked — e.g. "נעול". */
  locked_label?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: LockRevealScene;
}

export const LockReveal: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");

  // Phase 1 (0-1.0s): the lock SHAKES — three tugs, growing amplitude.
  const shakePhase = Math.min(frame / (1.0 * fps), 1);
  const shake =
    shakePhase < 1
      ? Math.sin(frame * 1.15) * 4 * shakePhase * (frame % 20 < 10 ? 1 : 0.3)
      : 0;
  // Phase 2 (1.0s): shackle POPS open + flash.
  const openFrame = Math.round(1.0 * fps);
  const openT = interpolate(frame, [openFrame, openFrame + Math.round(0.25 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
  });
  const flash = frame >= openFrame && frame < openFrame + 2 ? 1 : 0;
  // Phase 3: revealed text pops from behind, lock drifts down+fades.
  const revealT = interpolate(frame, [openFrame + Math.round(0.15 * fps), openFrame + Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });
  const breathe = 0.75 + 0.25 * (0.5 + 0.5 * Math.sin((frame / (2.6 * fps)) * Math.PI * 2));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {/* Padlock */}
          <div
            style={{
              position: "relative",
              transform: `translateX(${shake}px) translateY(${revealT * 26}px) scale(${1 - revealT * 0.35})`,
              opacity: 1 - revealT * 0.55,
              filter: `drop-shadow(0 10px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 ${16 * breathe}px ${accentGlow})`,
            }}
          >
            <svg width="150" height="170" viewBox="0 0 100 115">
              {/* shackle — rotates open around its right hinge */}
              <g transform={`rotate(${-42 * openT} 72 38)`}>
                <path
                  d="M 30 52 L 30 32 A 20 20 0 0 1 70 32 L 70 52"
                  fill="none"
                  stroke="#C9CCD6"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
              </g>
              {/* body */}
              <rect x="18" y="50" width="64" height="52" rx="12" fill="url(#lockbody)" stroke={openT > 0.5 ? accent : "rgba(255,255,255,0.35)"} strokeWidth="2.5" />
              {/* keyhole */}
              <circle cx="50" cy="70" r="7.5" fill={openT > 0.5 ? accent : "#0F1014"} />
              <rect x="46.5" y="74" width="7" height="14" rx="3" fill={openT > 0.5 ? accent : "#0F1014"} />
              <defs>
                <linearGradient id="lockbody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2A2B33" />
                  <stop offset="1" stopColor="#17181E" />
                </linearGradient>
              </defs>
            </svg>
            {/* flash */}
            <div style={{ position: "absolute", inset: -10, background: "#FFF", opacity: flash * 0.8, borderRadius: 24 }} />
            {scene.locked_label && openT < 0.5 && (
              <div
                style={{
                  position: "absolute",
                  bottom: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "rgba(255,255,255,0.75)",
                  direction: "rtl",
                  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                }}
              >
                {scene.locked_label}
              </div>
            )}
          </div>

          {/* Revealed text — free typography, pops from behind the lock */}
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 52,
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.22,
              color: "#FFFFFF",
              direction: "rtl",
              opacity: revealT,
              transform: `translateY(${(1 - revealT) * -30}px) scale(${0.7 + 0.3 * revealT})`,
              textShadow: `0 3px 12px rgba(0,0,0,0.9), 0 0 ${26 * breathe}px ${accentGlow}`,
            }}
          >
            {scene.revealed_text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
