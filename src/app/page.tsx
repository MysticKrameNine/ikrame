"use client";
import { Shield, Globe, Smartphone, ClipboardList, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Mail, Github, Linkedin } from "lucide-react";

/* ---------- Shared blocks ---------- */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-800">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-100">
          <span className="text-cyan-300/90 mr-2">/</span>
          {title}
        </h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  desc,
  points,
  price,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  points: string[];
  price?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 p-6 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-slate-700 p-2">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      <p className="mt-3 text-slate-300/90 text-sm">{desc}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-300/90 list-disc pl-5">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {price ? (
        <div className="mt-4 inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300/90">
          {price}
        </div>
      ) : null}
    </div>
  );
}

function Card({
  title,
  desc,
  tags,
  href,
}: {
  title: string;
  desc: string;
  tags: string[];
  href: string;
}) {
  return (
    <a
      className="block rounded-2xl border border-slate-800 p-6 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <h3 className="font-medium text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
        {tags.map((t) => (
          <span key={t} className="rounded-full border border-slate-700 px-2 py-1">
            {t}
          </span>
        ))}
      </div>
    </a>
  );
}

function Experience({
  company,
  role,
  period,
  bullets,
  highlight,
}: {
  company: string;
  role: string;
  period: string;
  bullets: string[];
  highlight?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 p-6 mb-6">
      <h3 className="text-xl font-semibold text-slate-100">
        {role} <span className="text-cyan-300">@ {company}</span>
      </h3>
      <p className="text-sm text-slate-400 mt-1">{period}</p>
      {highlight ? <p className="mt-3 text-slate-300/90">{highlight}</p> : null}
      <ul className="mt-3 list-disc pl-5 text-sm text-slate-300/90 space-y-1.5">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Main page ---------- */
export default function Home() {
  // EXACT typewriter alignment: measure the pixel width of the headline once rendered
  const headlineRef = useRef<HTMLSpanElement | null>(null);
  const [headlineWidth, setHeadlineWidth] = useState<number>(0);
  const HEADLINE_STEPS = 16; // "hi, ikrame here." -> 16 visible characters

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const measure = () => setHeadlineWidth(el.scrollWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="font-sans min-h-screen flex flex-col text-slate-200">

      {/* ===== HERO ===== */}
      <section id="home" className="flex items-center justify-center">
        <div className="mx-auto max-w-4xl px-5 py-28 text-center">

          {/* Top creative GIF — put your file at /public/hero-animation.gif */}
          <div className="mb-8 flex justify-center">
            <img
              src="/hero-animation5.gif"
              alt="Creative header animation"
              className="h-32 w-auto rounded-lg shadow-lg opacity-95"
            />
          </div>

          {/* Typing headline with shimmering name */}
          <div className="mx-auto w-fit">
            <h1
              className="typing text-[44px] md:text-[72px] leading-[1.05] font-semibold tracking-tight text-slate-100"
              style={
                {
                  ["--typew" as any]: `${headlineWidth}px`, // animate to exact pixel width
                  ["--steps" as any]: 16,
                } as React.CSSProperties
              }
            >
              <span ref={headlineRef} className="inline-block">
                hi, <span className="shimmer-text">ikrame</span> here.
              </span>
            </h1>
          </div>

          {/* Subtitle: static, fades in after typing */}
          <p className="headline-sub mt-5 text-slate-300/90 text-2xl md:text-[28px] font-medium opacity-0">
            I create stuff sometimes.
          </p>

          {/* Supporting line (kept for context/professional tone) */}
          <p className="mt-3 text-slate-300/85 text-lg md:text-xl">
            Based in <b>Paris</b>, I’m fascinated by high-impact systems and clean developer experiences.
          </p>

          <div className="mt-10 flex justify-center gap-3">
            <a
              href="mailto:ikramebakkari@protonmail.com"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-[15px] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <Mail className="w-4 h-4" />
              <span>Say hi!</span>
            </a>
            <a
              href="https://github.com/MysticKrameNine"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-[15px] hover:bg-slate-800"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ikrame-8429bb1a8/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-[15px] hover:bg-slate-800"
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* ===== / about me ===== */}
      <Section id="about" title="about me">
        <div className="space-y-6">
          <p className="max-w-3xl text-slate-300/90">
            I’m currently an <b>Infrastructure Engineer at Microsoft</b> (Azure, Paris). I’m also pursuing a
            <b> part-time MBA</b>. My background spans data-center reliability, networking, and secure software
            delivery. I care about pragmatic tools that reduce toil, clear interfaces, and measurable impact.
          </p>

          <div>
            <h4 className="text-sm uppercase tracking-widest text-slate-400">Technologies I work with</h4>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-300/90">
              {["TypeScript","Python","React.js","Java","JavaScript","C#"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="max-w-3xl text-slate-300/90">
            Outside of work, I’m into science & art, & I play piano.
          </p>
        </div>
      </Section>

      {/* ===== / experience ===== */}
      <Section id="experience" title="experience">
        <Experience
          company="Microsoft — Paris"
          role="Infrastructure Operations (Networking & Azure Cloud)"
          period="Jan 2025 – Jul 2025"
          highlight="Azure data-center operations with a focus on availability, safety and secure lifecycle."
          bullets={[
            "Built an internal training/testing platform controlling data-hall access by skill level; increased completion via automated notifications.",
            "Full infra ops: rack & stack, server integration, MAC/IP control, Azure connectivity, ticketing.",
            "Low-level troubleshooting: DIMMs, CPUs, PSUs, SSDs, NICs, FPGAs; optical checks (LC, PSM4, AOC).",
            "Secure decommissioning per NIST 800-88; EHS-compliant operations.",
          ]}
        />

        <Experience
          company="Guardsquare — Belgium"
          role="Software Engineer — Obfuscation & Bytecode"
          period="Jun 2023 – Sep 2023"
          bullets={[
            "Engineered ProGuard/ASM post-processing to retain runtime annotations and improve obfuscation resilience.",
            "Gradle plugin development; designed unit & integration tests (JUnit).",
          ]}
        />

        <Experience
          company="Alstef Group — France"
          role="Apprentice Software & Cybersecurity Engineer"
          period="Sep 2021 – Sep 2024"
          bullets={[
            "Crisis simulations with the French Cyber Command (COMCYBER).",
            "ELK stack for log collection/analysis; monitoring prototypes (Grafana/Prometheus).",
            "Identity & access: Keycloak + Spring Security, OAuth2/JWT, RBAC, AOP-based audit logging; EBIOS risk analysis.",
          ]}
        />
      </Section>

      {/* ===== / pet projects ===== */}
      <Section id="projects" title="pet projects">
        <div className="mt-2 text-slate-400 text-sm">
          Hand-picked work. The rest lives on my GitHub.
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="Quantum Intrusion Detection"
            desc="Experiments toward anomaly detection using quantum-inspired approaches."
            tags={["Python", "Jupyter", "Security"]}
            href="https://github.com/MysticKrameNine/Quantum_Intrusion_Detection"
          />
          <Card
            title="TrustShare"
            desc="Lightweight CRUD app demonstrating server-rendered flows and forms."
            tags={["PHP", "MySQL"]}
            href="https://github.com/MysticKrameNine/TrustShare"
          />
          <Card
            title="JarGraphAnalyzer"
            desc="Low-level data structures / algorithms with emphasis on correctness."
            tags={["C", "Algorithms"]}
            href="https://github.com/MysticKrameNine/JarGraphAnalyzer"
          />
          <Card
            title="CalculatorForSonarQubeAnanalysis"
            desc="Tiny front-end pieces exploring layout & typography."
            tags={["HTML", "CSS"]}
            href="https://github.com/MysticKrameNine/CalculatorForSonarQubeAnanalysis"
          />
          <Card
            title="ATM Machine"
            desc="Classic Java OOP exercise—PIN auth, balance ops, receipts."
            tags={["Java", "OOP"]}
            href="https://github.com/MysticKrameNine/ATM-Machine"
          />
          <Card
            title="exb1610local (fork)"
            desc="Academic Java project fork—demonstrates build & contribution workflow."
            tags={["Java", "Gradle"]}
            href="https://github.com/MysticKrameNine/exb1610local"
          />
        </div>

        <div className="mt-8">
          <a
            href="https://github.com/MysticKrameNine"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-[15px] hover:bg-slate-800"
          >
            View all on GitHub →
          </a>
        </div>
      </Section>

      {/* ===== / services ===== */}
      <Section id="services" title="services">
        <p className="text-slate-300/90 max-w-3xl">
          Advisory and delivery services focused on reliability, security, and measurable outcomes.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            icon={Globe}
            title="Website Creation & Design"
            desc="Design and build performant, accessible websites that reflect your brand and convert."
            points={[
              "Next.js/React, SSR/SSG",
              "Marketing sites, portfolios, lightweight apps",
              "Analytics instrumentation and SEO foundations",
            ]}
            price="From €800 (typical €800–€2,500)"
          />
          <ServiceCard
            icon={Smartphone}
            title="Mobile App Security"
            desc="End-to-end hardening for Android applications and delivery pipelines."
            points={[
              "ProGuard/DexGuard guidance and rules",
              "Secure storage; TLS hardening & certificate pinning",
              "Play Integrity enforcement and tamper detection",
            ]}
            price="From €900 (security review)"
          />
          <ServiceCard
            icon={Shield}
            title="Risk Analysis (EBIOS)"
            desc="Decision-grade risk assessments aligned with EBIOS, with a clear treatment roadmap."
            points={[
              "Asset inventory and threat modeling",
              "Impact/likelihood scoring and risk register",
              "Mitigation plan, KPIs, and governance artefacts",
            ]}
            price="From €1,200 (starter workshop)"
          />
          <ServiceCard
            icon={ClipboardList}
            title="Security Reviews"
            desc="Independent review of code, infrastructure, and processes with prioritized remediation."
            points={[
              "AuthN/AuthZ, secrets handling, logging/monitoring",
              "OWASP Top 10 spot-checks",
              "Actionable findings ordered by risk",
            ]}
            price="From €700 (mini-audit)"
          />
          <ServiceCard
            icon={Wrench}
            title="Custom Web Applications"
            desc="Bespoke internal tools and dashboards that streamline operations and reduce manual effort."
            points={[
              "CRUD workflows, forms, and admin panels",
              "API integration (REST/GraphQL)",
              "CI/CD enablement and basic observability",
            ]}
            price="From €1,500 (typical €1,500–€6,000)"
          />

          <div className="rounded-2xl border border-dashed border-slate-800 p-6 flex flex-col items-start justify-center">
            <h3 className="text-lg font-semibold text-slate-100">More services coming soon…</h3>
            <p className="mt-2 text-slate-300/90 text-sm">
              Have something specific in mind? I can scope it quickly.
            </p>
            <a
              href="mailto:ikramebakkari@protonmail.com?subject=Project%20inquiry"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              <Mail className="w-4 h-4" /> Request a quote
            </a>
            <p className="mt-3 text-xs text-slate-400">
              Prices are indicative and exclude VAT. Final quotes depend on scope & timeline.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {["Next.js","React","TypeScript","Node.js","Java","C#","Azure","EBIOS","OWASP"].map((t) => (
            <span key={t} className="text-xs text-slate-400 rounded-full border border-slate-700 px-2 py-1">
              {t}
            </span>
          ))}
        </div>
      </Section>

      {/* ===== / contact ===== */}
      <Section id="contact" title="contact">
        <div className="text-center">
          <p className="mt-1 text-slate-300/90 max-w-2xl mx-auto">
            Open to software engineering roles across cloud/infra/dev-tools.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="mailto:ikramebakkari@protonmail.com"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
            <a
              href="https://github.com/MysticKrameNine"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ikrame-8429bb1a8/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          </div>
        </div>
      </Section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-5 py-8 text-center text-sm text-slate-400">
          Built and designed by <span className="text-slate-200">Ikrame Bakkari</span>.
          <span className="mx-2">•</span>
          All rights reserved. © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Local CSS for shimmer + exact-width typing + subtitle fade */}
      <style jsx global>{`
        .shimmer-text {
          background: linear-gradient(90deg, #34d399, #22d3ee, #60a5fa, #22d3ee, #34d399);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .typing {
          width: 0;
          white-space: nowrap;
          overflow: hidden;
          border-right: 3px solid rgba(165, 243, 252, 0.9);
          animation:
            typingPx 2.4s steps(16, end) forwards,
            caret 1s steps(1) infinite;
        }
        @keyframes typingPx {
          from { width: 0; }
          to   { width: var(--typew, 0px); }
        }
        @keyframes caret {
          0%, 49%  { border-color: rgba(165, 243, 252, 0.9); }
          50%,100% { border-color: transparent; }
        }

        .headline-sub { animation: fadeIn 600ms ease forwards; animation-delay: 2.45s; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
