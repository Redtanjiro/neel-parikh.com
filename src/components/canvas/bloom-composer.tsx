"use client";

import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three-stdlib";
import { useEffect, useMemo } from "react";

type Props = {
  /** Off entirely on mobile per the perf budget. */
  enabled?: boolean;
  strength?: number;
  radius?: number;
  threshold?: number;
};

/**
 * Hand-rolled bloom via three-stdlib, deliberately NOT @react-three/postprocessing
 * (redundant with three-stdlib here per the spec). Tuned down from the original
 * full-screen-showpiece values (threshold 0 / strength 1.8, which bloomed every
 * particle in frame) to something that reads as a bulb+beam glow behind static
 * DOM cards rather than a blown-out haze — see spec section 8.
 *
 * Bloom's internal working resolution is half the canvas and upscaled — ~4x
 * cheaper, visually near-identical for a soft glow.
 */
export default function BloomComposer({
  enabled = true,
  strength = 0.9,
  radius = 0.5,
  threshold = 0.4,
}: Props) {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.max(1, size.width / 2), Math.max(1, size.height / 2)),
      strength,
      radius,
      threshold
    );
    c.addPass(bloom);
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    const bloomPass = composer.passes.find((p) => p instanceof UnrealBloomPass) as
      | UnrealBloomPass
      | undefined;
    bloomPass?.resolution.set(Math.max(1, size.width / 2), Math.max(1, size.height / 2));
  }, [composer, size]);

  useEffect(() => {
    const bloomPass = composer.passes.find((p) => p instanceof UnrealBloomPass) as
      | UnrealBloomPass
      | undefined;
    if (bloomPass) {
      bloomPass.strength = strength;
      bloomPass.radius = radius;
      bloomPass.threshold = threshold;
    }
  }, [composer, strength, radius, threshold]);

  useFrame(
    () => {
      if (enabled) {
        composer.render();
      } else {
        gl.render(scene, camera);
      }
    },
    1 // priority > 0 hands r3f's own render loop over to us
  );

  return null;
}
