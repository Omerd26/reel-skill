# Overlay Motion Graphics — Visual Identity

Ground truth for every overlay scene built in this project. No composition
ships without tracing its palette, type, motion, and transitions back to this
file. Generic colors (`#333`, `#3b82f6`, `Roboto`) are an instant fail.

> Inspired by: HyperFrames "Velvet Standard" (premium, timeless) blended with
> "Swiss Pulse" precision, anchored to the omer.digital warm-orange brand mark.
> Direct lineage from `may-shorts-19` (Student Kit) and the Infinite Global
> Payments spot deconstructed in `MOTION_PHILOSOPHY.md`.

---

## Style Prompt (one paragraph — read aloud before designing a scene)

omer.digital is a confident, productized, Apple-restraint brand — "iOS-26
liquid glass meets SaaS launch film." Compositions feel premium, intentional,
and lit (not colored) — talking-head footage stays the hero, with translucent
glass overlays floating in front of it like UI panels in a polished iOS keynote.
The mood is calm authority: motion is precise, never frantic; type is generous
with negative space; one warm orange accent earns its place by carrying meaning
(usually a number, a punchline, or a CTA). Not playful. Not neon. Not gradient
soup. Premium, restrained, kinetic-but-controlled.

---

## Colors

The brand operates on a **deep cool background + warm-orange accent** axis. The
talking head sits in front of this canvas; overlays exist to clarify, not to
decorate.

| Token              | Hex        | Role                                             |
| ------------------ | ---------- | ------------------------------------------------ |
| `--bg`             | `#0A0A0C`  | Primary canvas (near-black, slight warm tint)    |
| `--bg-deep`        | `#050608`  | Deepest zones, vignette extremes                 |
| `--surface`        | `#15161A`  | Solid card alt (when glass is wrong)             |
| `--glass-tint`     | `#1A1A1F`  | Tint behind backdrop-filter for liquid-glass     |
| `--border-hairline`| `rgba(255,255,255,0.10)` | Subtle border on dark surfaces        |
| `--border-glass`   | `rgba(255,255,255,0.22)` | Liquid-glass border (the iOS tell)    |
| `--text`           | `#FFFFFF`  | Primary text                                     |
| `--text-secondary` | `rgba(255,255,255,0.72)` | Body / supporting line                |
| `--text-tertiary`  | `rgba(255,255,255,0.45)` | Eyebrow labels, meta                  |
| `--accent-brand`   | `#E0701E`  | THE brand accent — orange. Carries one concept   |
| `--accent-glow`    | `rgba(224,112,30,0.45)` | Halo behind accent text/numbers          |
| `--accent-cool`    | `#4FC3F7`  | Secondary cool accent — only for "info" tone     |
| `--success`        | `#4ADE80`  | Tone: confirmation / positive comparison         |
| `--warn`           | `#FBBF24`  | Tone: caution / mid-state                        |
| `--danger`         | `#EF4444`  | Tone: problem / negative comparison              |

**Discipline:** the entire piece uses ≤ 5 active hues. The orange is *the*
signal — when it appears, the viewer's eye must go there. Never use orange for
decoration. If you reach for `#3b82f6` or invent a new accent, stop.

---

## Typography

Hebrew-first, paired with a register-shifting English mono for technical
labels and numbers. Two families, two roles — never default to one.

| Family             | Where to find it          | Role                                       |
| ------------------ | ------------------------- | ------------------------------------------ |
| **Rubik**          | Google Fonts (heb+lat)    | Headlines, hero text, comparison labels    |
| **Heebo**          | Google Fonts (heb+lat)    | Body, supporting copy, captions            |
| **JetBrains Mono** | Google Fonts (lat only)   | Eyebrows, numbers, meta labels, timestamps |

**Pairing logic:** Rubik for *voice*, Heebo for *narration*, JetBrains Mono
for *instruments*. Three voices in one conversation. Never two sans together.

### Type scale (1080×1920 portrait)

| Role              | Size          | Weight | Tracking  | Line height |
| ----------------- | ------------- | ------ | --------- | ----------- |
| Hero kinetic      | 140–200px     | 900    | -0.04em   | 0.92        |
| Display headline  | 84–110px      | 800    | -0.02em   | 1.05        |
| Section title     | 56–72px       | 800    | -0.01em   | 1.12        |
| Body              | 28–34px       | 400    | normal    | 1.4         |
| Eyebrow / label   | 22–26px       | 700    | 0.18em    | 1.3         |
| Meta / timestamp  | 18–22px       | 500    | 0.04em    | 1.3         |
| Number lockup     | 280–400px     | 900    | -0.04em   | 0.9         |

### Mandatory treatments

- **Hero text uses chrome gradient + halo glow** — never flat white.
  ```css
  background: linear-gradient(180deg, #FFFFFF 0%, #C7C7CC 60%, #E5E5E7 100%);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 0 24px rgba(255,255,255,0.45), 0 0 48px rgba(255,255,255,0.18);
  ```
- **Numbers in lockups** must use `font-variant-numeric: tabular-nums`.
- **Eyebrows** are ALL CAPS in Latin, regular weight in Hebrew with `letter-spacing: 0.18em`.
- **No `<br>` inside body copy** — let `max-width` wrap naturally. Exception: hero kinetic where each word is intentionally on its own line.

### Banned

- Inter, Roboto, Open Sans, Noto Sans, Poppins, Outfit, Sora, Syne, Playfair Display, Montserrat (already used by AIS — we want a different register), Cormorant Garamond, EB Garamond, Cinzel, Prata, Arimo, Lato.
- Pure `#000` backgrounds (use `#0A0A0C`).
- Pure `#FFF` text on hero (use the chrome gradient).
- Two sans paired (always cross the boundary: sans + mono).

---

## Motion Rules

Restrained, premium, kinetic-but-controlled. Apple-keynote energy, not TikTok-shake.

### Easing palette (named, intentional)

| Name             | GSAP equivalent                | Where it fires                                |
| ---------------- | ------------------------------ | --------------------------------------------- |
| `glass-rise`     | `expo.out`                     | Liquid-glass cards arriving                   |
| `confident`      | `power3.out`                   | Default headline / panel entrance             |
| `bounce-soft`    | `back.out(1.4)`                | Numbers locking, badges popping               |
| `bounce-firm`    | `back.out(2.4)`                | Stamp slams, checkmarks, CTAs                 |
| `silk`           | `sine.inOut`                   | Ambient drifts, breathing loops               |
| `glide`          | `power2.inOut`                 | Camera-style pans, scene transitions          |
| `whip`           | `power3.in` / `power2.out`     | Whip-streak transitions (pair: in for exit, out for enter) |
| `linear`         | `none`                         | Ken Burns, count-ups, holds after entrance    |

**Rule:** **at least 3 different eases per scene** across entrance tweens. If
two tweens in a scene use the same ease, restructure one.

### Duration bands

| Purpose                          | Duration        |
| -------------------------------- | --------------- |
| Word reveal (per word)           | 0.20–0.33s      |
| Card / panel entrance            | 0.40–0.60s      |
| Headline entrance                | 0.50–0.80s      |
| Number count-up                  | 0.40–0.80s      |
| Stamp slam                       | 0.28–0.35s      |
| Scene transition (push)          | 0.35–0.45s      |
| Scene transition (blur cross)    | 0.50–0.70s      |
| Whip streak                      | 0.30–0.40s      |
| Ambient drift / breath           | 2.0–4.0s, looping |
| Ken Burns over scene             | full scene, `linear` |

### Discipline rules

- **Offset first animation 0.10–0.30s** from scene start. Zero-delay = jump cut feel.
- **NO exit animations** on any scene except the final one. Scene transitions handle exits. If you write `tl.to(x, { opacity: 0 })` mid-piece, you are wrong.
- **Build / Breathe / Resolve** — every scene has three phases: 0–30% elements enter (staggered), 30–70% content holds with ONE ambient motion, 70–100% scene transition takes over.
- **Asymmetry** — entrance tweens are longer than exit hand-offs. A card takes 0.5s in, 0.25s out (when an exit is justified).
- **Vary direction** — never default `y: 30, opacity: 0` on every element. Mix: from x-, scale-pop, opacity-only, blur-reveal, letter-spacing collapse.
- **Word-reveal carrier pattern** — for kinetic text, stagger slide distances: first word 360px, then 120, 60, 25, 12. Carrier uses `expo.out 0.33s`, tail words `power2.out 0.20s`. Lead the visual 0.2s ahead of the spoken audio.
- **One idea per beat** — average overlay scene length is 1.5–2.5s. If the scene says two things, split it into two overlays.

---

## Transitions Between Overlays

No hard cuts between overlay scenes. Every scene-to-scene change uses one of:

| Transition         | When to use                                       | Duration | Ease pair               |
| ------------------ | ------------------------------------------------- | -------- | ----------------------- |
| **Push-slide-up**  | Default consecutive overlays                      | 0.35s    | `power2.in` → `power2.out` |
| **Blur-crossfade** | Calm hand-off, related ideas                      | 0.50s    | `sine.inOut`            |
| **Whip-streak**    | Energy beat, register shift                       | 0.35s    | `power3.in` → `power3.out` |
| **No transition**  | Scene fully covers previous (full-screen takeover)| —        | —                       |

Default is push-slide-up. Use whip only on a register break (e.g. moving from
"problem" to "solution"). Use blur-crossfade only when both scenes share the
same anchor and color tone.

---

## Liquid Glass — the recipe (do not deviate)

Every glass card is built with this exact CSS stack. The 4-stop diagonal
gradient is the iOS-26 tell — without it, the glass looks generic.

```css
.glass-surface {
  background: linear-gradient(135deg,
    rgba(255,255,255,0.075) 0%,
    rgba(255,255,255,0.025) 35%,
    rgba(255,255,255,0.010) 65%,
    rgba(255,255,255,0.055) 100%);
  backdrop-filter: blur(14px) saturate(1.12);
  -webkit-backdrop-filter: blur(14px) saturate(1.12);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 22px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),  /* the iOS-26 inner highlight */
    0 30px 60px -20px rgba(0,0,0,0.55),
    0 8px 16px -8px rgba(0,0,0,0.30);
}
```

**Variants:**
- `glass-frosted` — quieter, over busy backgrounds. Drop saturation to 1.0, raise blur to 22px.
- `glass-solid-dark` — when contrast is more important than translucency. Use `--surface` solid.
- `glass-outlined` — minimal, just `1.5px solid rgba(255,255,255,0.45)` and `rgba(255,255,255,0.02)` fill.

---

## Layout Rules — non-negotiable

### Default anchor priority (the speaker is the hero)

The talking head is the canvas. Overlays NEVER cover the speaker's face,
mouth, eyes, or main hand gesture. Default placement priority, in order:

1. **`top-right`** — the safest "I don't know" anchor. Top 100px down from
   frame top, x=56 from right edge.
2. **`top-left`** — same vertical, opposite side.
3. **`top-center`** — only when the content is short (< 60% frame width)
   and visually balanced; never for cards taller than 200px.
4. **`right-rail` / `left-rail`** — vertical strips at x=40, top=220.
   Use for tall narrow content beside the face.
5. **`center`** — RESERVED for full-screen takeover scenes (face hidden,
   FULLSCREEN face mode active). Never the default for a talking-head scene.
6. **`above-captions`** — legacy. Only `LowerThirdPremium` (name tag) uses
   this by convention. Everything else: top-bias.

### Forbidden positions (every overlay MUST avoid)

- The speaker's face zone: y=420→1300, x=200→880 (1080×1920 frame).
- The mouth area while speaking — never occlude.
- The main hand-gesture area — keep clear if the speaker uses their hands.
- The center chest / subtitle zone: y=1500→1820 (karaoke captions live here).

### Balance rule

If the speaker stands or leans toward one side of the frame, place the
overlay on the OPPOSITE side. The planner should detect this from a face
detection pass when available; fall back to `top-right` otherwise.

### Size rule

Overlay width: **18%–35% of frame width** (~195–380px on a 1080-wide
canvas). Never wider than 920px. Tall overlays should not exceed
**45% of frame height** (~860px on a 1920-tall canvas) and must stay
above the face zone.

### Composition rules

- **Anchor to edges, not the geometric center.** Centered-and-floating is
  a web pattern; video frames need eye paths.
- **Three layers minimum per scene** — background treatment + foreground
  content + accent element (divider, stamp, glow).
- **Two focal points minimum** — never a single text block in empty space.

---

## Visual Metaphor Framework — the meaning rule

Every glass overlay MUST visually illustrate the spoken meaning. A glass
card with a static title is a **failure**. A glass card with a toggle
animating from CLOSED to OPEN to illustrate the spoken phrase "the easiest
way to open" is the bar.

### Sentence classification → visual metaphor

When the planner builds a scene, classify the spoken phrase first, then
pick the metaphor with the strongest visual motion.

| Sentence means... | Visual metaphor (preferred motion) |
| --- | --- |
| **opening** something | toggle on, lock unlock, panel slides open, drawer opens, accordion expands |
| **closing** something | toggle off, lock locks, panel slides shut, drawer closes |
| **easiest / simplest** way | single tap with ripple, one-click animation, smooth shortcut completion |
| **faster** | speed indicator, progress bar jumping ahead, timeline compressing, fast-forward icon |
| **slower / more careful** | progress bar filling slowly, hourglass, deliberate fade-up |
| **organize / sort / filter** | cards moving into columns, folder grouping, tags being applied, checklist aligning |
| **compare** | two cards side by side, before/after split, toggle between states, A↔B switch |
| **choice / option** | tabs, radio buttons highlighting, branching arrows |
| **publish / send / upload** | upload arrow upward, post card flying upward, calendar slot filling, paper plane animation |
| **automate / chain** | flow arrows connecting nodes, trigger→action sequence, chain reaction lighting up |
| **state change** | before/after, on/off transition, status badge color flip |
| **growth** | bar chart bar growing, counter climbing, line graph rising |
| **decline / problem** | bar chart bar shrinking, line graph dropping, error badge appearing |
| **number / metric** | count-up animation, percentage filling, ring chart completing |
| **time / urgency** | timer ticking, hourglass, clock face spinning, calendar day flipping |
| **unlock / approval** | lock to unlocked, checkmark stamping, green check appearing |
| **receive / notification** | notification slides in from top-right (iOS feel) |
| **list / steps** | progressive list reveal, checklist with items checking off, numbered steps |

### The "child test" — quality bar

A good glass template makes a child instantly understand the meaning of
the sentence even before reading text. If the template doesn't make the
meaning clearer, **it failed**.

Failure modes:
- Template is just a floating title.
- Template covers the speaker.
- Template feels random.
- Template has a meaningless header text block.
- Template doesn't visually explain the idea.

### Text rules inside glass templates

Text must be minimal and functional. NEVER add a generic title because
there's empty space. Allowed:

- A single keyword (e.g. "OPEN", "LIVE", "DONE")
- A short label (≤ 3 words)
- A number / percentage
- A state label (`ON` / `OFF`)
- A button label (`PUBLISH`, `UPLOAD`)
- Step labels (`1`, `2`, `3`)

NOT allowed:
- Long sentences inside the template.
- Repeating the subtitles.
- A meaningless decorative title.
- More than 6 words total inside one overlay.

If the meaning can be shown visually without text, prefer visual only.

---

## Output contract — what the planner must emit per scene

For every scene plan, fill these fields:

- `transcript_phrase` — the spoken line this overlay supports
- `rationale` — 1 sentence: WHY this metaphor was chosen for this line
- `anchor` — top-bias (defaults above)
- `type` — one of the visual-metaphor scene types
- `text` — minimal (see rules above) or empty
- `motion` — implied by `type`, but can be tuned per scene

---

## Backgrounds — never flat

Talking-head footage *is* the canvas, but if a scene is full-screen overlay
(no face visible), the background MUST be the ambient stack:

1. Radial gradient base (`#0A0A0C` center-lift to `#050608` edges)
2. Subtle grid mesh, 80px cells, 4–5% opacity, slow drift via `translateY` over 8–12s
3. 6–10 drifting particle dots (positioned deterministically, 1–2px, 30–40% opacity)
4. Edge vignette (`radial-gradient(ellipse at center, transparent 30%, #050608 95%)`)
5. Faint film grain overlay (0.05 opacity)

Static backgrounds = death.

---

## Camera Discipline

- **Ken Burns on the talking head** — `scale: 1.000 → 1.025` over the full
  composition duration, `ease: "none"`. Always.
- **Subtle drift on overlays** — when an overlay holds for >2s, add a 2-4px
  `y` oscillation with `sine.inOut`, `repeat: -1, yoyo: true`. The eye reads
  any frozen pixel as broken.
- **Vignette breath** — vignette opacity wobbles 0.7 ↔ 0.9 over 4s loop.

---

## What NOT to Do

1. **Do not use `Inter`, `Roboto`, `Montserrat`, `Poppins`, or `Syne`.** Banned.
2. **Do not use pure `#000` or pure `#FFF`.** Always tint toward the warm-orange axis.
3. **Do not write exit animations** for non-final scenes. Transitions handle exits.
4. **Do not use the same ease on every tween in a scene.** 3+ eases minimum.
5. **Do not center every scene.** Anchor to edges; use center for hero kinetic only.
6. **Do not use flat white headlines.** Always chrome gradient + halo.
7. **Do not use cute icons or illustrations** — the brand is premium product, not playful dashboard.
8. **Do not use full-screen linear gradients on dark canvas** — H.264 banding. Radial only.
9. **Do not rely on `Math.random()` or `Date.now()`** — render determinism. Seeded PRNG only.
10. **Do not pack two ideas into one overlay.** One idea per beat. Split.
11. **Do not let the talking head sit still without Ken Burns + side vignette.**
12. **Do not skip the safe-zone check.** Face is sacred; captions are sacred.
13. **Do not invent new colors per scene.** Stick to the 13 tokens above.
14. **Do not use the orange accent for decoration.** It must carry meaning every time.

---

## File References

- `tokens.ts` — TypeScript export of every color, easing, type token in this doc
- `visual-styles.ts` — 8 named visual style presets (Velvet Standard, Swiss Pulse, etc.) for quick mood-shifts
- `MOTION_PHILOSOPHY.md` (HyperFrames Student Kit) — the parent aesthetic this doc descends from
