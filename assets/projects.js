// Single source of truth for project data — read by both
// Chosen Work (featured only) and All Work (everything).
// Add a project = append one object; it appears in the right places automatically.

window.DISCIPLINES = ["UI/UX", "Visual", "Immersive", "Brand"];

window.PROJECTS = [
  {
    slug: "futee",
    order: 1,
    title: "Futee",
    category: "Product Design",
    disciplines: ["UI/UX", "Visual"],
    description: "A football-culture-first product design system for a grassroots matchmaking app.",
    accent: "#f2e338",
    featured: true
  },
  {
    slug: "emf-ace",
    order: 2,
    title: "EMF ACE",
    category: "Brand & Campaign",
    disciplines: ["Visual", "Brand"],
    description: "A campaign content system for an Abu Dhabi wedding-industry showcase, built inside an existing 11-year brand.",
    accent: "#d4af37",
    featured: true
  },
  {
    slug: "cseds",
    order: 3,
    title: "CSEDS",
    category: "Web Design & Build",
    disciplines: ["UI/UX"],
    description: "Full site design and build for a civil/structural engineering distributor.",
    accent: "#3a6ea8",
    featured: true
  },
  {
    slug: "yourturn",
    order: 4,
    title: "Yourturn",
    category: "Brand & Onboarding",
    disciplines: ["Brand", "UI/UX"],
    description: "Brand guidelines and onboarding flow for a recruitment platform.",
    accent: "#e07a3f",
    featured: false
  }
];
