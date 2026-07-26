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

        {/* Contrast scrim — sits between the room and the copy, but below
            the figure, so the artwork reads through while white text keeps
            a workable contrast ratio over the lamp pool and window. */}
        <div className="hero-scrim pointer-events-none absolute inset-0" />

        <div className="hero-text pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="display mb-3 text-xs font-medium uppercase tracking-[0.22em] opacity-90 sm:mb-4 sm:text-sm md:text-base">
            welcome to my workspace
          </p>

          <h1 className="name-gap flex w-full items-baseline justify-center font-bold uppercase leading-[0.92] tracking-tight">
            <span className="display-condensed text-[clamp(2.75rem,9.5vw,8rem)]">Neel</span>
            <span className="display-condensed text-[clamp(2.75rem,9.5vw,8rem)]">Parikh</span>
          </h1>

          <p className="display tag-gap mt-5 flex w-full items-baseline justify-center text-[clamp(0.95rem,2.2vw,1.65rem)] font-normal sm:mt-6">
            <span>Interaction, brand</span>
            <span>and immersive designer</span>
          </p>
        </div>

        <div className="hero-text pointer-events-none absolute bottom-[5%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-white">
          <span className="display text-[clamp(0.7rem,1.3vw,0.9rem)] font-medium uppercase tracking-[0.22em] opacity-90">
            scroll down
          </span>
          <svg
            className="scroll-cue"
            width="18"
            height="10"
            viewBox="0 0 18 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1l8 7 8-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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
