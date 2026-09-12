/**
 * Speaker zoom — shared scale calculator used by both the browser preview
 * (PreviewVideoPane in app/projects/[id]/page.tsx) and the headless renderer
 * (EditedReel.tsx on Hetzner). Same input, same curve, so what the user
 * previews matches what gets baked into the MP4.
 *
 * Each zoom has four phases on the timeline:
 *   start ──ease_in──▶ peak ──hold──▶ peak ──ease_out──▶ baseline
 *
 * Outside any zoom window the function returns 1.0 (no scale). Inside a
 * window it returns the current scale at time `t`, with cubic ease-in-out
 * on the rise + fall so the start/end of the zoom feel soft. The user
 * specifically asked for "כניסה ויציאה איטית" (slow in/out, not punchy).
 *
 * Zooms are pre-generated server-side in pipeline_orchestrator._plan_speaker_zooms
 * and shipped down inside `editing_plan.speaker_zooms`.
 */
export interface SpeakerZoom {
  /** Seconds — when the ease-in begins. */
  start: number;
  /** Seconds — duration of the rise. */
  ease_in: number;
  /** Seconds — time held at peak before ease-out starts. */
  hold: number;
  /** Seconds — duration of the fall. */
  ease_out: number;
  /** Multiplier — 1.05 means 5% pushed-in. */
  peak: number;
}

const easeInOutCubic = (p: number): number =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

/**
 * Returns the speaker-video scale at time `t` (seconds). Returns 1 when
 * `t` is outside every zoom window, so callers can apply the result
 * unconditionally as `transform: scale(scale)` on the video element.
 *
 * Linear scan over zooms is fine — typical N is 3, capped at 6.
 */
// The skill's docs (SKILL.md / PLAYBOOK.md) describe a zoom as {anchor, start, end, peak}
// while this curve expects {start, ease_in, hold, ease_out, peak}. Fed the documented shape,
// ease_in/hold/ease_out were undefined → NaN scale → `transform: scale(NaN)` → Chromium stopped
// repainting the video layer for the whole window (the "video freezes at 5-7s" bug, 12.9.2026).
// Accept both: derive the three phases from start/end (rise 40% · hold 20% · fall 40%).
function normalizeZoom(z: SpeakerZoom & { end?: number; anchor?: number }): SpeakerZoom {
  const hasPhases = Number.isFinite(z.ease_in) && Number.isFinite(z.hold) && Number.isFinite(z.ease_out);
  if (hasPhases) return z;
  const end = Number.isFinite(z.end) ? (z.end as number) : z.start + 3;
  const span = Math.max(0.3, end - z.start);
  return { start: z.start, ease_in: span * 0.4, hold: span * 0.2, ease_out: span * 0.4, peak: z.peak ?? 1.05 };
}

export function speakerZoomScale(t: number, zooms: SpeakerZoom[] | undefined): number {
  if (!zooms || zooms.length === 0) return 1;

  for (const raw of zooms) {
    const z = normalizeZoom(raw as SpeakerZoom & { end?: number; anchor?: number });
    const easeInEnd = z.start + z.ease_in;
    const holdEnd = easeInEnd + z.hold;
    const easeOutEnd = holdEnd + z.ease_out;

    if (t < z.start || t >= easeOutEnd) continue;

    const peakDelta = z.peak - 1;

    if (t < easeInEnd) {
      const p = (t - z.start) / Math.max(0.001, z.ease_in);
      return 1 + peakDelta * easeInOutCubic(p);
    }
    if (t < holdEnd) {
      return z.peak;
    }
    // ease-out
    const p = (t - holdEnd) / Math.max(0.001, z.ease_out);
    return 1 + peakDelta * (1 - easeInOutCubic(p));
  }

  return 1;
}
