"use client";

import { SceneRefs } from "@/lib/scroll-refs";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

// DRAFT COPY — TODO(Neel): these are placeholders, not approved copy.
// Line 1 is deliberately the shortest: the cone apex gives it the least
// horizontal room (spec section 6, beat 4 constraint).
const LINES = [
  "Hi, I'm Neel.",
  "I design interactive, immersive digital experiences.",
  "MDes candidate at UNSW, Sydney.",
  "Everything below is what the lamp lit up.",
];

export default function AboutLines({ refs }: Props) {
  return (
    <div
      className="absolute left-[20%] top-[38%] w-[58%] max-w-[720px]"
      style={{ fontFamily: "var(--font-pixel)" }}
    >
      {LINES.map((line, i) => (
        <p
          key={i}
          ref={(el) => {
            refs.current.lines[i] = el;
          }}
          className="mb-5 text-2xl leading-snug text-[#141210] opacity-0 sm:text-3xl md:text-4xl"
          style={{ transform: "translateY(14px)" }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
