export type Project = {
  slug: string;
  title: string;
  role: string;
  year: string;
  summary: string;
  href: string;
};

// Grid holds 4-8 without a layout change (2x2 at 4, 3-col wrapping at 5+).
// Titles and summaries are real, factual, non-metric descriptions of what
// each project is — safe to ship as-is. Role/year are still genuinely
// unconfirmed, so those stay as plain "TBC" rather than a fabricated date
// or a literal "TODO" string, which reads as a broken site to a visitor.
// TODO(Neel): confirm role/year, and replace summary with your own voice
// once you've reviewed it — this is Claude-drafted, not your copy.
export const PROJECTS: Project[] = [
  {
    slug: "futee",
    title: "Futee",
    role: "TBC",
    year: "TBC",
    summary: "Product design for a grassroots five-a-side football matchmaking app.",
    href: "/work/futee",
  },
  {
    slug: "emf-ace",
    title: "EMF ACE",
    role: "TBC",
    year: "TBC",
    summary: "Campaign design for a wedding-industry showcase event in Abu Dhabi.",
    href: "/work/emf-ace",
  },
  {
    slug: "cseds",
    title: "CSEDS",
    role: "TBC",
    year: "TBC",
    summary: "Website consolidation for an Australian construction materials distributor.",
    href: "/work/cseds",
  },
  {
    slug: "into-yesterday",
    title: "Into Yesterday",
    role: "TBC",
    year: "TBC",
    summary: "A speculative light-and-sound installation concept for Vivid Sydney.",
    href: "/work/into-yesterday",
  },
];
