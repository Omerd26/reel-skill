/**
 * SeamTreatment — feathered edge between the talking head and the overlay
 * panel area.
 *
 * From may-shorts-19: when the face is in BOTTOM mode (occupying the bottom
 * half of the frame) and an overlay panel covers the top half, the y=960
 * boundary creates a razor-sharp horizontal cut that reads as "AI-edited."
 * The treatment feathers that edge with a small gradient band + a 2px accent
 * scan line.
 *
 * Drawn AFTER the face wrapper but BEFORE the overlay scenes. When a scene
 * is full-screen takeover (no face visible), the scene panel covers the seam
 * and the treatment is hidden by stacking order.
 *
 * Currently un-wired in EditedReel — placeholder for the Phase B integration
 * when face-mode choreography ships.
 */
import React from "react";
import { COLORS } from "../../design/tokens";

interface SeamTreatmentProps {
  /** Y coordinate where the seam lives. Default 960 (BOTTOM mode in 1080×1920). */
  y?: number;
  /** Color to tint the gradient toward. Default canvas bg. */
  bg?: string;
  /** Accent color for the scan line. Default brand. */
  accent?: string;
  /** Show? (Hide during full-screen scenes via parent.) */
  show?: boolean;
}

export const SeamTreatment: React.FC<SeamTreatmentProps> = ({
  y = 960,
  bg = COLORS.bg,
  accent = COLORS.accentBrand,
  show = true,
}) => {
  if (!show) return null;
  return (
    <>
      {/* Gradient band — 80px tall, centered on the seam */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: y - 40,
          left: 0,
          right: 0,
          height: 80,
          background: `linear-gradient(to bottom, ${bg} 0%, transparent 50%, ${bg} 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Accent scan line — 2px with soft glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: y,
          left: 0,
          right: 0,
          height: 2,
          background: accent,
          opacity: 0.72,
          boxShadow: `0 0 14px ${accent}`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
