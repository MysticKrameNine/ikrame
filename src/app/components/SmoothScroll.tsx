"use client";

import { useEffect } from "react";

/**
 * Smooth anchor jumps + reveal-on-scroll + progress bar.
 * Wheel and touch scrolling stay native: the browser's own scrolling runs off the main thread and is always the smoothest.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const bar = document.querySelector<HTMLElement>(".scroll-progress span");

    let ticking = false;
    const max = () => root.scrollHeight - window.innerHeight;
    const updateBar = () => {
      ticking = false;
      if (bar) bar.style.transform = `scaleX(${max() > 0 ? window.scrollY / max() : 0})`;
    };
    const animateTo = (y: number) => window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el && id !== "home") return;
      e.preventDefault();
      const y = el ? el.getBoundingClientRect().top + window.scrollY - 72 : 0;
      animateTo(y);
      history.replaceState(null, "", `#${id}`);
    };
    // other components (e.g. career mode) can ask for a smooth jump
    const onScrollTo = (e: Event) => {
      animateTo((e as CustomEvent<number>).detail);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    window.addEventListener("ik:scrollto", onScrollTo);
    updateBar();

    // reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      window.removeEventListener("ik:scrollto", onScrollTo);
      io.disconnect();
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span />
    </div>
  );
}
