"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * Replaces the old OrbitControls autoRotate. A slow constant orbit behind
 * static cards reads as drift and gets uncomfortable within ~30s (spec
 * section 8) — the flicker + mote drift already supply life, so the camera
 * itself just gets a small spring-damped mouse-parallax tilt instead.
 * Gated to fine-pointer/hover-capable devices only.
 */
export default function CameraParallax() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const enabled = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    enabled.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => (enabled.current = e.matches);
    mq.addEventListener("change", onChange);

    const onMove = (e: PointerEvent) => {
      if (!enabled.current) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      const maxDeg = 3;
      target.current.x = (-ny * maxDeg * Math.PI) / 180;
      target.current.y = (nx * maxDeg * Math.PI) / 180;
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useFrame((_, delta) => {
    // response ~0.4s, damping ~1.0 (critically damped) spring approximation
    const response = 0.4;
    const k = 1 - Math.exp(-delta / response);
    current.current.x += (target.current.x - current.current.x) * k;
    current.current.y += (target.current.y - current.current.y) * k;
    camera.rotation.x = current.current.x;
    camera.rotation.y = current.current.y;
  });

  return null;
}
