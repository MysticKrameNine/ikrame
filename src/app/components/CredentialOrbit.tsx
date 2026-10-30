"use client";

import { useEffect, useRef, useState } from "react";
import { CREDENTIALS, LANGUAGES, RESUME_URL, type Credential } from "../data/career";

/**
 * "Trust constellation": a glowing shield in the centre, credential medallions orbiting it on a
 * tilted 3D ring. Hover (or tap) a medallion to stop the orbit and read what it is.
 */
export default function CredentialOrbit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState<Credential | null>(null);
  const activeRef = useRef<Credential | null>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, angle = 0, last = performance.now(), visible = true;
    const n = CREDENTIALS.length;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(stage);

    const place = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      const narrow = w < 600;
      const rx = narrow ? w * 0.36 : Math.min(w * 0.42, 420), ry = narrow ? h * 0.36 : Math.min(h * 0.3, 150);
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        const a = angle + (i / n) * Math.PI * 2;
        const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        const depth = (Math.sin(a) + 1) / 2; // 0 = back, 1 = front
        const sc = 0.62 + depth * 0.48;
        const isActive = activeRef.current?.id === CREDENTIALS[i].id;
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${isActive ? sc * 1.12 : sc})`;
        el.style.zIndex = String(Math.round(depth * 100) + (isActive ? 200 : 0));
        el.style.opacity = String(0.45 + depth * 0.55);
        el.style.filter = depth < 0.35 ? `blur(${(0.35 - depth) * 3}px)` : "none";
      });
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !reduced && !hoverRef.current && !activeRef.current) angle += dt * 0.22;
      place();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  const shown = active;

  return (
    <div className="orbit-cred reveal">
      <div
        className="oc-stage"
        ref={stageRef}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") hoverRef.current = true; }}
        onPointerLeave={() => { hoverRef.current = false; setActive(null); }}
      >
        {/* tilted rings */}
        <span className="oc-ring r1" aria-hidden="true" />
        <span className="oc-ring r2" aria-hidden="true" />

        {/* centre: shield + identity, or the selected credential */}
        <div className={`oc-core${shown ? " is-detail" : ""}`}>
          <span className="oc-halo" aria-hidden="true" />
          {shown ? (
            <div className="oc-detail" key={shown.id}>
              <span className="oc-kind mono">
                {shown.status === "progress" ? "in progress" : shown.kind === "company" ? "worked with" : shown.kind === "mission" ? "field experience" : shown.kind === "skill" ? "expertise" : "certified"}
              </span>
              <strong>{shown.name}</strong>
              <p>{shown.detail}</p>
            </div>
          ) : (
            <>
              <Shield />
              <span className="oc-title">security, <em>certified</em></span>
              <span className="oc-sub mono">hover a medallion</span>
            </>
          )}
        </div>

        {CREDENTIALS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            ref={(el) => { itemsRef.current[i] = el; }}
            className={`oc-item${c.status === "progress" ? " is-wip" : ""}${active?.id === c.id ? " is-active" : ""} k-${c.kind}`}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(c); }}
            onClick={() => setActive((a) => (a?.id === c.id ? null : c))}
            aria-label={`${c.name}: ${c.detail}`}
          >
            <Medallion c={c} />
            <span className="oc-name">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="oc-langs">
        {LANGUAGES.map((l) => (
          <div key={l.name} className="oc-lang">
            <span className="oc-lang-name">{l.name}</span>
            <span className="oc-bar"><i style={{ width: l.level === "fluent" ? "100%" : "35%" }} /></span>
            <span className="oc-lang-level mono">{l.level}</span>
          </div>
        ))}
        <div className="oc-lang oc-smile">
          <span className="oc-lang-name">Mood</span>
          <span className="oc-bar"><i style={{ width: "100%" }} /></span>
          <span className="oc-lang-level mono">always smiling ☺</span>
        </div>
      </div>

      <a className="creds-more mono" href={RESUME_URL} target="_blank" rel="noreferrer">
        all my certifications are on my resume →
      </a>
    </div>
  );
}

/** Official logo if the file exists (svg, then png), otherwise an elegant engraved seal. */
function Medallion({ c }: { c: Credential }) {
  const [src, setSrc] = useState<string | null>(c.logo ? `${c.logo}.svg` : null);
  const onErr = () => {
    if (src && src.endsWith(".svg") && c.logo) setSrc(`${c.logo}.png`);
    else setSrc(null);
  };
  return (
    <span className="oc-medal">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={onErr} />
      ) : c.icon ? (
        <Icon kind={c.icon} />
      ) : (
        <Seal c={c} />
      )}
    </span>
  );
}

function Seal({ c }: { c: Credential }) {
  const text = `${c.name.toUpperCase()} · ${c.status === "progress" ? "IN PROGRESS" : c.kind === "company" ? "EXPERIENCE" : "CERTIFIED"} · `;
  const id = `seal-${c.id}`;
  return (
    <svg viewBox="0 0 100 100" className="oc-seal">
      <defs>
        <path id={id} d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
      </defs>
      <circle cx="50" cy="50" r="46" className="s-out" />
      <circle cx="50" cy="50" r="27" className="s-in" />
      <text className="s-ring">
        <textPath href={`#${id}`} startOffset="0">{text.repeat(2)}</textPath>
      </text>
      <text x="50" y="57" textAnchor="middle" className="s-mono">
        {c.name.replace(/[^A-Za-z]/g, "").slice(0, c.name.length > 6 ? 2 : 4).toUpperCase()}
      </text>
    </svg>
  );
}

function Icon({ kind }: { kind: "shield" | "radar" }) {
  if (kind === "radar")
    return (
      <svg viewBox="0 0 100 100" className="oc-icon radar">
        <circle cx="50" cy="50" r="34" /><circle cx="50" cy="50" r="22" /><circle cx="50" cy="50" r="10" />
        <path d="M50 50 L50 16" className="sweep" />
        <circle cx="66" cy="38" r="3.5" className="blip" /><circle cx="38" cy="64" r="2.5" className="blip b2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" className="oc-icon shield">
      <path d="M50 14 L80 26 V48 C80 68 66 80 50 87 C34 80 20 68 20 48 V26 Z" />
      <path d="M38 50 L47 59 L64 41" className="check" />
    </svg>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 120 120" className="oc-shield" aria-hidden="true">
      <defs>
        <linearGradient id="shg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset="0.5" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>
      <path d="M60 10 L98 25 V56 C98 82 80 98 60 108 C40 98 22 82 22 56 V25 Z" className="sh-body" />
      <path d="M60 22 L88 33 V56 C88 76 75 88 60 96 C45 88 32 76 32 56 V33 Z" className="sh-inner" />
      <rect x="46" y="54" width="28" height="22" rx="4" className="sh-lock" />
      <path d="M51 54 V47 a9 9 0 0 1 18 0 V54" className="sh-shackle" />
      <circle cx="60" cy="64" r="3" className="sh-key" />
    </svg>
  );
}
