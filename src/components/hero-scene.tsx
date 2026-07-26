"use client";

import { SceneRefs } from "@/lib/scroll-refs";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

/**
 * THE HERO IS THE PAINTED ART, NOT A RE-ASSEMBLY OF CUTOUTS.
 *
 * Earlier builds composited seven flat PNGs from `Drawn assests/Home office
 * interior@2x*.png`. Wrong source: those are an *asset inventory sheet* —
 * flat, unlit line art with "LAMP" / "KETTLE" / "FRIDGE" drawn in as
 * labels. The reference is painted (warm lamp pool, blue moonlight through
 * the window, vignette into the corners) and none of that lighting can be
 * reconstructed from flat silhouettes.
 *
 * The real hero is two files already aligned on the same 3840x2160 canvas:
 *   Nighttime.png    -> room-night.webp     (painted room)
 *   Working_pose.png -> figure-working.webp (the person at the desk)
 *
 * Both render full-bleed at inset:0 so their original alignment is exact —
 * never reposition one independently of the other.
 *
 * LAYERING: the headline sits BETWEEN room and figure, so the figure
 * occludes it naturally where they overlap. That's what puts "NEEL" and
 * "PARIKH" on either side of his head without any manual masking.
 */
export default function HeroScene({ refs }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden" id="hero-stage">
      {/* Painted room + all hero copy. Both live on this layer so the copy
          fades out with the room on scroll (spec beat 2) without needing
          its own timeline target. */}
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

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <p className="display mb-1 text-sm font-semibold uppercase tracking-[0.08em] sm:text-base md:text-lg">
            welcome to my workspace
          </p>

          <h1 className="flex w-full items-baseline justify-center gap-[12vw] font-bold uppercase leading-[0.95] tracking-tight">
            <span className="display-condensed text-[clamp(2.5rem,9.5vw,8rem)]">Neel</span>
            <span className="display-condensed text-[clamp(2.5rem,9.5vw,8rem)]">Parikh</span>
          </h1>

          <p className="display mt-2 flex w-full items-baseline justify-center gap-[15vw] text-[clamp(0.9rem,2.4vw,1.9rem)] font-medium">
            <span>Interaction, brand</span>
            <span>and immersive designer</span>
          </p>
        </div>

        <p className="display pointer-events-none absolute bottom-[6%] left-1/2 -translate-x-1/2 text-[clamp(0.9rem,2vw,1.5rem)] font-medium text-white">
          scroll down
        </p>
      </div>

      {/* The person — separate layer so they can walk out of frame while
          the room stays, and so they occlude the headline behind them. */}
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
    </div>
  );
}
