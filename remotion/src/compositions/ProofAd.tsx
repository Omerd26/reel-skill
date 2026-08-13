import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "@fontsource/heebo/900.css";

/**
 * ProofAd — "Screen-Capture Speedrun". ~11s vertical proof-driven ad cut
 * entirely from the REAL DrEdit screen recording: cold-opens directly on the
 * real, already-processed result reveal (captions animating, real DrEdit
 * watermark) with a punchy hook composited on top — then speedruns through a
 * real upload+processing montage — then returns to the real result reveal
 * with the comparison copy — then a small corner-badge + end-flash CTA.
 * No solid-black hook card, no big centered CTA lockup. GL-safe.
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";
export const PROOF_FPS = 30;

// beat lengths (frames @30) — cold open → montage (upload+process) → return-to-result + small endcard
const B = { open: 45, up: 60, proc: 90, result: 135 };
export const PROOF_DURATION = B.open + B.up + B.proc + B.result; // 330 (11s @ 30fps)

export interface ProofAdProps {
  hook: string;          // \n for line break
  hookAccent: string;
  capUp: string;
  capProc: string;
  capRes: string;        // kept for prop-compat; not used in the speedrun cut
  compareTop: string;
  compareBottom: string; // orange punch
  music?: string;
}

const accentSplit = (line: string, accent: string) => {
  if (accent && line.includes(accent)) {
    const [a, b] = line.split(accent);
    return (<>{a}<span style={{ color: ORANGE }}>{accent}</span>{b}</>);
  }
  return <>{line}</>;
};

// bottom caption band over a footage beat (upload/process montage)
const CapBand: React.FC<{ text: string; accent?: string }> = ({ text, accent = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 200 }, from: 0, to: 1 });
  const y = interpolate(s, [0, 1], [40, 0]);
  return (
    <div style={{ position: "absolute", bottom: 150, left: 40, right: 40, textAlign: "center", opacity: s, transform: `translateY(${y}px)`, direction: "rtl" }}>
      <div style={{ display: "inline-block", background: "rgba(6,6,8,0.86)", border: `1.5px solid rgba(224,112,30,0.5)`, borderRadius: 24, padding: "20px 34px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: "#fff", lineHeight: 1.25 }}>
          {text.split("\n").map((l, i) => <div key={i}>{accentSplit(l, accent)}</div>)}
        </span>
      </div>
    </div>
  );
};

const FootageBeat: React.FC<{ src: string; startFrom?: number; caption: string; accent?: string }> = ({ src, startFrom = 0, caption, accent }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000", opacity: fade }}>
      <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.72) 100%)" }} />
      <CapBand text={caption} accent={accent} />
    </AbsoluteFill>
  );
};

// big hook headline composited ON TOP of full-bleed real moving footage —
// upper-middle, spring fade+rise in, strong multi-layer text-shadow so it
// stays legible over a busy live screen recording.
const HookOverlay: React.FC<{ hook: string; accent: string }> = ({ hook, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15, stiffness: 190 }, from: 0, to: 1 });
  const y = interpolate(s, [0, 1], [26, 0]);
  return (
    <div style={{ position: "absolute", top: 540, left: 36, right: 36, textAlign: "center", direction: "rtl", opacity: s, transform: `translateY(${y}px)`, zIndex: 20 }}>
      <span style={{
        fontFamily: FONT, fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1.18,
        textShadow: "0 2px 10px rgba(0,0,0,0.95), 0 10px 34px rgba(0,0,0,0.9), 0 0 46px rgba(224,112,30,0.4)",
      }}>
        {hook.split("\n").map((l, i) => <div key={i}>{accentSplit(l, accent)}</div>)}
      </span>
    </div>
  );
};

// 0.0–1.5s: cold open directly on the real result-reveal footage (captions
// already animating, real DrEdit watermark burned in) + the hook overlay.
const ResultOpenBeat: React.FC<{ src: string; hook: string; hookAccent: string }> = ({ src, hook, hookAccent }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000", opacity: fade }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.42) 34%, rgba(0,0,0,0.1) 48%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.55) 100%)" }} />
      <HookOverlay hook={hook} accent={hookAccent} />
    </AbsoluteFill>
  );
};

// 6.5–11s: a longer/different real trim of the same result reveal.
// First carries the compareTop/compareBottom payoff caption (6.5–9s), then
// settles into the small end-card — corner brand badge + end-flash CTA
// (9–11s), composited on top of the still-playing real footage per the
// approved small-pattern (no big centered CTA lockup).
const ResultReturnBeat: React.FC<{ src: string; compareTop: string; compareBottom: string }> = ({ src, compareTop, compareBottom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  // compare caption — in early, out before the endcard phase (local 0–78 = 0–2.6s)
  const capIn = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 200 }, from: 0, to: 1 });
  const capOut = interpolate(frame, [64, 78], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capOpacity = capIn * capOut;
  const capY = interpolate(capIn, [0, 1], [30, 0]);

  // corner brand badge — fades in as the endcard phase begins (~9s)
  const badgeOp = interpolate(frame, [78, 92], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // end-flash CTA — only in the final ~1s (~10–11s), never earlier
  const flashIn = interpolate(frame, [100, 114], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOut = interpolate(frame, [127, 135], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOp = flashIn * flashOut;

  return (
    <AbsoluteFill style={{ background: "#000", opacity: fade }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)" }} />

      {capOpacity > 0.002 && (
        <div style={{ position: "absolute", bottom: 170, left: 40, right: 40, textAlign: "center", direction: "rtl", opacity: capOpacity, transform: `translateY(${capY}px)`, zIndex: 20 }}>
          <div style={{ display: "inline-block", background: "rgba(6,6,8,0.86)", border: `1.5px solid rgba(224,112,30,0.5)`, borderRadius: 24, padding: "18px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: "#cfd2dc" }}>{compareTop}</div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: ORANGE, marginTop: 6 }}>{compareBottom}</div>
          </div>
        </div>
      )}

      {/* small corner brand badge — real product export watermark treatment */}
      {badgeOp > 0.002 && (
        <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 5, display: "flex", alignItems: "center", gap: 7, background: "rgba(8,8,10,0.55)", borderRadius: 999, padding: "5px 12px 5px 6px", opacity: badgeOp }}>
          <svg width={22} height={22} viewBox="0 0 34 34" style={{ display: "block" }}>
            <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={ORANGE} />
            <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
          </svg>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.92)" }}>DrEdit</span>
        </div>
      )}

      {/* small end-flash CTA text — only in the final ~1s */}
      {flashOp > 0.002 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", direction: "rtl", opacity: flashOp, zIndex: 45 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: `0 0 20px rgba(224,112,30,0.6), 0 2px 8px rgba(0,0,0,0.85)` }}>
            נסה חינם על הסרטון שלך · <span style={{ color: "#FFC48A" }}>dredit.co</span>
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const ProofAd: React.FC<ProofAdProps> = ({
  hook, hookAccent, capUp, capProc, compareTop, compareBottom,
  music = "music/upbeat/full_of_energy.mp3",
}) => {
  let t = 0;
  const seq = (len: number) => { const from = t; t += len; return { from, durationInFrames: len }; };
  return (
    <AbsoluteFill style={{ background: BG }}>
      {music && <Audio src={staticFile(music)} volume={0.3} />}
      <Sequence {...seq(B.open)}><ResultOpenBeat src="demo/rec/seg_result_open.mp4" hook={hook} hookAccent={hookAccent} /></Sequence>
      <Sequence {...seq(B.up)}><FootageBeat src="demo/rec/seg_upload2.mp4" caption={capUp} /></Sequence>
      <Sequence {...seq(B.proc)}><FootageBeat src="demo/rec/seg_process2.mp4" caption={capProc} /></Sequence>
      <Sequence {...seq(B.result)}><ResultReturnBeat src="demo/rec/seg_result_return.mp4" compareTop={compareTop} compareBottom={compareBottom} /></Sequence>
    </AbsoluteFill>
  );
};
