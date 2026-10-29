// All site content lives here — edit this file to update the globe, the experience cards, the game and the lists.

export type Landmark = "lighthouse" | "cathedral" | "atomium" | "eiffel" | "skyline" | "hospital";

/** How Ikrame gets around in each chapter of the game (and on the globe). */
export type Ride = "walk" | "bike" | "car" | "train";

export type Chapter = {
  id: string;
  company: string;
  role: string;
  period: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  color: string; // accent on the globe
  landmark: Landmark; // drawn above the city on the globe and in the game
  landmarkName: string;
  /**
   * Optional company logo shown on the globe card, e.g. "/logos/microsoft.svg".
   * Put the image file in /public/logos/ and set the path here.
   */
  logo?: string;
  /** Optional photo shown on the chapter card, e.g. "/me/microsoft.jpg". */
  photo?: string;
  photoAlt?: string;
  highlight?: string;
  bullets: string[];
  stack: string[];
  /** walk = on foot with a backpack, bike = the pink bike, train = the regional train, car = the red roadster */
  ride: Ride;
  /** shown when this ride starts, e.g. "senior era: my MX-5!" */
  rideLabel?: string;
  /** switch ride part-way through the chapter (at = 0..1 of the chapter) */
  rideChange?: { at: number; ride: Ride; label: string };
};

// Chronological order = the order of the journey on the globe and in the game.
// NOTE: Leuven (Guardsquare) and "Paris region" (current role) are approximate pins.
export const CHAPTERS: Chapter[] = [
  {
    id: "alstef",
    ride: "walk",
    rideChange: { at: 0.66, ride: "bike", label: "my first bike!" },
    company: "Alstef Group",
    role: "Software & Cybersecurity Engineer",
    period: "Sep 2021 – Sep 2024",
    city: "Rennes",
    country: "France",
    lat: 48.117,
    lon: -1.678,
    color: "#6ee7b7",
    landmark: "lighthouse",
    landmarkName: "a Breton lighthouse",
    bullets: [
      "Crisis simulations with the French Cyber Command (COMCYBER).",
      "ELK stack for log collection/analysis; monitoring prototypes (Grafana/Prometheus).",
      "Identity & access: Keycloak + Spring Security, OAuth2/JWT, RBAC, AOP-based audit logging; EBIOS risk analysis.",
    ],
    stack: ["Java", "Spring Security", "Keycloak", "ELK", "Grafana", "EBIOS"],
  },
  {
    id: "guardsquare",
    ride: "bike",
    company: "Guardsquare",
    role: "ProGuard Software Engineer - Mobile App Protection",
    period: "Jun 2023 – Sep 2023",
    city: "Leuven",
    country: "Belgium",
    lat: 50.88,
    lon: 4.7,
    color: "#a5b4fc",
    landmark: "atomium",
    landmarkName: "the Atomium, Brussels",
    highlight: "Android app protection with ProGuard.",
    bullets: [
      "Engineered ProGuard/ASM post-processing to retain runtime annotations and improve obfuscation resilience.",
      "Gradle plugin development; designed unit & integration tests (JUnit).",
    ],
    stack: ["Android", "ProGuard", "ASM", "Gradle", "JUnit"],
  },
  {
    id: "microsoft",
    ride: "bike",
    company: "Microsoft",
    role: "Infrastructure Operations (Networking & Azure Cloud)",
    period: "Oct 2024 – Jul 2025",
    city: "Paris",
    country: "France",
    lat: 48.86,
    lon: 2.35,
    color: "#67e8f9",
    landmark: "eiffel",
    landmarkName: "the Eiffel Tower",
    highlight: "Azure data-center operations with a focus on availability, safety and secure lifecycle.",
    bullets: [
      "Built an internal training/testing platform controlling data-hall access by skill level; increased completion via automated notifications.",
      "Full infra data centers ops: server integration, Network control, Azure connectivity.",
      "Secure decommissioning per NIST 800-88; EHS-compliant operations.",
      "Troubleshot infrastructure incidents in a high-availability environment under strict operational and security procedures.",
    ],
    stack: ["Azure", "Networking", "NIST 800-88", "Automation"],
  },
  {
    id: "equinix",
    ride: "train",
    rideLabel: "train days, lovely people",
    company: "Equinix",
    role: "Infrastructure Operations",
    period: "Aug 2025 – Feb 2026",
    city: "Frankfurt",
    country: "Germany",
    lat: 50.11,
    lon: 8.68,
    color: "#60a5fa",
    landmark: "skyline",
    landmarkName: "the Frankfurt skyline",
    highlight: "Mission-critical infrastructure in an international, high-availability environment.",
    bullets: ["Enterprise data-center infrastructure, networking and incident troubleshooting."],
    stack: ["Data centers", "Networking", "Incident response"],
  },
  {
    id: "healthcare",
    ride: "car",
    rideLabel: "senior era: my MX-5!",
    company: "Healthcare Technology",
    role: "Senior Infrastructure Engineer",
    period: "Mar 2026 – Present",
    city: "Paris region",
    country: "France",
    lat: 48.7,
    lon: 2.6,
    color: "#34d399",
    landmark: "hospital",
    landmarkName: "hospitals across France",
    highlight: "Working with high-availability software systems supporting hospitals across France.",
    bullets: [
      "Production troubleshooting across Linux, RedHat 8, Oracle, Java and distributed systems.",
      "Root-cause analysis across infrastructure, database and application layers.",
    ],
    stack: ["Linux", "RedHat 8", "Oracle", "Java", "Distributed systems"],
  },
];

export const STATS = [
  { value: "5+", label: "years in industry" },
  { value: "5", label: "companies, incl. Microsoft & Equinix" },
  { value: "3", label: "countries" },
  { value: "24/7", label: "systems supporting hospitals across France" },
];

export const HIGHLIGHTS = [
  {
    kicker: "Cyber defence",
    title: "Crisis simulations with the French Cyber Command (COMCYBER)",
    body: "Alongside identity & access (Keycloak + Spring Security, OAuth2/JWT, RBAC) and an ELK logging stack at Alstef.",
  },
  {
    kicker: "Built at Microsoft",
    title: "An internal training/testing platform for Azure data halls",
    body: "Controls data-hall access by skill level; completion went up thanks to automated notifications.",
  },
  {
    kicker: "Android security",
    title: "ProGuard/ASM post-processing at Guardsquare",
    body: "Retains runtime annotations and improves obfuscation resilience; Gradle plugin work and JUnit tests.",
  },
];

export const TECH = ["TypeScript", "Python", "React.js", "Java", "JavaScript", "C#"];

export const PROJECTS = [
  {
    title: "Quantum Intrusion Detection",
    desc: "Experiments toward anomaly detection using quantum-inspired approaches.",
    tags: ["Python", "Jupyter", "Security"],
    href: "https://github.com/MysticKrameNine/Quantum_Intrusion_Detection",
  },
  {
    title: "TrustShare",
    desc: "Lightweight CRUD app demonstrating server-rendered flows and forms.",
    tags: ["PHP", "MySQL"],
    href: "https://github.com/MysticKrameNine/TrustShare",
  },
  {
    title: "JarGraphAnalyzer",
    desc: "Low-level data structures / algorithms with emphasis on correctness.",
    tags: ["C", "Algorithms"],
    href: "https://github.com/MysticKrameNine/JarGraphAnalyzer",
  },
  {
    title: "ATM Machine",
    desc: "Classic Java OOP exercise—PIN auth, balance ops, receipts.",
    tags: ["Java", "OOP"],
    href: "https://github.com/MysticKrameNine/ATM-Machine",
  },];

export const SERVICES = [
  {
    icon: "globe",
    title: "Website Creation & Design",
    desc: "Design and build performant, accessible websites that reflect your brand and convert.",
    points: ["Next.js/React, SSR/SSG", "Marketing sites, portfolios, lightweight apps", "Analytics instrumentation and SEO foundations"],
    price: "From €800 (typical €800–€2,500)",
  },
  {
    icon: "phone",
    title: "Mobile App Security",
    desc: "End-to-end hardening for Android applications and delivery pipelines.",
    points: ["ProGuard/DexGuard guidance and rules", "Secure storage; TLS hardening & certificate pinning", "Play Integrity enforcement and tamper detection"],
    price: "From €900 (security review)",
  },
  {
    icon: "shield",
    title: "Risk Analysis (EBIOS)",
    desc: "Decision-grade risk assessments aligned with EBIOS, with a clear treatment roadmap.",
    points: ["Asset inventory and threat modeling", "Impact/likelihood scoring and risk register", "Mitigation plan, KPIs, and governance artefacts"],
    price: "From €1,200 (starter workshop)",
  },
  {
    icon: "clipboard",
    title: "Security Reviews",
    desc: "Independent review of code, infrastructure, and processes with prioritized remediation.",
    points: ["AuthN/AuthZ, secrets handling, logging/monitoring", "OWASP Top 10 spot-checks", "Actionable findings ordered by risk"],
    price: "From €700 (mini-audit)",
  },
  {
    icon: "wrench",
    title: "Custom Web Applications",
    desc: "Bespoke internal tools and dashboards that streamline operations and reduce manual effort.",
    points: ["CRUD workflows, forms, and admin panels", "API integration (REST/GraphQL)", "CI/CD enablement and basic observability"],
    price: "From €1,500 (typical €1,500–€6,000)",
  },
] as const;

export const SERVICE_TAGS = ["Next.js", "React", "TypeScript", "Node.js", "Java", "C#", "Azure", "EBIOS", "OWASP"];

// Things that fall / float in the game
export const SKILLS = [
  "TypeScript", "Python", "React", "Java", "C#", "Azure", "Linux", "Networking",
  "Keycloak", "OAuth2", "ELK", "Grafana", "Oracle", "EBIOS", "OWASP", "ProGuard",
];

// Keywords orbiting the moon in the hero
export const ORBIT_WORDS = ["cloud", "security", "networking", "Azure", "Linux", "Java", "Android", "EBIOS"];

// My book. Put a cover image in /public/book/ and set `cover` to use it instead of the designed cover.
export const BOOK = {
  series: "BREATH I",
  title: "Quarter of a century",
  subtitle: "The Geometry of Becoming",
  quote: "Energy is never lost. It changes form; and so do we.",
  blurb:
    "The first book of the BREATH series. Starting from the biggest picture, the universe we travel through, it uses the laws of physics as a lens on a human life: how we change shape, surf the waves of hardship, and dismantle, rearrange and rebuild ourselves, now.",
  chapters: [
    "The Start of an Atom",
    "The Architecture of Mind and Matter",
    "Wave Mechanics of the Soul",
    "Quantum Escape",
    "The Goddess Unbound",
    "The Geometry of a Feather",
    "The Ledger of Light",
  ],
  cover: "", // e.g. "/book/cover.jpg"
  link: "", // where to get it, once it's out
  linkLabel: "Get the book",
  status: "First edition · 2026",
};

// Art gallery — images live in /public/art. Rename titles / mediums freely.
export const ART = [
  { src: "/art/chrome-bust.jpg", title: "Chrome & chains", medium: "3D digital art", w: 1100, h: 1349 },
  { src: "/art/misty-forest.jpg", title: "Misty forest", medium: "Painting on canvas", w: 915, h: 872 },
  { src: "/art/ballerina-3d.jpg", title: "The dancer, from screen to figure", medium: "3D sculpting", w: 1170, h: 855 },
  { src: "/art/orange.jpg", title: "Orange afternoon", medium: "Painting on canvas", w: 970, h: 1160 },
  { src: "/art/sketchbook.jpg", title: "Sketchbook study", medium: "Pencil", w: 900, h: 1395 },
];

export const EMAIL = "ikrame.spaces@gmail.com";
export const GITHUB = "https://github.com/MysticKrameNine";
export const LINKEDIN = "https://www.linkedin.com/in/ikrame-8429bb1a8/";
