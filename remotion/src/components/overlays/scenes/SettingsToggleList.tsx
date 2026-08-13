/**
 * SettingsToggleList — visual metaphor for "settings panel", "what to enable",
 * "list of options to flip".
 *
 * Direct reference: @softgirlnocode reel (2026-04-25), frames at 27–29s.
 * Anatomy: a glass card with a title + body line, and N rows each with a
 * label + iOS-style toggle. Toggles can flip in sequence to demonstrate
 * a setup or a "disable these" pattern.
 *
 * Use cases:
 *   - "כבי את כל ה-MCPs שאת לא משתמשת" → 3 toggles, each flips ON→OFF
 *   - "Choose what to sync" → 4 toggles flip OFF→ON in sequence
 *   - "Settings made simple" → demonstrates checklist clarity
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEntrance } from "../motion";
import {
  CornerBadge,
  Eyebrow,
  GlassCard,
  HaloGlow,
  resolveAnchor,
  type OverlayAnchor,
} from "../primitives";
import {
  COLORS,
  FONTS,
  RADIUS,
  TYPE,
  WARM,
  easeFn,
  toneColor,
  toneGlow,
  type GlassMaterial,
  type Tone,
} from "../../../design/tokens";

export interface SettingsToggleRow {
  /** Label shown next to the toggle. */
  label: string;
  /** Initial state. */
  from_state: "on" | "off";
  /** Final state — animates from from→to. */
  to_state: "on" | "off";
  /** Local time offset (seconds within the scene) when this toggle flips.
   * If unset, falls back to a sequenced default at i*0.30s + 0.85s. */
  flip_at_sec?: number;
}

export interface SettingsToggleListScene {
  type: "settings_toggle_list";
  id: string;
  start: number;
  end: number;
  /** Card title. e.g. "Unused MCP", "Notifications". */
  title: string;
  /** One-line body explanation. */
  body?: string;
  /** Eyebrow above title. e.g. "PRACTICAL FIX". */
  eyebrow?: string;
  /** Toggle rows. 2-5 work best. */
  rows: SettingsToggleRow[];
  /** Optional corner badge. e.g. "Cleaner state". */
  corner_badge?: string;
  corner_badge_tone?: Tone;
  /** Tone — colors active toggles. Default "brand". */
  tone?: Tone;
  /** Material. Default "warm". */
  material?: GlassMaterial;
  anchor?: OverlayAnchor;
  rtl?: boolean;
  /** Tease state (JATHO_PLAYBOOK §1.2): ALL row labels blurred/unreadable,
   * all toggles forced OFF, faint breathing glow. Card chrome + knobs stay
   * crisp — show the SHAPE of the payoff, censor its content.
   * Default undefined = normal behavior. */
  blurred?: boolean;
  /** Recallable progress state (JATHO §3.2 "the hook graphic is the progress
   * bar"): rows 0..revealed_count-1 render unblurred + ON, rows at or above
   * it render blurred + OFF. Takes precedence over `blurred` when set.
   * Default undefined = normal behavior. */
  revealed_count?: number;
  transcript_phrase?: string;
  rationale?: string;
  /** Planner sync metadata (JATHO §2) — carried through, ignored here. */
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: SettingsToggleListScene;
}

export const SettingsToggleList: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Dark by default (law 1) — the warm/light card is now opt-in only.
  const material = scene.material ?? "frosted";
  const isWarm = material === "warm";
  const tone: Tone = scene.tone ?? "brand";
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const rtl = scene.rtl ?? isHebrew(scene.title);
  const rows = scene.rows.slice(0, 5);

  // Per-row render mode. revealed_count wins over blurred; both undefined
  // = exactly the pre-existing rendering path ("normal").
  const rowMode = (i: number): RowMode => {
    if (scene.revealed_count !== undefined) {
      return i < scene.revealed_count ? "revealed" : "blurred";
    }
    if (scene.blurred === true) return "blurred";
    return "normal";
  };
  const anyBlurred = rows.some((_, i) => rowMode(i) === "blurred");

  // Faint deterministic breathing glow while any row is censored (mystery).
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 3.4);
  const mysteryGlow = anyBlurred ? 0.14 + 0.14 * breath : 0;

  const cardEntrance = useEntrance({
    signature: "stack-cascade",
    ease: "glass-rise",
    durationSec: 0.50,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={{ ...cardEntrance, position: "relative" }}>
          <GlassCard
            material={material}
            padding="26px 28px"
            rtl={rtl}
            style={{
              width: 560,
              position: "relative",
              ...(isWarm ? {} : {
                background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)",
              }),
            }}
          >
            {scene.eyebrow && (
              <Eyebrow
                tone="neutral"
                script={isHebrew(scene.eyebrow) ? "hebrew" : "latin"}
                style={{
                  fontSize: 18,
                  marginBottom: 6,
                  color: isWarm ? WARM.textTertiary : COLORS.textTertiary,
                  letterSpacing: "0.16em",
                }}
              >
                {scene.eyebrow}
              </Eyebrow>
            )}
            <div
              style={{
                ...TYPE.sectionTitle,
                fontSize: 38,
                fontWeight: 800,
                color: isWarm ? WARM.text : COLORS.text,
                marginBottom: scene.body ? 6 : 16,
              }}
            >
              {scene.title}
            </div>
            {scene.body && (
              <div
                style={{
                  ...TYPE.body,
                  fontSize: 22,
                  color: isWarm ? WARM.textSecondary : COLORS.textSecondary,
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                {scene.body}
              </div>
            )}

            {/* Toggle rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map((row, i) => (
                <ToggleRow
                  key={`tr-${i}`}
                  row={row}
                  index={i}
                  tone={tone}
                  isWarm={isWarm}
                  mode={rowMode(i)}
                />
              ))}
            </div>

            {scene.corner_badge && (
              <CornerBadge
                label={scene.corner_badge}
                corner="top-right"
                tone={scene.corner_badge_tone ?? tone}
                theme={isWarm ? "warm" : "dark"}
              />
            )}
          </GlassCard>

          {/* Faint breathing halo — only while content is censored */}
          {anyBlurred && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: mysteryGlow,
                pointerEvents: "none",
              }}
            >
              <HaloGlow
                tone={tone}
                size={560}
                intensity={0.4}
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type RowMode = "normal" | "revealed" | "blurred";

// ── ToggleRow ───────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  row: SettingsToggleRow;
  index: number;
  tone: Tone;
  isWarm: boolean;
  /** "revealed" = unblurred + ON (recall state); "blurred" = censored + OFF. */
  mode?: RowMode;
}> = ({ row, index, tone, isWarm, mode = "normal" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = toneColor(tone);
  const accentGlow = toneGlow(tone);

  // Flip timing: explicit or sequential
  const flipStartSec = row.flip_at_sec ?? 0.85 + index * 0.30;
  const flipStartFrame = Math.round(flipStartSec * fps);
  const flipT = interpolate(
    frame,
    [flipStartFrame, flipStartFrame + Math.round(0.35 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft") },
  );

  // State morph: from_state at t=0, to_state at t=1
  // We render the visual state as a scalar 0 (off) → 1 (on).
  // blurred = forced OFF (tease); revealed = forced ON (recall/progress).
  const fromVal = row.from_state === "on" ? 1 : 0;
  const toVal = row.to_state === "on" ? 1 : 0;
  const visualState =
    mode === "blurred" ? 0 :
    mode === "revealed" ? 1 :
    fromVal + (toVal - fromVal) * flipT;
  const glowFactor = mode === "revealed" ? 1 : flipT;

  const trackWidth = 70;
  const trackHeight = 40;
  const knobSize = 30;
  const knobX = 4 + (trackWidth - knobSize - 8) * visualState;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        borderRadius: RADIUS.md,
        background: isWarm ? WARM.rowBg : "rgba(255,255,255,0.04)",
        border: isWarm
          ? "1px solid rgba(120,100,75,0.10)"
          : `1px solid ${COLORS.borderHairline}`,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: 24,
          fontWeight: 600,
          color: isWarm ? WARM.text : COLORS.text,
          letterSpacing: "-0.005em",
          // Censored label: unreadable, but row chrome + knob stay sharp.
          ...(mode === "blurred"
            ? { filter: "blur(9px)", opacity: 0.55 }
            : null),
        }}
      >
        {row.label}
      </span>

      {/* Toggle */}
      <div
        style={{
          position: "relative",
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          background:
            visualState > 0.5
              ? `linear-gradient(90deg, ${accent}, ${darken(accent, 0.15)})`
              : isWarm
              ? "rgba(160,150,135,0.30)"
              : "rgba(255,255,255,0.10)",
          boxShadow:
            visualState > 0.5
              ? `inset 0 1px 0 rgba(255,255,255,0.25), 0 0 ${10 * glowFactor}px ${accentGlow}`
              : "inset 0 1px 0 rgba(255,255,255,0.08)",
          transition: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: (trackHeight - knobSize) / 2,
            left: knobX,
            width: knobSize,
            height: knobSize,
            borderRadius: "50%",
            background:
              visualState > 0.5
                ? "#FFFFFF"
                : "linear-gradient(135deg, #FFFFFF, #DCDCE0)",
            boxShadow:
              "0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.55)",
            willChange: "left",
          }}
        />
      </div>
    </div>
  );
};

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
