"use client";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-10">
      <a
        href="#"
        className="text-sm font-bold uppercase tracking-wide text-white sm:text-base"
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
          className="rounded-full border-2 border-[color:var(--accent)] px-6 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] sm:text-base"
        >
          Lets talk
        </a>
      </div>
    </header>
  );
}
