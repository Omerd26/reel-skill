/**
 * Scene transitions — bridges between consecutive overlays.
 *
 * Hyperframes rule: every cut needs a transition element. Hard cuts feel
 * cheap. The transition handles the EXIT of the outgoing scene + the ENTRY
 * of the incoming scene — scene files themselves never animate exits.
 *
 * Three flavors:
 *   - push-slide-up    — outgoing exits up + blur, incoming enters from below
 *                        with matching blur. Velocity-matched at the seam.
 *   - blur-crossfade   — both scenes blur and crossfade. Calm hand-off.
 *   - whip-streak      — bright streak crosses the frame, hides the cut.
 *                        Pair with hard cut on data-start of next scene.
 *
 * These are React components that render on top of consecutive Sequences.
 * The OverlayPreview / EditedReel composition wires them in by computing
 * scene boundaries and inserting the transition for the gap.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, easeFn } from "../../design/tokens";

export type TransitionKind =
  | "push-slide-up"
  | "blur-crossfade"
  | "whip-streak"
  | "none";

export interface TransitionDef {
  kind: TransitionKind;
  /** Local seconds where the transition lives — relative to its host Sequence. */
  durationSec?: number;
}

// ── PushSlideUp ──────────────────────────────────────────────────────────────
//
// Two halves: outgoing exits up (-150y, blur 30, power3.in), incoming enters
// from below (+150y, blur 30, power2.out). Velocity matched at the cut.
//
// Used inside a wrapper Sequence that lasts `durationSec` (default 0.35).

interface PushSlideProps {
  /** What renders on the outgoing side. Caller passes the outgoing scene. */
  outgoing: React.ReactNode;
  /** What renders on the incoming side. */
  incoming: React.ReactNode;
  durationSec?: number;
}

export const PushSlideUp: React.FC<PushSlideProps> = ({
  outgoing,
  incoming,
  durationSec = 0.35,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const halfFrames = totalFrames / 2;

  // Exit progress 0..1 across the first half
  const exitT = interpolate(frame, [0, halfFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-in"),
  });
  // Enter progress 0..1 across the second half
  const enterT = interpolate(frame, [halfFrames * 0.6, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-out"),
  });

  const exitTransform = `translate3d(0, ${(-150 * exitT).toFixed(2)}px, 0)`;
  const exitBlur = `blur(${(30 * exitT).toFixed(2)}px)`;
  const exitOpacity = 1 - exitT;

  const enterTransform = `translate3d(0, ${(150 * (1 - enterT)).toFixed(2)}px, 0)`;
  const enterBlur = `blur(${(30 * (1 - enterT)).toFixed(2)}px)`;
  const enterOpacity = enterT;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          opacity: exitOpacity,
          transform: exitTransform,
          filter: exitBlur,
          willChange: "transform, opacity, filter",
        }}
      >
        {outgoing}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: enterOpacity,
          transform: enterTransform,
          filter: enterBlur,
          willChange: "transform, opacity, filter",
        }}
      >
        {incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── BlurCrossfade ────────────────────────────────────────────────────────────

export const BlurCrossfade: React.FC<PushSlideProps> = ({
  outgoing,
  incoming,
  durationSec = 0.50,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(durationSec * fps));

  const t = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("glide"),
  });

  const exitOpacity = 1 - t;
  const exitBlur = `blur(${(t * 18).toFixed(2)}px)`;
  const exitScale = 1 + t * 0.02;

  const enterOpacity = t;
  const enterBlur = `blur(${((1 - t) * 18).toFixed(2)}px)`;
  const enterScale = 1 - (1 - t) * 0.02;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          opacity: exitOpacity,
          transform: `scale(${exitScale.toFixed(4)})`,
          filter: exitBlur,
          willChange: "transform, opacity, filter",
        }}
      >
        {outgoing}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: enterOpacity,
          transform: `scale(${enterScale.toFixed(4)})`,
          filter: enterBlur,
          willChange: "transform, opacity, filter",
        }}
      >
        {incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── WhipStreak ───────────────────────────────────────────────────────────────
//
// A bright white streak rips across the frame at velocity. Outgoing fades
// during the first half, incoming materializes during the second half. The
// streak's peak brightness hides the cut.

interface WhipProps extends PushSlideProps {
  /** Streak direction. Default "horizontal" (left-to-right). */
  direction?: "horizontal" | "vertical" | "diagonal";
  /** Streak color. Default white. */
  color?: string;
}

export const WhipStreak: React.FC<WhipProps> = ({
  outgoing,
  incoming,
  durationSec = 0.35,
  direction = "horizontal",
  color = "#FFFFFF",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const halfFrames = totalFrames / 2;

  const t = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-in"),
  });

  // Outgoing fades during first half
  const exitOpacity = interpolate(frame, [0, halfFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-in"),
  });
  // Incoming materializes during second half
  const enterOpacity = interpolate(frame, [halfFrames, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-out"),
  });

  // Streak position: starts off-frame, rips across
  const streakProgress = t; // 0..1
  const streakPercent = -100 + streakProgress * 250; // -100% → 150%

  const streakStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
  };

  if (direction === "horizontal") {
    streakStyle.top = "50%";
    streakStyle.left = `${streakPercent}%`;
    streakStyle.width = "60%";
    streakStyle.height = 16;
    streakStyle.transform = "translateY(-50%)";
    streakStyle.background = `linear-gradient(90deg, transparent, ${color}, transparent)`;
    streakStyle.filter = "blur(8px)";
  } else if (direction === "vertical") {
    streakStyle.left = "50%";
    streakStyle.top = `${streakPercent}%`;
    streakStyle.width = 16;
    streakStyle.height = "60%";
    streakStyle.transform = "translateX(-50%)";
    streakStyle.background = `linear-gradient(180deg, transparent, ${color}, transparent)`;
    streakStyle.filter = "blur(8px)";
  } else {
    // diagonal
    streakStyle.top = `${streakPercent}%`;
    streakStyle.left = `${streakPercent}%`;
    streakStyle.width = "70%";
    streakStyle.height = 12;
    streakStyle.transform = "rotate(-30deg)";
    streakStyle.background = `linear-gradient(90deg, transparent, ${color}, transparent)`;
    streakStyle.filter = "blur(10px)";
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ opacity: exitOpacity }}>
        {outgoing}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: enterOpacity }}>
        {incoming}
      </AbsoluteFill>
      <div style={streakStyle} />
    </AbsoluteFill>
  );
};

// ── Dispatcher ───────────────────────────────────────────────────────────────

interface TransitionLayerProps {
  kind: TransitionKind;
  outgoing: React.ReactNode;
  incoming: React.ReactNode;
  durationSec?: number;
}

export const TransitionLayer: React.FC<TransitionLayerProps> = ({
  kind,
  outgoing,
  incoming,
  durationSec,
}) => {
  switch (kind) {
    case "push-slide-up":
      return <PushSlideUp outgoing={outgoing} incoming={incoming} durationSec={durationSec} />;
    case "blur-crossfade":
      return <BlurCrossfade outgoing={outgoing} incoming={incoming} durationSec={durationSec} />;
    case "whip-streak":
      return <WhipStreak outgoing={outgoing} incoming={incoming} durationSec={durationSec} />;
    case "none":
    default:
      return <>{incoming}</>;
  }
};

// ── Standalone whip overlay (for use as a *bridge* effect) ───────────────────
//
// When the next scene is a full-screen takeover that doesn't need a
// 2-side dual transition, fire a standalone whip during the cut. Place
// inside a Sequence whose duration is the streak duration.

export const WhipBridge: React.FC<{
  durationSec?: number;
  color?: string;
  direction?: "horizontal" | "vertical" | "diagonal";
}> = ({ durationSec = 0.35, color = "#FFFFFF", direction = "horizontal" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(durationSec * fps));

  const t = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn("whip-in"),
  });

  const streakPercent = -100 + t * 250;
  const fadeIn = Math.min(1, t * 4);
  const fadeOut = Math.max(0, 1 - (t - 0.7) * 3.33);
  const opacity = Math.min(fadeIn, fadeOut);

  const streakStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    opacity,
  };

  if (direction === "horizontal") {
    streakStyle.top = "50%";
    streakStyle.left = `${streakPercent}%`;
    streakStyle.width = "60%";
    streakStyle.height = 16;
    streakStyle.transform = "translateY(-50%)";
    streakStyle.background = `linear-gradient(90deg, transparent, ${color}, transparent)`;
    streakStyle.filter = "blur(8px)";
  } else if (direction === "vertical") {
    streakStyle.left = "50%";
    streakStyle.top = `${streakPercent}%`;
    streakStyle.width = 16;
    streakStyle.height = "60%";
    streakStyle.transform = "translateX(-50%)";
    streakStyle.background = `linear-gradient(180deg, transparent, ${color}, transparent)`;
    streakStyle.filter = "blur(8px)";
  } else {
    streakStyle.top = `${streakPercent}%`;
    streakStyle.left = `${streakPercent}%`;
    streakStyle.width = "70%";
    streakStyle.height = 12;
    streakStyle.transform = "rotate(-30deg)";
    streakStyle.background = `linear-gradient(90deg, transparent, ${color}, transparent)`;
    streakStyle.filter = "blur(10px)";
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={streakStyle} />
    </AbsoluteFill>
  );
};

// Avoid unused-import warning when callers only pull TransitionLayer.
export const _COLOR_REF = COLORS.text;
