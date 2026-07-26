"use client";

import { SceneRefs } from "@/lib/scroll-refs";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

/**
 * THE HERO IS THE PAINTED ART, NOT A RE-ASSEMBLY OF CUTOUTS.
 *
 * Earlier builds composited seven flat PNGs from `Drawn assests/Home office
 * interior@2x*.png`. That was the wrong source: those files are an *asset
 * inventory sheet* — flat, unlit line art with the words "LAMP", "KETTLE",
 * "FRIDGE" drawn into them as inventory labels. No arrangement of them was
 * ever going to match the reference, because the reference is painted:
 * warm lamp pool on the left wall, blue moonlight through the window,
 * vignette falling off into the corners. All of that lighting is baked
 * into the painting and cannot be reconstructed from flat silhouettes.
 *
 * The real hero is two files that were already aligned on the same
 * 3840x2160 canvas, straight from Neel's own artwork:
 *   Nighttime.png    -> room-night.webp     (the painted room)
 *   Working_pose.png -> figure-working.webp (the person at the desk)
 *
 * Both render full-bleed at inset:0 so their original alignment is
 * preserved exactly — do not reposition either one independently.
 */
export default function HeroScene({ refs }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden" id="hero-stage">
      {/* Painted room. Recedes as one scene (spec beats 2/3) rather than
          shattering into pieces — see the note in scroll-experience.tsx
          for why the per-object shatter is blocked on assets that don't
          exist yet. */}
      <div
        ref={(el) => {
          refs.current.heroLayers.wall = el;
        }}
        className="absolute inset-0 will-change-transform"
        style={{ zIndex: 1 }}
      >
        <picture>
          <source
            media="(max-width: 900px)"
            srcSet="/hero/room-night-sm.webp"
            type="image/webp"
          />
          <img
            src="/hero/room-night.webp"
            alt="A dark room at night: a desk lamp lighting a kettle and mug, a window looking out over rooftops, a fridge in the corner."
            className="block h-full w-full select-none object-cover"
            draggable={false}
          />
        </picture>
      </div>

      {/* The person — a separate layer so they can leave the frame while
          the room stays (spec beat 2). */}
      <div
        ref={(el) => {
          refs.current.heroLayers.figure = el;
        }}
        className="absolute inset-0 will-change-transform"
        style={{ zIndex: 2 }}
      >
        <picture>
          <source
            media="(max-width: 900px)"
            srcSet="/hero/figure-working-sm.webp"
            type="image/webp"
          />
          <img
            src="/hero/figure-working.webp"
            alt=""
            className="block h-full w-full select-none object-cover"
            draggable={false}
          />
        </picture>
      </div>

      <div
        className="absolute bottom-[7%] left-[8%] z-[6]"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        <p className="text-3xl text-[color:var(--accent-bright)] sm:text-5xl">
          Welcome to my work space!
        </p>
      </div>
    </div>
  );
}
