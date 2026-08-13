/**
 * ReceiptCard — the "this part is REAL" proof card (Jatho DX0M §D): while
 * designed scenes glow, RECEIPTS are deliberately crisp, flat and
 * screenshot-like — the crisp-vs-glow contrast codes authenticity. Light
 * chrome, tabular numbers, a subtle paper drop, ZERO glow.
 *
 * NEW TYPE 2026-08-09. Use with REAL numbers only (owner's no-fake-proof
 * law — the planner/gate enforce spoken numbers).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnchor, type OverlayAnchor } from "../primitives";
import { easeFn, type Tone } from "../../../design/tokens";

export interface ReceiptRow {
  key: string;
  value: string;
}

export interface ReceiptCardScene {
  type: "receipt_card";
  id: string;
  start: number;
  end: number;
  /** Header — e.g. "תובנות · 30 ימים". */
  title: string;
  rows: ReceiptRow[];
  /** Small bottom-line note — e.g. "צילום מסך אמיתי". */
  footnote?: string;
  tone?: Tone;
  anchor?: OverlayAnchor;
  transcript_phrase?: string;
  rationale?: string;
  sync_role?: "plant" | "land" | "follow" | "payoff";
  tease_of?: string;
  payoff_of?: string;
}

interface Props {
  scene: ReceiptCardScene;
}

export const ReceiptCard: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anchor = resolveAnchor(scene.anchor ?? "above-captions");
  const rows = scene.rows.slice(0, 5);

  // Paper drop: falls in with slight rotation, settles flat.
  const dropT = interpolate(frame, [0, Math.round(0.45 * fps)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("bounce-soft"),
  });
  // Rows reveal top-down like a printing receipt.
  const rowT = (i: number) =>
    interpolate(frame, [Math.round((0.4 + i * 0.18) * fps), Math.round((0.62 + i * 0.18) * fps)], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeFn("glide"),
    });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", ...anchor }}>
        <div
          style={{
            width: 460,
            borderRadius: 14,
            overflow: "hidden",
            // CRISP + LIGHT — deliberately the opposite of the glowing dark
            // panels: the authenticity code.
            background: "#FAFAFC",
            border: "1px solid #D9DBE1",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            opacity: dropT,
            transform: `translateY(${(1 - dropT) * -46}px) rotate(${(1 - dropT) * 3}deg)`,
            direction: "rtl",
          }}
        >
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid #E5E7EC",
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 25,
              color: "#15161C",
              background: "#FFFFFF",
            }}
          >
            {scene.title}
          </div>
          {rows.map((r, i) => {
            const t = rowT(i);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 22px",
                  borderBottom: i < rows.length - 1 ? "1px solid #EDEEF2" : "none",
                  opacity: t,
                  transform: `translateY(${(1 - t) * 8}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 600,
                    fontSize: 22,
                    color: "#4A4D59",
                  }}
                >
                  {r.key}
                </span>
                <span
                  style={{
                    fontFamily: "'Heebo', sans-serif",
                    fontWeight: 800,
                    fontSize: 26,
                    color: "#15161C",
                    direction: "ltr",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.value}
                </span>
              </div>
            );
          })}
          {scene.footnote && (
            <div
              style={{
                padding: "10px 22px 14px",
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 500,
                fontSize: 17,
                color: "#8A8E9B",
                background: "#F4F5F8",
              }}
            >
              {scene.footnote}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
