// Scroll map, spec section 4. vh budgets for each pinned beat (beat 11,
// "Work", is natural/unpinned and excluded from the pinned total).
export const BEAT_VH = {
  heroHold: 60,
  roomFliesOut: 150,
  lampAlone: 40,
  coneOpens: 50,
  aboutLine1: 80,
  aboutLine2: 80,
  aboutLine3: 80,
  aboutLine4: 80,
  burst: 120,
  reformation: 150,
} as const;

export const TOTAL_PINNED_VH = Object.values(BEAT_VH).reduce((a, b) => a + b, 0); // 890

type Range = { start: number; end: number };

function ranges(vh: typeof BEAT_VH): Record<keyof typeof BEAT_VH, Range> {
  const keys = Object.keys(vh) as (keyof typeof BEAT_VH)[];
  const out = {} as Record<keyof typeof BEAT_VH, Range>;
  let cursor = 0;
  for (const key of keys) {
    const start = cursor / TOTAL_PINNED_VH;
    cursor += vh[key];
    const end = cursor / TOTAL_PINNED_VH;
    out[key] = { start, end };
  }
  return out;
}

// Fractional (0-1) start/end of each beat against the full pinned timeline.
// tl.totalDuration() must equal 1 exactly once every tween is added, or every
// checkpoint below drifts by the same ratio (the old project's own hard
// lesson on scrubbed GSAP timelines — worth carrying forward regardless of
// which build it was learned on).
export const BEATS = ranges(BEAT_VH);
