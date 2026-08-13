/**
 * BRollPack7_Apple.tsx — Apple ecosystem & productivity scenes.
 *
 * Scenes:
 *   - ui_finder_files:       macOS Finder with files organizing into folders
 *   - ui_imovie_timeline:    iMovie/Final Cut timeline with clips
 *   - ui_zoom_meeting:       Zoom multi-participant grid
 *   - ui_apple_watch_rings:  Apple Watch fitness rings closing
 *   - ui_calendar_fill:      Google Calendar week filling with events
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

export interface Pack7Props {
  brandColor: string;
  durationFrames: number;
  primary?: string;
  secondary?: string;
  items?: { text: string; icon?: string; sub_text?: string; value?: string }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// UI FINDER FILES — Messy files organizing into folders
// ══════════════════════════════════════════════════════════════════════════════

export const UIFinderFiles: React.FC<Pack7Props> = ({
  brandColor,
  durationFrames,
  primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  // 12 scattered files, organized into 3 folders
  const files = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const folderIdx = i % 3;
    return {
      startX: 100 + noise(i, 1) * 600,
      startY: 250 + noise(i, 2) * 350,
      rotation: (noise(i, 3) - 0.5) * 40,
      folderIdx,
      type: ["", "", "", "", ""][i % 5],
      color: ["#4285F4", "#34A853", "#FBBC04"][folderIdx],
      name: ["report.pdf", "video.mov", "data.xls", "photo.jpg", "notes.md", "draft.doc"][i % 6],
    };
  }), []);

  const folders = [
    { name: "תוכן", icon: "", x: 200, y: 800, color: "#FBBC04" },
    { name: "תמונות", icon: "", x: 540, y: 800, color: "#34A853" },
    { name: "מסמכים", icon: "", x: 880, y: 800, color: "#4285F4" },
  ];

  const ORGANIZE_FRAME = 36;
  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#F5F5F7", opacity: lifecycle }}>
      <div style={{
        position: "absolute", top: 30, left: 30, right: 30, bottom: 30,
        background: "#FFFFFF",
        borderRadius: 18,
        overflow: "hidden",
        opacity: panelReveal,
        boxShadow: "0 30px 80px rgba(0,0,0,0.2)",
      }}>
        {/* Finder title bar */}
        <div style={{
          background: "linear-gradient(180deg, #ECECEC 0%, #D8D8D8 100%)",
          padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 14,
          borderBottom: "1px solid #C8C8C8",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA42" }} />
          </div>
          <div style={{ display: "flex", gap: 8, color: "#8A8A8A" }}>
            <span style={{ fontSize: 18 }}>‹</span>
            <span style={{ fontSize: 18 }}>›</span>
          </div>
          <span style={{
            marginLeft: "auto", marginRight: "auto",
            fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 14,
            color: "#3C3C3C",
          }}>
            Downloads — {files.length} items
          </span>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: "10px 18px",
          background: "#F7F7F7",
          borderBottom: "1px solid #E0E0E0",
          display: "flex", gap: 16, alignItems: "center",
        }}>
          {["", "⊞", "⊞", "⊞"].map((icon, i) => (
            <span key={i} style={{ color: i === 1 ? "#0066CC" : "#888", fontSize: 16 }}>{icon}</span>
          ))}
        </div>

        {/* Sidebar + content */}
        <div style={{ display: "flex", flex: 1, height: "calc(100% - 90px)" }}>
          {/* Sidebar */}
          <div style={{
            width: 180,
            background: "#F2F2F4",
            padding: "16px 12px",
            borderRight: "1px solid #E0E0E0",
            fontFamily: "-apple-system, sans-serif", fontSize: 14,
          }}>
            <div style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
              Favorites
            </div>
            {[" AirDrop", " Recents", " Downloads", " Documents", " Pictures", " Movies"].map((item, i) => (
              <div key={i} style={{
                padding: "5px 10px",
                borderRadius: 4,
                background: item.includes("Downloads") ? "#D5D5D7" : "transparent",
                color: "#3C3C3C", marginBottom: 2,
              }}>
                {item}
              </div>
            ))}
          </div>

          {/* Content area with files */}
          <div style={{
            flex: 1, position: "relative",
            background: "#FFFFFF",
            overflow: "hidden",
          }}>
            {/* Scattered files moving to folders */}
            {files.map((file, i) => {
              const moveDelay = ORGANIZE_FRAME + i * 4;
              const moveProg = spring({
                frame: Math.max(0, frame - moveDelay), fps, config: SPRING_PRESETS.snappy,
              });
              const folder = folders[file.folderIdx];
              const currentX = file.startX + (folder.x - file.startX) * moveProg;
              const currentY = file.startY + (folder.y - file.startY) * moveProg;
              const currentRot = file.rotation * (1 - moveProg);
              const currentScale = 1 - moveProg * 0.5;
              const opacity = 1 - moveProg * 0.7;

              return (
                <div key={i} style={{
                  position: "absolute",
                  left: currentX, top: currentY,
                  transform: `translate(-50%, -50%) rotate(${currentRot}deg) scale(${currentScale})`,
                  opacity,
                  width: 64,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <div style={{ fontSize: 38 }}>{file.type}</div>
                  <span style={{
                    fontFamily: "-apple-system, sans-serif", fontSize: 11,
                    color: "#3C3C3C", maxWidth: 72,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{file.name}</span>
                </div>
              );
            })}

            {/* Folders */}
            {folders.map((folder, i) => {
              const folderProg = spring({
                frame: Math.max(0, frame - 18 - i * 3), fps, config: SPRING_PRESETS.smooth,
              });
              const isDone = frame > ORGANIZE_FRAME + 80;
              const countInFolder = files.filter(f => f.folderIdx === i).length;
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: folder.x, top: folder.y,
                  transform: `translate(-50%, -50%) scale(${folderProg})`,
                  opacity: folderProg,
                  width: 100,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <div style={{
                    fontSize: 64,
                    filter: isDone ? `drop-shadow(0 0 12px rgba(${rgb},0.4))` : "none",
                  }}>●</div>
                  <span style={{
                    fontFamily: "-apple-system, 'Heebo', sans-serif",
                    fontWeight: 600, fontSize: 14, color: "#3C3C3C",
                    direction: "rtl",
                  }}>{folder.name}</span>
                  {isDone && (
                    <span style={{
                      background: brandColor, color: "#FFF",
                      padding: "2px 8px", borderRadius: 10,
                      fontFamily: "-apple-system, sans-serif",
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {countInFolder} קבצים
                    </span>
                  )}
                </div>
              );
            })}

            {/* Success indicator */}
            {frame > ORGANIZE_FRAME + 100 && (
              <div style={{
                position: "absolute", bottom: 30, left: 0, right: 0,
                textAlign: "center",
              }}>
                <div style={{
                  display: "inline-block",
                  background: "#34C759", color: "#FFF",
                  padding: "10px 24px", borderRadius: 16,
                  fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 18,
                  direction: "rtl",
                  boxShadow: "0 4px 16px rgba(52,199,89,0.4)",
                }}>
                   {primary || "ארגנתי הכל בדקה"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI IMOVIE TIMELINE — Video editing timeline with clips
// ══════════════════════════════════════════════════════════════════════════════

export const UIiMovieTimeline: React.FC<Pack7Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  // Clips on timeline
  const clips = items?.map((i, idx) => ({
    name: i.text,
    duration: parseSceneNumber(i.value, 3),
    color: i.icon || ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA", "#FB7185"][idx % 5],
    track: parseInt(i.sub_text || "0"),
  })) || [
    { name: "Intro", duration: 2, color: "#FF6B6B", track: 0 },
    { name: "B-Roll", duration: 4, color: "#4ECDC4", track: 0 },
    { name: "Talking Head", duration: 8, color: "#FFD93D", track: 0 },
    { name: "Demo", duration: 5, color: "#A78BFA", track: 0 },
    { name: "CTA", duration: 3, color: "#FB7185", track: 0 },
    { name: "Music", duration: 22, color: "#10B981", track: 1 },
  ];

  const totalDuration = Math.max(...clips.map(c => c.duration)) +
    clips.filter(c => c.track === 0).reduce((s, c) => s + c.duration, 0) - Math.max(...clips.map(c => c.duration));

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  // Playhead moves across
  const playheadProg = interpolate(frame, [30, durationFrames * 0.9], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#1A1A1A", opacity: lifecycle }}>
      {/* iMovie window */}
      <div style={{
        position: "absolute", top: 30, left: 30, right: 30, bottom: 30,
        background: "#2A2A2A",
        borderRadius: 14,
        overflow: "hidden",
        opacity: panelReveal,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Title bar */}
        <div style={{
          padding: "10px 16px",
          background: "#1F1F1F",
          borderBottom: "1px solid #000",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA42" }} />
          </div>
          <div style={{
            marginLeft: "auto", marginRight: "auto",
            fontFamily: "-apple-system, sans-serif", fontSize: 13, color: "#888",
          }}>
            Final Cut Pro — My Reel.fcpbundle
          </div>
        </div>

        {/* Preview area + sidebar */}
        <div style={{ display: "flex", height: 320, borderBottom: "1px solid #000" }}>
          {/* Sidebar — clip library */}
          <div style={{
            width: 220,
            background: "#252525",
            padding: "14px 12px",
            borderRight: "1px solid #1A1A1A",
          }}>
            <div style={{
              fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 11,
              color: "#888", textTransform: "uppercase",
              marginBottom: 10,
            }}>
              Browser
            </div>
            {/* Mini clip thumbnails */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {clips.slice(0, 6).map((c, i) => (
                <div key={i} style={{
                  height: 50,
                  background: `linear-gradient(135deg, ${c.color}, rgba(0,0,0,0.3))`,
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.1)",
                }} />
              ))}
            </div>
          </div>

          {/* Preview monitor */}
          <div style={{
            flex: 1,
            background: "#000",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            {/* Fake video frame */}
            <div style={{
              width: "85%", height: "85%",
              background: `linear-gradient(135deg, ${brandColor} 0%, rgba(${rgb},0.3) 100%)`,
              borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Heebo', sans-serif", fontWeight: 900, fontSize: 36,
              color: "#FFF",
              direction: "rtl",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}>
              {primary || "תצוגה מקדימה"}
            </div>
            {/* Playback time */}
            <div style={{
              position: "absolute", bottom: 12, left: 0, right: 0,
              textAlign: "center",
              fontFamily: "'SF Mono', monospace", fontSize: 14,
              color: "rgba(255,255,255,0.7)",
            }}>
              00:{String(Math.floor(playheadProg * 22)).padStart(2, "0")}:00 / 00:22:00
            </div>
          </div>
        </div>

        {/* Timeline area */}
        <div style={{
          flex: 1, padding: "16px 18px",
          background: "#1F1F1F",
          position: "relative",
        }}>
          {/* Ruler */}
          <div style={{
            height: 20, marginBottom: 8,
            position: "relative",
            borderBottom: "1px solid #333",
          }}>
            {[0, 5, 10, 15, 20].map(s => (
              <div key={s} style={{
                position: "absolute", left: `${(s / 22) * 100}%`,
                fontFamily: "'SF Mono', monospace", fontSize: 10, color: "#666",
                top: 4,
              }}>
                {s}s
              </div>
            ))}
          </div>

          {/* Track 1 — video */}
          <div style={{
            position: "relative",
            height: 50, marginBottom: 6,
            background: "#0F0F0F",
            borderRadius: 4,
            overflow: "hidden",
          }}>
            {(() => {
              let xPos = 0;
              return clips.filter(c => c.track === 0).map((clip, i) => {
                const clipDelay = 12 + i * 8;
                const clipProg = spring({
                  frame: Math.max(0, frame - clipDelay), fps, config: SPRING_PRESETS.snappy,
                });
                const widthPct = (clip.duration / 22) * 100;
                const currentLeft = xPos;
                xPos += widthPct;
                return (
                  <div key={i} style={{
                    position: "absolute",
                    left: `${currentLeft}%`, top: 4,
                    width: `${widthPct - 0.5}%`, height: "calc(100% - 8px)",
                    background: `linear-gradient(180deg, ${clip.color} 0%, rgba(0,0,0,0.3) 100%)`,
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "-apple-system, 'Heebo', sans-serif",
                    fontWeight: 700, fontSize: 13, color: "#FFF",
                    opacity: clipProg,
                    transform: `translateY(${interpolate(clipProg, [0, 1], [30, 0])}px)`,
                    overflow: "hidden", whiteSpace: "nowrap",
                  }}>
                    {clip.name}
                  </div>
                );
              });
            })()}
          </div>

          {/* Track 2 — audio */}
          <div style={{
            position: "relative",
            height: 36,
            background: "#0F0F0F",
            borderRadius: 4,
            overflow: "hidden",
          }}>
            {clips.filter(c => c.track === 1).map((clip, i) => {
              const clipProg = spring({
                frame: Math.max(0, frame - 50), fps, config: SPRING_PRESETS.snappy,
              });
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: 4, top: 4, right: 4, height: "calc(100% - 8px)",
                  background: `linear-gradient(180deg, ${clip.color} 0%, rgba(0,0,0,0.3) 100%)`,
                  borderRadius: 4,
                  opacity: clipProg,
                  display: "flex", alignItems: "center", padding: "0 10px", gap: 8,
                }}>
                  {/* Mini waveform */}
                  <div style={{ display: "flex", alignItems: "center", gap: 1, flex: 1, height: 18 }}>
                    {Array.from({ length: 60 }).map((_, w) => {
                      const h = Math.abs(Math.sin(w * 0.5) + Math.sin(w * 1.3)) * 0.4 + 0.2;
                      return <div key={w} style={{ width: 2, height: `${h * 100}%`, background: "rgba(255,255,255,0.6)", borderRadius: 1 }} />;
                    })}
                  </div>
                  <span style={{
                    fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 11, color: "rgba(255,255,255,0.9)",
                  }}> {clip.name}</span>
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          {playheadProg > 0 && (
            <div style={{
              position: "absolute",
              left: `${18 + playheadProg * (100 - 36 / 1080 * 100) * 0.92}%`,
              top: 16, bottom: 16,
              width: 2,
              background: "#FFFFFF",
              boxShadow: "0 0 8px rgba(255,255,255,0.6)",
            }}>
              <div style={{
                position: "absolute", top: -8, left: -6,
                width: 14, height: 14,
                background: "#FFFFFF",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI ZOOM MEETING — Multi-participant grid
// ══════════════════════════════════════════════════════════════════════════════

export const UIZoomMeeting: React.FC<Pack7Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const participants = items?.map((i, idx) => ({
    name: i.text,
    role: i.sub_text || "Team",
    color: i.icon || ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA", "#FB7185", "#5EEAD4"][idx % 6],
    muted: idx % 3 === 2,
  })) || [
    { name: "אומר", role: "Host", color: "#E0701E", muted: false },
    { name: "דנה", role: "Marketing", color: "#FF6B6B", muted: false },
    { name: "יוסי", role: "Sales", color: "#4ECDC4", muted: true },
    { name: "מיכל", role: "Design", color: "#FFD93D", muted: false },
    { name: "אורי", role: "Dev", color: "#A78BFA", muted: false },
    { name: "תמר", role: "Content", color: "#FB7185", muted: true },
  ];

  const STAGGER = 8;
  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#1C1C1F", opacity: lifecycle }}>
      {/* Zoom window */}
      <div style={{
        position: "absolute", top: 30, left: 30, right: 30, bottom: 30,
        background: "#000000",
        borderRadius: 14,
        overflow: "hidden",
        opacity: panelReveal,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Top bar */}
        <div style={{
          background: "#2D2D2D",
          padding: "10px 18px",
          display: "flex", alignItems: "center",
          borderBottom: "1px solid #1A1A1A",
        }}>
          {/* Recording badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#FF3B30",
            color: "#FFF",
            padding: "4px 10px",
            borderRadius: 4,
            fontFamily: "-apple-system, sans-serif",
            fontSize: 12, fontWeight: 700,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF" }} />
            REC
          </div>
          <span style={{
            marginLeft: 12,
            fontFamily: "-apple-system, sans-serif", fontSize: 13, color: "#CCC",
          }}>
            Strategy Meeting · {participants.length} participants
          </span>
          {/* Time */}
          <div style={{
            marginLeft: "auto",
            fontFamily: "'SF Mono', monospace", fontSize: 14, color: "#FFF",
          }}>
            34:12
          </div>
        </div>

        {/* Participant grid */}
        <div style={{
          flex: 1, padding: 16,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 8,
        }}>
          {participants.map((p, i) => {
            const joinProg = spring({
              frame: Math.max(0, frame - 10 - i * STAGGER), fps, config: SPRING_PRESETS.snappy,
            });
            const isHost = i === 0;

            return (
              <div key={i} style={{
                background: `linear-gradient(135deg, ${p.color} 0%, rgba(0,0,0,0.4) 100%)`,
                borderRadius: 8,
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: joinProg,
                transform: `scale(${interpolate(joinProg, [0, 1], [0.7, 1])})`,
                border: isHost ? `3px solid ${brandColor}` : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isHost ? `0 0 20px rgba(${rgb},0.5)` : "none",
                overflow: "hidden",
              }}>
                {/* Avatar / initial */}
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Heebo', sans-serif",
                  fontSize: 44, fontWeight: 900, color: "#FFF",
                  border: "3px solid rgba(255,255,255,0.3)",
                }}>
                  {p.name.charAt(0)}
                </div>

                {/* Name bar bottom-left */}
                <div style={{
                  position: "absolute",
                  bottom: 8, left: 8,
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(0,0,0,0.6)",
                  padding: "4px 10px",
                  borderRadius: 4,
                }}>
                  {/* Mic */}
                  <span style={{ fontSize: 13, color: p.muted ? "#FF3B30" : "#FFF" }}>
                    {p.muted ? "" : ""}
                  </span>
                  <span style={{
                    fontFamily: "-apple-system, 'Heebo', sans-serif",
                    fontWeight: 600, fontSize: 14, color: "#FFF",
                    direction: "rtl",
                  }}>
                    {p.name}
                  </span>
                  {isHost && (
                    <span style={{
                      background: brandColor, color: "#FFF",
                      padding: "1px 6px", borderRadius: 3,
                      fontSize: 10, fontWeight: 700,
                    }}>
                      Host
                    </span>
                  )}
                </div>

                {/* Speaking indicator — animated for some */}
                {!p.muted && i % 4 === 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: 8, right: 8,
                    display: "flex", gap: 2, alignItems: "flex-end",
                    height: 18,
                  }}>
                    {[0, 1, 2].map(b => (
                      <div key={b} style={{
                        width: 3,
                        height: `${40 + Math.abs(Math.sin(frame * 0.3 + b)) * 60}%`,
                        background: "#34C759",
                        borderRadius: 1.5,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div style={{
          background: "#1A1A1A",
          padding: "14px 24px",
          display: "flex", justifyContent: "center",
          gap: 18,
        }}>
          {["", "", "", "", "", "", ""].map((icon, i) => (
            <div key={i} style={{
              width: 50, height: 38, borderRadius: 8,
              background: i === 6 ? "#FF3B30" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              {icon}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI APPLE WATCH RINGS — Fitness rings closing
// ══════════════════════════════════════════════════════════════════════════════

export const UIAppleWatchRings: React.FC<Pack7Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const goals = items?.map(i => ({
    label: i.text,
    value: parseSceneNumber(i.value, 100),
    target: parseFloat(i.sub_text || "100"),
    color: i.icon || "#FA114F",
  })) || [
    { label: "תוכן (Move)", value: 100, target: 100, color: "#FA114F" }, // red
    { label: "אינטראקציה (Exercise)", value: 100, target: 100, color: "#92E82A" }, // green
    { label: "פרסום (Stand)", value: 100, target: 100, color: "#1EEAEA" }, // cyan
  ];

  const RING_RADIUS = [140, 110, 80];
  const RING_WIDTH = 24;
  const STAGGER = 14;
  const CX = 540;
  const CY = 700;

  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#000000", opacity: lifecycle }}>
      {/* Watch face frame */}
      <div style={{
        position: "absolute", top: "10%", left: "50%",
        width: 500, height: 600,
        transform: "translateX(-50%)",
        background: "linear-gradient(180deg, #2A2A2A 0%, #0A0A0A 100%)",
        borderRadius: 80,
        border: "8px solid #1A1A1A",
        boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        opacity: panelReveal,
      }}>
        {/* Watch screen */}
        <div style={{
          position: "absolute", inset: 14,
          background: "#000000",
          borderRadius: 70,
          overflow: "hidden",
        }}>
          {/* Time at top */}
          <div style={{
            position: "absolute", top: 30, right: 40,
            fontFamily: "-apple-system, sans-serif", fontWeight: 600, fontSize: 28,
            color: "#FA114F",
          }}>
            9:41
          </div>

          {/* Rings centered */}
          <svg width="100%" height="100%" viewBox="0 0 600 800" style={{ position: "absolute", top: 0, left: 0 }}>
            <defs>
              {goals.map((g, i) => (
                <linearGradient key={i} id={`ringGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={g.color} />
                  <stop offset="100%" stopColor={g.color} stopOpacity="0.7" />
                </linearGradient>
              ))}
            </defs>

            {goals.map((g, i) => {
              const r = RING_RADIUS[i];
              const circumference = 2 * Math.PI * r;
              const ringDelay = 14 + i * STAGGER;
              const ringProg = spring({
                frame: Math.max(0, frame - ringDelay), fps,
                config: { damping: 25, stiffness: 35, mass: 1.5 },
              });
              const fillRatio = Math.min(g.value / g.target, 1) * Math.min(ringProg, 1);
              const isClosed = fillRatio >= 0.99;

              return (
                <g key={i}>
                  {/* Background ring */}
                  <circle
                    cx="300" cy="380" r={r}
                    fill="none"
                    stroke={g.color}
                    strokeWidth={RING_WIDTH}
                    opacity="0.15"
                  />
                  {/* Filled ring */}
                  <circle
                    cx="300" cy="380" r={r}
                    fill="none"
                    stroke={`url(#ringGrad${i})`}
                    strokeWidth={RING_WIDTH}
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={circumference * (1 - fillRatio)}
                    strokeLinecap="round"
                    transform={`rotate(-90 300 380)`}
                    style={{
                      filter: isClosed ? `drop-shadow(0 0 20px ${g.color})` : `drop-shadow(0 0 8px ${g.color}88)`,
                    }}
                  />
                  {/* Checkmark at end when closed */}
                  {isClosed && (
                    <circle cx="300" cy={380 - r} r={RING_WIDTH / 2} fill={g.color} />
                  )}
                </g>
              );
            })}

            {/* Center text */}
            <text x="300" y="380" textAnchor="middle"
              fontFamily="-apple-system, sans-serif" fontWeight="700" fontSize="34"
              fill="#FFF">
              {goals.every((g, i) => {
                const ringDelay = 14 + i * STAGGER;
                const ringProg = spring({
                  frame: Math.max(0, frame - ringDelay), fps,
                  config: { damping: 25, stiffness: 35, mass: 1.5 },
                });
                return ringProg > 0.95;
              }) ? "Done!" : "Keep going"}
            </text>
          </svg>
        </div>

        {/* Crown */}
        <div style={{
          position: "absolute", top: 80, right: -16,
          width: 20, height: 50, borderRadius: 4,
          background: "linear-gradient(90deg, #888 0%, #444 100%)",
        }} />
      </div>

      {/* Goal labels at bottom */}
      <div style={{
        position: "absolute", bottom: "8%", left: 40, right: 40,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {goals.map((g, i) => {
          const labelProg = spring({
            frame: Math.max(0, frame - 14 - i * STAGGER), fps, config: SPRING_PRESETS.smooth,
          });
          const isClosed = labelProg > 0.95;
          return (
            <div key={i} style={{
              display: "flex", flexDirection: "row-reverse",
              alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.05)",
              padding: "10px 18px",
              borderRadius: 12,
              opacity: labelProg,
              transform: `translateX(${interpolate(labelProg, [0, 1], [30, 0])}px)`,
              border: isClosed ? `1px solid ${g.color}` : "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: g.color,
                opacity: isClosed ? 1 : 0.3,
                boxShadow: isClosed ? `0 0 12px ${g.color}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF", fontSize: 14, fontWeight: 900,
              }}>
                {isClosed ? "" : ""}
              </div>
              <span style={{
                flex: 1,
                fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: 18,
                color: isClosed ? "#FFF" : "rgba(255,255,255,0.5)",
                direction: "rtl",
              }}>
                {g.label}
              </span>
              <span style={{
                fontFamily: "-apple-system, sans-serif", fontWeight: 700, fontSize: 16,
                color: g.color,
              }}>
                {Math.round(g.value)}%
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// UI CALENDAR FILL — Google Calendar week filling with events
// ══════════════════════════════════════════════════════════════════════════════

export const UICalendarFill: React.FC<Pack7Props> = ({
  brandColor,
  durationFrames,
  primary,
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rgb = hexToRgb(brandColor);
  const lifecycle = useSceneLifecycle(durationFrames, 6, 10);

  const events = items?.map(i => ({
    title: i.text,
    day: parseInt(i.icon || "0"), // 0-6
    hour: parseFloat(i.sub_text || "9"), // start hour
    duration: parseSceneNumber(i.value, 1),
    color: ["#1A73E8", "#34A853", "#F9AB00", "#D93025", "#A142F4"][parseInt(i.icon || "0") % 5],
  })) || [
    { title: "פגישת אסטרטגיה", day: 0, hour: 9, duration: 1, color: "#1A73E8" },
    { title: "צילום סרטון", day: 1, hour: 11, duration: 2, color: "#34A853" },
    { title: "סשן ייעוץ", day: 2, hour: 14, duration: 1, color: "#F9AB00" },
    { title: "ווביינר", day: 3, hour: 19, duration: 1.5, color: "#D93025" },
    { title: "פגישת לקוח", day: 4, hour: 10, duration: 1, color: "#1A73E8" },
    { title: "צילום סרטון", day: 4, hour: 14, duration: 2, color: "#34A853" },
    { title: "תכנון תוכן", day: 0, hour: 14, duration: 1.5, color: "#A142F4" },
    { title: "ביקורת תוכן", day: 2, hour: 9, duration: 1, color: "#A142F4" },
    { title: "סשן עריכה", day: 3, hour: 11, duration: 2, color: "#34A853" },
  ];

  const days = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  const STAGGER = 5;
  const panelReveal = spring({ frame: Math.max(0, frame - 2), fps, config: SPRING_PRESETS.snappy });

  return (
    <AbsoluteFill style={{ background: "#FFFFFF", opacity: lifecycle }}>
      {/* Google Calendar window */}
      <div style={{
        position: "absolute", top: 20, left: 20, right: 20, bottom: 20,
        background: "#FFFFFF",
        borderRadius: 14,
        overflow: "hidden",
        opacity: panelReveal,
        boxShadow: "0 30px 80px rgba(0,0,0,0.15)",
        border: "1px solid #E0E0E0",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #E0E0E0",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          {/* Google logo */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>●</div>
          <span style={{
            fontFamily: "-apple-system, sans-serif", fontWeight: 500, fontSize: 22,
            color: "#3C4043",
          }}>
            Calendar
          </span>
          <span style={{
            marginLeft: "auto",
            fontFamily: "-apple-system, 'Heebo', sans-serif", fontWeight: 500, fontSize: 18,
            color: "#3C4043",
            direction: "rtl",
          }}>
            השבוע · אפריל 7-13
          </span>
        </div>

        {/* Week grid */}
        <div style={{
          flex: 1, padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Day headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "60px repeat(7, 1fr)",
            borderBottom: "1px solid #E0E0E0",
            paddingBottom: 8,
          }}>
            <div />
            {days.map((d, i) => {
              const isToday = i === 3;
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "-apple-system, sans-serif", fontWeight: 500, fontSize: 13,
                    color: isToday ? "#1A73E8" : "#5F6368", textTransform: "uppercase",
                  }}>{d}</div>
                  <div style={{
                    fontFamily: "-apple-system, sans-serif", fontWeight: 400, fontSize: 26,
                    color: isToday ? "#FFF" : "#3C4043",
                    background: isToday ? "#1A73E8" : "transparent",
                    width: 38, height: 38, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "4px auto 0",
                  }}>
                    {7 + i}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid + events */}
          <div style={{
            flex: 1, position: "relative",
            display: "grid",
            gridTemplateColumns: "60px repeat(7, 1fr)",
            marginTop: 8,
          }}>
            {/* Hour rows + grid lines */}
            {hours.map((h, i) => (
              <React.Fragment key={i}>
                <div style={{
                  fontFamily: "-apple-system, sans-serif", fontSize: 11,
                  color: "#80868B", textAlign: "right",
                  paddingRight: 8, paddingTop: 0,
                  borderTop: i > 0 ? "1px solid #F0F0F0" : "none",
                  minHeight: 50,
                }}>
                  {h}:00
                </div>
                {days.map((_, dayIdx) => (
                  <div key={`${i}-${dayIdx}`} style={{
                    borderTop: i > 0 ? "1px solid #F0F0F0" : "none",
                    borderLeft: "1px solid #F0F0F0",
                    minHeight: 50,
                    position: "relative",
                  }} />
                ))}
              </React.Fragment>
            ))}

            {/* Events absolutely positioned over grid */}
            {events.map((evt, i) => {
              const eventDelay = 16 + i * STAGGER;
              const eventProg = spring({
                frame: Math.max(0, frame - eventDelay), fps, config: SPRING_PRESETS.snappy,
              });
              if (frame < eventDelay) return null;

              const hourIdx = Math.max(0, evt.hour - 9);
              const top = hourIdx * 50 + 1;
              const height = evt.duration * 50 - 4;
              const colWidth = (1080 - 40 - 24 - 60) / 7;
              const left = 60 + evt.day * colWidth + 2;
              const width = colWidth - 4;

              return (
                <div key={i} style={{
                  position: "absolute",
                  left, top, width, height,
                  background: evt.color,
                  borderRadius: 4,
                  padding: "4px 6px",
                  fontFamily: "-apple-system, 'Heebo', sans-serif",
                  fontWeight: 600, fontSize: 11,
                  color: "#FFF", direction: "rtl",
                  opacity: eventProg,
                  transform: `scale(${interpolate(eventProg, [0, 1], [0.7, 1])})`,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}>
                  {evt.title}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom label */}
        {frame > 60 && primary && (
          <div style={{
            position: "absolute", bottom: 20, left: 0, right: 0,
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-block",
              background: brandColor,
              color: "#FFF",
              padding: "10px 24px",
              borderRadius: 14,
              fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 18,
              direction: "rtl",
              boxShadow: `0 4px 16px rgba(${rgb},0.4)`,
            }}>
              {primary}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
