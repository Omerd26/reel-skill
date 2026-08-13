/**
 * BRollPack6_Social.tsx — Audience, community, social proof scenes.
 *
 * Scenes:
 *   - ui_follower_counter:   IG/TikTok counter ticking up with heart spam
 *   - ui_live_viewers:       Live stream with viewer count + chat messages
 *   - ui_review_stack:       Google reviews stacking with 5 stars
 *   - ui_testimonial_card:   Quote card with avatar + testimonial
 *   - visual_crowd_gather:   Avatars gathering around a center point
 *   - visual_ripple_effect:  Concentric circles spreading outward (viral)
 *   - visual_rating_stars:   5 stars filling up one by one
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

export interface Pack6Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// UI FOLLOWER COUNTER — IG-style follower count ticking up + heart spam
// ══════════════════════════════════════════════════════════════════════════════

export const UIFollowerCounter: React.FC<Pack6Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const targetFollowers = parseSceneNumber(primary, 47800);
  const handle = secondary || "@omerd";

  const countProg = spring({
    frame: Math.max(0, frame - 8), fps, config: { damping: 22, stiffness: 40 },
  });
  const current = Math.round(targetFollowers * Math.min(countProg, 1));
  const formatted = current >= 1000 ? `${(current / 1000).toFixed(1)}K` : String(current);

  // Hearts spawning
  const hearts = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    spawnFrame: 20 + i * 4,
    xStart: 40 + noise(i, 1) * 90,
    sway: noise(i, 2),
    speed: 0.8 + noise(i, 3) * 1.0,
    rotation: (noise(i, 4) - 0.5) * 40,
  })), []);

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #1A1A1F 0%, #000 100%)",
      opacity: lifecycle,
    }}>
      {/* Instagram-style profile card */}
      <div style={{
        position: "absolute", top: "20%", left: 50, right: 50,
        background: "rgba(28,28,32,0.85)",
        backdropFilter: "blur(40px)",
        borderRadius: 24,
        padding: "32px 28px",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Profile row */}
        <div style={{
          display: "flex", flexDirection: "row-reverse", alignItems: "center",
          gap: 18, marginBottom: 24,
        }}>
          {/* Avatar with story ring */}
          <div style={{
            position: "relative",
            width: 100, height: 100,
            borderRadius: "50%",
            padding: 3,
            background: "linear-gradient(135deg, #FFD600, #FF7A00, #E1306C, #C13584)",
          }}>
            <div style={{
              width: "100%", height: "100%",
              borderRadius: "50%",
              border: "3px solid #1C1C20",
              background: brandColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FFF", fontFamily: "'Heebo', sans-serif",
              fontSize: 36, fontWeight: 900,
            }}>O</div>
          </div>

          <div style={{ flex: 1, direction: "rtl" }}>
            <div style={{
              fontFamily: "-apple-system, 'Heebo', sans-serif",
              fontWeight: 700, fontSize: 26, color: "#FFF",
              display: "flex", alignItems: "center", gap: 8,
              flexDirection: "row-reverse",
            }}>
              {handle}
              {/* Verified badge */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1A95E5">
                <path d="M12 2 L13.5 5 L17 6 L15 8.5 L15.5 12 L12 11 L8.5 12 L9 8.5 L7 6 L10.5 5 Z" />
                <text x="12" y="14" fontSize="10" fill="#FFF" textAnchor="middle" fontWeight="900"></text>
              </svg>
            </div>
            <div style={{
              fontFamily: "-apple-system, sans-serif", fontSize: 16,
              color: "rgba(255,255,255,0.5)", marginTop: 4,
            }}>
              Omer Digital · Marketing
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", flexDirection: "row-reverse",
          padding: "20px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Posts */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 30,
              color: "#FFF",
            }}>247</div>
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontSize: 14,
              color: "rgba(255,255,255,0.5)", marginTop: 2,
            }}>פוסטים</div>
          </div>
          {/* Followers — HERO */}
          <div style={{ flex: 1.4, textAlign: "center", position: "relative" }}>
            <div style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 900, fontSize: 48,
              color: brandColor,
              textShadow: `0 0 30px rgba(${rgb},0.5)`,
              lineHeight: 1,
            }}>{formatted}</div>
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 15,
              color: "#FFF", marginTop: 4,
            }}>עוקבים</div>
            {/* Green +X */}
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14,
              color: "#34C759", marginTop: 2,
              opacity: countProg,
            }}>
              ▲ +1.2K היום
            </div>
          </div>
          {/* Following */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 30,
              color: "#FFF",
            }}>312</div>
            <div style={{
              fontFamily: "'Heebo', sans-serif", fontSize: 14,
              color: "rgba(255,255,255,0.5)", marginTop: 2,
            }}>עוקב</div>
          </div>
        </div>

        {/* Follow button */}
        <div style={{
          marginTop: 16,
          background: brandColor,
          padding: "12px 0",
          borderRadius: 10,
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 18,
          color: "#FFF",
          boxShadow: `0 4px 16px rgba(${rgb},0.4)`,
        }}>
           עוקב
        </div>
      </div>

      {/* Hearts flying up */}
      {hearts.map((h, i) => {
        const localFrame = frame - h.spawnFrame;
        if (localFrame < 0) return null;
        const yProgress = localFrame * h.speed / 80;
        if (yProgress > 1) return null;
        const y = 100 - yProgress * 90;
        const x = h.xStart + Math.sin(localFrame * 0.08 + h.sway * 10) * 4;
        const opacity = interpolate(yProgress, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);
        const scale = interpolate(yProgress, [0, 0.2, 1], [0.5, 1, 0.8]);
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${x}%`, top: `${y}%`,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${h.rotation}deg)`,
            opacity,
            fontSize: 32,
            filter: "drop-shadow(0 0 10px rgba(255,48,80,0.5))",
          }}>
            
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI LIVE VIEWERS — Live stream with viewer count + chat messages
// ══════════════════════════════════════════════════════════════════════════════

export const UILiveViewers: React.FC<Pack6Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const targetViewers = parseSceneNumber(primary, 2847);
  const messages = items?.map(i => ({
    user: i.sub_text || "viewer",
    text: i.text,
  })) || [
    { user: "dana_l", text: "וואו זה מטורף " },
    { user: "yossi_k", text: "איפה הלינק??" },
    { user: "michal_a", text: "ברצינות זה עבד?" },
    { user: "uri_s", text: "תני עוד פרטים פליז" },
    { user: "tamar_b", text: "" },
    { user: "ron_p", text: "מתחיל ליישם עכשיו!" },
    { user: "noa_g", text: "שמרתי לעצמי" },
  ];

  const viewerCountProg = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 25, stiffness: 40 } });
  const currentViewers = Math.round(targetViewers * Math.min(viewerCountProg, 1));

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // REC blink
  const recBlink = Math.floor(frame / 12) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Phone-like vertical viewport */}
      <div style={{
        position: "absolute", top: "5%", left: 30, right: 30, bottom: "5%",
        background: "linear-gradient(180deg, #2A1F2D 0%, #1A0D1F 100%)",
        borderRadius: 28,
        overflow: "hidden",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [40, 0])}px)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
      }}>
        {/* Top bar — LIVE badge + viewer count */}
        <div style={{
          position: "absolute", top: 30, left: 20, right: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {/* LIVE badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.5)",
            padding: "6px 14px",
            borderRadius: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#FF3B30",
              opacity: recBlink ? 1 : 0.5,
              boxShadow: recBlink ? "0 0 8px #FF3B30" : "none",
            }} />
            <span style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 13,
              color: "#FFF", letterSpacing: 1,
            }}>
              LIVE
            </span>
          </div>

          {/* Viewer count */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(0,0,0,0.5)",
            padding: "6px 14px",
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14 }}>●</span>
            <span style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 16,
              color: "#FFF",
            }}>
              {currentViewers.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Streamer info top-right */}
        <div style={{
          position: "absolute", top: 80, left: 20,
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(0,0,0,0.4)",
          padding: "6px 14px 6px 6px",
          borderRadius: 30,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: brandColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFF", fontWeight: 900, fontSize: 14,
          }}>O</div>
          <span style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 14,
            color: "#FFF",
          }}>
            @omerd
          </span>
          <span style={{
            background: brandColor,
            color: "#FFF",
            padding: "3px 10px",
            borderRadius: 12,
            fontSize: 11, fontWeight: 700,
          }}>
            עקוב
          </span>
        </div>

        {/* Chat messages — animate up from bottom */}
        <div style={{
          position: "absolute",
          bottom: 100, left: 20, right: 20,
          display: "flex", flexDirection: "column-reverse", gap: 10,
        }}>
          {messages.map((msg, i) => {
            const msgDelay = 14 + i * 8;
            const msgProg = spring({
              frame: Math.max(0, frame - msgDelay), fps, config: SPRING_PRESETS.snappy,
            });
            const fadeOut = interpolate(
              frame - msgDelay,
              [80, 130],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            if (frame < msgDelay) return null;

            return (
              <div key={i} style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
                padding: "8px 14px",
                borderRadius: 18,
                display: "flex", flexDirection: "row-reverse", alignItems: "center",
                gap: 8,
                opacity: msgProg * fadeOut,
                transform: `translateX(${interpolate(msgProg, [0, 1], [30, 0])}px)`,
                maxWidth: "85%",
                alignSelf: "flex-start",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: `hsl(${i * 53 % 360}, 60%, 60%)`,
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFF", fontSize: 11, fontWeight: 700,
                }}>
                  {msg.user.charAt(0).toUpperCase()}
                </div>
                <span style={{
                  fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 13,
                  color: brandColor,
                }}>
                  {msg.user}
                </span>
                <span style={{
                  fontFamily: "-apple-system, 'Heebo', sans-serif", fontSize: 14,
                  color: "rgba(255,255,255,0.95)", direction: "rtl",
                }}>
                  {msg.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom action bar */}
        <div style={{
          position: "absolute", bottom: 20, left: 20, right: 20,
          display: "flex", gap: 12, alignItems: "center",
        }}>
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 30,
            padding: "12px 20px",
            fontFamily: "'Heebo', sans-serif", fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            direction: "rtl",
          }}>
            הוסף תגובה...
          </div>
          <div style={{ fontSize: 28 }}>●</div>
          <div style={{ fontSize: 28 }}>●</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI REVIEW STACK — Google reviews stacking with 5 stars
// ══════════════════════════════════════════════════════════════════════════════

export const UIReviewStack: React.FC<Pack6Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const reviews = items?.map(i => ({
    name: i.sub_text || "לקוח",
    text: i.text,
    rating: parseSceneNumber(i.value, 5),
  })) || [
    { name: "דנה לוי", text: "הסרטונים הוויראליים שלי שילשו תוך חודש. שווה כל שקל!", rating: 5 },
    { name: "יוסי כהן", text: "אחרי 10 שנים בשיווק, סוף סוף שיטה שעובדת ברצינות.", rating: 5 },
    { name: "מיכל אברהם", text: "החל מהיום הראשון. תוצאות שלא ראיתי בעבר. ממליצה בלב שלם.", rating: 5 },
    { name: "אורי שמיר", text: "התוכן נהיה ויראלי כל שבוע. תודה!", rating: 5 },
  ];

  const totalRating = parseSceneNumber(primary, 4.9);

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });
  const STAGGER = 18;

  return (
    <AbsoluteFill style={{ background: "#F5F5F7", opacity: lifecycle }}>
      {/* Rating header */}
      <div style={{
        position: "absolute", top: "8%", left: 36, right: 36,
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "20px 24px",
        opacity: panelReveal,
        transform: `translateY(${interpolate(panelReveal, [0, 1], [30, 0])}px)`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        {/* Big rating */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 56,
            color: "#1A1A1A", lineHeight: 1,
          }}>
            {totalRating.toFixed(1)}
          </div>
          {/* Stars */}
          <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <span key={i} style={{ color: "#FFA500", fontSize: 18 }}></span>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, direction: "rtl" }}>
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 700, fontSize: 22,
            color: "#1A1A1A",
          }}>
            Omer Digital
          </div>
          <div style={{
            fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 500, fontSize: 16,
            color: "#5F6368", marginTop: 4,
          }}>
            מבוסס על {reviews.length}+ ביקורות בגוגל
          </div>
          {/* Recommendation bar */}
          <div style={{ marginTop: 8, display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
            <div style={{
              flex: 1, height: 6, background: "#E8EAED", borderRadius: 3, overflow: "hidden",
            }}>
              <div style={{ width: "98%", height: "100%", background: "#0F9D58", borderRadius: 3 }} />
            </div>
            <span style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 14,
              color: "#0F9D58",
            }}>98%</span>
          </div>
        </div>
      </div>

      {/* Review cards stacking */}
      <div style={{
        position: "absolute", top: 220, left: 36, right: 36, bottom: 40,
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {reviews.map((review, i) => {
          const slideProg = spring({
            frame: Math.max(0, frame - 8 - i * STAGGER), fps, config: SPRING_PRESETS.snappy,
          });
          // Subtle pulse highlight when card lands
          const landFrame = 8 + i * STAGGER + 10;
          const pulseProg = frame > landFrame && frame < landFrame + 12
            ? Math.max(0, 1 - (frame - landFrame) / 12)
            : 0;

          return (
            <div key={i} style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "16px 20px",
              boxShadow: pulseProg > 0
                ? `0 4px 12px rgba(0,0,0,0.08), 0 0 0 2px rgba(255,165,0,${pulseProg * 0.5})`
                : "0 4px 12px rgba(0,0,0,0.05)",
              opacity: slideProg,
              transform: `translateY(${interpolate(slideProg, [0, 1], [40, 0])}px) scale(${interpolate(slideProg, [0, 1], [0.9, 1])})`,
            }}>
              {/* Header row */}
              <div style={{
                display: "flex", flexDirection: "row-reverse",
                alignItems: "center", gap: 12,
                marginBottom: 8,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: ["#4285F4", "#34A853", "#FBBC04", "#EA4335"][i % 4],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFF", fontFamily: "'Heebo', sans-serif",
                  fontWeight: 700, fontSize: 18,
                }}>
                  {review.name.charAt(0)}
                </div>

                {/* Name + stars */}
                <div style={{ flex: 1, direction: "rtl" }}>
                  <div style={{
                    fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 700, fontSize: 18,
                    color: "#1A1A1A",
                  }}>
                    {review.name}
                  </div>
                  <div style={{ display: "flex", gap: 1, marginTop: 2 }}>
                    {[0, 1, 2, 3, 4].map(s => (
                      <span key={s} style={{
                        color: s < review.rating ? "#FFA500" : "#DADCE0",
                        fontSize: 14,
                      }}></span>
                    ))}
                    <span style={{
                      marginRight: 6,
                      fontFamily: "-apple-system, sans-serif", fontSize: 12, color: "#5F6368",
                    }}>· לפני שבוע</span>
                  </div>
                </div>
              </div>

              {/* Review text */}
              <div style={{
                fontFamily: "-apple-system, 'Heebo', sans-serif", fontSize: 16,
                color: "#3C4043", direction: "rtl", lineHeight: 1.45,
              }}>
                {review.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI TESTIMONIAL CARD — Big quote with avatar + name + role
// ══════════════════════════════════════════════════════════════════════════════

export const UITestimonialCard: React.FC<Pack6Props> = ({
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

  const quote = primary || "החיים שלי השתנו תוך 30 יום. סוף סוף יש לי מערכת שעובדת בלי שאני צריך לחשוב על כל פוסט מחדש.";
  const name = secondary || "דנה לוי";
  const role = items?.[0]?.text || "בעלת עסק · אופנה";

  const panelReveal = spring({ frame: Math.max(0, frame - 4), fps, config: SPRING_PRESETS.snappy });

  // Quote text reveals with fade-in
  const quoteOpacity = interpolate(frame, [12, 30], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const quoteScale = spring({
    frame: Math.max(0, frame - 12), fps, config: SPRING_PRESETS.smooth,
  });

  // Profile area reveals after quote
  const profileReveal = spring({ frame: Math.max(0, frame - 32), fps, config: SPRING_PRESETS.smooth });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse 60% 50% at 50% 40%, rgba(${rgb},0.08) 0%, #0A0A0F 70%)`,
      opacity: lifecycle,
    }}>
      {/* Quote marks decoration */}
      <div style={{
        position: "absolute", top: "12%", left: "8%",
        fontFamily: "Georgia, serif", fontSize: 220, fontWeight: 700,
        color: brandColor,
        opacity: 0.15 * panelReveal,
        lineHeight: 1,
      }}>
        "
      </div>

      {/* Main quote */}
      <div style={{
        position: "absolute", top: "22%", left: 70, right: 70,
        textAlign: "center",
        opacity: quoteOpacity,
        transform: `scale(${quoteScale})`,
      }}>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 700,
          fontSize: 44, color: "#FFF",
          direction: "rtl", lineHeight: 1.35,
          textShadow: `0 0 30px rgba(${rgb},0.2)`,
        }}>
          {quote}
        </div>
      </div>

      {/* Decorative line */}
      <div style={{
        position: "absolute", bottom: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: interpolate(profileReveal, [0, 1], [0, 120]),
        height: 3,
        background: brandColor,
        borderRadius: 2,
        boxShadow: `0 0 12px rgba(${rgb},0.6)`,
      }} />

      {/* Profile section at bottom */}
      <div style={{
        position: "absolute", bottom: "12%", left: 0, right: 0,
        display: "flex", flexDirection: "row-reverse",
        alignItems: "center", justifyContent: "center", gap: 18,
        opacity: profileReveal,
        transform: `translateY(${interpolate(profileReveal, [0, 1], [20, 0])}px)`,
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `linear-gradient(135deg, ${brandColor}, rgba(${rgb},0.5))`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Heebo', sans-serif", fontSize: 32, fontWeight: 900,
          color: "#FFF",
          boxShadow: `0 0 30px rgba(${rgb},0.4)`,
          border: "3px solid rgba(255,255,255,0.1)",
        }}>
          {name.charAt(0)}
        </div>

        {/* Name + role */}
        <div style={{ direction: "rtl" }}>
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 28,
            color: "#FFF",
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: "'Heebo', sans-serif", fontWeight: 500, fontSize: 18,
            color: `rgba(${rgb},0.8)`, marginTop: 4,
          }}>
            {role}
          </div>
          {/* 5 stars */}
          <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
            {[0, 1, 2, 3, 4].map(i => (
              <span key={i} style={{ color: "#FFA500", fontSize: 18 }}></span>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL CROWD GATHER — Avatars converging around a central point
// ══════════════════════════════════════════════════════════════════════════════

export const VisualCrowdGather: React.FC<Pack6Props> = ({
  brandColor,
  durationFrames,
  primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const label = primary || "10,000+ אנשים מצטרפים";

  // 30 avatars spawning and moving inward
  const avatars = useMemo(() => Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2 + noise(i, 1) * 0.5;
    const ring = Math.floor(i / 12);
    return {
      startAngle: angle,
      startR: 600 + ring * 50 + noise(i, 2) * 80,
      endR: 180 + ring * 60,
      delay: ring * 6 + (i % 12) * 1.2,
      color: `hsl(${(i * 31) % 360}, 60%, 55%)`,
      size: 30 + noise(i, 3) * 14,
    };
  }), []);

  const CX = 540;
  const CY = 850;

  // Center counter
  const targetCount = 10000;
  const countProg = spring({
    frame: Math.max(0, frame - 40), fps, config: { damping: 22, stiffness: 40 },
  });
  const currentCount = Math.round(targetCount * Math.min(countProg, 1));

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 50% 40% at 50% 50%, #1A0F1F 0%, #000 70%)",
      opacity: lifecycle,
    }}>
      {/* Pulse rings emanating from center */}
      {[0, 1, 2].map(i => {
        const ringPhase = (frame * 0.02 + i * 0.33) % 1;
        const size = ringPhase * 700;
        const opacity = (1 - ringPhase) * 0.4;
        return (
          <div key={i} style={{
            position: "absolute",
            top: CY, left: CX,
            width: size, height: size,
            borderRadius: "50%",
            border: `2px solid rgba(${rgb},${opacity})`,
            transform: "translate(-50%, -50%)",
          }} />
        );
      })}

      {/* Center anchor */}
      <div style={{
        position: "absolute", top: CY, left: CX,
        width: 120, height: 120, borderRadius: "50%",
        background: brandColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "translate(-50%, -50%)",
        boxShadow: `0 0 60px rgba(${rgb},0.6)`,
        zIndex: 10,
      }}>
        <span style={{ fontSize: 56 }}>●</span>
      </div>

      {/* Avatars converging */}
      {avatars.map((av, i) => {
        const progress = spring({
          frame: Math.max(0, frame - 6 - av.delay), fps, config: { damping: 18, stiffness: 30 },
        });
        const currentR = av.startR - (av.startR - av.endR) * progress;
        const x = CX + Math.cos(av.startAngle) * currentR;
        const y = CY + Math.sin(av.startAngle) * currentR;
        const opacity = Math.min(1, progress * 2);

        return (
          <div key={i} style={{
            position: "absolute",
            left: x, top: y,
            width: av.size, height: av.size,
            borderRadius: "50%",
            background: av.color,
            transform: "translate(-50%, -50%)",
            opacity: opacity * lifecycle,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFF", fontFamily: "'Heebo', sans-serif",
            fontWeight: 700, fontSize: av.size * 0.4,
            border: "2px solid rgba(255,255,255,0.2)",
            boxShadow: progress > 0.7 ? `0 0 10px rgba(${rgb},0.3)` : "none",
          }}>
            {String.fromCharCode(65 + (i % 26))}
          </div>
        );
      })}

      {/* Top counter */}
      <div style={{
        position: "absolute", top: "12%", left: 0, right: 0,
        textAlign: "center",
        opacity: lifecycle,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif", fontWeight: 900,
          fontSize: 110, color: "#FFF",
          textShadow: `0 0 40px rgba(${rgb},0.4)`,
          lineHeight: 1,
        }}>
          {currentCount.toLocaleString()}+
        </div>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 30,
          color: brandColor, marginTop: 12,
          direction: "rtl",
        }}>
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL RIPPLE EFFECT — Concentric circles spreading (viral wave)
// ══════════════════════════════════════════════════════════════════════════════

export const VisualRippleEffect: React.FC<Pack6Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 8, 10);

  const label = primary || "1 פוסט = 47K צפיות";

  // 8 ripples, each starts at different frame
  const ripples = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    startFrame: i * 18,
    color: `rgba(${rgb}, ${0.5 - i * 0.04})`,
  })), [rgb]);

  // Center pulse
  const centerPulse = 1 + Math.sin(frame * 0.15) * 0.08;

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 50%, #1A0F2A 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Ripples expanding */}
      {ripples.map((r, i) => {
        const localFrame = frame - r.startFrame;
        if (localFrame < 0) return null;
        const RIPPLE_DURATION = 90;
        const progress = Math.min(1, localFrame / RIPPLE_DURATION);
        const size = progress * 1400;
        const opacity = (1 - progress) * 0.7;
        return (
          <div key={i} style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: size, height: size,
            borderRadius: "50%",
            border: `3px solid rgba(${rgb},${opacity})`,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 ${50 * (1 - progress)}px rgba(${rgb},${opacity * 0.5})`,
          }} />
        );
      })}

      {/* Center origin point */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${centerPulse})`,
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: "50%",
          background: `radial-gradient(circle, ${brandColor} 0%, rgba(${rgb},0.4) 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 80px rgba(${rgb},0.7), 0 0 160px rgba(${rgb},0.3)`,
        }}>
          <span style={{ fontSize: 60 }}>●</span>
        </div>
      </div>

      {/* Counters at fixed positions where ripples reach */}
      {[
        { label: "1K", angle: 0, distance: 380, delay: 30 },
        { label: "10K", angle: Math.PI * 0.4, distance: 420, delay: 45 },
        { label: "25K", angle: Math.PI * 0.8, distance: 440, delay: 60 },
        { label: "47K", angle: Math.PI * 1.3, distance: 460, delay: 75 },
        { label: "100K+", angle: Math.PI * 1.8, distance: 480, delay: 90 },
      ].map((counter, i) => {
        const counterProg = spring({
          frame: Math.max(0, frame - counter.delay), fps, config: SPRING_PRESETS.pop,
        });
        const x = Math.cos(counter.angle) * counter.distance;
        const y = Math.sin(counter.angle) * counter.distance;
        return (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${counterProg})`,
            opacity: counterProg * lifecycle,
            background: brandColor,
            color: "#FFF",
            padding: "8px 16px",
            borderRadius: 14,
            fontFamily: "-apple-system, sans-serif", fontWeight: 900, fontSize: 22,
            boxShadow: `0 0 20px rgba(${rgb},0.5)`,
          }}>
            {counter.label}
          </div>
        );
      })}

      {/* Bottom label */}
      {label && (
        <div style={{
          position: "absolute", bottom: "10%", left: 0, right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [90, 110], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }) * lifecycle,
        }}>
          <div style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)",
            padding: "14px 32px",
            borderRadius: 16,
            border: `1px solid rgba(${rgb},0.4)`,
            fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 30,
            color: "#FFF", direction: "rtl",
          }}>
            {label}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL RATING STARS — 5 stars filling up one by one
// ══════════════════════════════════════════════════════════════════════════════

export const VisualRatingStars: React.FC<Pack6Props> = ({
  brandColor,
  durationFrames,
  primary,
  secondary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const rating = parseSceneNumber(primary, 4.9);
  const label = secondary || "מתוך 5";
  const STAGGER = 12;

  // Glow pulse on big rating
  const ratingProg = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 22, stiffness: 40 } });
  const currentRating = (rating * Math.min(ratingProg, 1)).toFixed(1);

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse 60% 50% at 50% 45%, #2A1F08 0%, #000 80%)",
      opacity: lifecycle,
    }}>
      {/* Glow behind stars */}
      <div style={{
        position: "absolute", top: "42%", left: "50%",
        width: 800, height: 300, borderRadius: "50%",
        background: `radial-gradient(ellipse, rgba(255,165,0,0.15) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        filter: "blur(40px)",
      }} />

      {/* 5 STARS */}
      <div style={{
        position: "absolute", top: "40%", left: 0, right: 0,
        display: "flex", justifyContent: "center",
        gap: 18,
      }}>
        {[0, 1, 2, 3, 4].map(i => {
          const starDelay = 6 + i * STAGGER;
          const starProg = spring({
            frame: Math.max(0, frame - starDelay), fps, config: SPRING_PRESETS.slam,
          });
          const isFilled = starProg > 0.5;
          // Pulse glow once filled
          const pulse = isFilled
            ? 1 + Math.sin((frame - starDelay) * 0.15) * 0.05
            : 1;

          return (
            <div key={i} style={{
              transform: `scale(${starProg * pulse})`,
              filter: isFilled ? "drop-shadow(0 0 20px rgba(255,165,0,0.7))" : "none",
            }}>
              <svg width="120" height="120" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id={`starGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </linearGradient>
                </defs>
                <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18 21 L12 17 L6 21 L8 13.5 L2 9 L9.5 9 Z"
                  fill={isFilled ? `url(#starGrad${i})` : "rgba(255,255,255,0.08)"}
                  stroke={isFilled ? "#FFD700" : "rgba(255,255,255,0.15)"}
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Big rating number */}
      <div style={{
        position: "absolute", top: "62%", left: 0, right: 0,
        textAlign: "center",
        opacity: ratingProg * lifecycle,
      }}>
        <div style={{
          fontFamily: "-apple-system, sans-serif", fontWeight: 900, fontSize: 140,
          color: "#FFD700", letterSpacing: -4,
          lineHeight: 1,
          textShadow: "0 0 40px rgba(255,215,0,0.4)",
        }}>
          {currentRating}
        </div>
        <div style={{
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 30,
          color: "rgba(255,255,255,0.5)",
          marginTop: 8,
        }}>
          {label}
        </div>
      </div>

      {/* Top label */}
      <div style={{
        position: "absolute", top: "20%", left: 0, right: 0,
        textAlign: "center",
        opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }) * lifecycle,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(255,165,0,0.15)",
          border: "1px solid rgba(255,165,0,0.4)",
          padding: "10px 24px",
          borderRadius: 20,
          fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 22,
          color: "#FFA500",
          direction: "rtl",
        }}>
          דירוג של 2,847+ לקוחות
        </div>
      </div>
    </AbsoluteFill>
  );
};
