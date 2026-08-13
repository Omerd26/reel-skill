import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "@fontsource/heebo/900.css";

/**
 * ThreeThingsAd — "3 Things It Does Automatically". Rapid hard-cut listicle:
 * three numbered proof beats (badge + bold caption slam-in + real proof clip)
 * land entirely inside the first ~4.5s so all three claims clear Meta's
 * 3-second hook-rate window, then a longer payoff beat holds on the full
 * real edited "after" clip with its baked-in captions playing, a small
 * corner brand badge, and a small end-flash CTA in the final ~1s only.
 *
 * Clip-to-claim pairings (verified against footage, see file header notes
 * in the build brief — do not swap without re-checking the source clips):
 *   1. "כתוביות מדויקות"   — demo/threethings_captions.mp4, a real cropped
 *      moment of the actual DrEdit-edited reel with genuine orange
 *      word-by-word captions baked in (cut cleanly at the hard-cut-in point,
 *      no fade/garbage frames at start).
 *   2. "בי-רול אוטומטי"    — examples/broll_counter.mp4, the real "auto"
 *      carousel clip showing a full-frame animated counter B-Roll takeover.
 *   3. "אפקטים ומעברים"    — examples/overlay_pill.mp4, the real "auto"
 *      carousel clip showing a pill/chip graphic popping in over the talking
 *      head (a genuine automatic overlay effect). NOT a music claim — none
 *      of the source "auto" clips carry any audio track.
 *
 * GL-safe (transforms/opacity only, no WebGL). Vertical 1080x1920 @ 30fps.
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";

export const THREE_THINGS_FPS = 30;
export const THREE_THINGS_DURATION = 285; // 9.5s — 3x45f beats (4.5s) + 150f payoff (5s)

export interface ThreeThingsAdProps {
  captionsClip: string; // staticFile path — real captioned crop (has audio, muted in-beat)
  brollClip: string; // staticFile path — real B-Roll "auto" example clip
  effectsClip: string; // staticFile path — real overlay-effect "auto" example clip
  payoffClip: string; // staticFile path — full real edited "after" clip (audio on)
}

// ── numbered proof badge — adapts the Label/NeonLabel spring-in pill idiom
// from BeforeAfterAd.tsx (spring() scale-in, rounded pill, Heebo 900) ──────

const NumberBadge: React.FC<{ n: number; text: string }> = ({ n, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 220 }, from: 0, to: 1 });
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, zIndex: 20, display: "flex", justifyContent: "center", direction: "rtl" }}>
      <div style={{
        transform: `scale(${s})`,
        display: "flex", alignItems: "center", gap: 16,
        background: "rgba(8,8,10,0.74)", border: "1.5px solid rgba(224,112,30,0.45)",
        borderRadius: 999, paddingBlock: 10, paddingInlineStart: 10, paddingInlineEnd: 30,
        boxShadow: "0 12px 36px rgba(0,0,0,0.5)", maxWidth: 900,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: ORANGE, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 26px rgba(224,112,30,0.65)",
        }}>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: "#fff" }}>{n}</span>
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: "#fff", lineHeight: 1.18 }}>{text}</span>
      </div>
    </div>
  );
};

// ── proof beat: real clip full-bleed + entry flash + numbered badge ───────

const ProofBeat: React.FC<{ n: number; caption: string; src: string; startFrom?: number }> = ({ n, caption, src, startFrom = 0 }) => {
  const frame = useCurrentFrame();
  // white flash on entry — sells the hard-cut "snap" of a rapid listicle
  const flash = interpolate(frame, [0, 5], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        muted
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* top scrim keeps the badge legible over bright footage */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360, background: "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)" }} />
      <NumberBadge n={n} text={caption} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.5, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ── payoff beat: full real edited "after" clip, corner badge, end-flash CTA
// (verbatim brand pattern — only the interpolate() frame numbers are tuned
// to this beat's own 150f/5s local timeline) ───────────────────────────────

const PayoffBeat: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const IN_START = 120;
  const IN_END = 132;
  const OUT_START = 144;
  const OUT_END = 150;
  const flashIn = interpolate(frame, [IN_START, IN_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOut = interpolate(frame, [OUT_START, OUT_END], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = flashIn * flashOut;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(src)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* small corner brand badge — the real DrEdit export watermark mark */}
      <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 5, display: "flex", alignItems: "center", gap: 7, background: "rgba(8,8,10,0.55)", borderRadius: 999, padding: "5px 12px 5px 6px" }}>
        <svg width={22} height={22} viewBox="0 0 34 34" style={{ display: "block" }}>
          <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={ORANGE} />
          <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
        </svg>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.92)" }}>DrEdit</span>
      </div>

      {/* small end-flash CTA text — only in the FINAL ~1s of the ad, never earlier */}
      {op > 0.002 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", direction: "rtl", opacity: op, zIndex: 45 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: "0 0 20px rgba(224,112,30,0.6), 0 2px 8px rgba(0,0,0,0.85)" }}>
            נסה חינם על הסרטון שלך · <span style={{ color: "#FFC48A" }}>dredit.co</span>
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const ThreeThingsAd: React.FC<ThreeThingsAdProps> = ({ captionsClip, brollClip, effectsClip, payoffClip }) => {
  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Beat 1 (0-45f / 0-1.5s): accurate captions — real captioned crop */}
      <Sequence from={0} durationInFrames={45}>
        <ProofBeat n={1} caption="כתוביות מדויקות" src={captionsClip} startFrom={0} />
      </Sequence>
      {/* Beat 2 (45-90f / 1.5-3s): automatic B-Roll — real counter takeover */}
      <Sequence from={45} durationInFrames={45}>
        <ProofBeat n={2} caption="בי-רול אוטומטי" src={brollClip} startFrom={0} />
      </Sequence>
      {/* Beat 3 (90-135f / 3-4.5s): effects & transitions — real pill overlay pop */}
      <Sequence from={90} durationInFrames={45}>
        <ProofBeat n={3} caption="אפקטים ומעברים" src={effectsClip} startFrom={45} />
      </Sequence>
      {/* Payoff (135-285f / 4.5-9.5s): full real edited "after" clip, captions
          playing, corner badge throughout, end-flash CTA in the final ~1s */}
      <Sequence from={135} durationInFrames={150}>
        <PayoffBeat src={payoffClip} />
      </Sequence>
    </AbsoluteFill>
  );
};
