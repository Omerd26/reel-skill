/**
 * CampaignAd — Omer Draizin paid-social ad composition (Phase 1).
 *
 * Layers over an ffmpeg-assembled SPINE (hook → middle → CTA, already trimmed,
 * normalized to 1080×1920/30fps, loudness-normalized audio):
 *   1. Spine video + audio, with optional subtle punch-ins on key sentences.
 *   2. Full-frame real-video CUTAWAYS (e.g. IG feed scroll) at given times.
 *   3. Real proof IMAGE overlays (view-count crops) placed above Omer.
 *   4. Simple Remotion connection / journey diagrams.
 *   5. Hebrew word-highlight captions (reused Captions component).
 *   6. After the spine: the real landing-page scroll + website end overlay.
 *
 * Brand: charcoal graphic layer, dark-orange accents, white text. NO logo.
 * Everything inside Reels safe zones; B-roll short (1–3s); Omer stays primary.
 */
import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { Captions, WordTimestamp } from "../components/Captions";

const ACCENT = "#E0701E";
const FONT = "'Heebo', sans-serif";

export interface VideoInsert {
  src: string;        // public-relative
  start: number;      // sec (spine time)
  end: number;
  startFrom?: number; // sec into the source clip
  label?: string;
  /** When set, overlays the website + (optional) disclaimer on the cutaway —
   *  used for the landing-page cutaway shown DURING the CTA. */
  website?: string;
  disclaimer?: boolean;
}
export interface ImageOverlay {
  src: string;        // public-relative
  start: number;
  end: number;
  label?: string;     // small caption under the image
}
export interface DiagramCue {
  variant: "two_worlds" | "journey" | "connection";
  start: number;
  end: number;
}
export interface PunchIn {
  start: number;
  end: number;
  scale?: number;     // default 1.08
}

export interface CampaignAdProps {
  spine_path: string;
  spine_duration: number;     // sec
  landing_path?: string;
  landing_duration?: number;  // sec
  words: WordTimestamp[];
  video_inserts?: VideoInsert[];
  image_overlays?: ImageOverlay[];
  diagrams?: DiagramCue[];
  punch_ins?: PunchIn[];
  end_cta_text?: string;
  website?: string;
  caption_offset?: number;
}

export function calculateCampaignDuration(
  spine_duration: number,
  landing_duration: number,
  fps: number,
): number {
  return Math.ceil((spine_duration + (landing_duration || 0)) * fps);
}

export const CampaignAd: React.FC<CampaignAdProps> = ({
  spine_path,
  spine_duration,
  landing_path,
  landing_duration = 0,
  words,
  video_inserts = [],
  image_overlays = [],
  diagrams = [],
  punch_ins = [],
  end_cta_text = "בדקו מה חסר לעסק שלכם",
  website = "omerdraizin.com",
  caption_offset = 0,
}) => {
  const { fps } = useVideoConfig();
  const spineFrames = Math.round(spine_duration * fps);
  const landingFrames = Math.round(landing_duration * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0C10" }}>
      {/* ── SPINE ── */}
      <Sequence from={0} durationInFrames={spineFrames}>
        <SpineLayer src={spine_path} punchIns={punch_ins} fps={fps} />

        {/* Diagrams (own Sequence → entrance animates locally) */}
        {diagrams.map((d, i) => {
          const s = Math.round(d.start * fps);
          const dd = Math.max(1, Math.round((d.end - d.start) * fps));
          return (
            <Sequence key={`dg-${i}`} from={s} durationInFrames={dd}>
              <LocalFade durationFrames={dd} fps={fps}><DiagramScene variant={d.variant} /></LocalFade>
            </Sequence>
          );
        })}

        {/* Proof image overlays (above Omer) */}
        {image_overlays.map((im, i) => {
          const s = Math.round(im.start * fps);
          const dd = Math.max(1, Math.round((im.end - im.start) * fps));
          return (
            <Sequence key={`im-${i}`} from={s} durationInFrames={dd}>
              <LocalFade durationFrames={dd} fps={fps}><ProofImage src={im.src} label={im.label} fps={fps} /></LocalFade>
            </Sequence>
          );
        })}

        {/* Full-frame video cutaways (incl. landing page DURING the CTA).
            Each in its OWN Sequence so the clip plays from its start (local
            timeline) instead of reading past its end. */}
        {video_inserts.map((v, i) => {
          const s = Math.round(v.start * fps);
          const d = Math.max(1, Math.round((v.end - v.start) * fps));
          return (
            <Sequence key={`vi-${i}`} from={s} durationInFrames={d}>
              <VideoCutaway src={v.src} startFrom={v.startFrom ?? 0} label={v.label} website={v.website} disclaimer={v.disclaimer} durationFrames={d} fps={fps} />
            </Sequence>
          );
        })}

        {/* Captions on top */}
        <Captions words={words} style="highlight" brandColor={ACCENT} captionOffset={caption_offset} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Spine with punch-ins ─────────────────────────────────────────────────────

const SpineLayer: React.FC<{ src: string; punchIns: PunchIn[]; fps: number }> = ({ src, punchIns, fps }) => {
  const frame = useCurrentFrame();
  // Active punch-in scale (smooth in/out)
  let scale = 1;
  for (const p of punchIns) {
    const s = Math.round(p.start * fps), e = Math.round(p.end * fps);
    if (frame >= s - fps * 0.3 && frame <= e + fps * 0.3) {
      const target = p.scale ?? 1.08;
      const up = interpolate(frame, [s - fps * 0.3, s + fps * 0.1], [1, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
      const down = interpolate(frame, [e - fps * 0.1, e + fps * 0.3], [target, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
      scale = Math.min(up, down);
      break;
    }
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale.toFixed(3)})` }}
      />
    </AbsoluteFill>
  );
};

// ── Local fade wrapper (uses LOCAL frame inside its Sequence) ─────────────────

const LocalFade: React.FC<{ durationFrames: number; fps: number; children: React.ReactNode }> = ({ durationFrames, fps, children }) => {
  const frame = useCurrentFrame();
  const fade = Math.round(0.22 * fps);
  const op = Math.min(
    interpolate(frame, [0, fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [durationFrames - fade, durationFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

// ── Full-frame video cutaway (feed scroll) ───────────────────────────────────

const VideoCutaway: React.FC<{ src: string; startFrom: number; label?: string; website?: string; disclaimer?: boolean; durationFrames: number; fps: number }> = ({ src, startFrom, label, website, disclaimer, durationFrames, fps }) => {
  const { fps: vfps } = useVideoConfig();
  const frame = useCurrentFrame(); // LOCAL to this insert's Sequence (0 = start)
  const fadeF = Math.round(0.22 * fps);
  const op = Math.min(
    interpolate(frame, [0, fadeF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [durationFrames - fadeF, durationFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const t = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0C10", opacity: op }}>
      <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(startFrom * vfps)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {label && <CornerLabel text={label} />}
      {(website || disclaimer) && (
        <AbsoluteFill style={{ pointerEvents: "none", direction: "rtl" }}>
          <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(11,12,16,0.45), rgba(11,12,16,0.1) 35%, rgba(11,12,16,0.7))" }} />
          {disclaimer && (
            <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", opacity: t * 0.9 }}>
              <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.85)", background: "rgba(11,12,16,0.6)", padding: "6px 16px", borderRadius: 10 }}>תוצאות נבחרות, משתנות בין עסקים</span>
            </div>
          )}
          {website && (
            <div style={{ position: "absolute", bottom: 320, left: 0, right: 0, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 18}px)` }}>
              <div style={{ display: "inline-block", fontFamily: FONT, fontSize: 52, fontWeight: 900, color: "#fff", background: ACCENT, padding: "14px 34px", borderRadius: 16, boxShadow: `0 12px 30px ${ACCENT}77` }}>{website}</div>
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ── Proof image above Omer (view-count crop) ─────────────────────────────────

const ProofImage: React.FC<{ src: string; label?: string; fps: number }> = ({ src, label, fps }) => {
  const frame = useCurrentFrame(); // local to its Sequence
  const t = interpolate(frame, [0, Math.round(0.32 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: t, transform: `scale(${(0.85 + 0.15 * t).toFixed(3)})` }}>
        <div style={{ borderRadius: 22, overflow: "hidden", border: `4px solid ${ACCENT}`, boxShadow: `0 0 30px ${ACCENT}66, 0 16px 40px rgba(0,0,0,0.6)`, background: "#000" }}>
          <Img src={src.startsWith("http") ? src : staticFile(src)} style={{ width: 300, height: "auto", display: "block" }} />
        </div>
        {label && (
          <span style={{ fontFamily: FONT, fontSize: 30, fontWeight: 900, color: "#fff", background: "rgba(11,12,16,0.85)", padding: "8px 20px", borderRadius: 12, border: `2px solid ${ACCENT}` }}>{label}</span>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── Corner label ─────────────────────────────────────────────────────────────

const CornerLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center" }}>
    <span style={{ fontFamily: FONT, fontSize: 38, fontWeight: 900, color: "#fff", background: ACCENT, padding: "10px 24px", borderRadius: 14, boxShadow: "0 8px 22px rgba(0,0,0,0.5)" }}>{text}</span>
  </div>
);

// ── Diagrams ─────────────────────────────────────────────────────────────────

const DiagramScene: React.FC<{ variant: DiagramCue["variant"] }> = ({ variant }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  if (variant === "two_worlds") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22, direction: "rtl" }}>
          {[{ t: "אורגני", c: "rgba(255,255,255,0.12)" }, { t: "ממומן", c: ACCENT }].map((p, i) => {
            const op = interpolate(frame, [i * 4, i * 4 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ width: 300, height: 150, borderRadius: 20, background: "rgba(11,12,16,0.88)", border: `3px solid ${p.c === ACCENT ? ACCENT : "rgba(255,255,255,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 52, fontWeight: 900, color: "#fff", opacity: op, boxShadow: "0 12px 30px rgba(0,0,0,0.55)" }}>{p.t}</div>
            );
          })}
        </div>
        <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 34, fontWeight: 800, color: "rgba(255,255,255,0.85)", direction: "rtl" }}>שני עולמות נפרדים</div>
      </AbsoluteFill>
    );
  }
  const steps = variant === "journey"
    ? ["צופה קר", "מכיר", "סומך", "פונה"]
    : ["תוכן", "אמון", "ממומן", "פנייה"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 220, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, direction: "rtl" }}>
        {steps.map((s, i) => {
          const op = interpolate(frame, [i * 6, i * 6 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.2)) });
          const isLast = i === steps.length - 1;
          return (
            <React.Fragment key={i}>
              <div style={{ minWidth: 360, padding: "16px 30px", borderRadius: 18, background: isLast ? ACCENT : "rgba(11,12,16,0.9)", border: `3px solid ${ACCENT}`, textAlign: "center", fontFamily: FONT, fontSize: 46, fontWeight: 900, color: "#fff", opacity: op, transform: `translateY(${(1 - op) * 16}px)`, boxShadow: `0 10px 26px rgba(0,0,0,0.5)` }}>{s}</div>
              {i < steps.length - 1 && (
                <div style={{ fontSize: 40, color: ACCENT, opacity: interpolate(frame, [i * 6 + 6, i * 6 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), lineHeight: 0.6 }}>↓</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── End overlay (website + CTA) over landing page ────────────────────────────

const EndOverlay: React.FC<{ ctaText: string; website: string; fps: number }> = ({ ctaText, website, fps }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", direction: "rtl" }}>
      {/* subtle darken for legibility */}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(11,12,16,0.55), rgba(11,12,16,0.2) 35%, rgba(11,12,16,0.75))" }} />
      {/* Required disclaimer when real campaign results are visible (secondary) */}
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", opacity: t * 0.92 }}>
        <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.85)", background: "rgba(11,12,16,0.6)", padding: "6px 16px", borderRadius: 10 }}>תוצאות נבחרות, משתנות בין עסקים</span>
      </div>
      <div style={{ position: "absolute", bottom: 360, left: 0, right: 0, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
        <div style={{ display: "inline-block", fontFamily: FONT, fontSize: 60, fontWeight: 900, color: "#fff", background: ACCENT, padding: "16px 36px", borderRadius: 18, boxShadow: `0 12px 32px ${ACCENT}77`, letterSpacing: "-0.01em" }}>{ctaText}</div>
        <div style={{ marginTop: 22, fontFamily: FONT, fontSize: 46, fontWeight: 800, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>{website}</div>
      </div>
    </AbsoluteFill>
  );
};
