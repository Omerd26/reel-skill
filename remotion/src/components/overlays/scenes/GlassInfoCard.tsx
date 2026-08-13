/**
 * GlassInfoCard — the workhorse "statement" scene.
 *
 * REBUILT 2026-08-09 per the overlay quality laws (7 owner review rounds):
 *
 *   Law 1 (legibility on ANY background): the old default was white text on
 *   translucent liquid glass — invisible over a white ceiling. Now every
 *   render path carries its own contrast: free typography gets a heavy dark
 *   text-shadow + glow; the panel path sits on the solid dark
 *   #1C1D24→#15161C gradient family (the approved MetricLockup look).
 *
 *   Law 2 (no boxes around plain text): a title (with optional eyebrow) is
 *   NOT a card object — it renders as free typography in the de-boxed
 *   TitlePill language: Heebo 900, ONE auto-picked accent word (digit-bearing
 *   token, else the longest word) in the tone color with a breathing glow.
 *   Only when a `body` is present does the scene become an info PANEL — a
 *   real UI object (header + copy block) — rendered dark, with an accent edge.
 *
 *   Law 3 (big): title 40–58px pre-scale (global ×1.3 anchor scale applies on
 *   top), body ≥26px. Widths capped at 800 (CONTENT_W) so ×1.3 fits 1080 —
 *   the old "wide" 940px overflowed the frame after scaling.
 *
 *   Law 5 (real content only): empty title → renders nothing; empty
 *   eyebrow/body are omitted entirely.
 *
 *   Law 8 (RTL first): Hebrew-first layout; embedded latin/number tokens get
 *   direction:ltr + unicode-bidi:isolate.
 *
 * Contract unchanged: type "glass_info_card", all props honored. `material`
 * is still ACCEPTED for back-compat but translucent materials are overridden
 * by the legibility law — text never sits on unscrimmed glass.
 */
import React, { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useEntrance, useAmbient } from "../motion";
import { GlassCard, Eyebrow, HaloGlow, resolveAnchor } from "../primitives";
import { COLORS, FONTS, toneColor, type Tone } from "../../../design/tokens";
import type { GlassInfoCardScene } from "../types";

interface Props {
  scene: GlassInfoCardScene;
}

// Pre-scale widths — the global 1.3× anchor scale multiplies these, so the
// ceiling is CONTENT_W (800): 800×1.3 = 1040 < 1080. The old wide=940 broke.
const WIDTH_MAP: Record<NonNullable<GlassInfoCardScene["width"]>, number> = {
  narrow: 560,
  medium: 700,
  wide:   800,
};

// Heavy dark shadow — free typography carries its OWN contrast (Law 1).
const DARK_SHADOW =
  "0 4px 30px rgba(0,0,0,0.85), 0 1px 6px rgba(0,0,0,0.60)";

export const GlassInfoCard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = (scene.title ?? "").trim();
  const body = (scene.body ?? "").trim();
  const eyebrow = (scene.eyebrow ?? "").trim();
  const rtl = scene.rtl ?? true;
  const tone: Tone = scene.tone ?? "neutral";
  // The accent word needs a REAL color — "neutral" would paint it white.
  const accentTone: Tone = tone === "neutral" ? "brand" : tone;
  const accent = toneColor(accentTone);
  const accentRgb = hexToRgb(accent);
  const maxWidth = WIDTH_MAP[scene.width ?? "medium"];
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const hasPanel = body.length > 0;

  // ── Motion (all frame-driven; ≥3 distinct eases across the stages) ────────
  const shellEntrance = useEntrance({
    signature: scene.entrance ?? (hasPanel ? "glass-rise" : "depth-pop"),
    durationSec: hasPanel ? 0.5 : 0.45,
  });
  const eyebrowEntrance = useEntrance({
    signature: "fade",
    durationSec: 0.3,
    offsetFrames: Math.round(0.05 * fps),
  });
  const titleEntrance = useEntrance({
    signature: "depth-pop",
    durationSec: 0.4,
    offsetFrames: Math.round(0.08 * fps),
  });
  const bodyEntrance = useEntrance({
    signature: "stack-cascade",
    durationSec: 0.4,
    offsetFrames: Math.round(0.24 * fps),
  });
  const ambient = useAmbient({
    startAfterSec: 0.8,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.0,
  });

  // Breathing glow on the accent word — the "always alive" element (Law 6).
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 3.6);
  const accentGlowA = 0.35 + 0.25 * breath;

  // Law 5: meaningless without its main prop → render nothing at all.
  if (!title) return null;

  // ── ONE accent word — TitlePill language ─────────────────────────────────
  const words = title.split(/\s+/).filter(Boolean);
  let accentIdx = words.findIndex((w) => /\d/.test(w));
  if (accentIdx < 0 && words.length > 1) {
    accentIdx = words.reduce(
      (best, w, i) => (w.length > words[best].length ? i : best),
      0,
    );
  }

  const accentShadow =
    `0 0 24px rgba(${accentRgb},${accentGlowA.toFixed(3)}), ` +
    `0 0 60px rgba(${accentRgb},${(accentGlowA * 0.45).toFixed(3)}), ` +
    `0 4px 30px rgba(0,0,0,0.85)`;

  const titleNode: ReactNode = words.map((w, i) => (
    <React.Fragment key={i}>
      {i > 0 ? " " : ""}
      <span
        style={{
          ...(isLatinRun(w)
            ? { direction: "ltr" as const, unicodeBidi: "isolate" as const }
            : null),
          ...(i === accentIdx
            ? { color: accent, textShadow: accentShadow }
            : null),
        }}
      >
        {w}
      </span>
    </React.Fragment>
  ));

  const titleSize = fitTitleSize(title.length, hasPanel);

  const eyebrowEl = eyebrow ? (
    <div style={eyebrowEntrance}>
      <Eyebrow
        tone={accentTone}
        script={isHebrew(eyebrow) ? "hebrew" : "latin"}
        style={{
          marginBottom: 14,
          fontSize: 23,
          fontWeight: 800,
          textAlign: hasPanel ? (rtl ? "right" : "left") : "center",
          // Free typography: the eyebrow carries its own contrast too.
          ...(hasPanel ? null : { textShadow: DARK_SHADOW }),
        }}
      >
        {eyebrow}
      </Eyebrow>
    </div>
  ) : null;

  const titleEl = (
    <div
      style={{
        ...titleEntrance,
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: titleSize,
        lineHeight: 1.16,
        letterSpacing: "-0.01em",
        color: COLORS.text,
        direction: rtl ? "rtl" : "ltr",
        textAlign: hasPanel ? (rtl ? "right" : "left") : "center",
        textShadow: hasPanel
          ? "0 2px 12px rgba(0,0,0,0.55)"
          : DARK_SHADOW,
      }}
    >
      {titleNode}
    </div>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        {/* Soft halo — the "lit, not colored" feel */}
        <div style={{ position: "absolute", inset: 0, opacity: hasPanel ? 0.45 : 0.3 }}>
          <HaloGlow
            tone={accentTone}
            size={maxWidth * 1.1}
            intensity={0.45}
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        <div
          style={{
            ...shellEntrance,
            transform: mergeTransforms(shellEntrance.transform, ambient.transform),
            maxWidth,
          }}
        >
          {hasPanel ? (
            // ── PANEL MODE — a real info object: dark panel, accent edge ──
            <GlassCard
              material="solid-dark"
              width={maxWidth}
              accentTone={accentTone}
              rtl={rtl}
              padding="30px 38px"
              style={{
                background: "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6)",
              }}
            >
              {eyebrowEl}
              {titleEl}
              <div
                style={{
                  ...bodyEntrance,
                  fontFamily: FONTS.body,
                  fontSize: 27,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  marginTop: 14,
                  color: "rgba(255,255,255,0.80)",
                  direction: rtl ? "rtl" : "ltr",
                  textAlign: rtl ? "right" : "left",
                }}
              >
                {body}
              </div>
            </GlassCard>
          ) : (
            // ── FREE TYPOGRAPHY MODE — de-boxed TitlePill language ────────
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              {eyebrowEl}
              {titleEl}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Adaptive pre-scale title size — never below the 38px law-3 floor. */
function fitTitleSize(len: number, panel: boolean): number {
  if (panel) {
    return len <= 14 ? 48 : len <= 24 ? 44 : len <= 34 ? 40 : 38;
  }
  return len <= 12 ? 58 : len <= 20 ? 52 : len <= 30 ? 46 : 40;
}

function mergeTransforms(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

/** A token with no Hebrew and at least one latin/digit → embed as LTR isolate. */
function isLatinRun(w: string): boolean {
  return !/[֐-׿]/.test(w) && /[A-Za-z0-9]/.test(w);
}

function hexToRgb(hex: string): string {
  if (!hex.startsWith("#") || hex.length !== 7) return "224,112,30";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const _cssPropertiesTypeAnchor: CSSProperties | undefined = undefined;
void _cssPropertiesTypeAnchor;
