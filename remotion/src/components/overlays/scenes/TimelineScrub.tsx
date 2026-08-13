/**
 * TimelineScrub — the editing-meta scene: a mini video timeline with clips,
 * a playhead SCRUBS across, a bad chunk gets marked red and POPS OUT
 * (cut!), the remaining clips snap together. "חותכים את החלק המשעמם" made
 * visible — DrEdit's own story.
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface TimelineScrubScene {
  type: "timeline_scrub";
  id: string;
  start: number;
  end: number;
  /** Label above — e.g. "העריכה קורית לבד". */
  headline?: string;
  /** Chip label on the removed chunk — e.g. "משעמם". */
  cut_label?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: TimelineScrubScene;
}

export const TimelineScrub: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const entrance = useEntrance({ signature: "glass-rise", durationSec: 0.4 });

  const W = 600;
  const TRACK_W = 544;
  // Clip layout: [good 34%][bad 22%][good 44%]
  const seg1 = 0.34, seg2 = 0.22;

  // Phase 1: playhead scrubs 0.3-1.2s.
  const scrubT = interpolate(frame, [Math.round(0.3 * fps), Math.round(1.2 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
  });
  // Phase 2: bad chunk flagged red while playhead crosses it.
  const inBad = scrubT > seg1 && scrubT < seg1 + seg2;
  const flagged = scrubT >= seg1 + seg2 * 0.4;
  const badPulse = flagged ? 0.5 + 0.5 * Math.sin((frame / (0.5 * fps)) * Math.PI * 2) : 0;
  // Phase 3: at 1.5s the chunk pops OUT and the sides SNAP together.
  const cutFrame = Math.round(1.5 * fps);
  const popT = interpolate(frame, [cutFrame, cutFrame + Math.round(0.3 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out"),
  });
  const snapT = interpolate(frame, [cutFrame + Math.round(0.22 * fps), cutFrame + Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm"),
  });
  // 1-frame jolt on the snap.
  const snapDone = cutFrame + Math.round(0.4 * fps);
  const jolt = frame >= snapDone && frame < snapDone + 2 ? 3 : 0;

  const CLIP_H = 74;
  const seg3Shift = snapT * (TRACK_W * seg2); // right block slides left into the gap

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            ...entrance,
            width: W,
            borderRadius: 24,
            padding: "22px 28px 26px",
            direction: "rtl",
            background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)",
            transform: `translateY(${jolt}px)`,
          }}
        >
          {scene.headline && (
            <div
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 30,
                color: "#FFFFFF",
                marginBottom: 16,
              }}
            >
              {scene.headline}
            </div>
          )}
          <div style={{ position: "relative", height: CLIP_H + 46, direction: "ltr" }}>
            {/* clip 1 */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 20,
                width: TRACK_W * seg1 - 3,
                height: CLIP_H,
                borderRadius: 12,
                background: `repeating-linear-gradient(90deg, #2A2B35 0 18px, #24252E 18px 36px)`,
                border: `2px solid ${accent}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12)`,
              }}
            />
            {/* bad chunk — flags red, then POPS out upward */}
            <div
              style={{
                position: "absolute",
                left: TRACK_W * seg1 + 3,
                top: 20,
                width: TRACK_W * seg2 - 6,
                height: CLIP_H,
                borderRadius: 12,
                background: flagged
                  ? `rgba(196,61,61,${0.55 + 0.25 * badPulse})`
                  : "repeating-linear-gradient(90deg, #2A2B35 0 18px, #24252E 18px 36px)",
                border: `2px solid ${flagged ? "#E05B5B" : "rgba(255,255,255,0.2)"}`,
                opacity: 1 - popT,
                transform: `translateY(${popT * -70}px) rotate(${popT * -7}deg) scale(${1 - popT * 0.2})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {scene.cut_label && flagged && (
                <span
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 900,
                    fontSize: 22,
                    color: "#FFF",
                    direction: "rtl",
                    textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                  }}
                >
                  {scene.cut_label}
                </span>
              )}
            </div>
            {/* clip 3 — snaps left into the gap after the cut */}
            <div
              style={{
                position: "absolute",
                left: TRACK_W * (seg1 + seg2) + 3 - seg3Shift,
                top: 20,
                width: TRACK_W * (1 - seg1 - seg2) - 3,
                height: CLIP_H,
                borderRadius: 12,
                background: `repeating-linear-gradient(90deg, #2A2B35 0 18px, #24252E 18px 36px)`,
                border: `2px solid ${accent}`,
                boxShadow: snapT > 0.9 ? `0 0 18px ${accentGlow}` : "inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            />
            {/* playhead */}
            <div
              style={{
                position: "absolute",
                left: scrubT * TRACK_W - 2,
                top: 6,
                width: 4,
                height: CLIP_H + 28,
                borderRadius: 2,
                background: inBad ? "#E05B5B" : "#FFFFFF",
                boxShadow: `0 0 12px ${inBad ? "rgba(224,91,91,0.8)" : "rgba(255,255,255,0.6)"}`,
                opacity: popT > 0.5 ? 0 : 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: -7,
                  width: 18,
                  height: 14,
                  borderRadius: 4,
                  background: inBad ? "#E05B5B" : "#FFFFFF",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
