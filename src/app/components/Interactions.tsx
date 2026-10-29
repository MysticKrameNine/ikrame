"use client";

import { useEffect } from "react";

/**
 * Small "premium site" touches, all in one place:
 *  - magnetic buttons (they lean towards the cursor)
 *  - scroll velocity exposed as --vel (used by the marquees to lean while you scroll)
 *  - parallax for the giant hero wordmark
 */
export default function Interactions() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const root = document.documentElement;
    let raf = 0, lastY = window.scrollY, vel = 0;

    const loop = () => {
      const y = window.scrollY;
      const v = y - lastY;
      lastY = y;
      vel += (v - vel) * 0.12;
      root.style.setProperty("--vel", Math.max(-1, Math.min(1, vel / 40)).toFixed(3));
      root.style.setProperty("--sy", String(y));
      raf = requestAnimationFrame(loop);
    };
    if (!reduced) raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".btn, .mode-btn");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`;
    };
    const onLeave = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".btn, .mode-btn");
      if (el && !el.contains(e.relatedTarget as Node)) el.style.transform = "";
    };
    if (fine && !reduced) {
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerout", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
    };
  }, []);
  return null;
}
