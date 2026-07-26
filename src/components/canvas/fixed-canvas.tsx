"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import LampParticles, { LampParticlesHandle } from "./lamp-particles";
import BloomComposer from "./bloom-composer";
import CameraParallax from "./camera-parallax";
import { forwardRef } from "react";

type Props = {
  particleCount: number;
  bloomEnabled: boolean;
  staticFrame: boolean;
};

/**
 * One <Canvas> for the whole page: fixed, full-bleed, z-0, pointer-events
 * none. Mounts once at page load and never unmounts — everything else
 * (nav, hero DOM layers, cone, about lines, cards) sits above it in normal
 * document flow at z-10+.
 */
const FixedCanvas = forwardRef<LampParticlesHandle, Props>(function FixedCanvas(
  { particleCount, bloomEnabled, staticFrame },
  ref
) {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Canvas
        frameloop={staticFrame ? "demand" : frameloop}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 60], fov: 50, near: 0.1, far: 400 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0f0d0c", 1);
        }}
      >
        <LampParticles ref={ref} count={particleCount} staticFrame={staticFrame} />
        {!staticFrame && <CameraParallax />}
        <BloomComposer enabled={bloomEnabled} />
      </Canvas>
    </div>
  );
});

export default FixedCanvas;
