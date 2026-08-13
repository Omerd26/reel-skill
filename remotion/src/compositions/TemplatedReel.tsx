/**
 * TemplatedReel — talking-head video + format template overlay.
 *
 * This is the PRODUCTION composition for client deliverables. Layer model:
 *   1. Video track  (OffthreadVideo, full frame)
 *   2. Template overlay (TemplateLayer — bracket / tier / decision cards)
 *   3. SFX cues     (Audio one-shots fired at transcript-synced times)
 *
 * Pass a real video path + a TemplatePlan-shaped `template` and you get the
 * final social-ready MP4. The video sets the duration; the template animates
 * over the full clip.
 */
import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { TemplateLayer } from "../components/templates/TemplateLayer";
import type { AnyTemplate } from "../components/templates/types";
import { Captions, type WordTimestamp } from "../components/Captions";
import { buildDuckVolume } from "./EditedReel";

/** A one-shot sound effect fired at a precise time. */
export interface SfxCue {
  /** public-relative path, e.g. "sfx/UI/pop sound.mp3". */
  src: string;
  /** When to fire, in seconds. */
  at_sec: number;
  /** Playback volume 0–1. Default 0.6. */
  volume?: number;
  /** Optional cap on how long the clip plays (sec). */
  duration_sec?: number;
}

export interface TemplatedReelProps {
  /** Remotion-relative path under `public/` (e.g. "videos/img_1926.mp4"). */
  video_path: string;
  /** Total duration of the video in seconds — drives composition length. */
  total_duration: number;
  /** The template plan to overlay on the talking head. */
  template: AnyTemplate;
  /** Mute the source audio (when re-scoring with music). Default: false. */
  mute_audio?: boolean;
  /** Where to start playback in the source video, in seconds. */
  start_at?: number;
  /** Sound-effect one-shots (e.g. a "ding" each time an item lands). */
  sfx?: SfxCue[];
  fps: number;
  /** Optional burned-in word captions. Null/absent = no subtitles. When set,
   *  they render in a reserved bottom band so they sit clear of the template
   *  overlay (the agent keeps the template above that band). */
  captions?: {
    words: WordTimestamp[];
    style?: "tiktok" | "classic" | "highlight" | "white_card" | "cinematic" | "none";
    brand_color?: string;
    caption_offset?: number;
  } | null;
  /** Optional background music bed (mood-selected server-side). Low volume so
   *  it sits under the speech; loops. Null/absent = no music. */
  music?: { src: string; volume?: number } | null;
}

export function calculateTemplatedReelDuration(
  totalDuration: number,
  fps: number,
): number {
  return Math.ceil(totalDuration * fps);
}

export const TemplatedReel: React.FC<TemplatedReelProps> = ({
  video_path,
  total_duration,
  template,
  mute_audio = false,
  start_at = 0,
  sfx = [],
  captions = null,
  music = null,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Background music bed — DUCKED under the speech (near-silent while the
          speaker talks, pleasant in the quiet gaps); loops. */}
      {music?.src && (
        <Audio
          src={staticFile(music.src)}
          volume={buildDuckVolume(captions?.words, fps, music.volume ?? 0.11)}
          loop
        />
      )}

      {/* Layer 1 — talking-head video */}
      <OffthreadVideo
        src={staticFile(video_path)}
        muted={mute_audio}
        startFrom={Math.round(start_at * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Layer 2 — template overlay (bracket / tier / decision cards) */}
      <TemplateLayer template={template} total_duration_sec={total_duration} />

      {/* Layer 3 — SFX one-shots */}
      {sfx.map((cue, i) => {
        const from = Math.max(0, Math.round(cue.at_sec * fps));
        const dur = cue.duration_sec
          ? Math.round(cue.duration_sec * fps)
          : undefined;
        return (
          <Sequence key={`sfx-${i}`} from={from} durationInFrames={dur ?? 90}>
            <Audio
              src={staticFile(cue.src)}
              volume={cue.volume ?? 0.6}
            />
          </Sequence>
        );
      })}

      {/* Layer 4 — word captions (only when the user kept subtitles ON). Topmost
          visual layer; sits in a reserved bottom band so it clears the template
          overlay (the agent keeps the template above it; the visual gate checks
          for overlap). Self-guards on empty words / style "none". */}
      {captions && captions.words && captions.words.length > 0 && (
        <Captions
          words={captions.words}
          style={captions.style ?? "highlight"}
          brandColor={captions.brand_color}
          captionOffset={captions.caption_offset}
        />
      )}
    </AbsoluteFill>
  );
};
