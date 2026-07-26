"use client";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-10">
      <a
        href="#"
        className="display rounded text-sm font-semibold uppercase tracking-[0.12em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-bright)] sm:text-base"
      >
        Neel Parikh
      </a>

      <div className="flex items-center gap-4">
        <a
          href="#work"
          className="rounded px-2 py-1 text-sm text-[color:var(--muted)] opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)]"
        >
          Skip to work
        </a>
        <a
          href="mailto:neelparikh7@gmail.com"
          className="display rounded-full border-2 border-[color:var(--accent)] px-6 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-bright)] sm:text-base"
        >
          Lets talk
        </a>
      </div>
    </header>
  );
}
