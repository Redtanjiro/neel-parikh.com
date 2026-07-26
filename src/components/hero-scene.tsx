"use client";

import { CSSProperties } from "react";
import { HeroLayerKey, SceneRefs } from "@/lib/scroll-refs";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

type RealLayer = {
  key: HeroLayerKey;
  base: string; // filename stem in /public/hero, e.g. "lamp" -> lamp.webp + lamp.png
  style: CSSProperties; // left/top anchor + width; height follows the image's own aspect ratio
};

// Seven of the ten spec layers are real hand-drawn cutouts, found in
// `Drawn assests/` mid-build (the spec assumed all ten existed as
// separated files; only these did, and "figure" turned up under the name
// `Working_pose.png` — Neel's own cursor-pose asset from the old site,
// which happens to be exactly "person at a desk with a laptop" this spec
// needs). Trimmed to content bounds (threshold-cleaned — a few of these
// exports had scattered near-zero-alpha noise pixels dragging the naive
// bbox out to the canvas edge), WebP with PNG fallback, copied into
// /public/hero. window-curtains combines what the spec listed as three
// separate files (window + curtains-left + curtains-right), matching how
// Neel's own export came out.
const REAL_LAYERS: RealLayer[] = [
  {
    key: "window",
    base: "window-curtains",
    style: { left: "27%", top: "0%", width: "46%" },
  },
  {
    key: "fridge",
    base: "fridge",
    style: { left: "70%", top: "14%", width: "20%" },
  },
  {
    key: "table",
    base: "table",
    style: { left: "2%", top: "58%", width: "42%" },
  },
  {
    key: "chair",
    base: "chair",
    style: { left: "0%", top: "68%", width: "24%" },
  },
  {
    key: "kettle",
    base: "kettle",
    style: { left: "16%", top: "48%", width: "11%" },
  },
  {
    key: "lamp",
    base: "lamp",
    style: { left: "7%", top: "40%", width: "9%" },
  },
  {
    key: "figure",
    base: "figure",
    style: { left: "27%", top: "34%", width: "22%" },
  },
];

export default function HeroScene({ refs }: Props) {
  return (
    <div className="absolute inset-0" id="hero-stage">
      {/* wall — background, fades rather than moving. Still placeholder:
          no wall.png cutout has turned up yet. */}
      <div
        ref={(el) => {
          refs.current.heroLayers.wall = el;
        }}
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #2a2622, #16130f)" }}
      />

      {REAL_LAYERS.map((layer) => (
        <div
          key={layer.key}
          ref={(el) => {
            refs.current.heroLayers[layer.key] = el;
          }}
          className="absolute will-change-transform"
          style={layer.style}
        >
          <picture>
            <source srcSet={`/hero/${layer.base}.webp`} type="image/webp" />
            <img
              src={`/hero/${layer.base}.png`}
              alt=""
              className="block w-full h-auto select-none"
              draggable={false}
            />
          </picture>
        </div>
      ))}

      <div
        className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-center"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        <p className="text-3xl text-[color:var(--accent-bright)] sm:text-5xl">
          Welcome to my work space!
        </p>
      </div>
    </div>
  );
}
