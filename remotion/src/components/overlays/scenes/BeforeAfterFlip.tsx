/**
 * BeforeAfterFlip — ONE card that flips 180° from its "before" face to its
 * "after" face (the exit-is-a-state-change law as a scene: the transform IS
 * the content). Red-coded before, brand/green-coded after, with a whip
 * flash at the flip moment.
 *
 * NEW TYPE 2026-08-09.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance } from "../motion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, toneColor, toneGlow, type Tone } from "../../../design/tokens";

export interface FlipFace {
  title: string;
  sub_text?: string;
}

export interface BeforeAfterFlipScene {
  type: "before_after_flip";
  id: string;
  start: number;
  end: number;
  before: FlipFace;
  after: FlipFace;
  /** Seconds into the scene when the flip fires. Default 1.2. */
  flip_at_sec?: number;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: BeforeAfterFlipScene;
}

export const BeforeAfterFlip: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone: Tone = scene.tone ?? "brand";
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const entrance = useEntrance({ signature: "depth-pop", durationSec: 0.4 });

  const flipFrame = Math.round((scene.flip_at_sec ?? 1.2) * fps);
  const flipT = interpolate(frame, [flipFrame, flipFrame + Math.round(0.45 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("whip-out"),
  });
  const angle = flipT * 180;
  const showingAfter = angle > 90;
  // Flash at the flip midpoint.
  const midFrame = flipFrame + Math.round(0.22 * fps);
  const flash = frame >= midFrame && frame < midFrame + 2 ? 1 : 0;
  // After-face settle pop.
  const settleT = interpolate(frame, [flipFrame + Math.round(0.45 * fps), flipFrame + Math.round(0.75 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });

  const face = showingAfter ? scene.after : scene.before;
  const faceAccent = showingAfter ? accent : "#C43D3D";
  const faceGlow = showingAfter ? accentGlow : "rgba(196,61,61,0.5)";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...entrance, perspective: 1100 }}>
          <div
            style={{
              width: 520,
              minHeight: 170,
              borderRadius: 26,
              padding: "30px 36px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              direction: "rtl",
              background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
              border: `2px solid ${faceAccent}`,
              boxShadow: `0 24px 55px rgba(0,0,0,0.55), 0 0 ${26 + 10 * settleT}px ${faceGlow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
              // The card flips around Y; the back face content is mirrored
              // back so it reads correctly.
              transform: `rotateY(${angle}deg) scale(${1 + 0.05 * settleT})`,
              transformStyle: "preserve-3d",
            }}
          >
            <div style={{ transform: showingAfter ? "rotateY(180deg)" : undefined, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {/* face tag */}
              <div
                style={{
                  padding: "5px 16px",
                  borderRadius: 999,
                  background: faceAccent,
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#FFF",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
                }}
              >
                {showingAfter ? "אחרי" : "לפני"}
              </div>
              <div
                style={{
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 900,
                  fontSize: 40,
                  textAlign: "center",
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                }}
              >
                {face.title}
              </div>
              {face.sub_text && (
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 600,
                    fontSize: 24,
                    color: "rgba(255,255,255,0.7)",
                    textAlign: "center",
                  }}
                >
                  {face.sub_text}
                </div>
              )}
            </div>
            {/* flip flash */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                background: "#FFFFFF",
                opacity: flash * 0.85,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
