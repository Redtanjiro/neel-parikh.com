"use client";

import { SceneRefs } from "@/lib/scroll-refs";
import { buildConePolygon } from "@/lib/cone-path";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

/**
 * Beat 4: the cone opens. A clip-path wedge anchored at the lamp head,
 * animating from near-zero spread to full — cream gradient, brightest at
 * the apex. Starts fully collapsed (spread 0 baked into the initial
 * clip-path below); the scroll orchestrator drives it open via
 * refs.current.cone.style.clipPath directly.
 */
export default function LightCone({ refs }: Props) {
  return (
    <div
      ref={(el) => {
        refs.current.cone = el;
      }}
      className="absolute inset-0"
      style={{
        clipPath: buildConePolygon(0),
        background:
          "radial-gradient(120% 90% at 9% 17%, var(--cream) 0%, #e8cf84 35%, #caa955 100%)",
        opacity: 0,
        zIndex: 3,
      }}
    />
  );
}
