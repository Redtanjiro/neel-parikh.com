"use client";

import { useEffect, useState } from "react";

export type ViewportProfile = {
  ready: boolean;
  isMobile: boolean; // <900px, matches the GSAP matchMedia breakpoint
  reducedMotion: boolean;
  webglAvailable: boolean;
  particleCount: number;
  bloomEnabled: boolean;
};

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Single source of truth for the perf/accessibility budget in spec section 10:
 * 20,000 particles desktop / 6,000 mobile, bloom off on mobile, and a
 * genuinely different (not just degraded) page under prefers-reduced-motion.
 */
export function useViewportProfile(): ViewportProfile {
  const [state, setState] = useState<ViewportProfile>({
    ready: false,
    isMobile: false,
    reducedMotion: false,
    webglAvailable: true,
    particleCount: 20000,
    bloomEnabled: true,
  });

  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 899px)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const compute = () => {
      const isMobile = mobileMq.matches;
      const reducedMotion = motionMq.matches;
      const webglAvailable = detectWebGL();
      setState({
        ready: true,
        isMobile,
        reducedMotion,
        webglAvailable,
        particleCount: isMobile ? 6000 : 20000,
        bloomEnabled: !isMobile && webglAvailable,
      });
    };

    compute();
    mobileMq.addEventListener("change", compute);
    motionMq.addEventListener("change", compute);
    return () => {
      mobileMq.removeEventListener("change", compute);
      motionMq.removeEventListener("change", compute);
    };
  }, []);

  return state;
}
