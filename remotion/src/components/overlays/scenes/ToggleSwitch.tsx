/**
 * ToggleSwitch — visual metaphor for open/close, on/off, lock/unlock.
 *
 * A real UI OBJECT (a settings row), so a panel is earned (Law 2) — but the
 * panel is the approved dark family (#1C1D24→#15161C, the MetricLockup look),
 * never white-on-translucent-glass (Law 1). Everything is BIG (Law 3):
 * 230×110 track, 92px knob, 180px lock, 30-34px state labels.
 *
 * Skeuomorphic realness (BROLL_STYLE_SPEC Law 6): the knob slide is the state
 * change, and the panel gives one physical reaction — a 3px jolt the frame
 * the flip lands.
 *
 * TEASE STATE (JATHO §1.2) — preserved exactly: `blurred` keeps labels
 * unreadable (blur 9px, dimmed), forces the toggle OFF, breathes a faint
 * mystery glow; panel chrome + knob stay crisp — the SHAPE of the payoff,
 * content censored. `tease_label` names WHAT is hidden above the panel.
 *
 * Use cases:
 *   - "the easiest way to open..."  → toggle CLOSED → OPEN, lock morphs
 *   - "turn this on"                → toggle OFF → ON
 *   - "unlock the workflow"         → lock icon CLOSED → OPEN, glow pulse
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance, useAmbient } from "../motion";
import {
  GlassCard,
  Eyebrow,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  easeFn,
  toneColor,
  toneGlow,
  type Tone,
} from "../../../design/tokens";

export interface ToggleSwitchScene {
  type: "toggle_switch";
  id: string;
  start: number;
  end: number;
  /** Variant — drives the icon. Default "switch" (iOS toggle). */
  variant?: "switch" | "lock" | "panel" | "drawer";
  /** Initial state label (shown briefly before the transition). */
  from_state?: string;     // e.g. "סגור" / "OFF" / "CLOSED"
  /** Final state label (shown after the transition lands). */
  to_state: string;        // e.g. "פתוח" / "ON" / "OPEN"
  /** Tone — colors the active state + glow. Default "brand". */
  tone?: Tone;
  /** Anchor — DESIGN.md top-bias preferred. Default "top-center". */
  anchor?: OverlayAnchor;
  /** Optional eyebrow label above the toggle. */
  eyebrow?: string;
  /** Tease state (JATHO_PLAYBOOK §1.2): labels blurred/unreadable, toggle
   * forced OFF, faint breathing glow signals mystery. Card chrome + knob
   * stay crisp — the SHAPE of the payoff, content censored.
   * Default undefined = normal behavior. */
  blurred?: boolean;
  /** SHOUT word above the censored panel naming WHAT is hidden (owner
   * 2026-08-09 — without it viewers don't realize something is deliberately
   * blurred). Only rendered when `blurred` is true. Default "הסוד:". */
  tease_label?: string;
  /** Transcript phrase + rationale (for plan review). */
  transcript_phrase?: string;
  rationale?: string;
  /** Planner sync metadata (JATHO §2) — carried through, ignored here. */
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ToggleSwitchScene;
}

/** The approved dark-panel material (MetricLockup reference look). */
const DARK_PANEL: React.CSSProperties = {
  background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)",
};

export const ToggleSwitch: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = scene.variant ?? "switch";
  const tone: Tone = scene.tone ?? "brand";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const accent = toneColor(tone);
  const blurred = scene.blurred === true;

  // Card entrance
  const cardEntrance = useEntrance({
    signature: "side-slide",
    ease: "glass-rise",
    durationSec: 0.45,
    fromEdge: "right",
  });

  // Toggle progress: starts at frame 0.7s, takes 0.45s to flip.
  const toggleStartFrames = Math.round(0.70 * fps);
  const toggleDurationFrames = Math.round(0.45 * fps);
  const flipT = interpolate(
    frame,
    [toggleStartFrames, toggleStartFrames + toggleDurationFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("bounce-soft"),
    },
  );
  // Tease state forces the toggle OFF — the flip is withheld for the payoff.
  const t = blurred ? 0 : flipT;

  // Glow ramps up after the toggle settles
  const glowStart = toggleStartFrames + toggleDurationFrames;
  const glowRamp = interpolate(
    frame,
    [glowStart, glowStart + Math.round(0.30 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("confident") },
  );
  const glowT = blurred ? 0 : glowRamp;

  // Physical reaction (BROLL Law 6): the panel jolts 3px the frame the flip
  // lands, like a real switch clunking home. Withheld in the tease.
  const joltY = blurred
    ? 0
    : interpolate(
        frame,
        [glowStart, glowStart + 2, glowStart + 6],
        [0, 3, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );

  // Ambient breath after everything settles — nothing frozen (Law 6).
  const ambient = useAmbient({
    startAfterSec: 1.6,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.0,
  });

  // Blurred tease: faint deterministic breathing glow (mystery signal).
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 3.4);
  const mysteryGlow = blurred ? 0.16 + 0.16 * breath : 0;

  // Labels unreadable but shape crisp: heavy blur + dimmed, chrome untouched.
  const labelBlurStyle = blurred
    ? ({ filter: "blur(9px)", opacity: 0.55 } as const)
    : undefined;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            ...cardEntrance,
            transform: mergeTransforms(
              cardEntrance.transform,
              ambient.transform,
              joltY !== 0 ? `translateY(${joltY.toFixed(2)}px)` : undefined,
            ),
          }}
        >
          {/* TEASE LABEL — SHOUT word naming what's hidden (blurred only) */}
          {blurred && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 12,
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 42,
                direction: "rtl",
                color: accent,
                textShadow: `0 0 24px ${toneGlow(tone)}, 0 2px 10px rgba(0,0,0,0.8)`,
              }}
            >
              {scene.tease_label || "הסוד:"}
            </div>
          )}

          <GlassCard
            material="solid-dark"
            padding="30px 40px"
            rtl={false}
            radius={RADIUS.lg}
            style={{ ...DARK_PANEL, minWidth: 360 }}
          >
            {scene.eyebrow && (
              <div style={labelBlurStyle}>
                <Eyebrow
                  tone={tone}
                  script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                  style={{ fontSize: 24, marginBottom: 16, textAlign: "center" }}
                >
                  {scene.eyebrow}
                </Eyebrow>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
              {/* The icon — always crisp, even in the blurred tease */}
              <ToggleIcon variant={variant} t={t} tone={tone} glow={glowT} />

              {/* State labels — minimal, swap with toggle progress */}
              {(scene.from_state || scene.to_state) && (
                <div style={labelBlurStyle}>
                  <StateLabel
                    fromText={scene.from_state}
                    toText={scene.to_state}
                    t={t}
                    tone={tone}
                  />
                </div>
              )}
            </div>
          </GlassCard>

          {/* Halo glow behind the card — post-flip settle, or the tease breath */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: blurred ? mysteryGlow : glowT * 0.6,
              pointerEvents: "none",
            }}
          >
            <HaloGlow
              tone={tone}
              size={520}
              intensity={0.4}
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Icon variants ────────────────────────────────────────────────────────────

interface IconProps {
  variant: NonNullable<ToggleSwitchScene["variant"]>;
  t: number;          // 0..1 progress through the flip
  tone: Tone;
  glow: number;       // 0..1 post-flip glow ramp
}

const ToggleIcon: React.FC<IconProps> = ({ variant, t, tone, glow }) => {
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);

  switch (variant) {
    case "switch":
      return <SwitchToggle t={t} accent={accent} accentGlow={accentGlow} glow={glow} />;
    case "lock":
      return <LockToggle t={t} accent={accent} accentGlow={accentGlow} glow={glow} />;
    case "panel":
      return <PanelSlide t={t} accent={accent} accentGlow={accentGlow} />;
    case "drawer":
      return <DrawerOpen t={t} accent={accent} accentGlow={accentGlow} />;
  }
};

// iOS-style toggle — knob slides from left to right, track fills with accent
const SwitchToggle: React.FC<{
  t: number;
  accent: string;
  accentGlow: string;
  glow: number;
}> = ({ t, accent, accentGlow, glow }) => {
  const trackWidth = 230;
  const trackHeight = 110;
  const knobSize = 92;
  const knobX = 9 + (trackWidth - knobSize - 18) * t; // 9 → 129

  return (
    <div
      style={{
        position: "relative",
        width: trackWidth,
        height: trackHeight,
        borderRadius: trackHeight / 2,
        background: `linear-gradient(90deg, rgba(255,255,255,0.10), ${accent} ${t * 100}%, rgba(255,255,255,0.10) ${t * 100 + 0.1}%)`,
        border: "1.5px solid rgba(255,255,255,0.18)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 ${28 * glow}px ${accentGlow}`,
      }}
    >
      {/* Knob */}
      <div
        style={{
          position: "absolute",
          top: (trackHeight - knobSize) / 2,
          left: knobX,
          width: knobSize,
          height: knobSize,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #E5E5E7 60%, #C7C7CC 100%)",
          boxShadow:
            "0 5px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      />
    </div>
  );
};

// Lock icon — padlock body + shackle. Shackle rotates open as t goes 0→1.
const LockToggle: React.FC<{
  t: number;
  accent: string;
  accentGlow: string;
  glow: number;
}> = ({ t, accent, accentGlow, glow }) => {
  const shackleRot = -45 * t; // closed=0, open=-45deg
  const isOpen = t > 0.6;

  return (
    <div style={{ position: "relative", width: 180, height: 206 }}>
      <svg viewBox="0 0 140 160" width={180} height={206}>
        {/* Glow ring */}
        <circle
          cx={70}
          cy={100}
          r={64}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          opacity={glow * 0.5}
          filter={`drop-shadow(0 0 ${20 * glow}px ${accentGlow})`}
        />
        {/* Shackle */}
        <g
          style={{
            transform: `rotate(${shackleRot}deg)`,
            transformOrigin: "92px 60px",
          }}
        >
          <path
            d="M 40 60 Q 40 20, 70 20 Q 100 20, 100 60 L 100 80"
            fill="none"
            stroke={isOpen ? accent : "#E5E5E7"}
            strokeWidth={10}
            strokeLinecap="round"
          />
        </g>
        {/* Body */}
        <rect
          x={28}
          y={70}
          width={84}
          height={70}
          rx={10}
          fill={isOpen ? accent : "#22232B"}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1.5}
        />
        {/* Keyhole */}
        <circle cx={70} cy={100} r={5} fill={isOpen ? "#FFFFFF" : accent} />
        <rect x={67} y={100} width={6} height={14} fill={isOpen ? "#FFFFFF" : accent} />
      </svg>
    </div>
  );
};

// Panel slide — a horizontal panel slides open revealing content
const PanelSlide: React.FC<{ t: number; accent: string; accentGlow: string }> = ({ t, accent, accentGlow }) => {
  const slideX = -100 * (1 - t); // -100 → 0
  return (
    <div
      style={{
        position: "relative",
        width: 280,
        height: 140,
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        border: "1.5px solid rgba(255,255,255,0.18)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.3)})`,
          transform: `translateX(${slideX}%)`,
          willChange: "transform",
          boxShadow: `0 0 28px ${accentGlow}`,
        }}
      />
    </div>
  );
};

// Drawer open — a top "lid" tilts up, revealing content beneath
const DrawerOpen: React.FC<{ t: number; accent: string; accentGlow: string }> = ({ t, accent, accentGlow }) => {
  const tilt = -55 * t; // 0 → -55deg
  return (
    <div style={{ position: "relative", width: 240, height: 184 }}>
      {/* Bottom (revealed) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 12,
          right: 12,
          height: 92,
          borderRadius: "10px 10px 0 0",
          background: `linear-gradient(135deg, ${accent}, ${darken(accent, 0.3)})`,
          boxShadow: `inset 0 4px 12px rgba(0,0,0,0.35), 0 0 26px ${accentGlow}`,
        }}
      />
      {/* Lid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 104,
          borderRadius: 10,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
          border: "1.5px solid rgba(255,255,255,0.22)",
          transformOrigin: "50% 100%",
          transform: `rotateX(${tilt}deg)`,
          willChange: "transform",
        }}
      />
    </div>
  );
};

// ── State label crossfade ───────────────────────────────────────────────────

const StateLabel: React.FC<{
  fromText?: string;
  toText: string;
  t: number;
  tone: Tone;
}> = ({ fromText, toText, t, tone }) => {
  const accent = toneColor(tone);
  const fromOpacity = Math.max(0, 1 - t * 2.2);
  const toOpacity = Math.max(0, t * 2.2 - 1.2);

  return (
    <div
      style={{
        position: "relative",
        height: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 160,
      }}
    >
      {fromText && (
        <span
          style={{
            position: "absolute",
            ...TYPE.eyebrow,
            fontFamily: isHebrew(fromText) ? FONTS.body : TYPE.eyebrow.fontFamily,
            fontSize: 30,
            fontWeight: 700,
            color: COLORS.textTertiary,
            opacity: fromOpacity,
            letterSpacing: "0.12em",
            ...latinIsolate(fromText),
          }}
        >
          {fromText.toUpperCase()}
        </span>
      )}
      <span
        style={{
          position: "absolute",
          ...TYPE.eyebrow,
          fontFamily: isHebrew(toText) ? FONTS.body : TYPE.eyebrow.fontFamily,
          fontSize: 34,
          fontWeight: 800,
          color: accent,
          opacity: toOpacity,
          letterSpacing: "0.12em",
          textShadow: `0 0 18px ${toneGlow(tone)}`,
          ...latinIsolate(toText),
        }}
      >
        {toText.toUpperCase()}
      </span>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergeTransforms(...parts: Array<string | undefined>): string | undefined {
  const joined = parts.filter(Boolean).join(" ");
  return joined || undefined;
}

/** Latin runs embedded in the RTL layout read LTR + isolated (Law 8). */
function latinIsolate(s: string): React.CSSProperties | undefined {
  return /[A-Za-z]/.test(s) && !isHebrew(s)
    ? { direction: "ltr", unicodeBidi: "isolate" }
    : undefined;
}

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
