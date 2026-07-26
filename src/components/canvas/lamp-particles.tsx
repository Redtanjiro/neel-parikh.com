"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  DEFAULT_UNIFORMS,
  buildParticleAttributes,
  lampFragmentShader,
  lampVertexShader,
} from "@/lib/lamp-shader";

export type LampParticlesHandle = {
  material: THREE.ShaderMaterial | null;
};

type Props = {
  /** 20,000 on desktop, 6,000 on mid-tier mobile per the perf budget. */
  count?: number;
  /** Static resting frame (reduced-motion / no-WebGL-animation path). */
  staticFrame?: boolean;
};

/**
 * The only 3D content on the page. A single THREE.Points cloud, driven
 * entirely by a vertex shader — see src/lib/lamp-shader.ts for why the
 * original CPU useFrame loop (20k iterations of trig/frame, full matrix +
 * color re-upload) had to be ported rather than kept as the resting state
 * under a portfolio.
 *
 * uFormation (0 = exploded shell, 1 = fully-formed lamp) is the single
 * scroll-driven handle into this system — the scroll orchestrator writes
 * to `ref.current.material.uniforms.uFormation.value` directly. Nothing
 * here touches React state per frame.
 */
const LampParticles = forwardRef<LampParticlesHandle, Props>(function LampParticles(
  { count = 20000, staticFrame = false },
  ref
) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useImperativeHandle(ref, () => ({
    get material() {
      return materialRef.current;
    },
  }));

  const { positions, index, seed, angle } = useMemo(() => {
    const { index, seed, angle } = buildParticleAttributes(count);
    const positions = new Float32Array(count * 3); // unused by the shader; required so THREE knows the vertex count
    return { positions, index, seed, angle };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCount: { value: count },
      uFormation: { value: DEFAULT_UNIFORMS.uFormation },
      uSpread: { value: DEFAULT_UNIFORMS.uSpread },
      uReach: { value: DEFAULT_UNIFORMS.uReach },
      uHaze: { value: DEFAULT_UNIFORMS.uHaze },
      uFlicker: { value: DEFAULT_UNIFORMS.uFlicker },
      uWarmth: { value: DEFAULT_UNIFORMS.uWarmth },
      uDrift: { value: DEFAULT_UNIFORMS.uDrift },
      uSize: { value: DEFAULT_UNIFORMS.uSize },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
    }),
    [count]
  );

  useFrame((_, delta) => {
    if (staticFrame) return; // reduced-motion: one still frame, no animation loop
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aIndex" args={[index, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seed, 3]} />
        <bufferAttribute attach="attributes-aAngle" args={[angle, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={lampVertexShader}
        fragmentShader={lampFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});

export default LampParticles;
