import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  Img,
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
 * ProductDemo — a ~31s vertical product-demo ad for the DrEdit landing page.
 * Recreates the real flow (upload → one button → AI edits → result → chat
 * refine → CTA) with the REAL edited reel embedded, big Hebrew explainer
 * captions, and a message of "one screen, one button, done". GL-safe only
 * (divs / Img / OffthreadVideo / SVG / frame-driven anim — no WebGL).
 *
 * Assets (in remotion/public/demo/): edited.mp4 (real output reel), raw.mp4
 * (the source clip), logo.png. Music: public/music/upbeat/full_of_energy.mp3.
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";
export const DEMO_FPS = 30;

// Scene boundaries (frames @30fps)
const S = {
  hook: [0, 90],
  upload: [90, 210],
  button: [210, 300],
  processing: [300, 450],
  result: [450, 600],
  chat: [600, 750],
  cta: [750, 930],
} as const;
export const DEMO_DURATION = 930; // 31s

// ── Shared chrome ─────────────────────────────────────────────────────────────

const Device: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
    <div
      style={{
        width: 980,
        height: 1786,
        borderRadius: 60,
        overflow: "hidden",
        background: "#000",
        border: "3px solid #1c1c20",
        boxShadow: "0 50px 140px rgba(0,0,0,0.7)",
        position: "relative",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const AppBar: React.FC = () => (
  <div
    style={{
      height: 92,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 40px",
      background: "#0E0E11",
      borderBottom: "1px solid #17171b",
      direction: "rtl",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🍃</div>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: "#fff" }}>DrEdit</span>
    </div>
    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 26, color: "#7d8194" }}>dredit.co</span>
  </div>
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15, stiffness: 200 }, from: 0, to: 1 });
  const y = interpolate(s, [0, 1], [46, 0]);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 40,
        right: 40,
        textAlign: "center",
        opacity: s,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "rgba(6,6,8,0.82)",
          borderRadius: 26,
          padding: "22px 38px",
          direction: "rtl",
          border: `1.5px solid rgba(224,112,30,0.45)`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#fff", lineHeight: 1.28 }}>
          {children}
        </span>
      </div>
    </div>
  );
};

const O: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: ORANGE }}>{children}</span>
);

// entrance helper: fade+rise for a scene's first frames
const useEnter = (dur = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, dur], [0, 1], { extrapolateRight: "clamp" });
};

// ── Scene 0: Hook — raw → edited wipe reveal ─────────────────────────────────

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  // wipe raw away between 0.8s–2.0s revealing the edited reel underneath
  const wipe = interpolate(frame, [24, 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelOpacity = interpolate(frame, [62, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Device>
      {/* edited (revealed) */}
      <OffthreadVideo src={staticFile("demo/edited.mp4")} muted startFrom={90} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      {/* raw (wiped away) */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${wipe}%)` }}>
        <OffthreadVideo src={staticFile("demo/raw.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) brightness(0.7)" }} />
        <div style={{ position: "absolute", top: 130, right: 44, background: "rgba(0,0,0,0.65)", padding: "10px 24px", borderRadius: 14, direction: "rtl" }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: "#bfc3d0" }}>גולמי</span>
        </div>
      </div>
      {/* wipe edge */}
      {wipe > 0 && wipe < 100 && (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${wipe}%`, width: 8, background: ORANGE, boxShadow: `0 0 40px ${ORANGE}` }} />
      )}
      <div style={{ position: "absolute", top: 130, left: 44, opacity: labelOpacity, background: ORANGE, padding: "10px 24px", borderRadius: 14, direction: "rtl" }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: "#fff" }}>ערוך ✨</span>
      </div>
      <Caption>מסרטון <O>גולמי</O> — לריל <O>ערוך</O>. תוך דקות.</Caption>
    </Device>
  );
};

// ── Scene 1: Upload ──────────────────────────────────────────────────────────

const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter();
  // file drops into the zone ~0.5s–1.4s
  const drop = spring({ frame: frame - 18, fps, config: { damping: 13, stiffness: 180 }, from: 0, to: 1 });
  const chipY = interpolate(drop, [0, 1], [-360, 0]);
  const inZone = frame > 46;
  return (
    <Device>
      <AbsoluteFill style={{ background: BG, opacity: enter }}>
        <AppBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, direction: "rtl" }}>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: "#fff", marginBottom: 50 }}>ריל חדש</span>
          {/* dropzone */}
          <div
            style={{
              width: 760,
              height: 620,
              borderRadius: 36,
              border: `4px dashed ${inZone ? ORANGE : "#2a2a30"}`,
              background: inZone ? "rgba(224,112,30,0.08)" : "rgba(255,255,255,0.02)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {!inZone && (
              <>
                <div style={{ fontSize: 130 }}>⬆️</div>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: "#9a9eb0", marginTop: 20 }}>זרוק סרטון כאן</span>
              </>
            )}
            {/* the file chip flying in */}
            <div
              style={{
                position: "absolute",
                transform: `translateY(${chipY}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: "#17171c",
                border: "1px solid #26262c",
                borderRadius: 20,
                padding: "24px 34px",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ fontSize: 60 }}>🎬</div>
              <div style={{ direction: "rtl", textAlign: "right" }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: "#fff" }}>my-clip.mp4</div>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: "#7d8194" }}>0:52 · 20MB</div>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Caption><O>1.</O> גוררים את הסרטון הגולמי.</Caption>
    </Device>
  );
};

// ── Scene 2: One button ──────────────────────────────────────────────────────

const ButtonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter();
  // cursor approaches + click ripple around frame 40
  const clickT = frame - 40;
  const press = clickT > 0 && clickT < 10 ? interpolate(clickT, [0, 5, 10], [1, 0.94, 1]) : 1;
  const ripple = interpolate(clickT, [0, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rippleShow = clickT > 0 && clickT < 26;
  const cursorX = interpolate(frame, [6, 40], [220, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [6, 40], [200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Device>
      <AbsoluteFill style={{ background: BG, opacity: enter }}>
        <AppBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, direction: "rtl" }}>
          {/* file chip settled */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#141419", border: `1px solid ${ORANGE}`, borderRadius: 18, padding: "20px 30px", marginBottom: 70 }}>
            <div style={{ fontSize: 46 }}>🎬</div>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#fff" }}>my-clip.mp4 ✓</span>
          </div>
          {/* the ONE button */}
          <div style={{ position: "relative", transform: `scale(${press})` }}>
            <div
              style={{
                background: ORANGE,
                borderRadius: 26,
                padding: "40px 90px",
                boxShadow: `0 24px 70px rgba(224,112,30,0.45)`,
              }}
            >
              <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, color: "#fff" }}>תעשה לי ריל ✨</span>
            </div>
            {rippleShow && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 40 + ripple * 620,
                  height: 40 + ripple * 620,
                  marginLeft: -(20 + ripple * 310),
                  marginTop: -(20 + ripple * 310),
                  borderRadius: "50%",
                  border: `4px solid ${ORANGE}`,
                  opacity: (1 - ripple) * 0.8,
                }}
              />
            )}
            {/* cursor */}
            <div style={{ position: "absolute", right: 120 + cursorX, top: 90 + cursorY, width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.9)", boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }} />
          </div>
        </div>
      </AbsoluteFill>
      <Caption><O>2.</O> לוחצים כפתור <O>אחד</O>.</Caption>
    </Device>
  );
};

// ── Scene 3: AI processing ───────────────────────────────────────────────────

const ProcessingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter();
  const pct = Math.round(interpolate(frame, [10, 135], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const scanY = interpolate(frame % 45, [0, 45], [0, 100]);
  const R = 150;
  const C = 2 * Math.PI * R;
  const steps = ["מתמלל את הדיבור…", "מוסיף B-Roll ואייקונים…", "כותב הוק + כתוביות…", "בוחר מוזיקה…"];
  const step = steps[Math.min(steps.length - 1, Math.floor(frame / 36))];
  return (
    <Device>
      <AbsoluteFill style={{ opacity: enter }}>
        <OffthreadVideo src={staticFile("demo/raw.mp4")} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.32) grayscale(0.4)" }} />
        {/* scanline */}
        <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 5, background: ORANGE, opacity: 0.8, boxShadow: `0 0 40px ${ORANGE}` }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <svg width={360} height={360} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={180} cy={180} r={R} stroke="rgba(255,255,255,0.14)" strokeWidth={16} fill="none" />
            <circle cx={180} cy={180} r={R} stroke={ORANGE} strokeWidth={16} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          </svg>
          <div style={{ position: "absolute", fontFamily: FONT, fontWeight: 900, fontSize: 96, color: "#fff" }}>{pct}%</div>
          <div style={{ position: "absolute", top: "64%", background: "rgba(0,0,0,0.6)", padding: "16px 34px", borderRadius: 18, direction: "rtl" }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: ORANGE }}>{step}</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Caption>וה-AI <O>עורך לבד</O> — כתוביות · B-Roll · מוזיקה.</Caption>
    </Device>
  );
};

// ── Scene 4: Result ──────────────────────────────────────────────────────────

const ResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter();
  const badge = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 220 }, from: 0, to: 1 });
  return (
    <Device>
      <AbsoluteFill style={{ opacity: enter }}>
        <OffthreadVideo src={staticFile("demo/edited.mp4")} muted startFrom={40} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 130, left: "50%", transform: `translateX(-50%) scale(${badge})`, background: "#16a34a", padding: "16px 36px", borderRadius: 999, direction: "rtl", boxShadow: "0 16px 50px rgba(22,163,74,0.5)" }}>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 42, color: "#fff" }}>✓ מוכן</span>
        </div>
      </AbsoluteFill>
      <Caption>ריל מוכן לאינסטגרם. <O>בלי עריכה, בלי ידע.</O></Caption>
    </Device>
  );
};

// ── Scene 5: Chat refine ─────────────────────────────────────────────────────

const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter();
  const full = "הוסף עוד B-Roll";
  const typed = full.slice(0, Math.floor(interpolate(frame, [10, 55], [0, full.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const sent = frame > 66;
  const working = frame > 74 && frame < 108;
  const updated = frame >= 108;
  const flash = updated ? interpolate(frame, [108, 118], [0.4, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <Device>
      <AbsoluteFill style={{ background: BG, opacity: enter }}>
        <AppBar />
        {/* reel preview */}
        <div style={{ height: 900, margin: "30px auto 0", width: 520, borderRadius: 30, overflow: "hidden", position: "relative", opacity: flash }}>
          <OffthreadVideo src={staticFile("demo/edited.mp4")} muted startFrom={150} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {updated && <div style={{ position: "absolute", top: 20, left: 20, background: ORANGE, padding: "8px 20px", borderRadius: 12 }}><span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: "#fff" }}>✨ עודכן</span></div>}
        </div>
        {/* chat area */}
        <div style={{ padding: "36px 50px", direction: "rtl" }}>
          {/* user bubble */}
          {(typed.length > 0 || sent) && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: ORANGE, borderRadius: "24px 24px 8px 24px", padding: "22px 34px", maxWidth: "80%" }}>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: "#fff" }}>{sent ? full : typed || "…"}</span>
              </div>
            </div>
          )}
          {working && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ background: "#17171c", borderRadius: "24px 24px 24px 8px", padding: "22px 34px" }}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: "#9a9eb0" }}>עובד על זה… ✨</span>
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Caption>רוצה שינוי? פשוט <O>תכתוב לו.</O> 💬</Caption>
    </Device>
  );
};

// ── Scene 6: CTA ─────────────────────────────────────────────────────────────

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 13, stiffness: 180 }, from: 0, to: 1 });
  const line1 = interpolate(frame, [16, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2 = interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5]);
  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", direction: "rtl" }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: ORANGE, filter: "blur(180px)", opacity: 0.18 * glow }} />
      <div style={{ transform: `scale(${logo})`, display: "flex", alignItems: "center", gap: 24, marginBottom: 60 }}>
        <div style={{ width: 110, height: 110, borderRadius: 30, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 66 }}>🍃</div>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 96, color: "#fff" }}>DrEdit</span>
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 68, color: "#fff", opacity: line1, textAlign: "center", padding: "0 60px" }}>
        נסה על הסרטון שלך — <O>חינם</O>
      </span>
      <div style={{ marginTop: 40, opacity: line2, background: ORANGE, padding: "26px 70px", borderRadius: 24, boxShadow: `0 24px 70px rgba(224,112,30,0.5)` }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, color: "#fff" }}>dredit.co</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Root composition ─────────────────────────────────────────────────────────

export const ProductDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Audio src={staticFile("music/upbeat/full_of_energy.mp3")} volume={0.28} />
      <Sequence from={S.hook[0]} durationInFrames={S.hook[1] - S.hook[0]}><HookScene /></Sequence>
      <Sequence from={S.upload[0]} durationInFrames={S.upload[1] - S.upload[0]}><UploadScene /></Sequence>
      <Sequence from={S.button[0]} durationInFrames={S.button[1] - S.button[0]}><ButtonScene /></Sequence>
      <Sequence from={S.processing[0]} durationInFrames={S.processing[1] - S.processing[0]}><ProcessingScene /></Sequence>
      <Sequence from={S.result[0]} durationInFrames={S.result[1] - S.result[0]}><ResultScene /></Sequence>
      <Sequence from={S.chat[0]} durationInFrames={S.chat[1] - S.chat[0]}><ChatScene /></Sequence>
      <Sequence from={S.cta[0]} durationInFrames={S.cta[1] - S.cta[0]}><CTAScene /></Sequence>
    </AbsoluteFill>
  );
};
