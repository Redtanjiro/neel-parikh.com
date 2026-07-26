"use client";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-10">
      <a
        href="#"
        className="text-xl text-[color:var(--accent-bright)] sm:text-2xl"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        Neel Parikh
      </a>

      <div className="flex items-center gap-4">
        <a
          href="#work"
          className="rounded px-2 py-1 text-sm text-[color:var(--muted)] opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Skip to work
        </a>
        <a
          href="mailto:neelparikh7@gmail.com"
          className="rounded border border-[color:var(--accent)] px-4 py-1.5 text-sm text-[color:var(--accent-bright)] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Let&rsquo;s talk
        </a>
      </div>
    </header>
  );
}
