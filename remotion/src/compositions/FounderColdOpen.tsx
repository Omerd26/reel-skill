import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "@fontsource/heebo/900.css";

/**
 * FounderColdOpen — a re-cut of Omer's own EXISTING real unscripted pitch
 * clip (leo-studio/public/demo/raw.mp4, staged here as public/demo/raw.mp4).
 * Nothing is scripted or re-shot: this just reorders three real beats from
 * the same take so the "boring videos" hook and the "so I built this"
 * payoff — which sit ~20s apart in the raw chronology — land back-to-back
 * near the top, with 3 quick real proof-cutaway flashes (actual DrEdit
 * output: burned-in orange word-by-word captions) bridging them instead of
 * 11s of setup talk. Deliberately native/imperfect: no logo, no title card,
 * no music, no intro fade — hard cuts throughout, exactly like a creator's
 * own rough re-edit, not a produced ad. The only branding is the small
 * corner badge + a ~1s end-flash CTA line in the closing beat (owner
 * explicitly rejected any big centered CTA lockup — do not add one).
 *
 * Cut points verified directly against the word-level transcript in
 * leo-studio/public/demo/pipeline-result.json (all timestamps below are
 * round(seconds * 30fps), so frame math matches the real audio exactly):
 *   HOOK   6.98s–9.26s  "לצערי רוב הסרטונים האלה הם טיפה משעממים"
 *   PAYOFF 20.00s–27.48s "...אני פיתחתי את הסוכן הזה. הסוכן בעצם לוקח את
 *          הסרטונים הכי משעממים והופך אותם למושכים שאנשים באמת ירצו לראות"
 *   CTA    31.70s–36.44s "...נתתי שבוע ניסיון... הירשמו כאן, תיכנסו, תראו
 *          איך זה עובד, ותתקנו אותי"
 *
 * Proof cutaways are trimmed 0.9s excerpts of a DIFFERENT, already-edited
 * DrEdit output (staged from ~/Desktop/omer_edit_FINAL.mp4, which has real
 * audio + strong burned-in captions) at public/demo/proof_cutaway_{1,2,3}.mp4
 * — kept at their own native sync (video+captions+audio together) rather
 * than muted, so each flash reads as an authentic finished clip, not a
 * silent placeholder.
 *
 * GL-safe only (opacity/clip-path, no WebGL). Vertical 1080x1920 @ 30fps to
 * match the rest of this project's ad comps; raw.mp4 (720x1280) is
 * object-fit:cover upscaled — the resulting softness only helps sell "real
 * phone clip," not "produced ad."
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";

export const FCO_FPS = 30;
export const FCO_WIDTH = 1080;
export const FCO_HEIGHT = 1920;

const RAW = "demo/raw.mp4";
const CUTAWAYS = [
  "demo/proof_cutaway_1.mp4",
  "demo/proof_cutaway_2.mp4",
  "demo/proof_cutaway_3.mp4",
];

// frame-accurate cut points — round(seconds * 30), re-verified against
// leo-studio/public/demo/pipeline-result.json's word-level transcript.
const HOOK_START = 209; // 6.98s, "לצערי"
const HOOK_END = 278; // 9.26s, end of "משעממים"
const PAYOFF_START = 600; // 20.00s, "אני" (NOT "אז")
const PAYOFF_END = 824; // 27.48s, end of "לראות"
const CTA_START = 951; // 31.70s, "נתתי"
const CTA_END = 1093; // 36.44s, end of "אותי"

const HOOK_DUR = HOOK_END - HOOK_START; // 69f  (2.30s)
const PAYOFF_DUR = PAYOFF_END - PAYOFF_START; // 224f (7.47s)
const CTA_DUR = CTA_END - CTA_START; // 142f (4.73s)
const CUTAWAY_DUR = 27; // 0.9s — matches the staged clip length exactly, no trim needed

export const FCO_DURATION =
  HOOK_DUR + CUTAWAY_DUR * 3 + PAYOFF_DUR + CTA_DUR; // 516f == 17.2s

// where the end-flash CTA text fades in/out, as frames LOCAL to the CTA
// beat (which is 142f long) — lands in the final 30f (~1s), never earlier.
const FLASH_IN = [112, 124] as const;
const FLASH_OUT = [130, 142] as const;

export interface FounderColdOpenProps {}

// ── a straight excerpt of the real raw take, no overlays ────────────────────
const RawBeat: React.FC<{ startFrom: number; endAt: number }> = ({ startFrom, endAt }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <OffthreadVideo
      src={staticFile(RAW)}
      startFrom={startFrom}
      endAt={endAt}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

// ── a quick real proof-cutaway: its own native audio + burned-in captions,
// a fast white snap on entry sells it as an intentional fast-cut, not a glitch.
const ProofCutaway: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 4], [0.85, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(src)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ── closing beat: real CTA line over his own face, small corner badge +
// end-flash CTA text only (the ONLY approved branding treatment — no big
// centered lockup, per explicit owner rejection).
const CtaBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const flashIn = interpolate(frame, [...FLASH_IN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOut = interpolate(frame, [...FLASH_OUT], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = flashIn * flashOut;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(RAW)}
        startFrom={CTA_START}
        endAt={CTA_END}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* small corner brand badge */}
      <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 5, display: "flex", alignItems: "center", gap: 7, background: "rgba(8,8,10,0.55)", borderRadius: 999, padding: "5px 12px 5px 6px" }}>
        <svg width={22} height={22} viewBox="0 0 34 34" style={{ display: "block" }}>
          <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={ORANGE} />
          <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
        </svg>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.92)" }}>DrEdit</span>
      </div>

      {/* small end-flash CTA text — only in the final ~1s */}
      {op > 0.002 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", direction: "rtl", opacity: op, zIndex: 45 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: `0 0 20px rgba(224,112,30,0.6), 0 2px 8px rgba(0,0,0,0.85)` }}>
            נסה חינם על הסרטון שלך · <span style={{ color: "#FFC48A" }}>dredit.co</span>
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const FounderColdOpen: React.FC<FounderColdOpenProps> = () => {
  const hookFrom = 0;
  const c1From = hookFrom + HOOK_DUR;
  const c2From = c1From + CUTAWAY_DUR;
  const c3From = c2From + CUTAWAY_DUR;
  const payoffFrom = c3From + CUTAWAY_DUR;
  const ctaFrom = payoffFrom + PAYOFF_DUR;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* HOOK — frame 0, hard cut, no lead-in */}
      <Sequence from={hookFrom} durationInFrames={HOOK_DUR} name="hook">
        <RawBeat startFrom={HOOK_START} endAt={HOOK_END} />
      </Sequence>

      {/* 3 quick real proof cutaways bridging hook → payoff */}
      <Sequence from={c1From} durationInFrames={CUTAWAY_DUR} name="proof-1">
        <ProofCutaway src={CUTAWAYS[0]} />
      </Sequence>
      <Sequence from={c2From} durationInFrames={CUTAWAY_DUR} name="proof-2">
        <ProofCutaway src={CUTAWAYS[1]} />
      </Sequence>
      <Sequence from={c3From} durationInFrames={CUTAWAY_DUR} name="proof-3">
        <ProofCutaway src={CUTAWAYS[2]} />
      </Sequence>

      {/* PAYOFF — "so I built this", pulled forward from its natural 0:20 spot */}
      <Sequence from={payoffFrom} durationInFrames={PAYOFF_DUR} name="payoff">
        <RawBeat startFrom={PAYOFF_START} endAt={PAYOFF_END} />
      </Sequence>

      {/* CTA — his own real closing line, over his own face */}
      <Sequence from={ctaFrom} durationInFrames={CTA_DUR} name="cta">
        <CtaBeat />
      </Sequence>
    </AbsoluteFill>
  );
};
