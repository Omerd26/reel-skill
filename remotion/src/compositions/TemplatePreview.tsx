/**
 * TemplatePreview — standalone composition for previewing video-format templates.
 *
 * Mirrors OverlayPreview but for the full-video templates (bracket_battle,
 * tier_rating). Renders the template on top of a speaker silhouette so the
 * face-zone-safe layout can be validated without a real video file.
 *
 * In production, the parent composition (e.g. a `TemplatedReel`) layers the
 * real talking-head video underneath the TemplateLayer.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { TemplateLayer } from "../components/templates/TemplateLayer";
import { AmbientBackground } from "../components/overlays/ambient-bg";
import { SafeZoneFrame } from "../components/overlays/primitives";
import type { AnyTemplate } from "../components/templates/types";

export interface TemplatePreviewProps {
  template: AnyTemplate;
  total_duration: number;
  fps: number;
  brand_color: string;
  show_safe_zones?: boolean;
  show_silhouette?: boolean;
  show_ambient_bg?: boolean;
}

export function calculateTemplatePreviewDuration(
  totalDuration: number,
  fps: number,
): number {
  return Math.ceil(totalDuration * fps);
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  total_duration,
  show_safe_zones = false,
  show_silhouette = true,
  show_ambient_bg = true,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0C" }}>
      {show_ambient_bg && <AmbientBackground />}
      {show_silhouette && <SpeakerSilhouette />}
      <TemplateLayer template={template} total_duration_sec={total_duration} />
      <SafeZoneFrame show={show_safe_zones} />
    </AbsoluteFill>
  );
};

const SpeakerSilhouette: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        top: 480,
        left: "50%",
        transform: "translateX(-50%)",
        width: 380,
        height: 460,
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse at 50% 35%, rgba(255,210,180,0.22), rgba(50,40,40,0.4) 70%, transparent)",
        filter: "blur(2px)",
        opacity: 0.6,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 920,
        left: "50%",
        transform: "translateX(-50%)",
        width: 760,
        height: 480,
        borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(60,60,75,0.55), rgba(20,20,28,0.4) 70%, transparent)",
        filter: "blur(4px)",
        opacity: 0.6,
      }}
    />
  </>
);
