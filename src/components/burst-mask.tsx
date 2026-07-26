"use client";

import { SceneRefs } from "@/lib/scroll-refs";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

/**
 * Beat 9: the bridge from DOM to WebGL. A full-bleed cream overlay that
 * ramps to near-white at the cut point, masking the swap from "cone at
 * full brightness" to "particle lamp already exploded underneath" — the
 * one deliberate cheat in the page (spec section 6).
 */
export default function BurstMask({ refs }: Props) {
  return (
    <div
      ref={(el) => {
        refs.current.burst = el;
      }}
      className="pointer-events-none fixed inset-0 z-20"
      style={{ background: "var(--cream)", opacity: 0 }}
      aria-hidden="true"
    />
  );
}
