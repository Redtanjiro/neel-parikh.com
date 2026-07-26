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

// The six layers Neel actually had cut out in `Drawn assests/` (found mid-build —
// the spec assumed all ten existed; only these six did). Real hand-drawn art,
// trimmed to content bounds, WebP with PNG fallback, copied into /public/hero.
// window-curtains combines what the spec listed as three separate files
// (window + curtains-left + curtains-right) since that's how Neel's own
// export came out — one wide layer reads the same on screen either way.
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
];

// PLACEHOLDER ART — no cutout exists yet for these two.
// TODO(Neel): export `figure.png` (you, at the desk) and `wall.png`
// (background) the same way as the six real layers above — trimmed to
// content bounds, transparent PNG/WebP — and swap them in below.
const PLACEHOLDER_LAYERS: {
  key: HeroLayerKey;
  label: string;
  style: CSSProperties;
  bg: string;
  radius?: string;
}[] = [
  {
    key: "figure",
    label: "figure — TODO: export cutout",
    bg: "linear-gradient(180deg, #3a3630, #232019)",
    style: { left: "44%", top: "38%", width: "22%", height: "60%" },
    radius: "40% 40% 8px 8px",
  },
];

export default function HeroScene({ refs }: Props) {
  return (
    <div className="absolute inset-0" id="hero-stage">
      {/* wall — background, fades rather than moving. Placeholder wash
          until a real wall.png exists. */}
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

      {PLACEHOLDER_LAYERS.map((layer) => (
        <div
          key={layer.key}
          ref={(el) => {
            refs.current.heroLayers[layer.key] = el;
          }}
          className="absolute flex items-end justify-center border border-dashed border-[color:var(--accent)]/50 will-change-transform"
          style={{
            ...layer.style,
            background: layer.bg,
            borderRadius: layer.radius ?? "2px",
          }}
        >
          <span
            className="mb-1 rounded bg-black/50 px-1.5 py-0.5 text-[11px] leading-none"
            style={{ fontFamily: "var(--font-hand)", color: "var(--cream)" }}
          >
            {layer.label}
          </span>
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
