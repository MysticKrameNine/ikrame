"use client";

import { useEffect, useState } from "react";

/**
 * Opening curtain: a big counter runs to 100%, then the screen slides up to reveal the site.
 * Shown once per browser session, skipped for people who prefer reduced motion.
 */
export default function Preloader() {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"count" | "lift" | "gone">("count");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("ik-intro") === "1";
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }
    document.documentElement.classList.add("is-loading");
    const t0 = performance.now();
    const DUR = 1700;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / DUR);
      // fast start, a little pause near the end, then 100
      const e = k < 0.85 ? 1 - Math.pow(1 - k / 0.85, 2.2) * 1 : 1;
      setN(Math.round(Math.min(k < 0.85 ? e * 92 : 92 + ((k - 0.85) / 0.15) * 8, 100)));
      if (k < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("lift");
        try {
          sessionStorage.setItem("ik-intro", "1");
        } catch {}
        window.setTimeout(() => {
          setPhase("gone");
          document.documentElement.classList.remove("is-loading");
        }, 1000);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`preloader${phase === "lift" ? " is-lifting" : ""}`} aria-hidden="true">
      <div className="preloader-top">
        <span>Ikrame B.</span>
        <span className="mono">portfolio / 2026</span>
      </div>
      <p className="preloader-line">
        Infrastructure, security <em>&amp; a little bit of magic.</em>
      </p>
      <div className="preloader-bottom">
        <span className="mono">Paris · 48.85° N, 2.35° E</span>
        <span className="preloader-count">{n}%</span>
      </div>
      <span className="preloader-bar" style={{ transform: `scaleX(${n / 100})` }} />
    </div>
  );
}
