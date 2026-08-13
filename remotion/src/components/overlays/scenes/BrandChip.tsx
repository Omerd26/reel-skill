/**
 * BrandChip — the REAL logo of a platform the speaker just mentioned
 * (owner 2026-08-09: "אם אני מדבר על אינסטגרם — שימשוך את האייקון של
 * אינסטגרם"). Lands on the mention word (sync land +0.25), chest level.
 *
 * The logo arrives as an ABSOLUTE https URL (pipeline /asset/ route) so the
 * box renderer and the browser preview load the exact same file — the
 * user_image pattern. No bundle sync involved. If the URL is missing the
 * chip renders name-only (graceful).
 *
 * Nominative use: a small chip while talking ABOUT the platform — never a
 * frame-filling hero, never implying endorsement.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { resolveAnchor } from "../primitives";
import type { OverlayAnchor } from "../primitives";
import { useEntrance } from "../motion";
import { easeFn } from "../../../design/tokens";

export interface BrandChipScene {
  type: "brand_chip";
  id: string;
  start: number;
  end: number;
  /** Display name, e.g. "Instagram". */
  name: string;
  /** Absolute https URL of the brand SVG (pipeline /asset/ route). */
  logo_url?: string;
  /** Official brand hex for the accent ring. */
  brand_hex?: string;
  /** Optional Hebrew context line under the name. */
  sub_text?: string;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: BrandChipScene;
}

const hexToRgb = (hex?: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "224,112,30";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

export const BrandChip: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const rgb = hexToRgb(scene.brand_hex);

  const entrance = useEntrance({
    signature: "depth-pop",
    ease: "glass-rise",
    durationSec: 0.4,
  });

  // Logo pop — spring-like scale via eased interpolate.
  const logoT = interpolate(
    frame,
    [0, Math.round(0.38 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-firm") },
  );
  // Breathing brand-color glow — a soft radial POOL behind the mark, never
  // a box (owner 2026-08-09: "רק הם, בלי כלום — לא בתוך קופסא עם כיתוב").
  const glowPulse = 0.45 + 0.25 * (0.5 + 0.5 * Math.sin((frame / (2.8 * fps)) * Math.PI * 2));

  if (!scene.logo_url) return null; // bare-logo design: no logo → no scene

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div style={entrance}>
          <div
            style={{
              position: "relative",
              width: 150,
              height: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Soft radial glow pool — light, not chrome. */}
            <div
              style={{
                position: "absolute",
                inset: -60,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(${rgb},${(0.4 * glowPulse).toFixed(3)}) 0%, transparent 65%)`,
              }}
            />
            <Img
              src={scene.logo_url}
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                transform: `scale(${0.55 + 0.45 * logoT})`,
                opacity: logoT,
                filter:
                  "drop-shadow(0 4px 14px rgba(0,0,0,0.55)) " +
                  `drop-shadow(0 0 22px rgba(${rgb},0.45))`,
              }}
              pauseWhenLoading
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
