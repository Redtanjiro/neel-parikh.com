import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/data/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center px-6 py-24">
      <p
        className="mb-4 text-sm text-[color:var(--accent-bright)]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        case study — coming soon
      </p>
      <h1
        className="mb-6 text-4xl sm:text-5xl"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        {project.title}
      </h1>
      <p className="mb-10 max-w-lg text-lg text-[color:var(--muted)]">
        {project.summary} The full write-up for this project isn&rsquo;t built
        yet — check back soon, or get in touch if you want to hear about it
        directly.
      </p>
      <Link
        href="/#work"
        className="rounded border border-[color:var(--accent)] px-4 py-1.5 text-sm text-[color:var(--accent-bright)] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)]"
      >
        ← back to work
      </Link>
    </main>
  );
}
