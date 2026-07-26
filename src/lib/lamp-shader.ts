// Vertex/fragment shader for the lamp particle system.
// Ported from a CPU useFrame loop (20,000 iterations of trig/frame) to the GPU.
// See BUILD-SPEC section 7 for the full writeup of why this port is necessary
// and the two precision traps (hash + golden angle) that break a naive port.

export const GOLD = 2.399963;
export const TAU = Math.PI * 2;

export const DEFAULT_UNIFORMS = {
  uTime: 0,
  uCount: 20000,
  uFormation: 1, // 0 = exploded, 1 = lamp. Driven by scroll (beat 10) then held at 1.
  uSpread: 0.991,
  uReach: 49.0,
  uHaze: 1.2,
  uFlicker: 0.25,
  uWarmth: 0.09,
  uDrift: 0.6,
  uSize: 4.5,
  uPixelRatio: 1,
};

/**
 * Precompute per-particle seeds/angle on the CPU using the *exact* original
 * hash formulas, in float64 (JS numbers), then upload as attributes.
 *
 * Why: sin(i * 78.233 + 2.0) at i = 20000 evaluates sin() of ~1.5M radians.
 * A 32-bit GLSL float only has ~24 bits of mantissa, so doing this same
 * computation *in the shader* collapses into visible banding at that
 * magnitude. Computing it here in JS (64-bit doubles) and uploading the
 * result as a plain attribute sidesteps the precision cliff entirely —
 * the shader only ever sees the already-reduced [0,1) fractional value.
 */
export function buildParticleAttributes(count: number) {
  const index = new Float32Array(count);
  const seed = new Float32Array(count * 3);
  const angle = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    index[i] = i;

    const s1 = Math.sin(i * 12.9898 + 1.0) * 43758.5453;
    const s2 = Math.sin(i * 78.233 + 2.0) * 24634.6345;
    const s3 = Math.sin(i * 39.425 + 3.0) * 15731.743;

    seed[i * 3 + 0] = s1 - Math.floor(s1);
    seed[i * 3 + 1] = s2 - Math.floor(s2);
    seed[i * 3 + 2] = s3 - Math.floor(s3);

    // Same precision cliff applies to GOLD * i (~48,000 radians at i = 20000).
    angle[i] = (GOLD * i) % TAU;
  }

  return { index, seed, angle };
}

export const lampVertexShader = /* glsl */ `
uniform float uTime;
uniform float uCount;
uniform float uFormation;   // 0 = exploded, 1 = lamp
uniform float uSpread;      // 0.991
uniform float uReach;       // 49.0
uniform float uHaze;        // 1.2
uniform float uFlicker;     // 0.25
uniform float uWarmth;      // 0.09
uniform float uDrift;       // 0.6
uniform float uSize;
uniform float uPixelRatio;

attribute float aIndex;
attribute vec3  aSeed;      // r1, r2, r3
attribute float aAngle;     // mod(GOLD * i, TAU)

varying vec3 vColor;

const float TAU = 6.2831853;

vec3 hsl2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
  float i  = aIndex;
  float r1 = aSeed.x, r2 = aSeed.y, r3 = aSeed.z;
  float a0 = aAngle;

  float apexY  =  uReach * 0.5;
  float floorY = -uReach * 0.5;

  float flick = 1.0 + uFlicker * 0.18 * (
      sin(uTime * 13.7)
    + 0.6 * sin(uTime * 29.1 + 1.3)
    + 0.4 * sin(uTime *  7.3 + 2.1)
  );

  float nBulb  = uCount * 0.05;
  float nShade = uCount * 0.13;
  float nBeam  = uCount * 0.74;
  float nPool  = uCount * 0.88;

  vec3 target;
  vec3 hsl;

  if (i < nBulb) {
    // filament
    float f  = (i + 0.5) / max(1.0, nBulb);
    float yy = 1.0 - 2.0 * f;
    float rr = sqrt(max(0.0001, 1.0 - yy * yy));
    float a  = a0 + uTime * 0.4;
    float rad = uReach * 0.035 * (1.0 + 0.06 * sin(uTime * 3.0 + i));
    target = vec3(cos(a) * rr * rad, apexY - uReach * 0.06 + yy * rad, sin(a) * rr * rad);
    hsl = vec3(uWarmth + 0.03, max(0.0, 0.35 - 0.2 * r1), clamp(0.92 * flick, 0.0, 1.0));
  } else if (i < nShade) {
    // shade
    float f = (i - nBulb) / max(1.0, nShade - nBulb);
    float rad = uReach * (0.03 + 0.14 * f);
    float y = apexY + uReach * 0.10 - f * uReach * 0.14;
    float rim = f * f * f;
    target = vec3(cos(a0) * rad, y, sin(a0) * rad);
    hsl = vec3(uWarmth + 0.01, min(1.0, 0.1 + 0.5 * rim), clamp((0.05 + 0.55 * rim) * flick, 0.0, 1.0));
  } else if (i < nBeam) {
    // volumetric beam
    float f = (i - nShade) / max(1.0, nBeam - nShade);
    float t = fract(f + uTime * 0.045 * (0.5 + r3));
    float depth = pow(t, 0.85);
    float coneR = max(0.001, depth * uReach * uSpread);
    float u = pow(r1, 0.6);
    float a = a0 + uTime * (0.25 - 0.15 * depth) + r2 * TAU;
    float x = cos(a) * u * coneR + sin(uTime * 0.8 + depth * 6.0 + r2 * TAU) * uHaze * 0.6;
    float z = sin(a) * u * coneR + cos(uTime * 0.7 + depth * 5.0 + r1 * TAU) * uHaze * 0.6;
    float axial  = 1.0 - depth;
    float radial = 1.0 - u * u;
    float b = pow(max(0.0, axial), 1.4) * (0.25 + 0.75 * radial);
    target = vec3(x, apexY - depth * uReach, z);
    hsl = vec3(uWarmth + 0.045 * axial,
               clamp(0.55 + 0.35 * depth - 0.2 * axial, 0.0, 1.0),
               clamp((0.06 + 0.75 * b) * flick, 0.0, 1.0));
  } else if (i < nPool) {
    // pool of light on the floor
    float f = (i - nBeam) / max(1.0, nPool - nBeam);
    float u = sqrt(f);
    float rad = u * uReach * uSpread * 1.02;
    float b = pow(max(0.0, 1.0 - u), 1.8);
    target = vec3(cos(a0) * rad, floorY + 0.4 * sin(uTime * 1.2 + rad * 0.2), sin(a0) * rad);
    hsl = vec3(uWarmth + 0.03 * b, clamp(0.75 - 0.35 * b, 0.0, 1.0),
               clamp((0.04 + 0.7 * b) * flick, 0.0, 1.0));
  } else {
    // ambient motes
    float span = uReach * 0.9;
    float by = fract(r3 + uTime * 0.02 * uDrift);
    float y = apexY - by * uReach;
    float x = (r1 - 0.5) * 2.0 * span + sin(uTime * 0.50 + r1 * TAU) * uDrift * 2.0;
    float z = (r2 - 0.5) * 2.0 * span + cos(uTime * 0.43 + r2 * TAU) * uDrift * 2.0;
    float depth = max(0.001, by);
    float coneR = max(0.001, depth * uReach * uSpread);
    float d = sqrt(x * x + z * z) / coneR;
    float lit = max(0.0, 1.0 - d * d);
    target = vec3(x, y, z);
    hsl = vec3(uWarmth + 0.02, 0.6,
               clamp((0.015 + 0.85 * lit * (1.0 - depth * 0.7)) * flick, 0.0, 1.0));
  }

  // exploded state — outward shell, seeded so it's stable frame to frame
  float ea = r1 * TAU;
  float ez = r2 * 2.0 - 1.0;
  float er = sqrt(max(0.0, 1.0 - ez * ez));
  vec3 exploded = vec3(cos(ea) * er, ez, sin(ea) * er) * (uReach * 2.4 + r3 * uReach);

  // staggered arrival: 30% spread across the population
  float f = clamp((uFormation - r1 * 0.3) / 0.7, 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);   // smoothstep
  vec3 pos = mix(exploded, target, f);

  vColor = hsl2rgb(hsl);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (300.0 / max(0.001, -mv.z));
}
`;

export const lampFragmentShader = /* glsl */ `
varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, d);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, a);
}
`;
