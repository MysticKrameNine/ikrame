"use client";

import { useEffect } from "react";

/**
 * Soft, inertial wheel scrolling + smooth anchor jumps + reveal-on-scroll + progress bar.
 * Touch devices and reduced-motion users keep native scrolling.
 * Add `data-native-scroll` to any element that should receive raw wheel events.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const root = document.documentElement;
    const bar = document.querySelector<HTMLElement>(".scroll-progress span");

    let target = window.scrollY;
    let current = window.scrollY;
    let animating = false;
    let raf = 0;

    const max = () => root.scrollHeight - window.innerHeight;
    const updateBar = () => {
      if (bar) bar.style.transform = `scaleX(${max() > 0 ? window.scrollY / max() : 0})`;
    };

    const step = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        animating = false;
      }
      window.scrollTo(0, current);
      if (animating) raf = requestAnimationFrame(step);
    };
    const animateTo = (y: number) => {
      target = Math.max(0, Math.min(max(), y));
      if (!animating) {
        current = window.scrollY;
        animating = true;
        raf = requestAnimationFrame(step);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || root.classList.contains("game-open") || root.classList.contains("lightbox-open")) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-native-scroll]")) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      animateTo((animating ? target : window.scrollY) + e.deltaY * unit);
    };
    const onScroll = () => {
      if (!animating) target = current = window.scrollY;
      updateBar();
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el && id !== "home") return;
      e.preventDefault();
      const y = el ? el.getBoundingClientRect().top + window.scrollY - 72 : 0;
      if (reduced) window.scrollTo(0, y);
      else if (fine) animateTo(y);
      else window.scrollTo({ top: y, behavior: "smooth" });
      history.replaceState(null, "", `#${id}`);
    };
    // other components (e.g. career mode) can ask for a smooth jump
    const onScrollTo = (e: Event) => {
      const y = (e as CustomEvent<number>).detail;
      if (fine && !reduced) animateTo(y);
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    };

    if (fine && !reduced) {
      root.classList.add("smooth-wheel");
      window.addEventListener("wheel", onWheel, { passive: false });
    }
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
      cancelAnimationFrame(raf);
      root.classList.remove("smooth-wheel");
      window.removeEventListener("wheel", onWheel);
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
