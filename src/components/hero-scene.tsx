"use client";

import { SceneRefs } from "@/lib/scroll-refs";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

/**
 * THE HERO IS THE PAINTED ART, NOT A RE-ASSEMBLY OF CUTOUTS.
 *
 * hero-night.png is one flattened, painted piece — room and figure already
 * baked together with consistent lighting (warm lamp pool, blue moonlight
 * through the window). It renders full-bleed at inset:0 as a single layer;
 * there is no separate figure element to occlude or walk out independently
 * (beat 2 fades the whole scene together — see scroll-experience.tsx).
 *
 * The headline sits on top of the painting, so NEEL/PARIKH read as text
 * over the art rather than being masked by the figure.
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
            srcSet="/hero/hero-night-sm.webp"
            type="image/webp"
          />
          <img
            src="/hero/hero-night.webp"
            alt="A dark room at night: someone works at a desk lit by a lamp, beside a kettle and mug, with a window looking out over rooftops."
            className="block h-full w-full select-none object-cover"
            draggable={false}
          />
        </picture>

        {/* Contrast scrim — buys back contrast for white text over the
            painting without flattening the art. */}
        <div className="hero-scrim pointer-events-none absolute inset-0" />

        {/* Rises from the bottom edge as beat 2 begins, so the room feels
            like it's sinking into shadow rather than just fading in place. */}
        <div
          ref={(el) => {
            refs.current.heroGradient = el;
          }}
          className="hero-gradient pointer-events-none absolute inset-x-0 bottom-0"
        />

        <div className="hero-text pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="display mb-3 text-xs font-medium uppercase tracking-[0.22em] opacity-90 sm:mb-4 sm:text-sm md:text-base">
            welcome to my workspace
          </p>

          <h1 className="name-gap flex w-full items-baseline justify-center font-bold uppercase leading-[0.92] tracking-tight">
            <span
              ref={(el) => {
                refs.current.heroNameLeft = el;
              }}
              className="display-condensed text-[clamp(2.75rem,9.5vw,8rem)]"
            >
              Neel
            </span>
            <span
              ref={(el) => {
                refs.current.heroNameRight = el;
              }}
              className="display-condensed text-[clamp(2.75rem,9.5vw,8rem)]"
            >
              Parikh
            </span>
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
    </div>
  );
}
