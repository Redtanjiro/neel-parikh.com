export type Project = {
  slug: string;
  title: string;
  role: string;
  year: string;
  summary: string;
  href: string;
};

// Grid holds 4-8 without a layout change (2x2 at 4, 3-col wrapping at 5+).
// Titles are real; role/year/summary are placeholders — TODO(Neel): confirm
// copy for each before this ships. Nothing here is a fabricated metric.
export const PROJECTS: Project[] = [
  {
    slug: "futee",
    title: "Futee",
    role: "TODO(Neel): your role",
    year: "TODO",
    summary: "TODO: one plain-language line — what it is, not what it's called.",
    href: "/work/futee",
  },
  {
    slug: "emf-ace",
    title: "EMF ACE",
    role: "TODO(Neel): your role",
    year: "TODO",
    summary: "TODO: one plain-language line — what it is, not what it's called.",
    href: "/work/emf-ace",
  },
  {
    slug: "cseds",
    title: "CSEDS",
    role: "TODO(Neel): your role",
    year: "TODO",
    summary: "TODO: one plain-language line — what it is, not what it's called.",
    href: "/work/cseds",
  },
  {
    slug: "into-yesterday",
    title: "Into Yesterday",
    role: "TODO(Neel): your role",
    year: "TODO",
    summary: "TODO: one plain-language line — what it is, not what it's called.",
    href: "/work/into-yesterday",
  },
];
