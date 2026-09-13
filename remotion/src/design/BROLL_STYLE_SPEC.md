# B-ROLL STYLE SPEC — "Reference Grade" upgrade
Build brief. Targets: `remotion/src/components/` (BRollOverlay.tsx, BRollPremium.tsx, BRollCreativeUI.tsx, BRollMotion.tsx) + `src/design/DESIGN.md`. Frame: 1080×1920 @30fps, Hebrew RTL, brand orange `#E0701E`.

---

## PART 1 — THE 7 DESIGN LAWS

### LAW 1: The hero object fills 55–90% of the frame. Crop courage.
**Evidence:** Ben Lavi's robot-army CU fills 90%; the CRT TV fills 80%; devinjatho's phone fills 55–65%, the IG UI is rebuilt at ~1.8× scale and cropped at the edges; testimonial climax hits 85% coverage. Our audit: GraphSpike's whole chart is ~330×340px in a 1920-tall frame (~15%); UIChecklistApp is a distant panel.
**Encode:** every scene declares one HERO element with a minimum bounding box of 60% frame width. It is allowed (encouraged) to overflow the frame edges — build UI cards at 110–130% frame width, tilt 2–3°, crop. Delete any layout constant under `width: 600` for hero content. Rule of thumb: if the whole composition is visible at once with margins on all four sides, it's too small.

### LAW 2: A virtual camera is always moving — every scene has 2–3 internal "sub-shots".
**Evidence:** Every Ben Lavi graphic contains 2–3 internal camera pushes in 3–4.5s (wide → mid → CU, a ~6× scale jump between consecutive frames in the browser scene). devinjatho's ManyChat whiteboard is one big canvas flown over with whip-pans; transitions are 0.2–0.4s whips with real directional blur.
**Encode:** build one `<CameraRig>` component and wrap EVERY scene's content:
```tsx
// poses: [{frame, x, y, scale, rotate?}]  — 2–3 poses per scene
const pose = interpolatePoses(frame, poses, Easing.bezier(0.25,0.1,0.25,1));
const vel  = poseVelocity(frame, poses);            // px/frame
const blurX = Math.min(24, Math.abs(vel.x) * 0.9);  // directional blur ∝ velocity
// isotropic CSS blur is wrong for whips — use an SVG filter:
// <filter id="dirblur"><feGaussianBlur stdDeviation={`${blurX} ${blurY}`}/></filter>
<div style={{ transform:`translate(${pose.x}px,${pose.y}px) scale(${pose.scale})`,
              filter: vel.mag > 2 ? `url(#dirblur)` : undefined }}>
```
Whips between poses: 8–12 frames, `power3.in → power2.out`. Settle pose always has a residual drift (scale 1.03→1.00 linear over the hold). No scene renders a static transform, ever.

### LAW 3: One light source + one texture pass — never flat dark, and never dark-on-dark.
**Evidence:** Ben Lavi: every graphic = one glow source + scanlines/grain + vignette over near-black. devinjatho: glow is the only texture on true black. Critically, the ManyChat "whiteboard world" flips to a LIGHT `#E8E9EB` canvas with white cards — that's how a UI scene reads crisp. Our audit: `rgba(0,0,0,0.85)` flats and `rgba(255,255,255,0.03)` cards on `#0A0A0F` = mud.
**Encode:** the shared `<SceneStage>` (Part 3) with two variants: `dark` (glow + grain + vignette) and `light` (whiteboard world) — UI-heavy scenes (workflow, checklist, dashboards) get the option to run `light`. On dark, minimum surface contrast: card fill ≥ `rgba(255,255,255,0.07)` with a 1px top light edge `inset 0 1px 0 rgba(255,255,255,0.22)`.

### LAW 4: Depth is mandatory — DOF blur, oversized soft shadows, layered z.
**Evidence:** ManyChat cards: shadow ≈ `0 20px 50px` at 18% black, non-hero nodes defocused; iPhone notifications stack with depth blur; Ben Lavi's browser tilts ~5° in 3D over vignette; devinjatho's z-sandwich (bg → graphics → subject → captions).
**Encode:** three depth bands per scene: BACK (blur 6–10px, brightness 0.55), MID (hero, crisp), FRONT (counters/labels, small drop shadow). Hero cards always get `boxShadow: "0 40px 90px -20px rgba(0,0,0,0.55)"` on dark or `"0 24px 60px rgba(17,24,39,0.18)"` on light, plus `transform: rotate(-2deg)` or `rotateX/Y` ~3° perspective. Anything not currently focal gets `filter: blur(4px) brightness(0.55)` — blur is a focus device, not a decoration.

### LAW 5: One accent per beat, bound to meaning; everything else is desaturated.
**Evidence:** identical across all four reels: white carries 90% of type, exactly ONE accent per screen, semantically mapped (red=loss, green=win, gold=status), accents always carry a matching glow. Our DESIGN.md already legislates this — the B-roll components just don't obey it (GraphSpike shows orange + 🔥 emoji + white simultaneously with no hierarchy).
**Encode:** scenes take `accentMeaning: "win" | "loss" | "brand"` → `#4ADE80 | #EF4444 | #E0701E`. The accent appears on exactly one element per beat and ALWAYS pairs with its glow: `textShadow/boxShadow: 0 0 24px rgba(<accent>,0.55), 0 0 60px rgba(<accent>,0.25)`. Everything non-accent: white/gray ramp only. Delete all emoji from scene internals (❌ ✅ 🔥 📋) — emoji are the #1 "cheap" tell vs. the references.

### LAW 6: Skeuomorphic realness — UI scenes look like real physical software, with press states.
**Evidence:** devinjatho: pixel-faithful IG chrome, iOS status bar/notch, a FOLLOWED button with a full pressed→released cycle, 7-segment LED clock with bloom, frosted iOS notifications. Ben Lavi: beveled Win95 chrome, CRT bezel.
**Encode:** every `ui_*` scene includes: real status bar (9:41, signal, battery), correct platform radii (iOS cards 20px, pills full-round), interactive states animated (button press = scale 0.94 for 3 frames + release overshoot; toggle knob slides with spring), and one "physical" reaction per state change (card jolts 4px for 1 frame when a check lands). Details are the premium.

### LAW 7: A visual state change every ≤45 frames; nothing holds.
**Evidence:** 31/31 frame pairs changed in DbS2vcfyQxx; ~35 state changes in 60s for Ben Lavi; rule extracted verbatim: "no frame range longer than ~45 frames without a state change; a big change every ~150."
**Encode:** every scene component derives a `beats[]` array from its duration (`durationFrames / 45` minimum beats) and must map each beat to a change: camera pose, item highlight, counter roll, color flip, or sub-shot. Add a dev-mode assertion that logs a warning when a scene defines fewer beats than `Math.floor(durationFrames/45)`.

*(Corollary to 1+5, on type: minimum readable sizes — no text below 24px, secondary text ≥32px, hero values 100–160px with `tabular-nums`. Our current 14px bar labels and 16px sub-headers are invisible at reel size.)*

---

## PART 2 — REDESIGN BRIEFS (same props, new body)

### 2.1 `graph_spike` — BRollOverlay.tsx:3416 (props: `bars[{value,label,highlight}]`, `title`, `primary`, `secondary`)
**Now:** 280px-tall bars centered in a flat black frame, 14px labels, 🔥 emoji, no camera.
**Rebuild:**
- **Composition:** chart spans 85% frame width, bar area height ~1050px (55% of frame), baseline at y≈1380. Bar width 130px, gap 28px. Sits on a dark glass panel (glass recipe from DESIGN.md) with 3 horizontal gridlines `rgba(255,255,255,0.06)` — a retention-graph feel, not floating sticks.
- **Fill:** non-highlight bars `rgba(255,255,255,0.10)` + top light edge; spike bar vertical gradient `#E0701E → rgba(224,112,30,0.55)` + bloom `0 0 40px rgba(224,112,30,0.7), 0 0 110px rgba(224,112,30,0.3)`. A 3px polyline traces the bar tops, drawn via `strokeDashoffset` as bars land (Ben Lavi hook-card graph).
- **Type:** spike value counts up above the bar — 140px Rubik 900 `tabular-nums`, chrome-gradient fill + orange halo. X labels 36px/700. `secondary` becomes a 44px payoff line at y≈1560. Emoji deleted.
- **Motion (3 beats):** beat 1 — camera punched to 1.3× on the small bars (offset toward first bars) as they spring in; beat 2 — 10-frame whip (directional blur) to center the spike exactly as its spring overshoots; beat 3 — settle, counter finishes, slow 1.05→1.0 drift. `glowPulse` stays but only on the spike.

### 2.2 `workflow_pipeline` — BRollPremium.tsx:1239 (props: `title`, `items[{text,icon}]`, `outcome`, `outcome_icon`)
**Now:** stacked translucent dark cards, 10px dots, dark-on-dark, no camera. **The biggest win available: flip it to the ManyChat "whiteboard world."**
- **Composition:** LIGHT stage (`SceneStage variant="light"`, Part 3). All nodes laid out on one oversized canvas (~1.6× frame height, nodes offset diagonally like a real flow editor), white cards `#FFFFFF`, radius 20, `boxShadow: 0 24px 60px rgba(17,24,39,0.18)`, text `#111827` (48px/800 node title, 30px/500 sub), icon in a tinted chip.
- **Camera IS the scene:** hold on node 1 filling ~42% of frame with neighbors visible but DOF-blurred (blur 6px, brightness 0.9) → 10-frame whip-pan along the wire to node 2 → repeat. `items.length` nodes = `items.length` sub-shots.
- **Wire:** animated bezier `stroke #C7CBD2` 3px; a glowing orange dot (`#E0701E`, `0 0 16px` bloom) travels the wire during each whip and "draws" it via dashoffset — the dot is what the eye follows between nodes.
- **Active state:** current node gets a 3px orange glow border (`0 0 0 3px rgba(224,112,30,0.9), 0 0 30px rgba(224,112,30,0.35)`); on arrival the node does a 1.06 spring pop.
- **Outcome:** final beat zooms OUT to show the whole flow, then the outcome card drops in with green (`#4ADE80`) glow + `outcome_icon`, everything else dims to 60%.

### 2.3 `split_transform` — BRollPremium.tsx:431 (props: `title`, `primary`, `secondary`, `left_label`, `right_label`)
**Now:** diagonal clipPath with scattered "chaos rectangles", scribble SVGs, ❌/✅ emoji, 30px labels. Decorative, illegible.
**Rebuild — sequence it in TIME (devinjatho red-room/green-room), not just space:**
- **Beat 1 (0→40%):** FULL-frame "before" room — bg `#220808`, radial red glow `rgba(192,24,24,0.35)` at center, heavy vignette. `left_label` as the hero: 110–130px Rubik 900, desaturated `rgba(255,255,255,0.6)`, slow camera push 1.0→1.12. One optional metaphor object max: a falling line graph drawn by stroke (no rectangle confetti).
- **Beat 2 (whip, 4 frames):** hard directional-blur whip.
- **Beat 3 (40→85%):** FULL-frame "after" room — bg `#1A0E04`, orange glow `rgba(224,112,30,0.4)`. `right_label` slams in at 120–140px with chrome gradient + orange halo, scale overshoot (`back.out(2.4)`), rising graph stroke.
- **Beat 4 (85→100%):** optional split composite: both rooms side-by-side, glowing orange divider (keep the existing skewed divider — it's good), labels shrunk to 48px pills.
- The room COLOR carries the semantics; delete the ❌/✅ emoji and the mess-rectangles entirely.

### 2.4 `ui_checklist_app` — BRollCreativeUI.tsx:737 (props: `primary`, `items[]`)
**Now:** distant frosted panel, 26px items, 30px checkboxes — a screenshot at arm's length.
**Rebuild — the 1.8× physical-surface treatment (Law 1 + 6):**
- **Composition:** one iOS Reminders-style card at ~115% frame width, tilted −2°, cropped at both edges, on the dark stage with an under-glow pool. iOS chrome: status bar, big-title header (`primary` at 64px/900), item-count pill. Only 3–4 rows visible at any time.
- **Rows:** text 48px/600, checkbox 56px circle, row padding 28px. Checked: text drops to `rgba(255,255,255,0.35)` + animated strikethrough (keep), row gains an orange right-edge accent bar + `rgba(224,112,30,0.08)` fill.
- **Motion:** camera pans DOWN the list — each check beat = `translateY` so the active row sits at optical center (y≈45%), plus scale 1.04. The check itself: spring pop + expanding orange ripple ring (2 frames) + the whole CARD jolts 4px down for 1 frame (haptic). Replace the bottom progress bar with a progress RING top-right of the header that fills per item.
- Under-glow when a check lands: `0 60px 120px -30px rgba(224,112,30,0.25)` pulsing once.

### 2.5 `list_highlight` — BRollOverlay.tsx:1302 (props: `items[{text,icon,highlight_at,sub_text}]`, `title`)
**Now:** all rows equally visible in a mid-band, 68px icon circles, highlight = mild tint + 1.06 scale. Nothing is focal.
**Rebuild — spotlight-dim + micro-punch (devinjatho "449K Followers" move, Ben Lavi highlight-strip):**
- **Composition:** rows fill 84% width, text 56px/800 (sub_text 32px), row height ~150px — the list occupies 60% of frame height.
- **Highlight state machine driven by `highlight_at` (unchanged prop):** when a row activates — (a) ALL other rows drop to `brightness(0.4)` + `blur(3px)` over 6 frames; (b) active row scales to 1.10, comes FORWARD with `0 30px 70px rgba(0,0,0,0.6)` shadow + orange edge glow; (c) a white bar wipes across the row in 5 frames and resolves into an orange highlight strip behind the key text (Ben Lavi t024–t025); (d) camera micro-punches: `translateY` centers the active row + scale 1.05, eased 8 frames.
- Entrance stagger happens ONCE in the first 15 frames; after that the scene lives exclusively on highlight beats — one state change per `highlight_at`, satisfying Law 7 for free.

**Reference-good internal example:** `analytics_dashboard` (BRollPremium.tsx:1029) already has the right bones (real card language, count-ups, per-metric bars). Only apply Laws 1+8: value type 42px→72px, cards wider, add one camera settle-drift.

---

## PART 3 — THE SHARED SCENE STAGE (fix once, upgrade everything)

New file: `src/components/SceneStage.tsx`. Replace `BRollBg` (BRollOverlay.tsx:351) and all `getBgStyle` call sites (BRollMotion.tsx:161) with it. API:

```tsx
<SceneStage variant="dark" | "light" accent={brandColor} glow={0..1} lifecycle={n}>
  <CameraRig poses={[...]}>{scene content}</CameraRig>
</SceneStage>
```

**`dark` variant — exact stack (bottom → top):**
1. **Base:** `radial-gradient(ellipse 120% 80% at 50% 38%, #14161D 0%, #0A0A0C 55%, #050608 100%)` (radial only — DESIGN.md's H.264-banding rule; never linear full-frame).
2. **Accent glow pool:** `radial-gradient(ellipse 70% 45% at 50% 45%, rgba(224,112,30,0.10·glow) 0%, transparent 65%)`, opacity breathing 0.7↔1.0 over 120 frames `sine.inOut`. This is the "one light source" — hero content sits IN it.
3. **Grid mesh:** 80px cells, lines `rgba(255,255,255,0.035)`, drifting `translateY: (frame*0.25) % 80` — slow, alive.
4. **Particles:** 8 dots, 2px, `rgba(255,255,255,0.30)`, positions from seeded PRNG (`noise()` helper already in BRollMotion.tsx — no Math.random), each drifting on its own sine.
5. **Floor shadow** (slot, optional): a blurred ellipse under the hero (`filter: blur(40px)`, `rgba(0,0,0,0.6)`, width 70%) — grounds cards physically.
6. **Grain:** 256px SVG `feTurbulence` data-URI tile (`baseFrequency 0.9, numOctaves 2`), `opacity 0.05`, `mixBlendMode: "overlay"`, `backgroundPosition` jittered every 2 frames from the seeded PRNG — reads as film, costs nothing.
7. **Vignette:** `radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(5,6,8,0.85) 100%)`, opacity wobbling 0.75↔0.9 over 120 frames.

**`light` variant (whiteboard world, for `workflow_pipeline` + any UI-editor scene):**
1. Base: `radial-gradient(ellipse 120% 90% at 50% 40%, #F4F5F7 0%, #E8E9EB 60%, #DCDEE2 100%)`.
2. Dot grid: `radial-gradient(rgba(17,24,39,0.07) 1.5px, transparent 1.5px)`, 32px cells, same slow drift.
3. Vignette: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(160,165,172,0.45) 100%)`.
4. No grain, no particles — light world's texture is shadow depth (Law 4).

`CameraRig` per Law 2 (poses + velocity-proportional SVG directional blur). Both exported from SceneStage.tsx so a component imports one thing.

---

## PART 4 — CAPTION-SYSTEM IMPLICATIONS

Reference standard vs. ours:
- **Size:** references run caption cap-height ≈ 4.5% of frame (≈78–90px at 1080×1920); emphasis words 1.5–2.5×. Anything we render under ~70px in the caption layer is below reference grade.
- **Position:** references sit captions at 50–62% frame height (chest). Our karaoke zone is y=1500–1820 (bottom). Keep it for talking-head segments (face-safe rule), but during FULL-SCREEN B-roll scenes the caption layer should migrate up to y≈55% — on full-frame graphics the references put text ON the object, never in the bottom UI zone.
- **Emphasis grammar to adopt:** (1) per-word `emphasis` flag → scale 1.6–2× + accent color + glow, max ONE accent color per screen (orange default; green/red only with semantic meaning); (2) additive line builds — previous line stays, new line lands under it, superseded accent words desaturate + blur 2px (Ben Lavi); (3) accent words enter with a 3-frame directional blur streak; (4) 2–6 words per screen, hard cap.
- **Fonts:** per DESIGN.md — Rubik 900 for caption/hero voice, Heebo for body, JetBrains Mono for counters/timestamps. Add Omer's Gveret Levin (already at `edit/assets/fonts/`) as a fourth voice: hand-drawn marker annotations + arrows (the devinjatho "unique within" scribble move) — orange, rotated 2–4°, never for captions themselves.
- **Counters everywhere:** references attach glowing white counters (eye + number, ~5% frame height, `tabular-nums`, 30% white outer glow) to proof moments. Build one `<StatCounter>` and reuse across scenes instead of each scene hand-rolling numbers.

---

## PART 5 — WHAT NOT TO COPY

1. **Illustrated/comic art worlds** (Ben Lavi's robot army, noir protest silhouettes, Win95 photoreal browser) — needs an illustrator or heavy AI-gen per scene; not reproducible as deterministic code. Our lane is the devinjatho lane: real UI + glow + camera.
2. **Photoreal 3D devices and hands** (iPhone titanium render, hand-holding-phone) — don't attempt in CSS; a flat "device-ish" card with notch + status bar reads 90% as good. No pseudo-3D phone bevels — half-real is worse than stylized.
3. **Rotoscoped subject z-sandwich** (graphics BEHIND the speaker's head) — requires a matting pipeline we don't have in the render path. Skip until there's a segmentation pass; do NOT fake it with rectangles.
4. **Real people/brands as proof** — reference reels show hormozi/garyvee handles, Stripe receipts, "$48,000 Paid". Standing rule for Omer's content: no fake proof, no impersonation. Fictional Hebrew names, generic app chrome, no real-brand receipts.
5. **Exact IG/iOS trademark chrome** — inspired-by is fine (status bar, pill buttons); pixel-perfect Instagram logos/wordmarks in ads invites platform trouble. Keep chrome generic-native.
6. **Film-plate whips between real locations** (red room/green room as physical sets) — we copy the color-semantics with full-frame washes (2.3), not the set changes.
7. **CRT/halftone/scanline texture soup** — Ben Lavi's texture identity conflicts with our "iOS liquid glass" DESIGN.md identity. We take grain+vignette+glow only; scanlines/halftone are his brand, not ours.

---

**Execution order for a developer tomorrow:** (1) SceneStage + CameraRig (Part 3) — every scene inherits it; (2) `workflow_pipeline` light-world rebuild (biggest visible jump); (3) `graph_spike`; (4) `list_highlight`; (5) `ui_checklist_app`; (6) `split_transform`; (7) caption emphasis grammar (Part 4). Laws in Part 1 are the review checklist for each PR.
