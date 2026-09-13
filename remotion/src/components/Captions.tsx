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

/** A caption group planned outside the renderer (scripts/reelkit/captions.py →
 *  work/captions.json → props.caption_groups). Seconds on the edited timeline.
 *  The group is on screen for [start, end); `break_after` forces the line
 *  break after that word index. */
export interface CaptionGroup {
  id?: string;
  start: number;
  end: number;
  break_after?: number | null;
  words: WordTimestamp[];
}

// ── Bidi runs ────────────────────────────────────────────────────────────────
// The flex layouts lay out one <span> per word with direction:rtl, so a run of
// English words was reversed ("Claude Code" rendered as "Code Claude", read
// left-to-right). Consecutive LTR tokens (Latin letters or digits, no Hebrew)
// are wrapped in ONE ltr-isolated inline-flex run; Hebrew keeps RTL order.
const HEBREW_CHAR = /[\u0590-\u05FF]/;
const LTR_CHAR = /[A-Za-z0-9]/;
export function isLtrToken(word: string): boolean {
  const w = (word ?? "").trim();
  return w.length > 0 && !HEBREW_CHAR.test(w) && LTR_CHAR.test(w);
}

type Run<T> = { ltr: boolean; items: T[] };
export function toBidiRuns<T>(items: T[], text: (item: T) => string): Run<T>[] {
  const runs: Run<T>[] = [];
  for (const it of items) {
    const ltr = isLtrToken(text(it));
    const last = runs[runs.length - 1];
    if (last && last.ltr && ltr) last.items.push(it);
    else runs.push({ ltr, items: [it] });
  }
  return runs;
}

/** Split a group's words into display lines (explicit break, else one flex-wrap line). */
function groupLines(g: CaptionGroup): WordTimestamp[][] {
  const ba = g.break_after;
  if (ba === null || ba === undefined || ba < 0 || ba >= g.words.length - 1) return [g.words];
  return [g.words.slice(0, ba + 1), g.words.slice(ba + 1)];
}

function activeGroupAt(groups: CaptionGroup[], t: number): CaptionGroup | undefined {
  return groups.find((g) => t >= g.start && t < g.end);
}

interface CaptionsProps {
  words: WordTimestamp[];
  /** Planned groups — when present they are used as-is (no regrouping). */
  groups?: CaptionGroup[];
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

const HighlightWord: React.FC<{ w: WordTimestamp; brandColor: string }> = ({ w, brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isActive = frame >= w.start * fps && frame < w.end * fps + 3;
  const isPast   = frame >= w.end * fps + 3;
  const wordFrame = Math.max(0, frame - w.start * fps);
  const emph = w.emphasis === true;
  // Emphasis via transform-scale ONLY (transforms don't reflow layout), so the
  // active word never changes the line height. Peak scale stays modest:
  // transform:scale reserves no layout width, and 1.26 collided with the
  // neighbouring words ("jammed captions"). 1.15/1.10 still reads as a pop.
  const activeScale = isActive
    ? spring({ frame: wordFrame, fps, config: { damping: 12, stiffness: 260 }, from: 0.9, to: emph ? 1.15 : 1.10 })
    : emph ? 1.06 : 1.0;
  return (
    <span
      style={{
        fontFamily: "'Heebo', sans-serif",
        fontWeight: 900,
        fontSize: 70,
        lineHeight: 1.25,
        color: isActive ? brandColor : isPast ? (emph ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.68)") : "#FFFFFF",
        // Heavy black outline (paintOrder keeps the fill crisp) — readable over any footage.
        WebkitTextStroke: "6px #000000",
        paintOrder: "stroke fill",
        textShadow: "0 3px 10px rgba(0,0,0,0.55)",
        display: "inline-block",
        transform: `scale(${activeScale})`,
        transformOrigin: "center bottom",
        margin: "0 16px",
        letterSpacing: "-0.01em",
        unicodeBidi: "isolate",
      }}
    >
      {w.word}
    </span>
  );
};

/** One line of words: Hebrew flows RTL, each LTR run is kept left-to-right. */
const WordLine: React.FC<{
  words: WordTimestamp[];
  render: (w: WordTimestamp, key: string) => React.ReactNode;
  lineKey: string;
}> = ({ words, render, lineKey }) => (
  <>
    {toBidiRuns(words, (w) => w.word).map((run, r) =>
      run.ltr && run.items.length > 1 ? (
        <span
          key={`${lineKey}-run${r}`}
          style={{ display: "inline-flex", direction: "ltr", unicodeBidi: "isolate", flexWrap: "nowrap" }}
        >
          {run.items.map((w, i) => render(w, `${lineKey}-${r}-${i}`))}
        </span>
      ) : (
        run.items.map((w, i) => render(w, `${lineKey}-${r}-${i}`))
      )
    )}
  </>
);

const HighlightBlock: React.FC<{ lines: WordTimestamp[][]; brandColor: string; opacity: number }> = ({
  lines,
  brandColor,
  opacity,
}) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        bottom: 400,
        left: 28,
        right: 28,
        opacity,
        direction: "rtl",
        textAlign: "center",
        lineHeight: 1.3,
        // Fixed 2-line height, bottom-aligned: 1-line vs 2-line groups share a baseline.
        minHeight: 200,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-end",
        justifyContent: "center",
      }}
    >
      {lines.map((line, li) => (
        <React.Fragment key={`l${li}`}>
          {li > 0 && <div style={{ flexBasis: "100%", height: 0 }} />}
          <WordLine
            words={line}
            lineKey={`l${li}`}
            render={(w, key) => <HighlightWord key={key} w={w} brandColor={brandColor} />}
          />
        </React.Fragment>
      ))}
    </div>
  </AbsoluteFill>
);

const HighlightCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string; groups?: CaptionGroup[] }> = ({
  words,
  brandColor,
  groups,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (groups && groups.length) {
    const g = activeGroupAt(groups, frame / fps);
    if (!g) return null;
    const opacity = interpolate(frame - g.start * fps, [0, 4], [0, 1], { extrapolateRight: "clamp" });
    return <HighlightBlock lines={groupLines(g)} brandColor={brandColor} opacity={opacity} />;
  }

  // Legacy props (words only): mechanical grouping, visible while a word is active.
  const currentIdx = words.findIndex((w) => frame >= w.start * fps && frame < w.end * fps + 3);
  if (currentIdx === -1) return null;
  const legacy = groupWordsByPauseAndLength(words, 0.5, 5, 28);
  const currentWord = words[currentIdx];
  const activeGroup = legacy.find((g) => g.some((w) => w === currentWord));
  if (!activeGroup) return null;
  const opacity = interpolate(frame - activeGroup[0].start * fps, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  return <HighlightBlock lines={[activeGroup]} brandColor={brandColor} opacity={opacity} />;
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

const ClassicCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string; groups?: CaptionGroup[] }> = ({
  words,
  groups,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (words.length === 0 && !(groups && groups.length)) return null;

  const activeChunk = pickChunk(words, groups, frame / fps, 0.4, 4, 24);
  if (!activeChunk) return null;

  const chunkStartFrame = activeChunk.start * fps;
  const opacity    = interpolate(frame - chunkStartFrame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(frame - chunkStartFrame, [0, 8], [12, 0], { extrapolateRight: "clamp" });
  const chunkText  = chunkNode(activeChunk);

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

/** Classic / white-card chunk: the planned group, or the legacy mechanical one. */
function pickChunk(
  words: WordTimestamp[], groups: CaptionGroup[] | undefined, t: number,
  maxGap: number, maxPer: number, maxChars: number,
): CaptionGroup | undefined {
  if (groups && groups.length) return activeGroupAt(groups, t);
  const chunks = groupWordsByPauseAndLength(words, maxGap, maxPer, maxChars).map((slice) => ({
    words: slice, start: slice[0].start, end: slice[slice.length - 1].end + 0.3,
  }));
  return chunks.find((c) => t >= c.start && t < c.end);
}

/** Plain-text chunk (one <p>, the browser's bidi handles mixed text) with the planned line break. */
function chunkNode(g: CaptionGroup): React.ReactNode {
  const lines = groupLines(g);
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line.map((w) => w.word).join(" ")}
    </React.Fragment>
  ));
}

// ── White Card style: clean white pill cards, black text — eilon.grouper style ─

const WhiteCardCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string; groups?: CaptionGroup[] }> = ({
  words,
  groups,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (words.length === 0 && !(groups && groups.length)) return null;

  const activeChunk = pickChunk(words, groups, frame / fps, 0.4, 4, 22);
  if (!activeChunk) return null;

  const chunkStartFrame = activeChunk.start * fps;
  const opacity    = interpolate(frame - chunkStartFrame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  const scaleIn    = spring({ frame: Math.max(0, frame - chunkStartFrame), fps, config: { damping: 14, stiffness: 260 }, from: 0.9, to: 1.0 });
  const chunkText  = chunkNode(activeChunk);

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

const CinematicCaptions: React.FC<{ words: WordTimestamp[]; brandColor: string; groups?: CaptionGroup[] }> = ({
  words,
  brandColor,
  groups: planned,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let activeGroup: WordTimestamp[];
  let lines: WordTimestamp[][];
  if (planned && planned.length) {
    const g = activeGroupAt(planned, frame / fps);
    if (!g) return null;
    activeGroup = g.words;
    lines = groupLines(g);
  } else {
    // Legacy: small natural phrases (3-5 words)
    const groups = groupWordsByPauseAndLength(words, 0.45, 5, 26);
    const activeGroupIdx = groups.findIndex((g) => {
      const gStart = g[0].start * fps;
      const gEnd = g[g.length - 1].end * fps + fps * 0.5;
      return frame >= gStart && frame < gEnd;
    });
    if (activeGroupIdx === -1) return null;
    activeGroup = groups[activeGroupIdx];
    lines = [activeGroup];
  }
  const groupStart = activeGroup[0].start;

  // Accent word: the planned emphasis if any, else the longest word.
  const accentIdx = (() => {
    const planned = activeGroup.findIndex((w) => w.emphasis === true);
    if (planned >= 0) return planned;
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
        }}
      >
        {lines.map((line, li) => (
          <React.Fragment key={`cl${li}`}>
            {li > 0 && <div style={{ flexBasis: "100%", height: 0 }} />}
            <WordLine
              words={line}
              lineKey={`cl${li}`}
              render={(w, key) => {
                const i = activeGroup.indexOf(w);
                // Each word enters with its own staggered delay
                const wordEntryFrame = (groupStart + i * 0.12) * fps;
                const framesSinceEntry = Math.max(0, frame - wordEntryFrame);
                const wordOpacity = interpolate(framesSinceEntry, [0, 6], [0, 1], { extrapolateRight: "clamp" });
                const slideUp = interpolate(framesSinceEntry, [0, 8], [18, 0], { extrapolateRight: "clamp" });
                const entryScale = spring({ frame: framesSinceEntry, fps, config: { damping: 14, stiffness: 200 }, from: 0.92, to: 1.0 });
                const isAccent = i === accentIdx;
                return (
                  <span
                    key={key}
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
                      margin: "0 4px",
                      unicodeBidi: "isolate",
                    }}
                  >
                    {w.word}
                  </span>
                );
              }}
            />
          </React.Fragment>
        ))}
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
  groups,
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
  const hasGroups = !!(groups && groups.length);
  if (!hasGroups && (!rawWords || rawWords.length === 0)) return null;
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
  // Planned groups already carry merged numbers; the words-only path merges here.
  const words = hasGroups
    ? (groups as CaptionGroup[]).flatMap((g) => g.words)
    : mergeNumberTokens(rawWords);
  const g = hasGroups ? groups : undefined;

  const inner =
    style === "tiktok"     ? <TikTokCaptions     words={words} brandColor={brandColor} /> :
    style === "classic"    ? <ClassicCaptions    words={words} brandColor={brandColor} groups={g} /> :
    style === "white_card" ? <WhiteCardCaptions  words={words} brandColor={brandColor} groups={g} /> :
    style === "cinematic"  ? <CinematicCaptions  words={words} brandColor={brandColor} groups={g} /> :
    /* highlight (default) */ <HighlightCaptions words={words} brandColor={brandColor} groups={g} />;

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
