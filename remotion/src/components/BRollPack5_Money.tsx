/**
 * BRollPack5_Money.tsx — Money & sales scenes.
 *
 * Scenes:
 *   - ui_stripe_dashboard:  Stripe with live payments rolling in + total counter
 *   - ui_apple_pay:         Apple Pay Face ID → Done → receipt
 *   - ui_calculator_money:  Calculator typing numbers → giant green total
 *   - visual_cash_register: Vintage cash register opening with bills flying
 *   - visual_money_counter: Large green counter ticking up rapidly
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import {
  SPRING_PRESETS,
  useSceneLifecycle,
  hexToRgb,
  noise,
  parseSceneNumber,
} from "./BRollMotion";

export interface Pack5Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// UI STRIPE DASHBOARD — Live payments rolling in
// ══════════════════════════════════════════════════════════════════════════════

export const UIStripeDashboard: React.FC<Pack5Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const payments = items?.map(i => ({
    name: i.text,
    amount: parseSceneNumber(i.value, 197),
    plan: i.sub_text || "Pro Plan",
  })) || [
    { name: "דנה לוי", amount: 497, plan: "Pro Plan" },
    { name: "יוסי כהן", amount: 197, plan: "Starter" },
    { name: "מיכל אברהם", amount: 997, plan: "Premium" },
    { name: "אורי שמיר", amount: 497, plan: "Pro Plan" },
    { name: "תמר ברק", amount: 197, plan: "Starter" },
    { name: "רון פלד", amount: 1497, plan: "Enterprise" },
  ];

  const targetTotal = parseSceneNumber(primary, payments.reduce((s, p) => s + p.amount, 0));

  // Total counter animates
  const countProg = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 25, stiffness: 50 } });
  const currentTotal = Math.round(targetTotal * Math.min(countProg, 1));

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });
  const STAGGER = 10;

  return (
    <AbsoluteFill style={{ background: "#F6F9FC", opacity: lifecycle }}>
      {/* Stripe header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        background: "#FFFFFF",
        padding: "18px 32px",
        borderBottom: "1px solid #EAEEF3",
        display: "flex", alignItems: "center", gap: 14,
        opacity: panelReveal,
      }}>
        {/* Stripe logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#635BFF" />
            <path d="M13.3 8.3c-1.9 0-3.4.7-3.4 2.4 0 3.6 6.6 1.8 6.6 4.5 0 .7-.6 1-1.5 1-1.3 0-3-.6-4-1.1l-.8 3.4c1 .5 2.9 1 4.7 1 2 0 3.5-.6 4.4-1.6.8-.9 1.2-2.1 1.2-3.6 0-3.6-6.6-1.7-6.6-4.3 0-.7.5-1 1.5-1 1.1 0 2.6.4 3.4.8l.8-3.3c-1-.4-2.6-.7-4.3-.7z" fill="#FFF" />
          </svg>
          <span style={{ fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 18, color: "#0A2540" }}>
            Stripe
          </span>
        </div>
        <span style={{ marginLeft: 20, fontFamily: "-apple-system, sans-serif", fontSize: 14, color: "#697386" }}>
          Dashboard · Payments
        </span>
        {/* Live indicator */}
        <div style={{
          marginLeft: "auto",
          display: "flex", alignItems: "center", gap: 6,
          background: "#E3F8E1",
          color: "#0D7A2A",
          padding: "4px 12px",
          borderRadius: 12,
          fontSize: 13, fontWeight: 600,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#0D7A2A",
            opacity: 0.5 + Math.sin(frame * 0.15) * 0.5,
          }} />
          Live
        </div>
      </div>

      {/* Big total card */}
      <div style={{
        position: "absolute", top: 90, left: 32, right: 32,
        background: "#FFFFFF",
        borderRadius: 12,
        padding: "28px 32px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid #EAEEF3",
        opacity: panelReveal,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif",
          fontSize: 14, color: "#697386",
          marginBottom: 8,
        }}>
          Today's revenue
        </div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 12,
        }}>
          <span style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 600,
            fontSize: 56, color: "#0A2540", letterSpacing: -1,
          }}>
            ₪{currentTotal.toLocaleString()}
          </span>
          <span style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 600,
            fontSize: 18, color: "#0D7A2A",
          }}>
            ▲ +{payments.length} payments
          </span>
        </div>
        {/* Mini sparkline */}
        <div style={{ marginTop: 18, height: 50, display: "flex", alignItems: "flex-end", gap: 4 }}>
          {Array.from({ length: 24 }).map((_, h) => {
            const v = 0.15 + noise(h, 9) * 0.85 * countProg;
            return (
              <div key={h} style={{
                flex: 1, height: `${v * 100}%`,
                background: h === 23 ? "#635BFF" : "#E3E8EF",
                borderRadius: 2,
              }} />
            );
          })}
        </div>
      </div>

      {/* Payments list */}
      <div style={{
        position: "absolute", top: 290, left: 32, right: 32, bottom: 40,
        background: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #EAEEF3",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        opacity: panelReveal,
      }}>
        {/* Table header */}
        <div style={{
          display: "flex", padding: "14px 20px",
          background: "#F7FAFC",
          borderBottom: "1px solid #EAEEF3",
          fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 13,
          color: "#697386", textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          <span style={{ flex: 1 }}>Customer</span>
          <span style={{ width: 100 }}>Plan</span>
          <span style={{ width: 100, textAlign: "right" }}>Amount</span>
          <span style={{ width: 80, textAlign: "right" }}>Status</span>
        </div>

        {/* Payment rows */}
        {payments.map((p, i) => {
          const rowDelay = 18 + i * STAGGER;
          const slideProg = spring({
            frame: Math.max(0, frame - rowDelay), fps, config: SPRING_PRESETS.snappy,
          });
          const flashProg = frame >= rowDelay && frame < rowDelay + 24
            ? Math.max(0, 1 - (frame - rowDelay) / 24)
            : 0;

          return (
            <div key={i} style={{
              display: "flex",
              padding: "16px 20px",
              borderBottom: "1px solid #F1F4F8",
              alignItems: "center",
              opacity: slideProg,
              transform: `translateX(${interpolate(slideProg, [0, 1], [40, 0])}px)`,
              background: `rgba(99, 91, 255, ${flashProg * 0.06})`,
            }}>
              {/* Customer */}
              <div style={{
                flex: 1,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: ["#FFD08E", "#FFA9CC", "#A1ADFF", "#B5EAEA", "#FFC09F", "#D4A5FF"][i % 6],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "-apple-system, 'Heebo', sans-serif",
                  fontWeight: 700, fontSize: 14, color: "#FFF",
                }}>
                  {p.name.charAt(0)}
                </div>
                <span style={{
                  fontFamily: "-apple-system, 'Heebo', sans-serif",
                  fontWeight: 500, fontSize: 16, color: "#0A2540",
                  direction: "rtl",
                }}>{p.name}</span>
              </div>
              {/* Plan */}
              <span style={{
                width: 100,
                fontFamily: "-apple-system, sans-serif",
                fontSize: 14, color: "#425466",
              }}>{p.plan}</span>
              {/* Amount */}
              <span style={{
                width: 100, textAlign: "right",
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 600, fontSize: 16, color: "#0A2540",
              }}>₪{p.amount}</span>
              {/* Status */}
              <span style={{
                width: 80, textAlign: "right",
              }}>
                <span style={{
                  background: "#E3F8E1",
                  color: "#0D7A2A",
                  padding: "3px 10px",
                  borderRadius: 10,
                  fontFamily: "-apple-system, sans-serif",
                  fontSize: 12, fontWeight: 600,
                }}>Paid</span>
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI APPLE PAY — Face ID → Done → Receipt
// ══════════════════════════════════════════════════════════════════════════════

export const UIApplePay: React.FC<Pack5Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const amount = primary || "₪497";
  const merchant = secondary || "OMER DIGITAL";

  // Phase timing
  // 0-30: Face ID scanning (animated rings)
  // 30-50: Done checkmark
  // 50+: Receipt expand
  const SCAN_DURATION = 30;
  const DONE_FRAME = SCAN_DURATION;
  const RECEIPT_FRAME = SCAN_DURATION + 20;

  const isScanning = frame < DONE_FRAME;
  const isDone = frame >= DONE_FRAME && frame < RECEIPT_FRAME;
  const showReceipt = frame >= RECEIPT_FRAME;

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Face ID scan ring
  const scanRotation = frame * 6;
  const scanProgress = Math.min(1, frame / SCAN_DURATION);

  // Checkmark animation
  const checkScale = spring({
    frame: Math.max(0, frame - DONE_FRAME), fps, config: SPRING_PRESETS.slam,
  });

  // Receipt slide up
  const receiptProg = spring({
    frame: Math.max(0, frame - RECEIPT_FRAME), fps, config: SPRING_PRESETS.snappy,
  });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Top header — merchant */}
      <div style={{
        position: "absolute", top: "8%", left: 0, right: 0,
        textAlign: "center",
        opacity: panelReveal,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif",
          fontWeight: 400, fontSize: 16, color: "rgba(255,255,255,0.5)",
          letterSpacing: 1,
          marginBottom: 8,
        }}>
          {merchant}
        </div>
        <div style={{
          fontFamily: "-apple-system, sans-serif",
          fontWeight: 700, fontSize: 64,
          color: "#FFFFFF", letterSpacing: -2,
        }}>
          {amount}
        </div>
      </div>

      {/* Center — Face ID / Done / Receipt */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: "translate(-50%, -50%)",
      }}>
        {/* Face ID scanning state */}
        {isScanning && (
          <div style={{
            width: 200, height: 200,
            position: "relative",
          }}>
            {/* Outer scan ring */}
            <svg width="200" height="200" viewBox="0 0 200 200" style={{
              transform: `rotate(${scanRotation}deg)`,
            }}>
              <circle cx="100" cy="100" r="90" fill="none"
                stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="100" cy="100" r="90" fill="none"
                stroke="#FFF" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 90 * scanProgress} ${2 * Math.PI * 90}`}
                strokeLinecap="round" />
            </svg>

            {/* Face ID icon (simplified) */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }}>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round">
                {/* Frame corners */}
                <path d="M 15 30 L 15 15 L 30 15" />
                <path d="M 70 15 L 85 15 L 85 30" />
                <path d="M 85 70 L 85 85 L 70 85" />
                <path d="M 30 85 L 15 85 L 15 70" />
                {/* Eyes */}
                <circle cx="38" cy="42" r="2" fill="#FFF" />
                <circle cx="62" cy="42" r="2" fill="#FFF" />
                {/* Smile */}
                <path d="M 40 60 Q 50 68 60 60" />
              </svg>
            </div>
          </div>
        )}

        {/* Done state */}
        {(isDone || showReceipt) && (
          <div style={{
            width: 200, height: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${checkScale})`,
          }}>
            <div style={{
              width: 160, height: 160, borderRadius: "50%",
              background: "#34C759",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 60px rgba(52,199,89,0.5)",
            }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#FFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 42 34 56 60 28" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Status text */}
      <div style={{
        position: "absolute", top: "60%", left: 0, right: 0,
        textAlign: "center",
        opacity: panelReveal,
      }}>
        <div style={{
          fontFamily: "-apple-system, 'Heebo', sans-serif",
          fontWeight: 700, fontSize: 28,
          color: isDone || showReceipt ? "#34C759" : "#FFF",
          direction: "rtl",
          transition: "color 0.3s",
        }}>
          {isScanning ? "מאמת זהות..." : isDone ? "תשלום הצליח" : " נשלחה אישור"}
        </div>
      </div>

      {/* Receipt card */}
      {showReceipt && (
        <div style={{
          position: "absolute", bottom: "5%",
          left: 40, right: 40,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "24px 28px",
          transform: `translateY(${interpolate(receiptProg, [0, 1], [200, 0])}px)`,
          opacity: receiptProg,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}>
          {/* Receipt rows */}
          {[
            { label: "סכום", value: amount },
            { label: "סוחר", value: merchant },
            { label: "כרטיס", value: "•••• 4582" },
            { label: "תאריך", value: "10 באפר׳ · 9:41" },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < 3 ? "1px solid #F0F0F0" : "none",
              direction: "rtl",
            }}>
              <span style={{
                fontFamily: "-apple-system, 'Heebo', sans-serif",
                fontSize: 16, color: "#8E8E93",
              }}>{row.label}</span>
              <span style={{
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 600, fontSize: 16, color: "#000",
              }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI CALCULATOR MONEY — Calculator typing → big green result
// ══════════════════════════════════════════════════════════════════════════════

export const UICalculatorMoney: React.FC<Pack5Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  // Calculation: items are operations (default: 365 × 197 = ?)
  const finalResult = parseSceneNumber(primary, 71905);
  const equation = secondary || "365 × 197";
  const label = items?.[0]?.text || "הכנסה שנתית";

  // Phases:
  // 0-50: equation types
  // 50-70: equals appears
  // 70+: result reveals with big green animation

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Equation typing
  const eqChars = Math.max(0, Math.min(equation.length, Math.floor((frame - 8) * 0.4)));
  const visibleEq = equation.slice(0, eqChars);
  const eqDone = eqChars >= equation.length;

  const RESULT_FRAME = 8 + equation.length / 0.4 + 14;
  const resultProg = spring({
    frame: Math.max(0, frame - RESULT_FRAME), fps, config: SPRING_PRESETS.slam,
  });
  const resultCountUp = Math.round(finalResult * Math.min(resultProg, 1));

  // Pulsing glow on result
  const resultGlow = resultProg > 0.5 ? 20 + Math.sin(frame * 0.1) * 10 : 0;

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Calculator panel */}
      <div style={{
        position: "absolute", top: "8%", left: 80, right: 80, bottom: "10%",
        background: "linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%)",
        borderRadius: 28,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Display area */}
        <div style={{
          flex: 1,
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 16,
          minHeight: 300,
        }}>
          {/* Label at top */}
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontSize: 18, color: "rgba(255,255,255,0.4)",
            direction: "rtl", textAlign: "right",
          }}>
            {label}
          </div>

          {/* Equation */}
          <div style={{
            fontFamily: "-apple-system, sans-serif",
            fontWeight: 200, fontSize: 56,
            color: "rgba(255,255,255,0.6)", textAlign: "right",
            letterSpacing: -1,
            minHeight: 70,
          }}>
            {visibleEq}
            {!eqDone && frame > 8 && (
              <span style={{
                display: "inline-block",
                width: 3, height: 50,
                background: brandColor,
                marginRight: 4,
                verticalAlign: "middle",
                opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
              }} />
            )}
            {eqDone && frame < RESULT_FRAME && (
              <span style={{ marginLeft: 12, color: brandColor }}>=</span>
            )}
          </div>

          {/* RESULT — big green */}
          {resultProg > 0 && (
            <div style={{
              fontFamily: "-apple-system, sans-serif",
              fontWeight: 200, fontSize: 96,
              color: "#34C759",
              textAlign: "right",
              letterSpacing: -3,
              lineHeight: 1,
              textShadow: `0 0 ${resultGlow}px rgba(52,199,89,0.5)`,
              transform: `scale(${interpolate(resultProg, [0, 1], [0.5, 1])})`,
              transformOrigin: "right center",
            }}>
              ₪{resultCountUp.toLocaleString()}
            </div>
          )}
        </div>

        {/* Button grid */}
        <div style={{
          padding: "16px 24px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}>
          {[
            { label: "AC", type: "fn" }, { label: "+/-", type: "fn" }, { label: "%", type: "fn" }, { label: "÷", type: "op" },
            { label: "7", type: "num" }, { label: "8", type: "num" }, { label: "9", type: "num" }, { label: "×", type: "op", active: true },
            { label: "4", type: "num" }, { label: "5", type: "num" }, { label: "6", type: "num" }, { label: "−", type: "op" },
            { label: "1", type: "num" }, { label: "2", type: "num" }, { label: "3", type: "num" }, { label: "+", type: "op" },
          ].map((btn, i) => {
            const bg = btn.type === "fn" ? "#A5A5A5"
              : btn.type === "op" ? (btn.active ? brandColor : "#FF9F0A")
              : "#333333";
            const color = btn.type === "fn" ? "#000" : "#FFF";
            return (
              <div key={i} style={{
                background: bg,
                borderRadius: "50%",
                aspectRatio: "1 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 400, fontSize: 26,
                color,
                boxShadow: btn.active ? `0 0 20px rgba(${rgb},0.5)` : "none",
              }}>
                {btn.label}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL CASH REGISTER — Cash register opening with bills flying
// ══════════════════════════════════════════════════════════════════════════════

export const VisualCashRegister: React.FC<Pack5Props> = ({
  brandColor,
  durationFrames,
  primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // Phases: 0-20 register appears closed. 20-40 drawer opens. 40+ bills fly.
  const OPEN_FRAME = 20;
  const BILLS_FRAME = 38;

  const drawerOpenProg = spring({
    frame: Math.max(0, frame - OPEN_FRAME), fps, config: SPRING_PRESETS.snappy,
  });

  const billsActive = frame >= BILLS_FRAME;

  // Generate 20 flying bills
  const bills = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      angle: noise(i, 1) * Math.PI * 2,
      speed: 0.8 + noise(i, 2) * 1.5,
      rotation: noise(i, 3) * 360,
      rotSpeed: (noise(i, 4) - 0.5) * 6,
      delay: i * 2,
    })),
    [],
  );

  const registerScale = spring({ frame, fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 60%, #1a0f08 0%, #000 70%)",
      opacity: lifecycle,
    }}>
      {/* Cash register SVG */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: `translate(-50%, -50%) scale(${registerScale})`,
      }}>
        <svg width="500" height="450" viewBox="0 0 500 450">
          {/* Register body — antique gold */}
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4C842" />
              <stop offset="50%" stopColor="#D4A017" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            <linearGradient id="drawerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C29A0E" />
              <stop offset="100%" stopColor="#7A5F08" />
            </linearGradient>
          </defs>

          {/* Top display panel */}
          <rect x="70" y="20" width="360" height="100" rx="10" fill="url(#goldGrad)" stroke="#5C4308" strokeWidth="3" />
          {/* Display screen */}
          <rect x="100" y="40" width="300" height="60" rx="6" fill="#1a1a1a" stroke="#5C4308" strokeWidth="2" />
          {/* Display text — green LED */}
          <text x="250" y="82" textAnchor="middle"
            fontFamily="'Courier New', monospace" fontWeight="700" fontSize="32"
            fill="#7CFC00" style={{ filter: "drop-shadow(0 0 4px #7CFC00)" }}>
            {billsActive ? "₪+1,247" : "₪0.00"}
          </text>

          {/* Body */}
          <rect x="50" y="120" width="400" height="220" rx="14" fill="url(#goldGrad)" stroke="#5C4308" strokeWidth="3" />

          {/* Decorative buttons grid */}
          {[0, 1, 2, 3].map((row) => [0, 1, 2, 3].map((col) => (
            <circle key={`${row}-${col}`}
              cx={120 + col * 80} cy={170 + row * 40} r="14"
              fill="#8B6914" stroke="#5C4308" strokeWidth="1.5" />
          )))}

          {/* Drawer */}
          <g transform={`translate(0, ${drawerOpenProg * 80})`}>
            <rect x="60" y="340" width="380" height="80" rx="8" fill="url(#drawerGrad)" stroke="#5C4308" strokeWidth="3" />
            {/* Drawer handle */}
            <rect x="220" y="370" width="60" height="14" rx="4" fill="#5C4308" />
            {/* Coin slots (visible when open) */}
            {drawerOpenProg > 0.3 && [0, 1, 2, 3, 4].map((i) => (
              <rect key={i}
                x={80 + i * 70} y="385" width="50" height="20" rx="3"
                fill="#000" opacity="0.4" />
            ))}
          </g>
        </svg>
      </div>

      {/* Flying bills */}
      {billsActive && bills.map((bill, i) => {
        const localFrame = frame - BILLS_FRAME - bill.delay;
        if (localFrame < 0) return null;

        const dist = localFrame * bill.speed * 8;
        const x = 540 + Math.cos(bill.angle - Math.PI / 2) * dist;
        const y = 700 - Math.abs(Math.sin(bill.angle - Math.PI / 2) * dist) - localFrame * 4;
        const rotation = bill.rotation + localFrame * bill.rotSpeed;
        const fadeOut = interpolate(localFrame, [40, 80], [1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });

        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            width: 110, height: 60,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            opacity: fadeOut,
          }}>
            {/* Bill SVG */}
            <svg width="110" height="60" viewBox="0 0 110 60">
              <rect width="110" height="60" rx="4" fill="#2D7D32" stroke="#1B5E20" strokeWidth="1.5" />
              <rect x="6" y="6" width="98" height="48" rx="2" fill="none" stroke="#76FF03" strokeWidth="1" opacity="0.6" />
              <circle cx="30" cy="30" r="12" fill="none" stroke="#76FF03" strokeWidth="1.5" opacity="0.5" />
              <text x="30" y="35" textAnchor="middle" fontFamily="serif" fontWeight="900" fontSize="14" fill="#76FF03">₪</text>
              <text x="75" y="22" textAnchor="middle" fontFamily="serif" fontWeight="900" fontSize="20" fill="#FFFF00">100</text>
              <text x="75" y="48" textAnchor="middle" fontFamily="serif" fontSize="10" fill="#76FF03">SHEKEL</text>
            </svg>
          </div>
        );
      })}

      {/* Bottom label */}
      {primary && billsActive && (
        <div style={{
          position: "absolute", bottom: "10%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [BILLS_FRAME + 10, BILLS_FRAME + 25], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "#2D7D32",
            color: "#FFF",
            padding: "12px 32px", borderRadius: 16,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900,
            fontSize: 36, direction: "rtl",
            boxShadow: "0 0 40px rgba(45,125,50,0.5)",
            border: "2px solid #76FF03",
          }}>
             {primary}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL MONEY COUNTER — Big green counter ticking up rapidly
// ══════════════════════════════════════════════════════════════════════════════

export const VisualMoneyCounter: React.FC<Pack5Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const targetAmount = parseSceneNumber(primary, 247500);
  const label = secondary || "הכנסה החודש";

  // Counter animates with eased curve
  const countProg = spring({
    frame: Math.max(0, frame - 10), fps, config: { damping: 20, stiffness: 35, mass: 1.5 },
  });
  const current = Math.round(targetAmount * Math.min(countProg, 1));

  // Progress milestones (e.g., 50K, 100K, 150K)
  const milestones = items?.map(i => ({
    label: i.text,
    threshold: parseSceneNumber(i.value, 50000),
  })) || [
    { label: "יעד מינימום", threshold: 50000 },
    { label: "יעד טוב", threshold: 150000 },
    { label: " יעד שאיפה", threshold: 250000 },
  ];

  // Background glow pulses with count rate
  const glowIntensity = 30 + Math.min(80, countProg * 60);

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 45%, #003319 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "40%", left: "50%",
        width: 700, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(52,199,89,0.2) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        filter: `blur(${glowIntensity}px)`,
      }} />

      {/* Label */}
      <div style={{
        position: "absolute", top: "20%", left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(52,199,89,0.15)",
          border: "1px solid rgba(52,199,89,0.4)",
          padding: "8px 22px",
          borderRadius: 18,
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22,
          color: "#34C759",
          direction: "rtl",
        }}>
          {label}
        </div>
      </div>

      {/* Huge counter */}
      <div style={{
        position: "absolute", top: "32%", left: 0, right: 0,
        textAlign: "center",
        opacity: lifecycle,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif",
          fontWeight: 700, fontSize: 220,
          color: "#34C759",
          letterSpacing: -8,
          lineHeight: 1,
          textShadow: `0 0 ${glowIntensity}px rgba(52,199,89,0.6), 0 0 60px rgba(52,199,89,0.3)`,
        }}>
          ₪{current.toLocaleString()}
        </div>
      </div>

      {/* Growth indicator */}
      <div style={{
        position: "absolute", top: "60%", left: 0, right: 0,
        textAlign: "center",
        opacity: countProg * lifecycle,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif",
          fontWeight: 700, fontSize: 36,
          color: "#34C759",
          display: "inline-flex", alignItems: "center", gap: 12,
        }}>
          ▲ +247%
        </div>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 500, fontSize: 22,
          color: "rgba(255,255,255,0.5)",
          direction: "rtl", marginTop: 4,
        }}>
          לעומת חודש קודם
        </div>
      </div>

      {/* Milestones progress */}
      <div style={{
        position: "absolute", bottom: "10%", left: 60, right: 60,
        display: "flex", justifyContent: "space-between",
        gap: 12,
      }}>
        {milestones.map((m, i) => {
          const reached = current >= m.threshold;
          const milestoneProg = spring({
            frame: Math.max(0, frame - 20 - i * 6), fps, config: SPRING_PRESETS.snappy,
          });
          return (
            <div key={i} style={{
              flex: 1,
              opacity: milestoneProg * lifecycle,
              transform: `translateY(${interpolate(milestoneProg, [0, 1], [20, 0])}px)`,
            }}>
              <div style={{
                background: reached ? "rgba(52,199,89,0.2)" : "rgba(255,255,255,0.05)",
                border: reached ? "1px solid #34C759" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "12px 16px",
                textAlign: "center",
                boxShadow: reached ? "0 0 20px rgba(52,199,89,0.3)" : "none",
              }}>
                <div style={{
                  fontSize: 22, marginBottom: 4,
                  color: reached ? "#34C759" : "rgba(255,255,255,0.3)",
                }}>
                  {reached ? "" : "○"}
                </div>
                <div style={{
                  fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14,
                  color: reached ? "#FFF" : "rgba(255,255,255,0.4)",
                  direction: "rtl", marginBottom: 2,
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 16,
                  color: reached ? "#34C759" : "rgba(255,255,255,0.3)",
                }}>
                  ₪{m.threshold.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
