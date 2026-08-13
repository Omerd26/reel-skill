import React from "react";
import {
  AbsoluteFill,
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
 * SocialAd — a ~9s vertical paid-social ad: an AI-generated backdrop clip
 * (Higgsfield) + a bold Hebrew hook + a DrEdit CTA endcard + music. Parameterized
 * via inputProps so one composition renders all three ad concepts. GL-safe.
 */

const ORANGE = "#E0701E";
const BG = "#0A0A0C";
const FONT = "'Heebo', sans-serif";
export const AD_FPS = 30;
export const AD_DURATION = 270; // 9s

export interface SocialAdProps {
  src: string;      // staticFile path to the AI clip, e.g. "demo/ads/ad1_pain.mp4"
  hook: string;     // the Hebrew hook line(s); use \n for a line break
  accent: string;   // substring of `hook` to color orange
  sub: string;      // endcard subline
  music?: string;   // staticFile path to a music bed
}

const HookText: React.FC<{ hook: string; accent: string }> = ({ hook, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 190 }, from: 0, to: 1 });
  const y = interpolate(s, [0, 1], [50, 0]);
  const fade = interpolate(frame, [185, 205], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const renderLine = (line: string, key: number) => {
    if (accent && line.includes(accent)) {
      const [a, b] = line.split(accent);
      return (
        <div key={key}>
          {a}
          <span style={{ color: ORANGE }}>{accent}</span>
          {b}
        </div>
      );
    }
    return <div key={key}>{line}</div>;
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 50,
        right: 50,
        textAlign: "center",
        direction: "rtl",
        opacity: s * fade,
        transform: `translateY(${y}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 96,
          color: "#fff",
          lineHeight: 1.15,
          WebkitTextStroke: "3px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          textShadow: "0 6px 30px rgba(0,0,0,0.9)",
          display: "inline-block",
        }}
      >
        {hook.split("\n").map(renderLine)}
      </span>
    </div>
  );
};

const EndCard: React.FC<{ sub: string }> = ({ sub }) => {
  const frame = useCurrentFrame(); // relative to the endcard Sequence-less; we gate by absolute below
  const { fps } = useVideoConfig();
  const local = frame - 210;
  const logo = spring({ frame: local, fps, config: { damping: 13, stiffness: 180 }, from: 0, to: 1 });
  const subO = interpolate(local, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pill = interpolate(local, [22, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate((local < 0 ? 0 : local) % 60, [0, 30, 60], [0.5, 1, 0.5]);
  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center", direction: "rtl" }}>
      <div style={{ position: "absolute", width: 820, height: 820, borderRadius: "50%", background: ORANGE, filter: "blur(170px)", opacity: 0.2 * glow }} />
      <div style={{ transform: `scale(${logo})`, display: "flex", alignItems: "center", gap: 22, marginBottom: 46 }}>
        <div style={{ width: 100, height: 100, borderRadius: 28, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🍃</div>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 90, color: "#fff" }}>DrEdit</span>
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: "#fff", opacity: subO, textAlign: "center", padding: "0 60px", lineHeight: 1.25 }}>{sub}</span>
      <div style={{ marginTop: 44, opacity: pill, background: ORANGE, padding: "26px 64px", borderRadius: 22, boxShadow: `0 22px 66px rgba(224,112,30,0.5)` }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#fff" }}>נסה חינם · dredit.co</span>
      </div>
    </AbsoluteFill>
  );
};

export const SocialAd: React.FC<SocialAdProps> = ({ src, hook, accent, sub, music = "music/upbeat/full_of_energy.mp3" }) => {
  const frame = useCurrentFrame();
  const showEnd = frame >= 210;
  const clipFade = interpolate(frame, [200, 212], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BG }}>
      {music && <Audio src={staticFile(music)} volume={0.3} />}
      {/* backdrop clip + scrims + hook (first 7s) */}
      {!showEnd && (
        <AbsoluteFill style={{ opacity: clipFade }}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
          <HookText hook={hook} accent={accent} />
        </AbsoluteFill>
      )}
      {showEnd && <EndCard sub={sub} />}
    </AbsoluteFill>
  );
};
