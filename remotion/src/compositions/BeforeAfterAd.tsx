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
 * BeforeAfterAd — ~13s vertical ad built from the SAME 10s moment of a real
 * clip, raw vs DrEdit-edited. Variants:
 *   "wipe"  — both play in sync; an orange wipe sweeps (RTL) revealing the
 *             edited layer over the raw one. The strongest "same moment,
 *             transformed" visual.
 *   "cut"   — hook card → raw beat (its own rough audio) → flash → edited
 *             beat (polished audio + music) → endcard. Audio-upgrade angle.
 *   "cards" — the live floating-cards showcase (no intro/outro, owner ask).
 *   "wipe2" — same mechanic as "wipe", retimed so the reveal completes
 *             inside the first 3s instead of 2.2-4.4s (hook-rate fix).
 *   "cut2"  — "result-first" reorder of "cut": opens directly on the edited
 *             payoff (no hook card), a short raw "twist" beat, back to the
 *             edited clip with the small end-flash CTA. Kept fully separate
 *             from "cut" (new ResultFirstBeat component) so the original
 *             variant is untouched.
 * GL-safe (transforms/clip-path only). Assets in remotion/public/demo/ba/.
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";
export const BA_FPS = 30;
export const BA_DURATION = 400; // ~13.3s

export interface BeforeAfterAdProps {
  variant: "wipe" | "cut" | "cards" | "wipe2" | "cut2";
  before: string; // staticFile path
  after: string;
}

const Label: React.FC<{ text: string; side: "left" | "right"; accent?: boolean; show: boolean }> = ({ text, side, accent = false, show }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 220 }, from: 0, to: 1 });
  if (!show) return null;
  return (
    <div style={{
      position: "absolute", top: 120, [side]: 40, zIndex: 20,
      transform: `scale(${s})`, direction: "rtl",
      background: accent ? ORANGE : "rgba(8,8,10,0.72)",
      border: accent ? "none" : "1px solid rgba(255,255,255,0.25)",
      padding: "12px 26px", borderRadius: 16,
      boxShadow: accent ? "0 10px 34px rgba(224,112,30,0.55)" : "0 8px 24px rgba(0,0,0,0.45)",
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 42, color: "#fff" }}>{text}</span>
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 13, stiffness: 180 }, from: 0, to: 1 });
  const l1 = interpolate(frame, [10, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pill = interpolate(frame, [22, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5]);
  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", direction: "rtl" }}>
      <div style={{ position: "absolute", width: 860, height: 860, borderRadius: "50%", background: ORANGE, filter: "blur(180px)", opacity: 0.2 * glow }} />
      <div style={{ transform: `scale(${logo})`, display: "flex", alignItems: "center", gap: 20, marginBottom: 46 }}>
        <div style={{ width: 92, height: 92, borderRadius: 26, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54 }}>🍃</div>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: "#fff" }}>DrEdit</span>
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 60, color: "#fff", opacity: l1, textAlign: "center", padding: "0 70px", lineHeight: 1.25 }}>
        מהסרטון שלך — <span style={{ color: ORANGE }}>לריל מוכן.</span>
      </span>
      <div style={{ marginTop: 44, opacity: pill, background: ORANGE, padding: "24px 62px", borderRadius: 22, boxShadow: `0 22px 66px rgba(224,112,30,0.5)` }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: "#fff" }}>נסה חינם · dredit.co</span>
      </div>
    </AbsoluteFill>
  );
};

// ── wipe variant: synced layers + RTL sweep ──────────────────────────────────

const WipeContent: React.FC<{ before: string; after: string; sweepStart?: number; sweepEnd?: number; labelSwitch?: number }> = ({ before, after, sweepStart = 66, sweepEnd = 132, labelSwitch = 120 }) => {
  const frame = useCurrentFrame();
  // full raw sweepStart→sweepEnd → full edited after. Defaults (66-132,
  // switch 120) are the original "wipe" timing (2.2-4.4s); "wipe2" passes
  // (4,70,50) so the reveal completes inside the 0-3s hook-rate window.
  const wipe = interpolate(frame, [sweepStart, sweepEnd], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showAfterLabel = frame > labelSwitch;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* BEFORE (base) — muted; slightly dull so the upgrade pops */}
      <OffthreadVideo src={staticFile(before)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.8) brightness(0.92)" }} />
      {/* AFTER (revealed, RTL: from the right) — carries the polished audio */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${100 - wipe}%)` }}>
        <OffthreadVideo src={staticFile(after)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {/* sweep edge */}
      {wipe > 0 && wipe < 100 && (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${100 - wipe}%`, width: 7, background: ORANGE, boxShadow: `0 0 44px ${ORANGE}`, zIndex: 10 }} />
      )}
      <Label text="גולמי" side="left" show={frame < labelSwitch} />
      <Label text="✨ ערוך ב-DrEdit" side="right" accent show={showAfterLabel} />
      {/* bottom hook line */}
      <div style={{ position: "absolute", bottom: 110, left: 40, right: 40, textAlign: "center", direction: "rtl", zIndex: 20 }}>
        <div style={{ display: "inline-block", background: "rgba(6,6,8,0.82)", border: `1.5px solid rgba(224,112,30,0.45)`, borderRadius: 22, padding: "16px 30px" }}>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: "#fff" }}>
            אותו סרטון. אותו רגע. <span style={{ color: ORANGE }}>AI עשה את השאר.</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── cut variant: hook card → raw → flash → edited ────────────────────────────

const HookCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15, stiffness: 190 }, from: 0, to: 1 });
  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", direction: "rtl" }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 96, color: "#fff", textAlign: "center", lineHeight: 1.16, padding: "0 60px", transform: `scale(${s})`, opacity: s }}>
        ככה נראה <span style={{ color: ORANGE }}>אותו סרטון</span><br />לפני ואחרי
      </span>
    </AbsoluteFill>
  );
};

const CutBeat: React.FC<{ src: string; label: string; accent?: boolean; startFrom?: number; dull?: boolean }> = ({ src, label, accent, startFrom = 0, dull }) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 5], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(src)} startFrom={startFrom} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: dull ? "saturate(0.75) brightness(0.9)" : undefined }} />
      <Label text={label} side="right" accent={accent} show />
      {/* white flash on entry — sells the "snap" */}
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.55, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ── cut2 variant: result-first reorder — after → raw twist → after + CTA ────
// Deliberately a NEW component, not a CutBeat reuse: the opening/closing
// beats need no Label pill (payoff should be the literal first pixel, no
// "logo/build-up" per the concept) and need the small corner badge instead,
// which CutBeat/CutBeat's callers never asked for — keeping this separate
// means the original "cut" variant stays byte-identical.

const ResultFirstBeat: React.FC<{
  src: string; startFrom: number; dull?: boolean; flash?: boolean;
  badge?: boolean; label?: string; cta?: boolean;
}> = ({ src, startFrom, dull, flash, badge, label, cta }) => {
  const frame = useCurrentFrame();
  const flashOp = flash ? interpolate(frame, [0, 5], [1, 0], { extrapolateRight: "clamp" }) : 0;
  const ctaIn = cta ? interpolate(frame, [60, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: dull ? "saturate(0.75) brightness(0.9)" : undefined }}
      />
      {label && (
        <div style={{ position: "absolute", top: 120, left: 40, zIndex: 20, direction: "rtl", background: "rgba(8,8,10,0.72)", border: "1px solid rgba(255,255,255,0.25)", padding: "12px 26px", borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, color: "#fff" }}>{label}</span>
        </div>
      )}
      {badge && (
        <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 5, display: "flex", alignItems: "center", gap: 7, background: "rgba(8,8,10,0.55)", borderRadius: 999, padding: "5px 12px 5px 6px" }}>
          <svg width={22} height={22} viewBox="0 0 34 34" style={{ display: "block" }}>
            <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={ORANGE} />
            <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
          </svg>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.92)" }}>DrEdit</span>
        </div>
      )}
      {flash && <AbsoluteFill style={{ background: "#fff", opacity: flashOp * 0.55, pointerEvents: "none" }} />}
      {cta && ctaIn > 0.002 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", direction: "rtl", opacity: ctaIn, zIndex: 45 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: `0 0 20px rgba(224,112,30,0.6), 0 2px 8px rgba(0,0,0,0.85)` }}>
            נסה חינם על הסרטון שלך · <span style={{ color: "#FFC48A" }}>dredit.co</span>
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── cards variant: layered floating cards over a living background ──────────
// Reference: editor.krave-style showcase — big glowing AFTER card front-center,
// small dimmed BEFORE card floating behind it, animated dark backdrop, and
// rotating benefit captions. All GL-safe (blurred divs + transforms).

const BENEFITS: Array<{ pre: string; main: string }> = [
  { pre: "כתוביות עברית", main: "מדויקות ומסונכרנות" },
  { pre: "B-Roll ואייקונים", main: "נבנים אוטומטית" },
  { pre: "מוזיקה ואפקטים", main: "מתוזמנים לדיבור" },
  { pre: "והכל מוכן", main: "תוך דקות" },
];

const LivingBackground: React.FC = () => {
  const frame = useCurrentFrame();
  // two ember blobs drifting on slow sine paths + breathing opacity
  const x1 = Math.sin(frame / 55) * 160;
  const y1 = Math.cos(frame / 71) * 120;
  const x2 = Math.cos(frame / 63) * 190;
  const y2 = Math.sin(frame / 49) * 140;
  const b1 = 0.32 + Math.sin(frame / 40) * 0.08;
  const b2 = 0.22 + Math.cos(frame / 33) * 0.07;
  const spin = frame * 0.12;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 90% at 50% 0%, #17110c 0%, #0A0806 55%, #050403 100%)" }}>
      <div style={{ position: "absolute", left: 140 + x1, top: 260 + y1, width: 820, height: 820, borderRadius: "50%", background: ORANGE, filter: "blur(190px)", opacity: b1 }} />
      <div style={{ position: "absolute", left: -180 + x2, top: 1050 + y2, width: 760, height: 760, borderRadius: "50%", background: "#8a3c0a", filter: "blur(200px)", opacity: b2 }} />
      {/* slow-rotating conic sheen adds "alive" texture without WebGL */}
      <div style={{
        position: "absolute", left: -400, top: 200, width: 1880, height: 1880, borderRadius: "50%",
        background: `conic-gradient(from ${spin}deg, transparent 0deg, rgba(224,112,30,0.10) 40deg, transparent 90deg, rgba(224,112,30,0.05) 200deg, transparent 260deg)`,
        filter: "blur(60px)",
      }} />
      {/* rising ember particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const speed = 2.2 + (i % 3) * 0.9;
        const y = 1980 - ((frame * speed + i * 340) % 2100);
        const x = 90 + i * 170 + Math.sin((frame + i * 47) / 30) * 28;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 7 + (i % 3) * 3, height: 7 + (i % 3) * 3, borderRadius: "50%", background: "#F2A765", opacity: 0.5, filter: "blur(2px)" }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 130% 110% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const NeonLabel: React.FC<{ text: string; big?: boolean }> = ({ text, big }) => (
  <span style={{
    fontFamily: FONT, fontWeight: 900, fontSize: big ? 76 : 46, direction: "rtl",
    color: big ? "#FFD9B8" : "rgba(255,255,255,0.75)",
    textShadow: big
      ? `0 0 22px ${ORANGE}, 0 0 60px rgba(224,112,30,0.75), 0 2px 8px rgba(0,0,0,0.6)`
      : "0 0 14px rgba(224,112,30,0.45), 0 2px 6px rgba(0,0,0,0.6)",
    letterSpacing: "0.01em",
  }}>{text}</span>
);

const CardsContent: React.FC<{ before: string; after: string }> = ({ before, after }) => {
  const frame = useCurrentFrame();
  // No intro — the full scene is there from frame 0 (owner request). Only the
  // gentle idle float/breathe animates the cards.
  const inB = 1;
  const inA = 1;
  const floatA = Math.sin(frame / 38) * 8;
  const floatB = Math.cos(frame / 44) * 6;
  const breatheA = 1 + Math.sin(frame / 50) * 0.008;

  // rotating benefit caption — 4 × 75f = exactly the 10s runtime
  const PER = 75;
  const idx = Math.min(BENEFITS.length - 1, Math.floor(frame / PER));
  const local = frame - idx * PER;
  const capIn = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capOut = idx < BENEFITS.length - 1 ? interpolate(local, [PER - 8, PER], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const capY = interpolate(capIn, [0, 1], [26, 0]);
  const benefit = BENEFITS[idx];

  return (
    <AbsoluteFill>
      <LivingBackground />

      {/* BEFORE — bigger + brighter so the raw side really reads (owner ask),
          still clearly secondary to the glowing AFTER card */}
      <div style={{
        position: "absolute", right: 26, top: 350 + floatB, width: 495, height: 870,
        transform: `rotate(3.5deg) scale(${0.9 + inB * 0.1})`, opacity: inB,
        borderRadius: 32, overflow: "hidden",
        border: "1.5px solid rgba(255,255,255,0.22)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.65)",
        filter: "brightness(0.88) saturate(0.9)",
      }}>
        <OffthreadVideo src={staticFile(before)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {/* AI SCAN — an orange analysis line sweeping the RAW clip every ~2.5s,
            with a trailing tint: the software "reading" the footage. */}
        {(() => {
          const scanY = ((frame * 1.35) % 75) / 75 * 118 - 9; // -9%→109%, clips at edges
          return (
            <>
              <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 5, background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`, boxShadow: `0 0 26px ${ORANGE}`, opacity: 0.95 }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY - 16}%`, height: "16%", background: `linear-gradient(to bottom, transparent, rgba(224,112,30,0.16))` }} />
            </>
          );
        })()}
      </div>
      <div style={{ position: "absolute", right: 215, top: 266 + floatB, opacity: inB }}>
        <NeonLabel text="לפני" />
      </div>

      {/* AFTER — big, glowing, front-center-left (nudged left to reveal more
          of the BEFORE card behind it) */}
      <div style={{
        position: "absolute", left: 26, top: 330 + floatA, width: 600, height: 1120,
        transform: `rotate(-2deg) scale(${(0.92 + inA * 0.08) * breatheA})`, opacity: inA,
        borderRadius: 40, overflow: "hidden",
        border: `2.5px solid rgba(242,167,101,0.85)`,
        boxShadow: `0 0 46px rgba(224,112,30,0.55), 0 0 130px rgba(224,112,30,0.30), 0 44px 110px rgba(0,0,0,0.7)`,
      }}>
        <OffthreadVideo src={staticFile(after)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {/* WATERMARK — the SAME mark DrEdit burns onto real exports (rounded
            badge + play triangle, see EditedReel.tsx), not a placeholder icon.
            Fixes "zero branding anywhere in the ad" without reintroducing the
            big centered CTA pill the owner asked removed — this reads as "yes,
            this really is our app's output," not as an ad button. */}
        <div style={{
          position: "absolute", left: 16, bottom: 14, zIndex: 5,
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(8,8,10,0.55)", borderRadius: 999, padding: "5px 12px 5px 6px",
        }}>
          <svg width={22} height={22} viewBox="0 0 34 34" style={{ display: "block" }}>
            <rect x={1.5} y={1.5} width={31} height={31} rx={9} fill={ORANGE} />
            <path d="M13 10.5 L24.5 17 L13 23.5 Z" fill="#ffffff" />
          </svg>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "rgba(255,255,255,0.92)" }}>DrEdit</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 280, top: 216 + floatA, opacity: inA }}>
        <NeonLabel text="אחרי" big />
      </div>

      {/* PARTICLE FLOW — glowing sparks stream from the RAW card into the
          EDITED card: the transformation direction, visualized. */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const cycle = 55;
        const t = ((frame + i * 13) % cycle) / cycle; // 0→1 along the path
        const x = 780 - t * 350 + Math.sin((frame + i * 31) / 22) * 10;
        const y = 640 + (i % 5) * 95 + Math.sin(t * Math.PI * 2 + i) * 16;
        const o = Math.sin(t * Math.PI); // fade in → out
        const s = 6 + (i % 3) * 4;
        return (
          <div key={`p${i}`} style={{
            position: "absolute", left: x, top: y, width: s, height: s,
            borderRadius: "50%", background: "#FFC48A", opacity: o * 0.9,
            boxShadow: `0 0 ${10 + s}px ${ORANGE}`, zIndex: 30,
          }} />
        );
      })}

      {/* MAIN HEADLINE — top of frame, always on: the ad's one-line promise. */}
      <div style={{ position: "absolute", top: 84, left: 40, right: 40, textAlign: "center", direction: "rtl", zIndex: 40 }}>
        <span style={{
          fontFamily: FONT, fontWeight: 900, fontSize: 68, color: "#fff", lineHeight: 1.15,
          textShadow: `0 0 30px rgba(224,112,30,0.55), 0 4px 14px rgba(0,0,0,0.85)`,
        }}>
          תן ל-<span style={{ color: "#FFC48A", textShadow: `0 0 26px ${ORANGE}` }}>AI</span> לערוך לך את הסרטונים
        </span>
      </div>

      {/* rotating benefit captions */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 210, textAlign: "center", direction: "rtl", opacity: capIn * capOut, transform: `translateY(${capY}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: "rgba(255,255,255,0.72)", marginBottom: 6, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{benefit.pre}</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1.1, textShadow: `0 0 26px rgba(224,112,30,0.65), 0 3px 12px rgba(0,0,0,0.85)` }}>
          {benefit.main}
        </div>
      </div>

      {/* END FLASH — a brief (~1s), small, non-intrusive CTA line in the final
          beat only. NOT the big centered pill/cube the owner removed — small
          text, quick fade, timed to land only as the loop is about to end (or
          restart on Instagram/TikTok's autoloop) so it never competes with the
          headline/cards for the first-3-second hook, but a viewer who watched
          through — and anyone catching the loop restart — gets one clear,
          calm next-step. Ad had ZERO on-screen brand/URL/CTA before this. */}
      {(() => {
        const flashIn = interpolate(frame, [260, 276], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const flashOut = interpolate(frame, [294, 300], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const op = flashIn * flashOut;
        if (op <= 0.002) return null;
        return (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, textAlign: "center", direction: "rtl", opacity: op, zIndex: 45 }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: `0 0 20px rgba(224,112,30,0.6), 0 2px 8px rgba(0,0,0,0.85)` }}>
              נסה חינם על הסרטון שלך · <span style={{ color: "#FFC48A" }}>dredit.co</span>
            </span>
          </div>
        );
      })()}

    </AbsoluteFill>
  );
};

export const BeforeAfterAd: React.FC<BeforeAfterAdProps> = ({ variant, before, after }) => {
  if (variant === "cards") {
    // Pure showcase — no intro card, no endcard, no CTA pill (owner request).
    // The composition's calculateMetadata trims this variant to 300 frames.
    return (
      <AbsoluteFill style={{ background: BG }}>
        <CardsContent before={before} after={after} />
      </AbsoluteFill>
    );
  }
  if (variant === "wipe") {
    return (
      <AbsoluteFill style={{ background: BG }}>
        <Sequence from={0} durationInFrames={300}><WipeContent before={before} after={after} /></Sequence>
        <Sequence from={300} durationInFrames={BA_DURATION - 300}><EndCard /></Sequence>
      </AbsoluteFill>
    );
  }
  if (variant === "wipe2") {
    // Same mechanic, retimed: sweep completes at frame 70 (2.33s) instead of
    // 132 (4.4s) — the reveal now lands inside Meta's 3-second hook window.
    return (
      <AbsoluteFill style={{ background: BG }}>
        <Sequence from={0} durationInFrames={300}><WipeContent before={before} after={after} sweepStart={4} sweepEnd={70} labelSwitch={50} /></Sequence>
        <Sequence from={300} durationInFrames={BA_DURATION - 300}><EndCard /></Sequence>
      </AbsoluteFill>
    );
  }
  if (variant === "cut2") {
    // Result-first: after (payoff, first pixel) → raw twist → after + CTA.
    // ~7.5s total. Uses the same before/after pair's 0-10s window as the
    // live "cards" ad (startFrom picked to land on real caption highlights).
    return (
      <AbsoluteFill style={{ background: BG }}>
        <Sequence from={0} durationInFrames={90}><ResultFirstBeat src={after} startFrom={15} badge /></Sequence>
        <Sequence from={90} durationInFrames={45}><ResultFirstBeat src={before} startFrom={15} dull flash label="זה מה שהוא באמת צילם" /></Sequence>
        <Sequence from={135} durationInFrames={90}><ResultFirstBeat src={after} startFrom={180} flash badge cta /></Sequence>
      </AbsoluteFill>
    );
  }
  // cut: 36f hook → 105f raw (0-3.5s of segment) → 165f edited (3.5-9s)
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence from={0} durationInFrames={36}><HookCard /></Sequence>
      <Sequence from={36} durationInFrames={105}><CutBeat src={before} label="גולמי 😴" dull /></Sequence>
      <Sequence from={141} durationInFrames={165}><CutBeat src={after} label="✨ ערוך ב-DrEdit" accent startFrom={105} /></Sequence>
      <Sequence from={306} durationInFrames={BA_DURATION - 306}><EndCard /></Sequence>
    </AbsoluteFill>
  );
};
