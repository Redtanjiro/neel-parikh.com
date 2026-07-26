"use client";

import { SceneRefs } from "@/lib/scroll-refs";
import { PROJECTS } from "@/data/projects";

type Props = {
  refs: React.MutableRefObject<SceneRefs>;
};

/**
 * Beat 11: natural document flow, not pinned. The particle canvas keeps
 * rendering behind this (resting state, uFormation = 1, lamp offset to the
 * left third so the beam rakes diagonally) — cards sit in DOM, over the
 * darker right half of the frame, anchored to the pool of light rather
 * than the beam itself (flatter, lower contrast, less bloom — spec
 * section 9).
 */
export default function WorkSection({ refs }: Props) {
  return (
    <section
      ref={(el) => {
        refs.current.workSection = el;
      }}
      id="work"
      className="relative z-10 mx-auto max-w-6xl px-6 py-32 sm:px-10"
    >
      <h2
        className="mb-14 ml-auto w-full max-w-xl text-right text-3xl sm:text-4xl"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        selected work
      </h2>

      <div className="ml-auto grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
        {PROJECTS.map((project) => (
          <a
            key={project.slug}
            href={project.href}
            className="group rounded-lg border border-[color:var(--line)] p-6 backdrop-blur-md transition-colors hover:border-[color:var(--accent)]"
            style={{ background: "rgba(15,13,12,0.55)" }}
          >
            <div
              className="mb-3 flex items-baseline justify-between text-lg"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              <span className="text-[color:var(--ink)]">{project.title}</span>
              <span className="text-sm text-[color:var(--muted)]">{project.year}</span>
            </div>
            <p className="mb-4 text-sm text-[color:var(--muted)]">{project.role}</p>
            <p className="text-base text-[color:var(--ink)]/90">{project.summary}</p>
            <span
              className="mt-4 inline-block text-sm text-[color:var(--accent-bright)] opacity-0 transition-opacity group-hover:opacity-100"
            >
              view case study →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
