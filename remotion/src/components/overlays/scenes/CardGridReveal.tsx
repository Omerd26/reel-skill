/**
 * CardGridReveal — N glass cards cascade in.
 *
 * Adopted from may-shorts-19 scene5-benefits: 3 vertical cards in a row,
 * each cascades in with `back.out(1.3)`, then secondary motion fires
 * (underline sweep + checkmark pop top-right) once all cards are in.
 *
 * Layout: optional headline at top, then a horizontal row of 2-3 cards.
 * Each card has eyebrow + number + simple icon + title + body.
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useEntrance, useAmbient, staggerOffset } from "../motion";
import {
  GlassCard,
  ChromeText,
  Eyebrow,
  AccentUnderline,
  resolveAnchor,
} from "../primitives";
import { TYPE, COLORS, easeFn, toneColor, type Tone } from "../../../design/tokens";
import type { CardGridRevealScene, GridCard } from "../types";
import { interpolate, useCurrentFrame } from "remotion";

interface Props {
  scene: CardGridRevealScene;
}

export const CardGridReveal: React.FC<Props> = ({ scene }) => {
  const rtl = scene.rtl ?? true;
  const layout = scene.layout ?? "row";
  const cards = scene.cards;
  const isBlurred = scene.blurred === true;
  // Card grids span the full frame — they're full-screen takeover by nature.
  // Anchor top-center keeps them above the speaker's head when the face
  // is still in frame.
  const anchor = resolveAnchor(scene.anchor ?? "top-center");

  const headlineEntrance = useEntrance({
    signature: "fade",
    durationSec: 0.30,
    offsetFrames: 0,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          ...anchor,
          // 800 (was 980): the global ×1.3 overlay scale would push 980 to
          // 1274px — past the 1080 frame. 800×1.3 = 1040 fits.
          width: 800,
          direction: rtl ? "rtl" : "ltr",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        {/* TEASE LABEL — names WHAT is hidden (playbook §1.2: the blurred
            checklist hook; owner 2026-08-09: label above the censored
            object so viewers realize it's deliberately hidden). */}
        {isBlurred && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 900,
              fontSize: 46,
              direction: "rtl",
              color: "#E0701E",
              textShadow: "0 0 24px rgba(224,112,30,0.65), 0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {scene.tease_label || "הסוד:"}
          </div>
        )}
        {/* TEASE: card SHAPES stay crisp (solid-dark chrome), contents
            unreadable — the censored-checklist move. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
            width: "100%",
            ...(isBlurred ? { filter: "blur(9px)", opacity: 0.6 } : {}),
          }}
        >
          {scene.headline && (
            <div style={headlineEntrance}>
              <Eyebrow
                tone="neutral"
                script={isHebrew(scene.headline) ? "hebrew" : "latin"}
                style={{
                  fontSize: 32,
                  letterSpacing: "0.18em",
                  color: COLORS.textSecondary,
                }}
              >
                {scene.headline}
              </Eyebrow>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: layout === "row" ? "row" : "column",
              gap: 24,
              width: "100%",
              justifyContent: "center",
            }}
          >
            {cards.map((card, i) => (
              <CardItem
                key={`grid-card-${i}`}
                card={card}
                index={i}
                total={cards.length}
                material={isBlurred ? "solid-dark" : (scene.material ?? "solid-dark")}
                rtl={rtl}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── CardItem ─────────────────────────────────────────────────────────────────

interface CardItemProps {
  card: GridCard;
  index: number;
  total: number;
  material: NonNullable<CardGridRevealScene["material"]>;
  rtl: boolean;
}

const CardItem: React.FC<CardItemProps> = ({ card, index, total, material, rtl }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const offsetFrames = staggerOffset(index, fps, 280); // longer stagger — each card is its own beat

  const cardEntrance = useEntrance({
    signature: "stack-cascade",
    ease: "bounce-soft",   // back.out(1.4) — the may-shorts-19 lift
    durationSec: 0.50,
    offsetFrames,
  });

  // Secondary motion: underline sweep starts after all cards are in (~1.0s after first stagger).
  const allInOffset = offsetFrames + Math.round(0.60 * fps) + Math.round(0.30 * fps) * (total - 1 - index);
  const underlineProgress = interpolate(
    frame,
    [allInOffset, allInOffset + Math.round(0.32 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeFn("confident"),
    },
  );

  const ambient = useAmbient({
    startAfterSec: (offsetFrames / fps) + 1.0,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.0,
  });

  const tone: Tone = card.tone ?? "brand";

  return (
    <div
      style={{
        flex: 1,
        ...cardEntrance,
        transform: mergeTransforms(cardEntrance.transform, ambient.transform),
      }}
    >
      <GlassCard
        material={material}
        accentTone={tone === "neutral" ? undefined : tone}
        rtl={rtl}
        padding={card.body || card.icon ? "32px 28px" : "22px 24px"}
        style={{
          // COMPACT MODE (owner 2026-08-09: the grid "עולה לי על הפרצוף"):
          // number+title-only cards (the enumeration counting device) stay
          // short so the whole grid ends above the speaker's face. The tall
          // 460px editorial card survives only when there's body/icon
          // content to justify it.
          ...(card.body || card.icon ? { height: 460 } : { minHeight: 150 }),
          display: "flex",
          flexDirection: "column",
          gap: card.body || card.icon ? 18 : 10,
        }}
      >
        {card.eyebrow && (
          <Eyebrow
            tone={tone}
            script={isHebrew(card.eyebrow) ? "hebrew" : "latin"}
            style={{ fontSize: 20 }}
          >
            {card.eyebrow}
          </Eyebrow>
        )}

        {card.number && (
          <div
            style={{
              ...TYPE.meta,
              fontSize: 36,
              color: tone === "neutral" ? COLORS.text : toneColor(tone),
              fontWeight: 700,
            }}
          >
            {card.number}
          </div>
        )}

        {card.icon && <CardIcon kind={card.icon} tone={tone} />}

        <div style={{ marginTop: "auto", position: "relative", paddingBottom: 20 }}>
          <ChromeText
            role="sectionTitle"
            tone={tone === "brand" ? "neutral" : tone}
            style={{
              ...TYPE.sectionTitle,
              fontSize: 38,
              lineHeight: 1.05,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {card.title}
          </ChromeText>
          {card.body && (
            <div
              style={{
                ...TYPE.body,
                fontSize: 22,
                color: "rgba(255,255,255,0.74)",
                marginTop: 8,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {card.body}
            </div>
          )}
          <AccentUnderline tone={tone} progress={underlineProgress} thickness={4} />
        </div>
      </GlassCard>
    </div>
  );
};

// ── Mini stroke icons (SVG, accent-tinted) ──────────────────────────────────

const CardIcon: React.FC<{ kind: NonNullable<GridCard["icon"]>; tone: Tone }> = ({
  kind,
  tone,
}) => {
  const color = toneColor(tone);
  const common = {
    width: 96,
    height: 96,
    viewBox: "0 0 80 80",
    fill: "none",
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "save":
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="30" />
          <line x1="40" y1="40" x2="40" y2="20" />
          <line x1="40" y1="40" x2="54" y2="46" />
        </svg>
      );
    case "fix":
      return (
        <svg {...common}>
          <path d="M18 56 L40 34 L46 40 L24 62 Z" />
          <circle cx="58" cy="22" r="8" />
          <line x1="50" y1="30" x2="40" y2="40" />
        </svg>
      );
    case "speed":
      return (
        <svg {...common}>
          <path d="M14 44 L28 30 L34 36 L52 18" />
          <polyline points="40,18 52,18 52,30" />
        </svg>
      );
    case "scale":
      return (
        <svg {...common}>
          <rect x="14" y="14" width="22" height="22" rx="3" />
          <rect x="44" y="44" width="22" height="22" rx="3" />
          <line x1="36" y1="22" x2="44" y2="22" />
          <line x1="22" y1="36" x2="22" y2="44" />
        </svg>
      );
    case "secure":
      return (
        <svg {...common}>
          <path d="M40 14 L62 22 V42 C62 54 50 64 40 66 C30 64 18 54 18 42 V22 Z" />
          <path d="M30 40 L38 48 L52 32" />
        </svg>
      );
    case "automate":
      return (
        <svg {...common}>
          <rect x="14" y="18" width="52" height="36" rx="4" />
          <line x1="30" y1="62" x2="50" y2="62" />
          <line x1="40" y1="54" x2="40" y2="62" />
          <circle cx="40" cy="36" r="6" />
        </svg>
      );
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergeTransforms(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function isHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}
