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
import { createSceneRefs } from "@/lib/scroll-refs";
import { useViewportProfile } from "@/lib/use-viewport-profile";
import { BEATS, TOTAL_PINNED_VH } from "@/lib/beats";
import { buildConePolygon, CONE_APEX } from "@/lib/cone-path";

gsap.registerPlugin(ScrollTrigger);

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
            if (r.heroNameLeft) gsap.set(r.heroNameLeft, { clearProps: "transform" });
            if (r.heroNameRight) gsap.set(r.heroNameRight, { clearProps: "transform" });
            if (r.heroGradient) gsap.set(r.heroGradient, { opacity: 0 });
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
          const nameSpread = isMobile ? "6vw" : "12vw";
          if (r.heroNameLeft) gsap.set(r.heroNameLeft, { x: `-${nameSpread}` });
          if (r.heroNameRight) gsap.set(r.heroNameRight, { x: nameSpread });
          if (r.heroGradient) gsap.set(r.heroGradient, { scaleY: 0 });
          const material = lampRef.current?.material;
          if (material) material.uniforms.uFormation.value = 0;

          const tl = gsap.timeline({ paused: true });

          // --- Beat 2: room flies out ---
          const b2 = BEATS.roomFliesOut;
          const b2Width = b2.end - b2.start;
          // Headline words converge to their resting (CSS gap) position and
          // a black gradient rises from the floor of the frame, in the same
          // window the room fades — the room sinking into shadow as focus
          // narrows, rather than a plain opacity crossfade.
          if (r.heroNameLeft) {
            tl.to(r.heroNameLeft, { x: 0, ease: "power2.out", duration: b2Width }, b2.start);
          }
          if (r.heroNameRight) {
            tl.to(r.heroNameRight, { x: 0, ease: "power2.out", duration: b2Width }, b2.start);
          }
          if (r.heroGradient) {
            tl.to(r.heroGradient, { scaleY: 1, ease: "power1.in", duration: b2Width }, b2.start);
          }
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
          // Always adds this tween, even if the R3F material ref isn't
          // ready yet at timeline-build time — the uniform is read lazily
          // via onUpdate instead of closed over now. Gating the tween
          // itself on `material` (as before) meant a slow canvas mount
          // silently dropped the timeline's final tween, so
          // tl.totalDuration() locked in at wherever beat 9 ended instead
          // of 1 — the exact drift trap called out below.
          const b10 = BEATS.reformation;
          const formationProxy = { v: 0 };
          tl.to(
            formationProxy,
            {
              v: 1,
              duration: b10.end - b10.start,
              ease: "power2.inOut",
              onUpdate: () => {
                const m = lampRef.current?.material;
                if (m) m.uniforms.uFormation.value = formationProxy.v;
              },
            },
            b10.start
          );

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
