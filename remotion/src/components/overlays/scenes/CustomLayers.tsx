import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// CustomLayers — a one-off scene described entirely by data.
//
// For requests no catalog scene covers ("put the number 3 here next to me",
// an opening animation, a logo the user sent) WITHOUT touching core
// components: Claude writes layers with pixel positions on the 1080×1920
// canvas (read off the coordinate grid in the understanding/QA contact
// sheets), each with its own entrance, exit and loop. Works as an overlay
// (speaker visible) or, with `background` / in broll_scenes, as a full screen.
// Frame-driven only (interpolate/spring) — no CSS transitions, no WebGL.
// Schema is enforced by scripts/reelkit/validate.py; docs/SCENES.md documents it.
// ─────────────────────────────────────────────────────────────────────────────

export type LayerEnter =
  | "none" | "fade" | "pop" | "slide-up" | "slide-down" | "slide-left" | "slide-right"
  | "draw" | "type" | "wipe";

export interface CustomLayer {
  kind: "text" | "image" | "video" | "shape";
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** "top-left" (default): x,y is the box corner. "center": x,y is the box centre. */
  origin?: "top-left" | "center";
  enter?: LayerEnter;
  /** Seconds from scene start. */
  enter_at?: number;
  enter_duration?: number;
  /** Seconds from scene start; default = scene end. */
  exit_at?: number;
  exit?: "fade" | "none";
  loop?: "none" | "pulse" | "float" | "spin";
  opacity?: number;
  rotate?: number;
  // text
  text?: string;
  size?: number;
  weight?: number;
  color?: string;
  stroke?: number;
  stroke_color?: string;
  align?: "right" | "center" | "left";
  plate?: string | null;
  plate_radius?: number;
  padding?: number;
  line_height?: number;
  // image / video
  src?: string;
  fit?: "cover" | "contain";
  radius?: number;
  start_from?: number;
  // shape
  shape?: "rect" | "circle" | "line" | "arrow" | "underline";
  fill?: string | null;
  stroke_width?: number;
  x2?: number;
  y2?: number;
}

export interface CustomLayersScene {
  id: string;
  type: "custom_layers";
  start: number;
  end: number;
  background?: string | null;
  fullscreen?: boolean;
  layers: CustomLayer[];
}

const src = (s?: string) => (!s ? "" : /^(https?:|data:)/.test(s) ? s : staticFile(s));

const LayerView: React.FC<{ layer: CustomLayer; sceneFrames: number }> = ({ layer, sceneFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enterAt = layer.enter_at ?? 0;
  const enterDur = Math.max(0.05, layer.enter_duration ?? (layer.enter === "type" ? 0.9 : 0.45));
  const exitAt = layer.exit_at ?? sceneFrames / fps;
  const exitDur = layer.exit === "none" ? 0 : 0.25;
  if (t < enterAt || t >= exitAt) return null;

  const p = interpolate(t, [enterAt, enterAt + enterDur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const out = exitDur
    ? interpolate(t, [exitAt - exitDur, exitAt], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const enter = layer.enter ?? "fade";
  let opacity = (layer.opacity ?? 1) * out;
  let tx = 0, ty = 0, scale = 1, clip: string | undefined;
  switch (enter) {
    case "none": break;
    case "fade": opacity *= p; break;
    case "pop": {
      const sp = spring({ frame: frame - Math.round(enterAt * fps), fps, config: { damping: 11, stiffness: 170, mass: 0.6 } });
      scale = interpolate(sp, [0, 1], [0.55, 1]);
      opacity *= Math.min(1, p * 2);
      break;
    }
    case "slide-up": ty = (1 - p) * 70; opacity *= p; break;
    case "slide-down": ty = -(1 - p) * 70; opacity *= p; break;
    case "slide-left": tx = (1 - p) * 90; opacity *= p; break;
    case "slide-right": tx = -(1 - p) * 90; opacity *= p; break;
    // RTL reveal: uncover from the right edge towards the left
    case "wipe": case "draw": clip = `inset(0 0 0 ${((1 - p) * 100).toFixed(2)}%)`; break;
    case "type": break;
  }
  const lt = t - enterAt;
  if (layer.loop === "pulse") scale *= 1 + 0.035 * Math.sin(lt * Math.PI * 2 * 0.9);
  if (layer.loop === "float") ty += 8 * Math.sin(lt * Math.PI * 2 * 0.5);
  const rotate = (layer.rotate ?? 0) + (layer.loop === "spin" ? lt * 90 : 0);

  const w = layer.w, h = layer.h;
  const left = layer.origin === "center" && w ? layer.x - w / 2 : layer.x;
  const top = layer.origin === "center" && h ? layer.y - h / 2 : layer.y;
  const box: React.CSSProperties = {
    position: "absolute", left, top, width: w, height: h, opacity,
    transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`,
    transformOrigin: "center center", clipPath: enter === "draw" && layer.kind === "shape" ? undefined : clip,
  };

  if (layer.kind === "text") {
    const full = layer.text ?? "";
    const shown = enter === "type" ? full.slice(0, Math.ceil(full.length * p)) : full;
    return (
      <div
        style={{
          ...box,
          display: "flex",
          justifyContent: layer.align === "right" ? "flex-end" : layer.align === "left" ? "flex-start" : "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: layer.weight ?? 900,
            fontSize: layer.size ?? 72,
            lineHeight: layer.line_height ?? 1.1,
            color: layer.color ?? "#FFFFFF",
            textAlign: layer.align ?? "center",
            unicodeBidi: "plaintext",
            direction: /^[^֐-׿]*[A-Za-z]/.test(full) ? "ltr" : "rtl",
            WebkitTextStroke: layer.stroke ? `${layer.stroke}px ${layer.stroke_color ?? "#000"}` : undefined,
            paintOrder: "stroke fill",
            textShadow: layer.plate ? undefined : "0 3px 14px rgba(0,0,0,0.55)",
            background: layer.plate ?? undefined,
            borderRadius: layer.plate ? (layer.plate_radius ?? 22) : undefined,
            padding: layer.plate ? (layer.padding ?? 18) : undefined,
            whiteSpace: "pre-wrap",
          }}
        >
          {shown}
        </div>
      </div>
    );
  }
  if (layer.kind === "image") {
    return (
      <div style={{ ...box, overflow: "hidden", borderRadius: layer.radius ?? 0 }}>
        <Img src={src(layer.src)} style={{ width: "100%", height: "100%", objectFit: layer.fit ?? "contain" }} />
      </div>
    );
  }
  if (layer.kind === "video") {
    return (
      <div style={{ ...box, overflow: "hidden", borderRadius: layer.radius ?? 0 }}>
        <OffthreadVideo
          src={src(layer.src)}
          muted
          startFrom={Math.round((layer.start_from ?? 0) * fps)}
          style={{ width: "100%", height: "100%", objectFit: layer.fit ?? "cover" }}
        />
      </div>
    );
  }
  // shape
  const color = layer.color ?? "#E0701E";
  const sw = layer.stroke_width ?? 8;
  const dash = enter === "draw" ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p } : {};
  if (layer.shape === "line" || layer.shape === "arrow") {
    const x2 = layer.x2 ?? layer.x + (w ?? 200), y2 = layer.y2 ?? layer.y;
    const ang = Math.atan2(y2 - layer.y, x2 - layer.x);
    const head = 34;
    const hx1 = x2 - head * Math.cos(ang - 0.5), hy1 = y2 - head * Math.sin(ang - 0.5);
    const hx2 = x2 - head * Math.cos(ang + 0.5), hy2 = y2 - head * Math.sin(ang + 0.5);
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity }}>
        <path d={`M ${layer.x} ${layer.y} L ${x2} ${y2}`} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" {...dash} />
        {layer.shape === "arrow" && p > 0.85 && (
          <path d={`M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </svg>
    );
  }
  const bw = w ?? 200, bh = h ?? (layer.shape === "underline" ? 20 : 200);
  return (
    <svg width={bw + sw * 2} height={bh + sw * 2} style={{ ...box, width: bw + sw * 2, height: bh + sw * 2, left: left - sw, top: top - sw }}>
      {layer.shape === "circle" ? (
        <ellipse cx={bw / 2 + sw} cy={bh / 2 + sw} rx={bw / 2} ry={bh / 2} stroke={color} strokeWidth={sw} fill={layer.fill ?? "none"} {...dash} />
      ) : layer.shape === "underline" ? (
        <path d={`M ${bw + sw} ${bh / 2 + sw} L ${sw} ${bh / 2 + sw}`} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" {...dash} />
      ) : (
        <rect x={sw} y={sw} width={bw} height={bh} rx={layer.radius ?? 24} stroke={color} strokeWidth={sw} fill={layer.fill ?? "none"} {...dash} />
      )}
    </svg>
  );
};

export const CustomLayers: React.FC<{ scene: CustomLayersScene }> = ({ scene }) => {
  const { fps } = useVideoConfig();
  const sceneFrames = Math.max(1, Math.round((scene.end - scene.start) * fps));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {scene.background && <AbsoluteFill style={{ background: scene.background }} />}
      {(scene.layers || []).map((layer, i) => (
        <LayerView key={i} layer={layer} sceneFrames={sceneFrames} />
      ))}
    </AbsoluteFill>
  );
};
