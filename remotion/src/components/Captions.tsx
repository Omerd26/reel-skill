import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  /** Key word (power word / number). Rendered with a harder pop + stays crisp
   *  after it's spoken, so the eye lands on what matters. Set server-side. */
  emphasis?: boolean;
}

interface CaptionsProps {
  words: WordTimestamp[];
  /** "none" disables burned captions entirely (user toggled subtitles off, or
   *  a reference brief banned them) — the component renders nothing. */
  style: "tiktok" | "classic" | "highlight" | "white_card" | "cinematic" | "none";
  brandColor?: string;
  /** Vertical shift in px applied to ALL caption styles. Positive = move
   *  DOWN (closer to screen bottom), negative = UP. Lets the user nudge
   *  captions away from a low/high face via a chat revision. Default 0. */
  captionOffset?: number;
  /** Full-frame B-roll mute windows in SECONDS ({start, end}). While the
   *  current frame time falls inside any window the component renders
   *  NOTHING — playbook §4.1: zero captions during full-frame takeovers,
   *  "the UI is the text". Computed by the mounting composition from
   *  editing_plan.broll_scenes. Absent/empty = exactly previous behavior. */
  muteWindows?: Array<{ start: number; end: number }>;
}

// ── Smart word grouping ───────────────────────────────────────────────────────
// Groups by natural pauses AND character limits for clean RTL Hebrew/English.

function groupWordsByPauseAndLength(
  words: WordTimestamp[],
  maxGapSecs = 0.5,
  maxPerGroup = 5,
  maxChars = 28
): WordTimestamp[][] {
  const groups: WordTimestamp[][] = [];
  let current: WordTimestamp[] = [];
  let currentChars = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordChars = word.word.replace(/\s/g, "").length;
    const next = words[i + 1];
    const gap  = next ? next.start - word.end : 999;

    current.push(word);
    currentChars += wordChars;

    const shouldBreak =
      gap > maxGapSecs ||
      current.length >= maxPerGroup ||
      currentChars >= maxChars ||
      (gap > 0.25 && currentChars >= Math.floor(maxChars * 0.7));

    if (shouldBreak) {
      groups.push([...current]);
      current = [];
      currentChars = 0;
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

// ── Highlight style: current word in brand color ──────────────────────────────

const HighlightCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string }> = ({
  words,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentIdx = words.findIndex((w) => {
    return frame >= w.start * fps && frame < w.end * fps + 3;
  });

  if (currentIdx === -1) return null;

  // Group with smart length-aware splitting (28 chars max per group)
  const groups = groupWordsByPauseAndLength(words, 0.5, 5, 28);

  const currentWord = words[currentIdx];
  const activeGroup = groups.find((g) => g.some((w) => w === currentWord));

  if (!activeGroup) return null;

  const groupStartFrame = activeGroup[0].start * fps;
  const groupOpacity = interpolate(frame - groupStartFrame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 400,
          left: 28,
          right: 28,
          opacity: groupOpacity,
          direction: "rtl",
          textAlign: "center",
          lineHeight: 1.3,
          // Reserve a fixed 2-line height and bottom-align so 1-line vs 2-line
          // groups always sit on the same baseline — no vertical jumping.
          minHeight: 200,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-end",
          justifyContent: "center",
        }}
      >
        {activeGroup.map((w, i) => {
          const isActive = frame >= w.start * fps && frame < w.end * fps + 3;
          const isPast   = frame >= w.end * fps + 3;

          const wordFrame = Math.max(0, frame - w.start * fps);
          const emph = w.emphasis === true;
          // Emphasis via transform-scale ONLY (transforms don't reflow layout),
          // so the active word never changes the line height — no vertical
          // bobbing. Font size stays constant. Key words (emph) pop harder when
          // spoken and keep a slightly larger baseline so the eye lands on them.
          // Peak scale is deliberately modest: transform:scale is paint-only and
          // reserves NO layout width, so an oversized active word's pixels spill
          // past its margin box and collide with the neighbouring words (the
          // "jammed captions" bug). 1.15/1.10 still reads as a clear pop while
          // staying inside the widened 16px margin below. (Was 1.26/1.12.)
          const activeScale = isActive
            ? spring({ frame: wordFrame, fps, config: { damping: 12, stiffness: 260 }, from: 0.9, to: emph ? 1.15 : 1.10 })
            : emph ? 1.06 : 1.0;

          return (
            <span
              key={i}
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 900,
                fontSize: 70,
                lineHeight: 1.25,
                color: isActive ? brandColor : isPast ? (emph ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.68)") : "#FFFFFF",
                // Heavy black outline (paintOrder keeps the fill crisp) is the
                // 2026 look AND makes captions readable over ANY B-roll, light
                // or dark — no scrim needed. A soft shadow adds lift.
                WebkitTextStroke: "6px #000000",
                paintOrder: "stroke fill",
                textShadow: "0 3px 10px rgba(0,0,0,0.55)",
                display: "inline-block",
                transform: `scale(${activeScale})`,
                transformOrigin: "center bottom",
                margin: "0 16px",
                letterSpacing: "-0.01em",
                // Isolate each word's bidi so a Latin number ("1,000", "80%")
                // renders left-to-right on its own instead of being reordered by
                // the surrounding RTL Hebrew (was showing as "000,1").
                unicodeBidi: "isolate",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── TikTok style: one word at a time, large, centered ─────────────────────────

const TikTokCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string }> = ({
  words,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentWordIndex = words.findIndex((w) => {
    return frame >= w.start * fps && frame < w.end * fps + 2;
  });

  if (currentWordIndex === -1) return null;

  const word = words[currentWordIndex];
  const nextWord = words[currentWordIndex + 1];
  const wordStartFrame   = word.start * fps;
  const framesSinceStart = Math.max(0, frame - wordStartFrame);

  // Pair very short words with the next word for readability
  const wordDuration = word.end - word.start;
  const displayText = (wordDuration < 0.22 && nextWord)
    ? `${word.word} ${nextWord.word}`
    : word.word;

  const scale = spring({
    frame: framesSinceStart,
    fps,
    config: { damping: 10, stiffness: 200 },
    from: 0.7,
    to: 1.0,
  });

  const opacity = interpolate(framesSinceStart, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 400,
          left: 0,
          right: 0,
          direction: "rtl",
          textAlign: "center",
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <span
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 900,
            fontSize: 88,
            color: "#FFFFFF",
            WebkitTextStroke: "4px #000000",
            textShadow: "0 4px 16px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.6)",
            lineHeight: 1.1,
            display: "block",
            padding: "0 40px",
          }}
        >
          {displayText}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Classic style: 2-4 words at once, bottom subtitle bar ─────────────────────

const ClassicCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string }> = ({
  words,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (words.length === 0) return null;

  // Use smart grouping: max 4 words OR 24 chars, break on pauses
  const chunks = groupWordsByPauseAndLength(words, 0.4, 4, 24).map((slice) => ({
    words: slice,
    start: slice[0].start,
    end:   slice[slice.length - 1].end,
  }));

  const activeChunk = chunks.find((c) => {
    return frame >= c.start * fps && frame < c.end * fps + fps * 0.3;
  });

  if (!activeChunk) return null;

  const chunkStartFrame = activeChunk.start * fps;
  const opacity    = interpolate(frame - chunkStartFrame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(frame - chunkStartFrame, [0, 8], [12, 0], { extrapolateRight: "clamp" });
  const chunkText  = activeChunk.words.map((w) => w.word).join(" ");

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 400,
          left: 28,
          right: 28,
          display: "flex",
          justifyContent: "center",
        }}
      >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          background: "rgba(0,0,0,0.68)",
          borderRadius: 14,
          padding: "16px 32px",
          maxWidth: "88%",
        }}
      >
        <p
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 50,
            color: "#FFFFFF",
            textAlign: "center",
            direction: "rtl",
            margin: 0,
            lineHeight: 1.3,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {chunkText}
        </p>
      </div>
      </div>
    </AbsoluteFill>
  );
};

// ── White Card style: clean white pill cards, black text — eilon.grouper style ─

const WhiteCardCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string }> = ({
  words,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (words.length === 0) return null;

  // Group words into small chunks (3-4 words max, break on pauses)
  const chunks = groupWordsByPauseAndLength(words, 0.4, 4, 22).map((slice) => ({
    words: slice,
    start: slice[0].start,
    end:   slice[slice.length - 1].end,
  }));

  const activeChunk = chunks.find((c) => {
    return frame >= c.start * fps && frame < c.end * fps + fps * 0.3;
  });

  if (!activeChunk) return null;

  const chunkStartFrame = activeChunk.start * fps;
  const opacity    = interpolate(frame - chunkStartFrame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  const scaleIn    = spring({ frame: Math.max(0, frame - chunkStartFrame), fps, config: { damping: 14, stiffness: 260 }, from: 0.9, to: 1.0 });
  const chunkText  = activeChunk.words.map((w) => w.word).join(" ");

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 400,
          left: 28,
          right: 28,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scaleIn})`,
            background: "#FFFFFF",
            borderRadius: 28,
            padding: "18px 36px",
            maxWidth: "88%",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 6px rgba(0,0,0,0.12)",
          }}
        >
          <p
            style={{
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 800,
              fontSize: 52,
              color: "#111111",
              textAlign: "center",
              direction: "rtl",
              margin: 0,
              lineHeight: 1.3,
              letterSpacing: "-0.5px",
            }}
          >
            {chunkText}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cinematic style: word-by-word fade-up, gold accent, no background ────────
// Inspired by @omgluka / premium creator reels.
// Each word fades in + slides up individually with staggered timing.
// Key words (longer or emphasized) get the brand/gold accent color.

const CinematicCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string }> = ({
  words,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Group into small natural phrases (3-5 words)
  const groups = groupWordsByPauseAndLength(words, 0.45, 5, 26);

  // Find active group
  const activeGroupIdx = groups.findIndex((g) => {
    const gStart = g[0].start * fps;
    const gEnd = g[g.length - 1].end * fps + fps * 0.5;
    return frame >= gStart && frame < gEnd;
  });

  if (activeGroupIdx === -1) return null;
  const activeGroup = groups[activeGroupIdx];
  const groupStart = activeGroup[0].start;

  // Decide which word in the group gets the accent color.
  // Heuristic: the longest word, or the 2nd word if group has 3+.
  const accentIdx = (() => {
    if (activeGroup.length <= 1) return -1; // no accent for single words
    let longestIdx = 0;
    let longestLen = 0;
    activeGroup.forEach((w, i) => {
      if (w.word.length > longestLen) { longestLen = w.word.length; longestIdx = i; }
    });
    return longestLen >= 3 ? longestIdx : -1;
  })();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 380,
          left: 32,
          right: 32,
          direction: "rtl",
          textAlign: "center",
          lineHeight: 1.2,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 8px",
        }}
      >
        {activeGroup.map((w, i) => {
          // Each word enters with its own staggered delay
          const wordDelay = i * 0.12; // 120ms stagger between words
          const wordEntryFrame = (groupStart + wordDelay) * fps;
          const framesSinceEntry = Math.max(0, frame - wordEntryFrame);

          // Fade in + slide up
          const wordOpacity = interpolate(
            framesSinceEntry, [0, 6], [0, 1],
            { extrapolateRight: "clamp" }
          );
          const slideUp = interpolate(
            framesSinceEntry, [0, 8], [18, 0],
            { extrapolateRight: "clamp" }
          );

          // Subtle scale spring on entry
          const entryScale = spring({
            frame: framesSinceEntry,
            fps,
            config: { damping: 14, stiffness: 200 },
            from: 0.92,
            to: 1.0,
          });

          const isAccent = i === accentIdx;

          return (
            <span
              key={i}
              style={{
                fontFamily: "'Heebo', sans-serif",
                fontWeight: 800,
                fontSize: 72,
                color: isAccent ? brandColor : "#FFFFFF",
                textShadow: isAccent
                  ? `0 2px 20px rgba(0,0,0,0.7), 0 0 40px ${brandColor}40`
                  : "0 2px 16px rgba(0,0,0,0.85), 0 4px 32px rgba(0,0,0,0.5)",
                display: "inline-block",
                opacity: wordOpacity,
                transform: `translateY(${slideUp}px) scale(${entryScale})`,
                transformOrigin: "center bottom",
                letterSpacing: "-0.5px",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Number-fragment merge ─────────────────────────────────────────────────────
// ivrit-ai/whisper splits a number like "1,000" into separate word tokens —
// e.g. ["-1", ",000"] — often with a stray leading hyphen. Each token is its
// own RTL span, so the fragments lay out right-to-left and the number reads
// backwards ("000,1"). Collapse consecutive numeric fragments into one clean
// token. Idempotent (already-whole numbers pass through) and mirrors the
// server-side _merge_number_tokens in video_editor.py, so preview == export.
const NUM_FRAG = /^[-–—,.]*\d[\d,.]*$/;
function mergeNumberTokens(words: WordTimestamp[]): WordTimestamp[] {
  if (!words || words.length === 0) return words;
  const out: WordTimestamp[] = [];
  let i = 0;
  while (i < words.length) {
    if (NUM_FRAG.test((words[i].word ?? "").trim())) {
      const frags: WordTimestamp[] = [];
      let j = i;
      while (j < words.length && NUM_FRAG.test((words[j].word ?? "").trim())) {
        frags.push(words[j]);
        j++;
      }
      if (frags.length <= 1) {
        out.push(words[i]);
      } else {
        out.push({
          ...frags[0],
          word: frags.map((f) => (f.word ?? "").trim().replace(/^[-–—]+/, "")).join(""),
          start: frags[0].start,
          end: frags[frags.length - 1].end,
          emphasis: frags.some((f) => f.emphasis),
        });
      }
      i = j;
    } else {
      out.push(words[i]);
      i++;
    }
  }
  // Second pass: attach a standalone "%" token to the preceding digit-bearing
  // word ("80" + "%" → "80%") so the percent can't detach ("20 %") or flip to
  // "% 80" in the RTL line. Idempotent: after one pass no standalone "%"
  // remains next to a number, and already-whole "80%" tokens pass through
  // untouched. Mirrors the server-side _merge_number_tokens percent merge.
  const withPct: WordTimestamp[] = [];
  for (const w of out) {
    const prev = withPct[withPct.length - 1];
    if ((w.word ?? "").trim() === "%" && prev && /\d/.test(prev.word ?? "")) {
      withPct[withPct.length - 1] = {
        ...prev,
        word: `${(prev.word ?? "").trim()}%`,
        end: w.end,
        emphasis: prev.emphasis || w.emphasis,
      };
    } else {
      withPct.push(w);
    }
  }
  return withPct;
}

// ── Exported component ────────────────────────────────────────────────────────

export const Captions: React.FC<CaptionsProps> = ({
  words: rawWords,
  style,
  brandColor = "#E0701E",
  captionOffset = 0,
  muteWindows,
}) => {
  // Hooks unconditionally FIRST (rules of hooks) — the early returns below
  // must never skip them.
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // "none" = captions disabled (user opted out / brief banned). Render nothing.
  if (style === "none") return null;
  if (!rawWords || rawWords.length === 0) return null;
  // Playbook §4.1 — "zero captions during full-frame; the UI is the text":
  // inside any mute window (seconds) captions render NOTHING. Windows are
  // computed by the mounting composition from editing_plan.broll_scenes using
  // the same frame math as the B-roll <Sequence>s, so the mute covers exactly
  // the frames a takeover is on screen. Absent/empty = previous behavior.
  if (muteWindows && muteWindows.length > 0) {
    const t = frame / fps;
    for (const w of muteWindows) {
      if (t >= w.start && t < w.end) return null;
    }
  }
  const words = mergeNumberTokens(rawWords);

  const inner =
    style === "tiktok"     ? <TikTokCaptions     words={words} brandColor={brandColor} /> :
    style === "classic"    ? <ClassicCaptions    words={words} brandColor={brandColor} /> :
    style === "white_card" ? <WhiteCardCaptions  words={words} brandColor={brandColor} /> :
    style === "cinematic"  ? <CinematicCaptions  words={words} brandColor={brandColor} /> :
    /* highlight (default) */ <HighlightCaptions words={words} brandColor={brandColor} />;

  // One uniform vertical shift for every style — positive moves captions DOWN.
  // translateY on a wrapping AbsoluteFill moves the absolutely-positioned
  // (bottom: 400 / 380) caption groups together without touching each style.
  // ⚠️ The base `bottom` values here MUST match the preview copy at
  // leo-studio/lib/remotion-shared/components/Captions.tsx (currently 400/380).
  // They drifted (render was 520/500) and the rendered MP4 sat 120px higher
  // than the preview, so a "lower the captions" nudge looked like it reverted.
  if (!captionOffset) return inner;
  return (
    <AbsoluteFill style={{ transform: `translateY(${captionOffset}px)` }}>
      {inner}
    </AbsoluteFill>
  );
};
