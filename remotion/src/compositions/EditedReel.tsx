import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions, WordTimestamp, type CaptionGroup } from "../components/Captions";
import { EffectLayer, AnyEffect } from "../components/EffectLayer";
import { BRollOverlay, BRollSceneData } from "../components/BRollOverlay";
import { OverlayLayer } from "../components/overlays/OverlayLayer";
import { TrackedObject, type TrackedObjectScene, type BodyTrack } from "../components/overlays/scenes/TrackedObject";
import type { AnyOverlayScene } from "../components/overlays/types";
import { speakerZoomScale, type SpeakerZoom } from "../components/speakerZoom";
import { HookText, type HookVariant } from "../components/HookText";

// ── Music ducking ────────────────────────────────────────────────────────────
// Per-frame volume for the background music bed: near-silent UNDER speech, and
// rising to a pleasant level only in the quiet gaps (owner: the music should be
// a nice sound while the speaker isn't talking, never come in over the words).
// Driven by the word timestamps, with smooth ramps so the bed never pumps.
// Kept identical to the copy in leo-studio/lib/remotion-shared/PreviewReel.tsx.
export function buildDuckVolume(
  words: WordTimestamp[] | undefined,
  fps: number,
  gapVol: number,
): (frame: number) => number {
  const HIGH = gapVol;          // level in the quiet gaps
  const LOW = gapVol * 0.28;    // ducked level under speech
  const PAD = 0.12;             // seconds treated as speech around each word
  const RAMP = 0.4;             // seconds to fade between the two levels
  const JOIN = 0.3;             // merge speech spans across gaps shorter than this

  const spans: Array<[number, number]> = [];
  if (words && words.length) {
    let s = words[0].start - PAD;
    let e = words[0].end + PAD;
    for (let i = 1; i < words.length; i++) {
      const ws = words[i].start - PAD;
      const we = words[i].end + PAD;
      if (ws - e < JOIN) { e = Math.max(e, we); }
      else { spans.push([s, e]); s = ws; e = we; }
    }
    spans.push([s, e]);
  }

  return (frame: number) => {
    if (!spans.length) return HIGH;
    const t = frame / fps;
    let prevEnd = 0;
    let nextStart = Infinity;
    for (const [a, b] of spans) {
      if (t >= a && t <= b) return LOW;            // inside speech → ducked
      if (b <= t && b > prevEnd) prevEnd = b;
      if (a >= t && a < nextStart) nextStart = a;
    }
    const k = Math.min(t - prevEnd, nextStart - t, RAMP) / RAMP;
    return LOW + (HIGH - LOW) * Math.max(0, Math.min(1, k));
  };
}

// ── Types ──────────────────────────────────────────────────────────────────

interface SFXPlacement {
  timestamp_s: number;
  decision: "place" | "skip";
  file_path: string;         // e.g. "UI/ui sound 4.mp3"
  editorial_role: string;
  pre_lead_s: number;
  volume: {
    gain: number;            // 0.0–1.0
    fade_in_s: number;
    fade_out_s: number;
    duck_under_speech: boolean;
    duck_amount_db: number;
  };
}

interface EditingPlan {
  effects?:         AnyEffect[];
  broll_scenes?:    BRollSceneData[];
  // Premium motion-graphics overlays (glass cards, kinetic headlines, etc.).
  // Sit ON TOP of the talking head but UNDER B-roll takeovers, hence Layer 1.5
  // in the z-order below. Orchestrator drops scenes that collide with B-roll
  // windows, and suppresses Freepik icon_points overlapping these windows.
  overlay_scenes?:  AnyOverlayScene[];
  sfx_placements?:  SFXPlacement[];
  // Subtle speaker push-ins (~1 every 10s, peak 1.05×, slow ease in/out).
  // Generated server-side by pipeline_orchestrator._plan_speaker_zooms and
  // applied to the source-video layer ONLY (overlays + captions + B-roll
  // stay at full size). Same data structure consumed by PreviewVideoPane
  // in leo-studio so the live preview matches the rendered MP4.
  speaker_zooms?:   SpeakerZoom[];
  [key: string]:    unknown;
}

export interface EditedReelProps {
  video_path:        string;
  words:             WordTimestamp[];
  duration_seconds:  number;
  editing_plan:      EditingPlan;
  captions_style:    "tiktok" | "classic" | "highlight" | "white_card" | "cinematic" | "none";
  fps:               number;
  brand_color:       string;
  instagram_handle:  string;
  gradient_overlay?: boolean;
  /** Vertical caption shift in px (positive = lower). Default 0. */
  caption_offset?:   number;
  /** Optional background music bed, mood-selected server-side. Null/absent =
   *  no music. `src` is a staticFile path under public/ (e.g.
   *  "music/upbeat/track.mp3"); `volume` is the low bed level (default 0.13). */
  music?:            { src: string; volume?: number } | null;
  /** Written hook shown in the first ~3s (top-third, big Heebo Black). Null/
   *  absent = no hook. `highlight` is one word inside `text` to accent in the
   *  brand colour; `variant` picks the visual treatment. */
  hook?:             {
    text: string; highlight?: string; variant?: HookVariant;
    /** Legacy alias of `variant` (older docs said "style"). */
    style?: HookVariant;
    /** Seconds on the edited timeline. Default 0 → 3. */
    start?: number; end?: number;
  } | null;
  /** Exact output length in frames (preferred over duration_seconds). */
  duration_frames?:  number;
  /** Caption groups planned outside the renderer (work/captions.json). When
   *  present the renderer shows exactly these groups and never regroups. */
  caption_groups?:   CaptionGroup[];
  /** Burn a tasteful DrEdit watermark into this render (guest / free tier).
   *  RENDER-TIME only — a clean re-render of the same cached plan passes
   *  `false` to strip it. Default false = clean owner / paid render. */
  watermark?:        boolean;
}

// ── Main composition ────────────────────────────────────────────────────────
//
// 4-layer model:
//   Layer 1   (bottom): Source video + SVG icon overlays (icon_point)
//   Layer 1.5 (mid):    Overlay motion graphics (glass cards / kinetic text)
//   Layer 2   (mid+):   B-Roll scenes (full-screen, hides video when active)
//   Layer 3   (top):    Captions / subtitles (always visible)
//

/**
 * SFXAudio — renders a single sound effect with volume and fade controls.
 * Placed inside a <Sequence> that handles timing.
 */
const SFXAudio: React.FC<{ sfx: SFXPlacement }> = ({ sfx }) => {
  const frame = useCurrentFrame();
  const { fps: cfgFps } = useVideoConfig();

  const gain = sfx.volume?.gain ?? 0.5;
  const fadeIn = (sfx.volume?.fade_in_s ?? 0) * cfgFps;
  const fadeOut = (sfx.volume?.fade_out_s ?? 0.3) * cfgFps;

  // Simple volume envelope: fade in → hold → fade out
  const vol = interpolate(
    frame,
    [0, Math.max(1, fadeIn), Math.max(fadeIn + 1, cfgFps * 3), Math.max(fadeIn + 2, cfgFps * 3 + fadeOut)],
    [0, gain, gain, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const src = staticFile(`sfx/${sfx.file_path}`);

  return <Audio src={src} volume={vol} />;
};

/**
 * SpeakerZoomLayer — wraps the source <OffthreadVideo> and applies a frame-
 * driven CSS scale based on the planned `speaker_zooms` array. Overflow is
 * hidden on the wrapper so the slight push-in doesn't bleed past the
 * 1080×1920 frame.
 *
 * Stays in lockstep with the browser preview's zoom logic by sharing the
 * same `speakerZoomScale` util — there's no separate render-side curve.
 */
const SpeakerZoomLayer: React.FC<{
  zooms: SpeakerZoom[] | undefined;
  fps: number;
  children: React.ReactNode;
}> = ({ zooms, fps, children }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const scale = speakerZoomScale(t, zooms);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// GL-safe punch-cut on B-Roll enter: a subtle scale-settle (1.03→1.0 over the
// first ~5 frames). Pure CSS transform — no WebGL — so it can't crash the
// software-GL (swiftshader) compositor the way the reverted @remotion/light-leaks
// transition did. Adds a snappy "cut-in" rhythm at each B-Roll scene boundary,
// which is what makes short-form pacing read as edited rather than static.
const BRollCutIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 5], [1.03, 1.0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      {children}
    </AbsoluteFill>
  );
};

// Watermark — GL-SAFE branded mark for guest / free renders. Gated by the
// `watermark` prop (render-time only); a clean re-render of the SAME cached
// plan passes watermark=false to strip it (that's why watermark is a render
// prop, not baked into the plan).
//
// Constraint: NO WebGL. The Linux render box runs software-GL (swiftshader),
// which crashed the reverted @remotion/light-leaks transition. Everything here
// is pure DOM/CSS + inline SVG (both CPU-rasterized) + opacity — same GL-safe
// discipline as BRollCutIn / HookText, so it can't take down the compositor.
//
// Two crop-resistant layers so the mark survives cropping any corner:
//   A. a very faint (~6%) full-frame diagonal "DrEdit" SVG tile, and
//   B. a tasteful bottom-center pill (brand-tinted play glyph + "DrEdit"
//      wordmark in bundled Heebo Black) — clearly branded and "worth removing"
//      without covering the content.
// Sits at full 1080×1920; static (no per-frame animation) so it's render-cheap.
const Watermark: React.FC<{ brandColor: string }> = ({ brandColor }) => {
  const TILE = 300; // px between repeated wordmarks in the diagonal field
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Layer A — faint diagonal repeat (crop-resistant). SVG <pattern> tiles
          the whole frame at a fixed scale; SVG text is CPU-rasterized (no WebGL). */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, opacity: 0.06 }}
      >
        <defs>
          <pattern
            id="dredit-wm-tile"
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-28)"
          >
            <text
              x={TILE / 2}
              y={TILE / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'Heebo', sans-serif"
              fontWeight={900}
              fontSize={34}
              letterSpacing={1}
              fill="#ffffff"
            >
              DrEdit
            </text>
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#dredit-wm-tile)" />
      </svg>

      {/* Layer B — bottom-center brand pill. Low on the frame + low opacity so
          it reads as a watermark, never blocks the content or the captions. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 46,
          display: "flex",
          justifyContent: "center",
          opacity: 0.72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 22px",
            borderRadius: 999,
            background: "rgba(12,12,16,0.42)",
            border: "1.5px solid rgba(255,255,255,0.22)",
            boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
          }}
        >
          {/* Mascot glyph — rounded brand-tinted badge + play mark (video/reel).
              Pure inline SVG so no raster asset ships; the available logo PNGs
              have opaque backgrounds unsuitable for a small unobtrusive mark. */}
          <svg width={34} height={34} viewBox="0 0 34 34" style={{ display: "block" }}>
            <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={brandColor} />
            <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
          </svg>
          <span
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: "0.3px",
              color: "#ffffff",
              lineHeight: 1,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            DrEdit
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EditedReel: React.FC<EditedReelProps> = ({
  video_path,
  words,
  editing_plan,
  captions_style,
  fps,
  brand_color,
  gradient_overlay = false,
  caption_offset = 0,
  music = null,
  hook = null,
  watermark = false,
  caption_groups,
}) => {
  const { durationInFrames } = useVideoConfig();
  const duckVolume = music?.src ? buildDuckVolume(words, fps, music.volume ?? 0.11) : null;
  const effects       = editing_plan?.effects || [];
  const brollScenes   = (editing_plan?.broll_scenes || []) as BRollSceneData[];
  const overlayScenes = (editing_plan?.overlay_scenes || []) as AnyOverlayScene[];
  // Motion-attached objects (owner 2026-08-11): anchor tracks extracted by
  // the pipeline's body_tracker ride alongside the plan; tracked_object
  // scenes get their track injected here (OverlayLayer stays track-blind).
  const bodyTracks = ((editing_plan as Record<string, unknown> | undefined)?.body_tracks as
    { anchors?: Record<string, BodyTrack> } | undefined)?.anchors || {};
  const videoSrc      = video_path.startsWith("http") ? video_path : staticFile(video_path);

  // Caption mute windows — playbook §4.1: ZERO captions during full-frame
  // B-roll ("the UI is the text"). Mirrors the exact frame math of the B-roll
  // <Sequence>s below (Math.round + the 1s minimum duration) so captions are
  // silent for precisely the frames a takeover is on screen. Kept identical
  // to leo-studio/lib/remotion-shared/PreviewReel.tsx so preview == export.
  const captionMuteWindows = brollScenes.map((scene) => {
    const startFrame     = Math.round(scene.start * fps);
    const durationFrames = Math.max(fps, Math.round((scene.end - scene.start) * fps));
    return { start: startFrame / fps, end: (startFrame + durationFrames) / fps };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>

      {/* ═══ AUDIO: background music bed ═══ mood-selected. Volume is DUCKED
          per-frame — near-silent under the speaker's voice, rising to a
          pleasant level only in the quiet gaps — so it never fights the words.
          Loops if shorter than the video. No Sequence → plays the whole comp. */}
      {music?.src && (
        <Audio
          src={staticFile(music.src)}
          volume={(f: number) => {
            // intentional ending: the bed fades out over the last 0.6s instead of being cut
            const tailFade = interpolate(f, [durationInFrames - Math.round(fps * 0.6), durationInFrames - 1], [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (duckVolume ? duckVolume(f) : 0) * tailFade;
          }}
          loop
        />
      )}

      {/* ═══ LAYER 1: Source video + icon overlays ═══
          Wrapped in a SpeakerZoomLayer that applies the gentle 1.05× pushes
          to the video element ONLY. Overlays / captions / B-roll all sit
          outside this wrapper so the speaker zooms while everything else
          stays put — same behavior the browser preview pane uses. */}
      <SpeakerZoomLayer zooms={editing_plan?.speaker_zooms} fps={fps}>
        <OffthreadVideo
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </SpeakerZoomLayer>

      {/* Optional gradient overlay for caption readability */}
      {gradient_overlay && (
        <AbsoluteFill
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 28%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* SVG support icons (icon_point effects) — on top of video */}
      {effects.map((effect, i) => {
        const startFrame     = Math.round(effect.start * fps);
        const durationFrames = Math.max(fps, Math.round((effect.end - effect.start) * fps));
        return (
          <Sequence
            key={`effect-${i}`}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <EffectLayer effect={effect} />
          </Sequence>
        );
      })}

      {/* ═══ LAYER 1.5: Overlay motion graphics ═══
          Glass cards, kinetic headlines, comparison boards. Z-order works
          via JSX source order — Layer 1.5 sits above video+icons but below
          full-screen B-roll. Orchestrator already filtered scenes that
          collided with B-roll windows, so we just render whatever is here. */}
      {overlayScenes.map((scene, i) => {
        const startFrame     = Math.round(scene.start * fps);
        const durationFrames = Math.max(fps, Math.round((scene.end - scene.start) * fps));
        const isTracked = (scene as { type?: string }).type === "tracked_object";
        return (
          <Sequence
            key={`overlay-${scene.id ?? i}`}
            from={startFrame}
            durationInFrames={durationFrames}
            layout="none"
          >
            {isTracked ? (
              <TrackedObject
                scene={scene as unknown as TrackedObjectScene}
                track={bodyTracks[(scene as unknown as TrackedObjectScene).track_anchor]}
              />
            ) : (
              <OverlayLayer scene={scene} />
            )}
          </Sequence>
        );
      })}

      {/* ═══ LAYER 2: B-Roll scenes (full-screen overlay) ═══ */}
      {brollScenes.map((scene, i) => {
        const startFrame     = Math.round(scene.start * fps);
        const durationFrames = Math.max(fps, Math.round((scene.end - scene.start) * fps));
        return (
          <Sequence
            key={`broll-${i}`}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            {/* Punch-cut enter via BRollCutIn (pure transform, GL-safe). This
                replaced the reverted @remotion/light-leaks WebGL transition that
                crashed the software-GL compositor. */}
            <BRollCutIn>
              <BRollOverlay scene={scene} fps={fps} brandColor={brand_color} />
            </BRollCutIn>
          </Sequence>
        );
      })}

      {/* ═══ LAYER 3: Captions — on top, unless the user turned subtitles off
              (captions_style "none") or a brief banned them. ═══ */}
      {captions_style !== "none" && (
        <Captions
          words={words}
          groups={caption_groups}
          style={captions_style}
          brandColor={brand_color}
          captionOffset={caption_offset}
          muteWindows={captionMuteWindows}
        />
      )}

      {/* ═══ LAYER 3.5: Written HOOK — first ~3s, top-third, big Heebo Black.
              Sits above the video/overlays but doesn't collide with the bottom
              captions (it lives in the top third). Its own Sequence so it only
              exists for the opening window and fades itself out. ═══ */}
      {hook?.text && (() => {
        const hookFrom = Math.max(0, Math.round((hook.start ?? 0) * fps));
        const hookEnd = Math.round((hook.end ?? (hook.start ?? 0) + 3) * fps);
        const hookFrames = Math.max(1, Math.min(hookEnd, durationInFrames) - hookFrom);
        return (
          <Sequence from={hookFrom} durationInFrames={hookFrames}>
            <HookText
              hook={hook.text}
              highlight={hook.highlight}
              variant={hook.variant ?? hook.style}
              brandColor={brand_color}
              durationInFrames={hookFrames}
            />
          </Sequence>
        );
      })()}

      {/* ═══ LAYER 4: DrEdit watermark ═══ topmost VISUAL layer (guest / free
              renders only). Source-order-last among visuals → sits above the
              captions + hook. Gated on `watermark`; a clean re-render of the
              same cached plan passes watermark=false to strip it. GL-safe. ═══ */}
      {watermark && <Watermark brandColor={brand_color} />}

      {/* ═══ AUDIO: SFX placements ═══ */}
      {(editing_plan?.sfx_placements || [])
        .filter((sfx: SFXPlacement) => sfx.decision === "place")
        .map((sfx: SFXPlacement, i: number) => {
          const startSec = Math.max(0, sfx.timestamp_s - (sfx.pre_lead_s || 0));
          const startFrame = Math.round(startSec * fps);
          // Estimate audio duration — give generous room (5s max)
          const durationFrames = Math.round(5 * fps);

          return (
            <Sequence
              key={`sfx-${i}`}
              from={startFrame}
              durationInFrames={durationFrames}
            >
              <SFXAudio sfx={sfx} />
            </Sequence>
          );
        })}
    </AbsoluteFill>
  );
};

/** Duration calculator — used by Root.tsx calculateMetadata.
 *  Exactly the video's frames: the old `ceil(s*fps) + fps` "+1s buffer" held
 *  the last frame for a second (a frozen tail with silence) on every export. */
export function calculateEditDuration(durationSeconds: number, fps: number, durationFrames?: number): number {
  if (Number.isInteger(durationFrames) && (durationFrames as number) > 0) return durationFrames as number;
  return Math.max(1, Math.round(durationSeconds * fps));
}
