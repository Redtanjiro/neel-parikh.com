"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Nav from "./nav";
import HeroScene from "./hero-scene";
import LightCone from "./light-cone";
import AboutLines from "./about-lines";
import BurstMask from "./burst-mask";
import WorkSection from "./work-section";
import FixedCanvas from "./canvas/fixed-canvas";
import { LampParticlesHandle } from "./canvas/lamp-particles";
import { createSceneRefs, HeroLayerKey } from "@/lib/scroll-refs";
import { useViewportProfile } from "@/lib/use-viewport-profile";
import { BEATS, TOTAL_PINNED_VH } from "@/lib/beats";
import { buildConePolygon, CONE_APEX } from "@/lib/cone-path";

gsap.registerPlugin(ScrollTrigger);

// Per-layer exit choreography for beat 2 ("room flies out"). Heavy objects
// drift slower/later than light ones; every layer commits to leaving
// immediately and decelerates (ease out, not in) — spec section 6.
// xPercent/yPercent are relative translations away from each layer's own
// rest position; delay/duration are fractions of beat 2's own span.
const LAYER_EXITS: Partial<
  Record<HeroLayerKey, { x: number; y: number; rot: number; delay: number; duration: number }>
> = {
  kettle: { x: -55, y: -30, rot: -25, delay: 0.0, duration: 0.55 },
  // window-curtains is one combined layer (see hero-scene.tsx) — bigger
  // exit distance since it's carrying what would've been three layers.
  window: { x: 20, y: -55, rot: 3, delay: 0.06, duration: 0.65 },
  chair: { x: -45, y: 55, rot: -16, delay: 0.1, duration: 0.65 },
  figure: { x: -70, y: 4, rot: -5, delay: 0.1, duration: 0.6 },
  fridge: { x: 60, y: 12, rot: 8, delay: 0.14, duration: 0.7 },
  table: { x: -30, y: 65, rot: -5, delay: 0.18, duration: 0.75 },
};

export default function ScrollExperience() {
  const refs = useRef(createSceneRefs());
  const lampRef = useRef<LampParticlesHandle>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const profile = useViewportProfile();
  const [pinnedVhPx, setPinnedVhPx] = useState(0);

  useEffect(() => {
    const update = () => setPinnedVhPx((TOTAL_PINNED_VH / 100) * window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Lenis smooth scroll, wired into GSAP's own ticker so ScrollTrigger and
  // Lenis agree on scroll position every frame.
  useEffect(() => {
    if (profile.reducedMotion) return; // reduced motion: native scroll, no smoothing
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [profile.reducedMotion]);

  useEffect(() => {
    if (!profile.ready || pinnedVhPx === 0) return;

    const ctx = gsap.context(() => {
      const r = refs.current;
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: "(prefers-reduced-motion: reduce)",
          desktop: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 899px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduced, mobile } = context.conditions as {
            reduced: boolean;
            desktop: boolean;
            mobile: boolean;
          };

          if (reduced) {
            // A genuinely different page, not a broken one: no pin, no
            // scrub, normal document flow. Resolve every layer to its
            // final, static, readable state.
            if (stageWrapRef.current) {
              gsap.set(stageWrapRef.current, { position: "relative", height: "auto" });
            }
            Object.values(r.heroLayers).forEach((el) => {
              if (el) gsap.set(el, { clearProps: "transform", position: "static", display: "inline-block", margin: 4 });
            });
            if (r.cone) gsap.set(r.cone, { opacity: 0, display: "none" });
            r.lines.forEach((el) => {
              if (el) gsap.set(el, { opacity: 1, transform: "none", position: "static" });
            });
            if (r.burst) gsap.set(r.burst, { opacity: 0 });
            const material = lampRef.current?.material;
            if (material) material.uniforms.uFormation.value = 1;
            return;
          }

          const isMobile = mobile;
          const scale = isMobile ? 0.55 : 1; // compress 5-8 + overall runway on mobile
          const totalPx = pinnedVhPx * scale;

          // Initial hidden state.
          gsap.set(r.cone, { opacity: 0 });
          r.lines.forEach((el) => el && gsap.set(el, { opacity: 0, y: 14 }));
          gsap.set(r.burst, { opacity: 0 });
          const material = lampRef.current?.material;
          if (material) material.uniforms.uFormation.value = 0;

          const tl = gsap.timeline({ paused: true });

          // --- Beat 2: room flies out ---
          const b2 = BEATS.roomFliesOut;
          const b2Width = b2.end - b2.start;
          (Object.keys(LAYER_EXITS) as HeroLayerKey[]).forEach((key) => {
            const el = r.heroLayers[key];
            const exit = LAYER_EXITS[key];
            if (!el || !exit) return;
            tl.to(
              el,
              {
                x: `${exit.x}vw`,
                y: `${exit.y}vh`,
                rotate: exit.rot,
                opacity: 0,
                ease: "power2.out",
                duration: isMobile ? b2Width * 0.6 : exit.duration * b2Width,
              },
              b2.start + (isMobile ? 0 : exit.delay * b2Width)
            );
          });
          if (r.heroLayers.wall) {
            tl.to(
              r.heroLayers.wall,
              { opacity: 0.05, ease: "power1.out", duration: b2Width + (BEATS.lampAlone.end - BEATS.lampAlone.start) },
              b2.start
            );
          }
          // Lamp survives: translates + scales to its anchor (left third,
          // upper-middle) over beats 2+3 combined, instead of exiting.
          if (r.heroLayers.lamp) {
            tl.to(
              r.heroLayers.lamp,
              {
                left: `${CONE_APEX.x}%`,
                top: `${CONE_APEX.y}%`,
                scale: 0.8,
                ease: "power2.out",
                duration: b2Width + (BEATS.lampAlone.end - BEATS.lampAlone.start),
              },
              b2.start
            );
          }

          // --- Beat 4: cone opens ---
          const b4 = BEATS.coneOpens;
          const spreadProxy = { v: 0 };
          tl.to(r.cone, { opacity: 1, duration: (b4.end - b4.start) * 0.15 }, b4.start);
          tl.to(
            spreadProxy,
            {
              v: 1,
              duration: b4.end - b4.start,
              ease: "power1.out",
              onUpdate: () => {
                if (r.cone) r.cone.style.clipPath = buildConePolygon(spreadProxy.v);
              },
            },
            b4.start
          );

          // --- Beats 5-8: about lines, snap-lands each line ---
          const lineBeats = [BEATS.aboutLine1, BEATS.aboutLine2, BEATS.aboutLine3, BEATS.aboutLine4];
          lineBeats.forEach((beat, i) => {
            const el = r.lines[i];
            if (!el) return;
            const width = beat.end - beat.start;
            tl.to(el, { opacity: 1, y: 0, duration: width * 0.3, ease: "power2.out" }, beat.start);
            if (i > 0) {
              const prev = r.lines[i - 1];
              // Dim, don't wash out — 0.55 read as barely-there against the
              // gold backdrop once the font-weight/size were fixed too.
              if (prev) tl.to(prev, { opacity: 0.82, duration: width * 0.3 }, beat.start);
            }
          });

          // --- Beat 9: the burst ---
          const b9 = BEATS.burst;
          const b9Width = b9.end - b9.start;
          const peak = b9.start + b9Width * 0.6;
          const whiteProxy = { v: 0 };
          tl.to(
            whiteProxy,
            {
              v: 0.96,
              duration: b9Width * 0.6,
              ease: "power2.in",
              onUpdate: () => {
                if (r.burst) r.burst.style.opacity = String(whiteProxy.v);
              },
            },
            b9.start
          );
          tl.to(
            [r.cone, r.heroLayers.lamp].filter(Boolean),
            { opacity: 0, duration: b9Width * 0.08 },
            peak - b9Width * 0.04
          );
          tl.call(
            () => {
              const m = lampRef.current?.material;
              if (m) m.uniforms.uFormation.value = 0; // exploded, hidden under white
            },
            [],
            peak
          );
          r.lines.forEach((el) => {
            if (el) tl.to(el, { opacity: 0, duration: b9Width * 0.08 }, peak - b9Width * 0.04);
          });
          tl.to(
            whiteProxy,
            {
              v: 0,
              duration: b9Width * 0.4,
              ease: "power2.out",
              onUpdate: () => {
                if (r.burst) r.burst.style.opacity = String(whiteProxy.v);
              },
            },
            peak
          );

          // --- Beat 10: reformation ---
          const b10 = BEATS.reformation;
          if (material) {
            tl.to(
              material.uniforms.uFormation,
              { value: 1, duration: b10.end - b10.start, ease: "power2.inOut" },
              b10.start
            );
          }

          // Trap #15, carried forward as good practice regardless of which
          // build it was learned on: a scrubbed timeline whose last tween
          // doesn't land exactly on 1.0 makes every earlier checkpoint drift
          // by the same ratio.
          if (Math.abs(tl.totalDuration() - 1) > 0.001) {
            console.warn(
              `[scroll-experience] tl.totalDuration() = ${tl.totalDuration()}, expected 1 — every beat boundary above is now off by that ratio.`
            );
          }

          ScrollTrigger.create({
            trigger: stageWrapRef.current,
            start: "top top",
            end: `+=${totalPx}`,
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
            animation: tl,
            // Guard against parking inside the blown-out beat-9 frame —
            // the spec calls for a fully time-based sub-timeline there;
            // this is the pragmatic scrub-based approximation of that
            // guard. Flagged for a real-browser tuning pass.
            snap: (progress) => {
              const guard = 0.015;
              if (progress > peak - guard && progress < peak + guard * 3) {
                return peak + guard * 3;
              }
              return progress;
            },
          });
        }
      );

      return () => mm.revert();
    }, stageWrapRef);

    return () => ctx.revert();
  }, [profile.ready, profile.reducedMotion, pinnedVhPx]);

  return (
    <>
      <FixedCanvas
        ref={lampRef}
        particleCount={profile.particleCount}
        bloomEnabled={profile.bloomEnabled}
        staticFrame={profile.reducedMotion}
      />
      <Nav />
      <main className="relative z-10">
        <div ref={stageWrapRef} className="relative h-screen overflow-hidden bg-[color:var(--bg)]">
          <HeroScene refs={refs} />
          <LightCone refs={refs} />
          <AboutLines refs={refs} />
        </div>
        <BurstMask refs={refs} />
        <WorkSection refs={refs} />
      </main>
    </>
  );
}
