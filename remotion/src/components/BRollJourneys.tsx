/**
 * BRollJourneys — the LONG-FORM takeover types from JATHO_PLAYBOOK §4.2
 * (owner 2026-08-09: "אם מכניסים בירולים — שיהיו ארוכים, שייקחו אותנו
 * למסע"). Three journey scenes, each ONE B-roll event of 8-16s with
 * internal beats (a state change every ≤1.5s inside):
 *
 *   screen_journey     — a guided multi-screen phone tour: generic-native
 *                        screens chained, dim+spotlight focal per beat,
 *                        glow-cursor tap, receipt chip after each action,
 *                        camera flying screen→screen. Jatho's workhorse.
 *   blueprint_map      — ONE tall vertical canvas: nodes drawn top→down by
 *                        connector lines, one node per beat, red/green
 *                        outcome branches, camera pans down then whip
 *                        zoom-out recap. The "ככה האלגוריתם עובד" format.
 *   twin_phones_funnel — two mirrored phones with counters draining/
 *                        gaining — the mechanism teach-rhyme.
 *
 * Built on SceneStage + CameraRig (origin-0,0 pose math — world coords
 * include EVERY ancestor offset).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneStage, CameraRig, type CameraPose } from "./SceneStage";
import type { BRollSceneData } from "./BRollOverlay";

const hexToRgb = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "224,112,30";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/* ═══════════════════ 1. SCREEN JOURNEY ═══════════════════ */

export const ScreenJourneyBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const steps = (scene.items || []).slice(0, 5);
  const n = Math.max(1, steps.length);

  // Screen canvas: phones laid on a diagonal, camera flies phone→phone.
  const PH_W = 620;
  const PH_H = 980;
  const STEP_X = 700;
  const STEP_Y = 420;
  const perStep = Math.max(Math.round(2.0 * fps), Math.floor((durationFrames - Math.round(0.5 * fps)) / n));
  const stepAt = (k: number) => Math.round(0.3 * fps) + k * perStep;
  let active = 0;
  for (let k = 0; k < n; k++) if (frame >= stepAt(k)) active = k;

  const phoneCenter = (k: number) => ({ x: 540 + k * STEP_X, y: 700 + k * STEP_Y });

  // Camera: centered on the active phone (origin-0,0 math).
  const SCALE = 1.0;
  const poses: CameraPose[] = steps.map((_, k) => {
    const c = phoneCenter(k);
    return {
      frame: Math.max(0, stepAt(k) - 6),
      x: 540 - c.x * SCALE,
      y: 960 - c.y * SCALE,
      scale: SCALE,
    };
  });

  return (
    <SceneStage accent={brandColor} seed={21}>
      {scene.title && (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 60,
            right: 60,
            zIndex: 20,
            textAlign: "center",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 64,
            color: "#FFFFFF",
            direction: "rtl",
            textShadow: "0 3px 14px rgba(0,0,0,0.9)",
          }}
        >
          {scene.title}
        </div>
      )}
      {/* step progress dots — fixed to frame, above the camera world */}
      <div
        style={{
          position: "absolute",
          top: 290,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          direction: "rtl",
        }}
      >
        {steps.map((_, k) => (
          <div
            key={k}
            style={{
              width: k === active ? 34 : 14,
              height: 14,
              borderRadius: 7,
              background: k <= active ? brandColor : "rgba(255,255,255,0.25)",
              boxShadow: k === active ? `0 0 14px rgba(${rgb},0.8)` : undefined,
            }}
          />
        ))}
      </div>
      <CameraRig poses={poses} settleDrift={false}>
        {steps.map((st, k) => {
          const c = phoneCenter(k);
          const sAt = stepAt(k);
          const tapT = interpolate(frame, [sAt + Math.round(0.55 * fps), sAt + Math.round(0.75 * fps)], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const receiptT = interpolate(frame, [sAt + Math.round(0.9 * fps), sAt + Math.round(1.15 * fps)], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const isActive = k === active;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: c.x - PH_W / 2,
                top: c.y - PH_H / 2,
                width: PH_W,
                height: PH_H,
                borderRadius: 56,
                background: "linear-gradient(180deg, #1E1F27 0%, #14151B 100%)",
                border: `3px solid ${isActive ? brandColor : "rgba(255,255,255,0.18)"}`,
                boxShadow: isActive
                  ? `0 60px 120px -30px rgba(0,0,0,0.75), 0 0 44px rgba(${rgb},0.3)`
                  : "0 40px 90px -30px rgba(0,0,0,0.7)",
                filter: isActive ? "none" : "brightness(0.55)",
                overflow: "hidden",
              }}
            >
              {/* status bar */}
              <div style={{ height: 54, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22, color: "rgba(255,255,255,0.8)" }}>
                9:41
              </div>
              {/* screen header */}
              <div
                style={{
                  padding: "18px 34px 14px",
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 900,
                  fontSize: 40,
                  color: "#FFFFFF",
                  direction: "rtl",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {st.text}
              </div>
              {/* generic rows with ONE focal action row */}
              {[0, 1, 2, 3].map((r) => {
                const focal = r === 1;
                return (
                  <div
                    key={r}
                    style={{
                      margin: "16px 30px 0",
                      height: 96,
                      borderRadius: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 26px",
                      direction: "rtl",
                      background: focal ? `rgba(${rgb},${0.14 + 0.1 * tapT})` : "rgba(255,255,255,0.05)",
                      border: focal ? `2px solid rgba(${rgb},${0.5 + 0.4 * tapT})` : "1px solid rgba(255,255,255,0.08)",
                      filter: focal ? "none" : "brightness(0.7)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Heebo', sans-serif",
                        fontWeight: focal ? 800 : 600,
                        fontSize: focal ? 30 : 26,
                        color: focal ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {focal ? st.sub_text || st.text : "···"}
                    </span>
                    {focal && (
                      <span
                        style={{
                          width: 66,
                          height: 40,
                          borderRadius: 20,
                          background: tapT > 0.5 ? brandColor : "rgba(255,255,255,0.15)",
                          position: "relative",
                          boxShadow: tapT > 0.5 ? `0 0 16px rgba(${rgb},0.7)` : undefined,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 4 + (66 - 32 - 8) * tapT,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            background: "#FFF",
                          }}
                        />
                      </span>
                    )}
                  </div>
                );
              })}
              {/* glow cursor tap on the focal row */}
              {isActive && tapT > 0 && tapT < 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 208,
                    right: 90,
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(${rgb},0.9) 0%, rgba(${rgb},0) 70%)`,
                    transform: `scale(${1 + tapT})`,
                    opacity: 1 - tapT * 0.6,
                  }}
                />
              )}
              {/* receipt chip */}
              {st.value && receiptT > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 60,
                    left: "50%",
                    transform: `translateX(-50%) scale(${receiptT})`,
                    padding: "10px 24px",
                    borderRadius: 999,
                    background: "rgba(47,163,92,0.95)",
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 26,
                    color: "#FFF",
                    direction: "rtl",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {st.value}
                </div>
              )}
            </div>
          );
        })}
      </CameraRig>
    </SceneStage>
  );
};

/* ═══════════════════ 2. BLUEPRINT MAP ═══════════════════ */

export const BlueprintMapBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const nodes = (scene.items || []).slice(0, 5);
  const n = Math.max(1, nodes.length);

  const NODE_W = 660;
  const NODE_H = 190;
  const GAP_Y = 320;
  const X = 540;
  const topY = 760;
  const nodeY = (k: number) => topY + k * (NODE_H + GAP_Y);

  const perNode = Math.max(Math.round(1.6 * fps), Math.floor((durationFrames - Math.round(1.2 * fps)) / (n + 1)));
  const nodeAt = (k: number) => Math.round(0.4 * fps) + k * perNode;
  // Recap zoom-out for the final ~20% of the scene.
  const recapAt = nodeAt(n - 1) + perNode;
  const totalH = nodeY(n - 1) + NODE_H / 2 + 200;

  let active = 0;
  for (let k = 0; k < n; k++) if (frame >= nodeAt(k)) active = k;

  const SCALE = 1.06;
  const outScale = Math.min(0.52, 1500 / totalH);
  const poses: CameraPose[] = [
    ...nodes.map((_, k) => ({
      frame: Math.max(0, nodeAt(k) - 6),
      x: 540 - X * SCALE,
      y: 900 - nodeY(k) * SCALE,
      scale: SCALE,
    })),
    // whip zoom-out recap: whole map visible
    { frame: recapAt, x: 540 - X * outScale, y: 960 - (topY + (totalH - topY) / 2) * outScale, scale: outScale },
  ];

  return (
    <SceneStage accent={brandColor} seed={33}>
      {scene.title && (
        <div
          style={{
            position: "absolute",
            top: 140,
            left: 60,
            right: 60,
            zIndex: 20,
            textAlign: "center",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 62,
            color: "#FFFFFF",
            direction: "rtl",
            textShadow: "0 3px 14px rgba(0,0,0,0.9)",
          }}
        >
          {scene.title}
        </div>
      )}
      <CameraRig poses={poses} settleDrift={false}>
        {nodes.map((nd, k) => {
          const at = nodeAt(k);
          const drawT = interpolate(frame, [at - Math.round(0.4 * fps), at], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const popT = interpolate(frame, [at, at + Math.round(0.25 * fps)], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          // Branch coloring: item.sub_text "bad" → red, "good" → green, else brand.
          const toneKey = (nd.sub_text || "").toLowerCase();
          const nodeColor = toneKey === "bad" ? "196,61,61" : toneKey === "good" ? "47,163,92" : rgb;
          const y = nodeY(k);
          return (
            <React.Fragment key={k}>
              {/* connector line draws downward INTO this node */}
              {k > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: X - 4,
                    top: nodeY(k - 1) + NODE_H / 2,
                    width: 8,
                    height: (GAP_Y + NODE_H / 2) * drawT,
                    borderRadius: 4,
                    background: `linear-gradient(180deg, rgba(255,255,255,0.5), rgba(${nodeColor},0.9))`,
                    boxShadow: `0 0 12px rgba(${nodeColor},0.5)`,
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  left: X - NODE_W / 2,
                  top: y - NODE_H / 2,
                  width: NODE_W,
                  height: NODE_H,
                  borderRadius: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 22,
                  padding: "0 34px",
                  direction: "rtl",
                  background: "linear-gradient(180deg, #1E1F27 0%, #15161C 100%)",
                  border: `2.5px solid rgba(${nodeColor},${k === active ? 0.95 : 0.45})`,
                  boxShadow:
                    k === active
                      ? `0 40px 90px -25px rgba(0,0,0,0.7), 0 0 40px rgba(${nodeColor},0.35)`
                      : "0 30px 70px -25px rgba(0,0,0,0.65)",
                  opacity: popT,
                  transform: `scale(${0.85 + 0.15 * popT})`,
                }}
              >
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: `radial-gradient(circle at 35% 30%, rgba(${nodeColor},1), rgba(${nodeColor},0.55))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 900,
                    fontSize: 34,
                    color: "#FFF",
                  }}
                >
                  {k + 1}
                </div>
                <div
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 40,
                    lineHeight: 1.15,
                    color: "#FFFFFF",
                  }}
                >
                  {nd.text}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </CameraRig>
    </SceneStage>
  );
};

/* ═══════════════════ 3. TWIN PHONES FUNNEL ═══════════════════ */

export const TwinPhonesFunnelBRoll: React.FC<{
  scene: BRollSceneData;
  brandColor: string;
  durationFrames: number;
}> = ({ scene, brandColor, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const left = scene.items?.[0];
  const right = scene.items?.[1];

  const countT = interpolate(frame, [Math.round(0.6 * fps), Math.round(0.85 * durationFrames)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const enterT = interpolate(frame, [0, Math.round(0.45 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const Phone: React.FC<{ item?: { text: string; value?: string }; x: number; good: boolean }> = ({ item, x, good }) => {
    if (!item) return null;
    const target = parseInt((item.value || "0").replace(/[^\d]/g, ""), 10) || 0;
    const shown = Math.round(target * countT);
    const color = good ? "47,163,92" : "196,61,61";
    return (
      <div
        style={{
          position: "absolute",
          left: x - 230,
          top: 560,
          width: 460,
          height: 800,
          borderRadius: 48,
          background: "linear-gradient(180deg, #1E1F27 0%, #14151B 100%)",
          border: `3px solid rgba(${color},0.8)`,
          boxShadow: `0 50px 110px -30px rgba(0,0,0,0.75), 0 0 36px rgba(${color},0.25)`,
          overflow: "hidden",
          opacity: enterT,
          transform: `translateY(${(1 - enterT) * 60}px) rotate(${good ? -2 : 2}deg)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 60,
          gap: 26,
        }}
      >
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: "#FFFFFF",
            direction: "rtl",
            textAlign: "center",
            padding: "0 26px",
          }}
        >
          {item.text}
        </div>
        <div
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 96,
            color: `rgb(${color})`,
            direction: "ltr",
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 30px rgba(${color},0.5)`,
          }}
        >
          {shown.toLocaleString("en-US")}
          <span style={{ fontSize: 50 }}>%</span>
        </div>
        {/* audience dots draining/gaining */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "0 40px", justifyContent: "center" }}>
          {[...Array(24)].map((_, i) => {
            const lit = good ? i < Math.round(24 * countT * (target / 100)) : i >= Math.round(24 * countT * (1 - target / 100));
            return (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: lit ? `rgba(${color},0.9)` : "rgba(255,255,255,0.12)",
                  boxShadow: lit ? `0 0 8px rgba(${color},0.6)` : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SceneStage accent={brandColor} seed={44} floorShadowAt={0.78}>
      {scene.title && (
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 60,
            right: 60,
            textAlign: "center",
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 60,
            color: "#FFFFFF",
            direction: "rtl",
            textShadow: "0 3px 14px rgba(0,0,0,0.9)",
            zIndex: 5,
          }}
        >
          {scene.title}
        </div>
      )}
      {/* VS divider */}
      <div
        style={{
          position: "absolute",
          top: 880,
          left: "50%",
          transform: `translateX(-50%) scale(${enterT})`,
          width: 92,
          height: 92,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, rgba(${rgb},1), rgba(${rgb},0.5))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 900,
          fontSize: 34,
          color: "#FFF",
          zIndex: 5,
          boxShadow: `0 0 34px rgba(${rgb},0.5)`,
        }}
      >
        VS
      </div>
      <Phone item={left} x={288} good={false} />
      <Phone item={right} x={792} good />
    </SceneStage>
  );
};
