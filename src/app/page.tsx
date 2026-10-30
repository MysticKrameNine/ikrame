"use client";

import { useEffect, useRef, useState } from "react";
import CareerGlobe from "./components/CareerGlobe";
import ArtGallery from "./components/ArtGallery";
import OrbitSystem from "./components/OrbitSystem";
import ProjectsFloat from "./components/ProjectsFloat";
import SecurityTerminal from "./components/SecurityTerminal";
import { drawGirl } from "./components/draw";
import {
  Mail, Github, Linkedin, Compass, Gamepad, Globe, Phone, Shield, Clipboard, Wrench,
} from "./components/Icons";
import {
  STATS, HIGHLIGHTS, TECH, PROJECTS, BOOK, SERVICES, SERVICE_TAGS, EMAIL, GITHUB, LINKEDIN,
} from "./data/career";

/* ---------- building blocks ---------- */

function SectionTitle({ children, n, label }: { children: React.ReactNode; n?: string; label?: string }) {
  return (
    <>
      {n ? (
        <div className="section-label mono reveal">
          <span>({n})</span>
          <span className="section-label-line" />
          <span>{label}</span>
        </div>
      ) : null}
      <h2 className="section-title reveal mask">
        <span className="mask-inner">{children}</span>
      </h2>
    </>
  );
}

function TypeLine({ onDone }: { onDone?: () => void }) {
  const text = "hi, ikrame here.";
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      onDone?.();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) {
        window.clearInterval(id);
        onDone?.();
      }
    }, 110);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // "ikrame" (chars 4–9) gets the shimmering gradient, as on the original site
  const typed = text.slice(0, n);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {typed.slice(0, 4)}
        <span className="shimmer-text">{typed.slice(4, 10)}</span>
        {typed.slice(10)}
      </span>
      <span className="caret" aria-hidden="true" />
    </>
  );
}

/** The little cyclist riding across the game teaser. */
function TeaserRider() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 160 * dpr;
    c.height = 110 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, p = 0;
    const loop = () => {
      p += 0.12;
      ctx.clearRect(0, 0, 160, 110);
      ctx.strokeStyle = "rgba(103,232,249,0.4)";
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -p * 12;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(160, 100);
      ctx.stroke();
      ctx.setLineDash([]);
      drawGirl(ctx, 80, 99, 17, { pedal: p, glow: true, bob: Math.sin(p) * 0.04 });
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ width: 160, height: 110 }} aria-hidden="true" />;
}

const SERVICE_ICONS = { globe: Globe, phone: Phone, shield: Shield, clipboard: Clipboard, wrench: Wrench } as const;

/* ---------- page ---------- */

export default function Home() {
  const [typed, setTyped] = useState(false);

  return (
    <main className="page">
      {/* ===== HERO ===== */}
      <section id="home" className="hero">
        <div className="hero-moon">
          <OrbitSystem />
        </div>
        <div className="hero-copy">
          <div className="hero-gif">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-animation5.gif" alt="Creative header animation" />
          </div>
          <h1 className="hero-title">
            <TypeLine onDone={() => setTyped(true)} />
          </h1>
          <p className={`hero-sub${typed ? " is-in" : ""}`}>I create stuff <em>sometimes.</em></p>
          <p className={`hero-text${typed ? " is-in" : ""}`}>
            <b>Fascinated</b> by tech and clean user experiences.
          </p>
          <p className={`hero-status mono${typed ? " is-in" : ""}`}>
            <span className="hs-dot" /> ANSSI-certified engineer · SIEM · crisis simulations · OSCP in progress<span className="hs-caret" />
          </p>
          <div className={`hero-cta${typed ? " is-in" : ""}`}>
            <a href={`mailto:${EMAIL}`} className="btn btn-ghost"><Mail /> Say hi!</a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="btn btn-ghost"><Github /> GitHub</a>
            <a href={LINKEDIN} target="_blank" rel="noreferrer" className="btn btn-ghost"><Linkedin /> LinkedIn</a>
          </div>
          <div className={`hero-modes${typed ? " is-in" : ""}`}>
            <button type="button" className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("ik:career"))}>
              <Compass /> Career mode
            </button>
            <button type="button" className="btn btn-glow" onClick={() => window.dispatchEvent(new Event("ik:game"))}>
              <Gamepad /> Game mode
            </button>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="section">
        <SectionTitle n="01" label="About">about <em>me</em></SectionTitle>
        <div className="about-grid">
          <div className="about-text reveal">
            <p>
              I’m currently a <b>Senior Infrastructure Engineer</b> working at the intersection of systems, security, and
              software. I’m also pursuing a <b>part-time MBA</b>. My background spans data-center, networking, and secure software
              delivery. I care about pragmatic tools that reduce toil, clear interfaces, and impact.
            </p>
            <h4 className="mini-title">Technologies I work with</h4>
            <ul className="tech-list">
              {TECH.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p>Outside of work, I’m into sports, art, science, &amp; I play piano.</p>
          </div>
          <figure className="about-photo reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/me/paris-night.jpg" alt="Ikrame at night in Paris, near the Arc de Triomphe" width={1000} height={1333} loading="lazy" />
            <figcaption className="mono">a little bit of stardust</figcaption>
          </figure>
        </div>
        <div className="stats reveal">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SECURITY ===== */}
      <section id="security" className="section">
        <SectionTitle n="02" label="Security">the <em>security</em> side</SectionTitle>
        <p className="section-lede reveal">
          Security is where I feel at home: hardening systems, watching the logs, and rehearsing for the day things go wrong.
        </p>
        <SecurityTerminal />
      </section>

      {/* ===== EXPERIENCE ===== */}
      <section id="experience" className="section">
        <SectionTitle n="03" label="Experience">the <em>journey</em></SectionTitle>
        <p className="section-lede reveal">
          Spin the globe and ride along: every glowing city is a chapter of my career. Press play for career mode, or click a city.
        </p>
        <div className="reveal">
          <CareerGlobe />
        </div>

        <div className="highlights">
          {HIGHLIGHTS.map((h, i) => (
            <article key={h.title} className="highlight reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="mono kicker">{h.kicker}</span>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </article>
          ))}
        </div>

      </section>

      {/* ===== GAME TEASER ===== */}
      <section className="game-teaser reveal" aria-label="Game mode">
        <div className="game-teaser-inner">
          <TeaserRider />
          <div className="game-teaser-text">
            <h2>Ride through my career.</h2>
            <p>Rennes → Leuven → Paris → Frankfurt. Jump the bugs, duck the phishing, ride the turbo, catch the skills.</p>
          </div>
          <button type="button" className="btn btn-glow" onClick={() => window.dispatchEvent(new Event("ik:game"))}>
            <Gamepad /> Play Ikrame&apos;s Ride
          </button>
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="section">
        <SectionTitle n="04" label="Projects">pet <em>projects</em></SectionTitle>
        <p className="section-lede reveal">Hand-picked work. The rest lives on my GitHub.</p>
        <div className="reveal">
          <ProjectsFloat projects={PROJECTS} />
        </div>
        <a href={GITHUB} target="_blank" rel="noreferrer" className="btn btn-ghost more-link reveal">
          View all on GitHub →
        </a>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" className="section">
        <SectionTitle n="05" label="Services">how I can <em>help</em></SectionTitle>
        <p className="section-lede reveal">Advisory and delivery services focused on reliability, security, and measurable outcomes.</p>
        <div className="services">
          {SERVICES.map((s, i) => {
            const Icon = SERVICE_ICONS[s.icon];
            return (
              <article key={s.title} className="service reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <div className="service-head">
                  <span className="service-icon"><Icon /></span>
                  <h3>{s.title}</h3>
                </div>
                <p>{s.desc}</p>
                <ul>
                  {s.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <span className="service-price">{s.price}</span>
              </article>
            );
          })}
          <article className="service service-cta reveal">
            <h3>More services coming soon…</h3>
            <p>Have something specific in mind? I can scope it quickly.</p>
            <a href={`mailto:${EMAIL}?subject=Project%20inquiry`} className="btn btn-ghost">
              <Mail /> Request a quote
            </a>
            <p className="small t-dim">Prices are indicative and exclude VAT. Final quotes depend on scope &amp; timeline.</p>
          </article>
        </div>
        <div className="chips tag-row reveal">
          {SERVICE_TAGS.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </section>

      {/* ===== CREATIVE: BOOK + ART ===== */}
      <section id="creative" className="section">
        <SectionTitle n="06" label="Art"><em>art</em></SectionTitle>
        <p className="section-lede reveal">
          The other side of the brain: writing, painting, sketching and 3D sculpting.
        </p>

        <div className="book reveal">
          <div className="book-cover-wrap">
            {BOOK.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="book-cover" src={BOOK.cover} alt={`Cover of ${BOOK.series}: ${BOOK.title}`} />
            ) : (
              <div className="book-cover book-cover-designed" aria-hidden="true">
                <span className="book-orbit" />
                <span className="book-atom" />
                <span className="book-cover-series">{BOOK.series}</span>
                <span className="book-cover-title">{BOOK.title}</span>
                <span className="book-cover-author">Ikrame B.</span>
              </div>
            )}
          </div>
          <div className="book-text">
            <span className="mono kicker">{BOOK.status}</span>
            <h3 className="book-title">
              {BOOK.series} <span className="book-title-sub">— {BOOK.title}</span>
            </h3>
            <p className="book-subtitle">{BOOK.subtitle}</p>
            <blockquote className="book-quote">“{BOOK.quote}”</blockquote>
            <p className="book-blurb">{BOOK.blurb}</p>
            <div className="book-author">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/me/portrait.jpg" alt="Ikrame, the author" width={56} height={56} loading="lazy" />
              <span>written by <b>Ikrame B.</b></span>
            </div>
            {BOOK.link ? (
              <a href={BOOK.link} target="_blank" rel="noreferrer" className="btn btn-primary">{BOOK.linkLabel} →</a>
            ) : null}
          </div>
        </div>

        <h3 className="sub-title reveal">art</h3>
        <ArtGallery />
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="section contact">
        <SectionTitle n="07" label="Contact">get in <em>touch</em></SectionTitle>
        
        <div className="reveal">
          <p className="section-lede">Open to software engineering roles across cloud/infra/dev-tools.</p>
          <div className="contact-links">
            <a href={`mailto:${EMAIL}`} className="btn btn-ghost"><Mail /> Email</a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="btn btn-ghost"><Github /> GitHub</a>
            <a href={LINKEDIN} target="_blank" rel="noreferrer" className="btn btn-ghost"><Linkedin /> LinkedIn</a>
          </div>
          <p className="contact-mail mono">{EMAIL}</p>
        </div>
      </section>

      <footer className="footer">
        Built and designed by <span className="t-strong">Ikrame B</span>.<span className="dot">•</span>All rights reserved. ©{" "}
        {new Date().getFullYear()}
      </footer>
    </main>
  );
}
