/**
 * TrackedObject — an element GLUED to a moving body part (owner 2026-08-11:
 * "למקם אובייקטים על אצבע / ראש / יד — שיזוזו יחד איתה").
 *
 * The pipeline's body_tracker extracts named anchor tracks (index_finger_tip,
 * head_top, palm_right/left, wrist_right/left) from the actual video; this
 * component samples the track at the current frame (linear interpolation
 * between ~15fps samples — the server pre-smooths jitter) and renders one of
 * three element kinds at that position:
 *
 *   "logo"  — a bare brand mark (the BrandChip look) riding the anchor
 *   "label" — free SHOUT typography riding the anchor
 *   "ring"  — a pulsing focus ring around the anchor (pure highlight)
 *
 * Fades in/out with track visibility — the object never teleports or
 * lingers after the hand leaves the frame.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeFn } from "../../../design/tokens";

export interface TrackPoint {
  t: number;
  x: number;
  y: number;
  v: 0 | 1;
}

export interface BodyTrack {
  points: TrackPoint[];
  stable_windows: [number, number][];
}

export interface TrackedObjectScene {
  type: "tracked_object";
  id: string;
  start: number;
  end: number;
  /** Anchor name — must exist in editing_plan.body_tracks.anchors. */
  track_anchor: string;
  /** What rides the anchor. */
  element: "logo" | "label" | "ring";
  /** For element="label": the text. */
  text?: string;
  /** For element="logo": absolute https URL (brand_assets pattern). */
  logo_url?: string;
  /** Brand hex for glow/ring. */
  brand_hex?: string;
  /** Pixel offset from the anchor (e.g. lift a logo above a fingertip). */
  offset_x?: number;
  offset_y?: number;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: TrackedObjectScene;
  /** The full track for scene.track_anchor (EditedReel passes it down). */
  track?: BodyTrack;
  /** Scene-local frame 0 = scene.start on the master timeline. */
}

const hexToRgb = (hex?: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "224,112,30";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/** Sample the track at absolute time t (linear between samples). */
const sampleTrack = (track: BodyTrack, t: number): { x: number; y: number; v: number } => {
  const pts = track.points;
  if (!pts.length) return { x: 0.5, y: 0.5, v: 0 };
  if (t <= pts[0].t) return { ...pts[0] };
  if (t >= pts[pts.length - 1].t) return { ...pts[pts.length - 1] };
  // Binary search for the surrounding pair.
  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = pts[lo];
  const b = pts[hi];
  if (!a.v || !b.v) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: 0 };
  const f = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, v: 1 };
};

export const TrackedObject: React.FC<Props> = ({ scene, track }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const rgb = hexToRgb(scene.brand_hex);

  if (!track || !track.points.length) return null;

  // Scene-local frame → master-timeline seconds.
  const t = scene.start + frame / fps;
  const pos = sampleTrack(track, t);

  // Visibility envelope: fade in 0.25s, fade out on track loss or scene end.
  const sceneDur = scene.end - scene.start;
  const local = frame / fps;
  const inT = interpolate(local, [0, 0.25], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });
  const outT = interpolate(local, [sceneDur - 0.25, sceneDur], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const visT = pos.v ? 1 : 0.0;
  const opacity = Math.min(inT, outT) * visT;
  if (opacity <= 0.01) return null;

  const px = pos.x * width + (scene.offset_x ?? 0);
  const py = pos.y * height + (scene.offset_y ?? 0);
  const breathe = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin((frame / (1.8 * fps)) * Math.PI * 2));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * inT})`,
          opacity,
        }}
      >
        {scene.element === "ring" && (
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              border: `5px solid rgba(${rgb},0.95)`,
              boxShadow: `0 0 ${26 * breathe}px rgba(${rgb},0.6), inset 0 0 18px rgba(${rgb},0.25)`,
              transform: `scale(${breathe})`,
            }}
          />
        )}
        {scene.element === "logo" && scene.logo_url && (
          <div style={{ position: "relative", width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                position: "absolute",
                inset: -40,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(${rgb},${(0.35 * breathe).toFixed(3)}) 0%, transparent 65%)`,
              }}
            />
            <Img
              src={scene.logo_url}
              style={{
                width: 92,
                height: 92,
                objectFit: "contain",
                filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.55)) drop-shadow(0 0 18px rgba(${rgb},0.45))`,
              }}
              pauseWhenLoading
            />
          </div>
        )}
        {scene.element === "label" && scene.text && (
          <div
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 38,
              whiteSpace: "nowrap",
              color: "#FFFFFF",
              direction: "rtl",
              textShadow: `0 2px 10px rgba(0,0,0,0.9), 0 0 22px rgba(${rgb},0.55)`,
            }}
          >
            {scene.text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
