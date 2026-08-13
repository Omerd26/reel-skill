/**
 * NotificationCard — a REAL iOS push notification, dark-mode.
 *
 * Rebuilt 2026-08-09 against the OVERLAY QUALITY LAWS:
 *   - Law 2: this is one of the few sanctioned CARDS — it represents a real
 *     UI object (a push notification), so the panel stays.
 *   - Law 1: the panel is the approved #1C1D24→#15161C dark gradient (the
 *     MetricLockup chrome) — the old translucent "liquid" surface was
 *     invisible over bright footage.
 *   - Law 3 (BIG): icon 84px, title 36px/800, body 27px, meta 21px — pre the
 *     global ×1.3 anchor scale. Card width 620 (×1.3 = 806 < 1080).
 *   - Law 8 (RTL): Hebrew-first layout (icon on the right, text right-
 *     aligned); Latin/number runs (app name, "now") get an isolated LTR run.
 *   - Law 5: renders null when both title and body are empty; empty
 *     app_name/time_label omit their slots (time falls back to the iOS
 *     "עכשיו" — UI chrome, not content).
 *   - Law 6 + CTA pre-visualization pair: the entrance must POP ON LAND —
 *     spring drop from the top edge (real iOS banner physics) with a
 *     soft overshoot and a glow flash exactly at touchdown. Frame-driven,
 *     deterministic, ≤0.5s. No exit animation.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useAmbient } from "../motion";
import { resolveAnchor } from "../primitives";
import { COLORS, FONTS, TYPE } from "../../../design/tokens";
import type { NotificationCardScene } from "../types";

interface Props {
  scene: NotificationCardScene;
}

// The approved dark-panel chrome (MetricLockup reference).
const PANEL_BG = "linear-gradient(180deg, #1C1D24 0%, #15161C 100%)";

export const NotificationCard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = scene.rtl ?? true;
  // iOS banners live at the top of the screen — top-center is the honest
  // default and keeps the card out of the face band.
  const anchor = resolveAnchor(scene.anchor ?? "top-center");
  const iconColor = scene.app_icon_color ?? COLORS.accentBrand;

  // Law 5 — a notification with no content is nothing. Omit entirely.
  const title = scene.title?.trim();
  const body = scene.body?.trim();
  if (!title && !body) return null;

  const appName = scene.app_name?.trim();
  const iconLetter =
    scene.app_icon_letter?.trim() || (appName ? appName.slice(0, 1).toUpperCase() : "");

  // ── Entrance: spring drop from the top, lands with a pop (≤0.5s) ──────────
  const drop = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 190, mass: 0.9 },
    durationInFrames: Math.round(0.5 * fps),
  });
  const translateY = interpolate(drop, [0, 1], [-150, 0]);
  const scale = interpolate(drop, [0, 1], [0.94, 1]);
  const opacity = interpolate(frame, [0, Math.round(0.16 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Touchdown flash — the "pop on land" beat for the CTA pair. The card's
  // shadow + icon glow surge right as the spring settles, then relax into a
  // gentle deterministic breath (the always-alive element).
  const flash = interpolate(
    frame,
    [Math.round(0.2 * fps), Math.round(0.38 * fps), Math.round(1.0 * fps)],
    [0, 1, 0.35],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const breath = 0.5 + 0.5 * Math.sin(((frame / fps) * Math.PI * 2) / 3.8);
  const glowLevel = flash * (0.75 + 0.25 * breath);

  const ambient = useAmbient({
    startAfterSec: 0.8,
    kind: "y-bob",
    amplitude: 3,
    periodSec: 4.5,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            opacity,
            transform: mergeTransforms(
              `translate3d(0px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
              ambient.transform,
            ),
            willChange: "transform, opacity",
          }}
        >
          <div
            style={{
              background: PANEL_BG,
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: [
                "inset 0 1px 0 rgba(255,255,255,0.12)",
                "0 24px 60px rgba(0,0,0,0.6)",
                `0 0 ${Math.round(18 + 26 * glowLevel)}px ${withAlpha(iconColor, 0.30 * glowLevel)}`,
              ].join(", "),
              borderRadius: 30,
              padding: "24px 26px",
              width: 620,
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              direction: rtl ? "rtl" : "ltr",
            }}
          >
            {/* App icon — letter-as-icon, brand-clean (real iOS geometry). */}
            {iconLetter && (
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${iconColor}, ${darken(iconColor, 0.28)})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 6px ${Math.round(16 + 14 * glowLevel)}px ${withAlpha(iconColor, 0.35 + 0.25 * glowLevel)}`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 44,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    lineHeight: 1,
                  }}
                >
                  {iconLetter}
                </span>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* App name + timestamp row (iOS meta strip) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 12,
                }}
              >
                {appName ? (
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 21,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      ...bidiFor(appName),
                    }}
                  >
                    {appName}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 20,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.42)",
                    ...bidiFor(scene.time_label?.trim() || "עכשיו"),
                  }}
                >
                  {scene.time_label?.trim() || "עכשיו"}
                </span>
              </div>

              {title && (
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 36,
                    fontWeight: 800,
                    color: COLORS.text,
                    lineHeight: 1.2,
                    marginBottom: body ? 6 : 0,
                    textAlign: rtl ? "right" : "left",
                    ...bidiFor(title),
                  }}
                >
                  {title}
                </div>
              )}
              {body && (
                <div
                  style={{
                    ...TYPE.body,
                    fontSize: 27,
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.32,
                    textAlign: rtl ? "right" : "left",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    ...bidiFor(body),
                  }}
                >
                  {body}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergeTransforms(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  }
  return hex;
}

function darken(hex: string, amount: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

/** Latin/number runs inside the RTL card get an isolated LTR run (Law 8). */
function bidiFor(s: string): React.CSSProperties {
  return isHebrew(s)
    ? {}
    : { direction: "ltr", unicodeBidi: "isolate" as const };
}
