/**
 * BRollCreativePack2.tsx — Second pack of Creative UI scenes.
 *
 * Scenes:
 *   - ui_phone_lockscreen: iOS lock screen with stacking notifications
 *   - ui_notes_app:        Apple Notes with text being typed in real time
 *   - ui_analytics_graph:  Google Analytics dashboard with line chart climbing
 *
 * Same philosophy as pack 1: recognizable UI = instant visual understanding.
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
 parseSceneNumber,} from "./BRollMotion";

// ── Shared ────────────────────────────────────────────────────────────────────

export interface CreativePack2Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// UI PHONE LOCKSCREEN — iOS lock screen with notifications stacking in
// ══════════════════════════════════════════════════════════════════════════════

export const UIPhoneLockscreen: React.FC<CreativePack2Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // Default notifications if none provided
  const notifications = items?.map((i) => ({
    app: i.icon || i.sub_text || "Instagram",
    title: i.text,
    time: i.value || "עכשיו",
  })) || [
    { app: "Instagram", title: "3 אנשים חדשים התחילו לעקוב אחריך", time: "עכשיו" },
    { app: "Instagram", title: "הפוסט שלך קיבל 247 לייקים", time: "לפני דקה" },
    { app: "WhatsApp", title: "לקוח חדש: מתי אפשר להתחיל?", time: "לפני 2 דק'" },
    { app: "Gmail", title: "הצעת מחיר התקבלה ", time: "לפני 5 דק'" },
    { app: "Instagram", title: "שמרו את הפוסט שלך 89 פעמים", time: "לפני 8 דק'" },
  ];

  // Clock animation — counts from 9:41 up
  const hourNow = 9;
  const minuteNow = 41;

  const STAGGER = 14;

  // Subtle breathing on the whole screen
  const breathe = Math.sin(frame * 0.03) * 1.5;

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Blurred wallpaper — abstract warm gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 30% 30%, rgba(${rgb},0.35) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 70% 75%, rgba(100,50,150,0.3) 0%, transparent 60%),
            linear-gradient(160deg, rgba(20,15,30,1) 0%, rgba(5,5,15,1) 100%)
          `,
          filter: "blur(2px)",
        }}
      />

      {/* Dark overlay */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.25)" }} />

      {/* Phone frame subtle hint */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 40,
          right: 40,
          bottom: 50,
          borderRadius: 60,
          border: "1px solid rgba(255,255,255,0.05)",
          transform: `translateY(${breathe}px)`,
        }}
      >
        {/* Status bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "30px 40px 20px",
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          <span>{`${hourNow}:${String(minuteNow).padStart(2, "0")}`}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Signal */}
            <svg width="22" height="16" viewBox="0 0 22 16">
              <rect x="0" y="10" width="3" height="4" fill="#fff" rx="0.5" />
              <rect x="5" y="8" width="3" height="6" fill="#fff" rx="0.5" />
              <rect x="10" y="5" width="3" height="9" fill="#fff" rx="0.5" />
              <rect x="15" y="2" width="3" height="12" fill="#fff" rx="0.5" />
            </svg>
            {/* Wifi */}
            <svg width="22" height="16" viewBox="0 0 22 16" fill="#fff">
              <path d="M11 14a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-4.5-4a6 6 0 019 0l-1.5 1.5a4 4 0 00-6 0L6.5 10zm-3-3a10 10 0 0115 0L17 8.5a8 8 0 00-12 0L3.5 7z" />
            </svg>
            {/* Battery */}
            <svg width="28" height="14" viewBox="0 0 28 14">
              <rect x="0.5" y="0.5" width="24" height="13" rx="3" fill="none" stroke="#fff" strokeWidth="1" opacity="0.6" />
              <rect x="25" y="4" width="2" height="6" rx="0.5" fill="#fff" opacity="0.6" />
              <rect x="2" y="2" width="20" height="10" rx="1.5" fill="#fff" />
            </svg>
          </div>
        </div>

        {/* Time display — big */}
        <div
          style={{
            textAlign: "center",
            marginTop: 50,
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 200,
            fontSize: 140,
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: "-4px",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          {hourNow}:{String(minuteNow).padStart(2, "0")}
        </div>
        {/* Date */}
        <div
          style={{
            textAlign: "center",
            marginTop: 4,
            fontFamily: "-apple-system, 'Heebo', sans-serif",
            fontWeight: 500,
            fontSize: 26,
            color: "rgba(255,255,255,0.85)",
            direction: "rtl",
          }}
        >
          יום חמישי, 10 באפריל
        </div>

        {/* Notifications — stack in from top */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 24,
            right: 24,
            display: "flex",
            flexDirection: "column-reverse",
            gap: 10,
          }}
        >
          {notifications.map((notif, i) => {
            const delay = 14 + i * STAGGER;
            const slamProg = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: SPRING_PRESETS.slam,
            });

            const translateY = interpolate(slamProg, [0, 1], [-200, 0]);
            const opacity = interpolate(slamProg, [0, 0.3], [0, 1], {
              extrapolateRight: "clamp",
            });

            // Earlier notifications get scaled down (stack effect)
            const stackScale = 1 - (notifications.length - 1 - i) * 0.02;
            const stackOpacity =
              0.4 + (i / Math.max(1, notifications.length - 1)) * 0.6;

            return (
              <div
                key={i}
                style={{
                  transform: `translateY(${translateY}px) scale(${stackScale})`,
                  opacity: opacity * stackOpacity * lifecycle,
                  background: "rgba(40,40,50,0.75)",
                  backdropFilter: "blur(30px)",
                  borderRadius: 18,
                  padding: "14px 18px",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  flexDirection: "row-reverse",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                {/* App icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background:
                      notif.app === "Instagram"
                        ? "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)"
                        : notif.app === "WhatsApp"
                        ? "#25D366"
                        : notif.app === "Gmail"
                        ? "#EA4335"
                        : brandColor,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 16,
                    color: "#FFF",
                  }}
                >
                  {notif.app === "Instagram" ? "" : notif.app === "WhatsApp" ? "" : notif.app === "Gmail" ? "" : "•"}
                </div>

                {/* Text content */}
                <div style={{ flex: 1, direction: "rtl", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "-apple-system, 'Heebo', sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#FFF",
                      }}
                    >
                      {notif.app}
                    </span>
                    <span
                      style={{
                        fontFamily: "-apple-system, sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {notif.time}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "-apple-system, 'Heebo', sans-serif",
                      fontWeight: 400,
                      fontSize: 16,
                      color: "rgba(255,255,255,0.9)",
                      lineHeight: 1.35,
                      direction: "rtl",
                    }}
                  >
                    {notif.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notification counter badge at top */}
        {primary && (
          <div
            style={{
              position: "absolute",
              top: 280,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity:
                interpolate(
                  frame,
                  [durationFrames * 0.5, durationFrames * 0.65],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                ) * lifecycle,
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                padding: "8px 22px",
                borderRadius: 20,
                border: `1px solid rgba(${rgb},0.4)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Heebo', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#FFF",
                  direction: "rtl",
                }}
              >
                {primary}
              </span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI NOTES APP — Apple Notes with text being typed in real time
// ══════════════════════════════════════════════════════════════════════════════

export const UINotesApp: React.FC<CreativePack2Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const noteTitle = primary || "תסריט — סרטון ליום ה'";
  const lines = items?.map((i) => i.text) || [
    "1. וו: למה אף אחד לא שומר את הסרטונים שלי?",
    "2. אמת מרה: כי הם לא מספיק שימושיים",
    "3. סיפור: מה עבד לי השבוע",
    "4. 3 טיפים מעשיים",
    "5. CTA: 'שלחו לי TIP ואני אשלח את המדריך'",
  ];

  // Panel drops in
  const panelReveal = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: SPRING_PRESETS.snappy,
  });

  // Title types out first
  const titleDelay = 10;
  const titleSpeed = 2.5; // chars per frame
  const titleChars = Math.max(
    0,
    Math.min(noteTitle.length, Math.floor((frame - titleDelay) * titleSpeed)),
  );
  const visibleTitle = noteTitle.slice(0, titleChars);
  const titleDone = titleChars >= noteTitle.length;

  // Lines start appearing after title completes
  const linesStartFrame = titleDelay + noteTitle.length / titleSpeed + 6;

  // Cursor blink
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: "#1C1C1E",
        opacity: lifecycle,
      }}
    >
      {/* Subtle warm gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,220,150,0.03) 0%, transparent 70%)`,
        }}
      />

      {/* Notes app window */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: 40,
          right: 40,
          bottom: "10%",
          background: "#2C2C2E",
          borderRadius: 20,
          overflow: "hidden",
          transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
          opacity: panelReveal,
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title bar with traffic lights */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(40,40,45,0.95)",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#28CA42" }} />
          <div
            style={{
              marginRight: "auto",
              marginLeft: 20,
              fontFamily: "-apple-system, sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              direction: "rtl",
            }}
          >
            פתקים
          </div>
          {/* Share icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </div>

        {/* Note metadata bar */}
        <div
          style={{
            padding: "8px 28px",
            fontSize: 12,
            fontFamily: "-apple-system, sans-serif",
            color: "rgba(255,255,255,0.3)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            direction: "rtl",
            textAlign: "left",
          }}
        >
          Today 9:41 AM
        </div>

        {/* Note content area */}
        <div
          style={{
            flex: 1,
            padding: "36px 40px",
            overflow: "hidden",
          }}
        >
          {/* Title — typing out */}
          <div
            style={{
              fontFamily: "-apple-system, 'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 38,
              color: "#FFFFFF",
              direction: "rtl",
              minHeight: 50,
              lineHeight: 1.2,
              marginBottom: 28,
            }}
          >
            {visibleTitle}
            {!titleDone && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 34,
                  background: "#FFCC00",
                  marginRight: 2,
                  verticalAlign: "middle",
                  opacity: cursorVisible ? 1 : 0,
                }}
              />
            )}
          </div>

          {/* Lines — appear one by one after title done */}
          {titleDone &&
            lines.map((line, i) => {
              const lineDelay = linesStartFrame + i * 18;
              const lineChars = Math.max(
                0,
                Math.min(line.length, Math.floor((frame - lineDelay) * 3)),
              );
              const visibleLine = line.slice(0, lineChars);
              const lineDone = lineChars >= line.length;

              if (frame < lineDelay) return null;

              return (
                <div
                  key={i}
                  style={{
                    fontFamily: "-apple-system, 'Heebo', sans-serif",
                    fontWeight: 500,
                    fontSize: 26,
                    color: "rgba(255,255,255,0.92)",
                    direction: "rtl",
                    marginBottom: 14,
                    minHeight: 36,
                    lineHeight: 1.4,
                  }}
                >
                  {visibleLine}
                  {!lineDone && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 26,
                        background: "#FFCC00",
                        marginRight: 2,
                        verticalAlign: "middle",
                        opacity: cursorVisible ? 1 : 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>

        {/* Bottom toolbar hint */}
        <div
          style={{
            padding: "14px 28px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            gap: 18,
            alignItems: "center",
            background: "rgba(40,40,45,0.6)",
          }}
        >
          {["Aa", "", "", ""].map((icon, i) => (
            <span
              key={i}
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 600,
              }}
            >
              {icon}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI ANALYTICS GRAPH — Google Analytics dashboard with climbing line chart
// ══════════════════════════════════════════════════════════════════════════════

export const UIAnalyticsGraph: React.FC<CreativePack2Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  // Data points for line chart — climbs dramatically
  const dataPoints = useMemo(
    () => [
      { x: 0, y: 20 },
      { x: 10, y: 22 },
      { x: 20, y: 25 },
      { x: 30, y: 30 },
      { x: 40, y: 28 },
      { x: 50, y: 35 },
      { x: 60, y: 42 },
      { x: 70, y: 58 },
      { x: 80, y: 75 },
      { x: 90, y: 88 },
      { x: 100, y: 95 },
    ],
    [],
  );

  const metricValue = parseSceneNumber(primary, 247800);
  const growthPercent = parseFloat(secondary || "842");

  // Panel reveals
  const panelReveal = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: SPRING_PRESETS.smooth,
  });

  // Line draws in
  const lineProgress = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 30, stiffness: 40 },
  });

  // Count up metric
  const countProg = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 22, stiffness: 50 },
  });
  const currentValue = Math.round(metricValue * Math.min(countProg, 1));
  const currentGrowth = Math.round(growthPercent * Math.min(countProg, 1));

  // SVG chart dimensions
  const CHART_W = 920;
  const CHART_H = 360;
  const maxY = 100;

  // Build chart path — only shows points up to lineProgress
  const visibleCount = Math.max(1, Math.floor(dataPoints.length * lineProgress));
  const visiblePoints = dataPoints.slice(0, visibleCount + 1);
  const pathStr = visiblePoints
    .map((p, i) => {
      const x = (p.x / 100) * CHART_W;
      const y = CHART_H - (p.y / maxY) * CHART_H;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Area fill below line
  const areaPathStr = visiblePoints.length > 1
    ? pathStr +
      ` L ${(visiblePoints[visiblePoints.length - 1].x / 100) * CHART_W} ${CHART_H}` +
      ` L 0 ${CHART_H} Z`
    : "";

  // Last point for pulse dot
  const lastPoint = visiblePoints[visiblePoints.length - 1];
  const lastX = lastPoint ? (lastPoint.x / 100) * CHART_W : 0;
  const lastY = lastPoint ? CHART_H - (lastPoint.y / maxY) * CHART_H : 0;
  const pulseScale = 1 + Math.sin(frame * 0.2) * 0.3;

  // Metric labels
  const metricLabels = items?.map((i) => ({
    label: i.text,
    value: i.value || i.sub_text || "",
  })) || [
    { label: "משתמשים חדשים", value: "+147%" },
    { label: "זמן באתר", value: "+89%" },
    { label: "המרות", value: "+312%" },
  ];

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)",
        opacity: lifecycle,
      }}
    >
      {/* Top bar / header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderBottom: "1px solid #E8EAED",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: panelReveal,
        }}
      >
        {/* Google Analytics-like logo placeholder */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F9AB00, #E37400)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFF">
              <path d="M22.84 2.998a3 3 0 0 0-2.87-.995 3 3 0 0 0-2.33 2.33L14.92 18.94a3 3 0 0 0 5.89.98l2.72-14.6a3 3 0 0 0-.69-2.322zM4.01 12.008A3 3 0 0 0 1 15v6a3 3 0 0 0 6 0v-6a3 3 0 0 0-2.99-2.992zm8-6A3 3 0 0 0 9 9v12a3 3 0 0 0 6 0V9a3 3 0 0 0-2.99-2.992z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "-apple-system, sans-serif",
              fontWeight: 500,
              fontSize: 18,
              color: "#5F6368",
            }}
          >
            Analytics
          </span>
        </div>
        <span
          style={{
            marginLeft: 20,
            fontFamily: "-apple-system, sans-serif",
            fontSize: 14,
            color: "#9AA0A6",
          }}
        >
          omerd.com › Audience
        </span>
      </div>

      {/* Main content area */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 40,
          right: 40,
          bottom: 40,
          opacity: panelReveal,
        }}
      >
        {/* Big metric card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "28px 32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #E8EAED",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontFamily: "-apple-system, 'Heebo', sans-serif",
              fontWeight: 400,
              fontSize: 16,
              color: "#5F6368",
              direction: "rtl",
              marginBottom: 8,
            }}
          >
            משתמשים פעילים · 30 ימים אחרונים
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 400,
                fontSize: 64,
                color: "#202124",
                lineHeight: 1,
              }}
            >
              {currentValue.toLocaleString()}
            </span>
            <span
              style={{
                fontFamily: "-apple-system, sans-serif",
                fontWeight: 600,
                fontSize: 22,
                color: "#0F9D58",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ▲ {currentGrowth}%
            </span>
          </div>
        </div>

        {/* Chart area */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: "24px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #E8EAED",
            marginBottom: 24,
          }}
        >
          <svg width={CHART_W} height={CHART_H} style={{ maxWidth: "100%", display: "block" }}>
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <line
                key={i}
                x1="0"
                y1={CHART_H * f}
                x2={CHART_W}
                y2={CHART_H * f}
                stroke="#E8EAED"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            ))}

            {/* Area fill */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brandColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={brandColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaPathStr && (
              <path d={areaPathStr} fill="url(#areaGradient)" />
            )}

            {/* Line */}
            {pathStr && (
              <path
                d={pathStr}
                stroke={brandColor}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: `drop-shadow(0 2px 4px rgba(${rgb},0.3))`,
                }}
              />
            )}

            {/* Pulse dot at last point */}
            {lastPoint && lineProgress > 0.05 && (
              <>
                <circle
                  cx={lastX}
                  cy={lastY}
                  r={12 * pulseScale}
                  fill={brandColor}
                  opacity="0.3"
                />
                <circle
                  cx={lastX}
                  cy={lastY}
                  r="7"
                  fill={brandColor}
                />
                <circle
                  cx={lastX}
                  cy={lastY}
                  r="3"
                  fill="#FFFFFF"
                />
              </>
            )}
          </svg>

          {/* X-axis labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              padding: "0 6px",
              fontFamily: "-apple-system, sans-serif",
              fontSize: 12,
              color: "#9AA0A6",
            }}
          >
            {["1", "7", "14", "21", "28", "30"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>

        {/* Metric cards row */}
        <div
          style={{
            display: "flex",
            gap: 14,
          }}
        >
          {metricLabels.map((m, i) => {
            const cardDelay = 26 + i * 8;
            const cardProg = spring({
              frame: Math.max(0, frame - cardDelay),
              fps,
              config: SPRING_PRESETS.snappy,
            });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: "#FFFFFF",
                  borderRadius: 10,
                  padding: "16px 20px",
                  border: "1px solid #E8EAED",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  opacity: cardProg,
                  transform: `translateY(${interpolate(cardProg, [0, 1], [20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: "-apple-system, 'Heebo', sans-serif",
                    fontSize: 13,
                    color: "#5F6368",
                    direction: "rtl",
                    marginBottom: 4,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontFamily: "-apple-system, sans-serif",
                    fontWeight: 600,
                    fontSize: 24,
                    color: "#0F9D58",
                  }}
                >
                  {m.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
