"use client";

import { useEffect } from "react";

/**
 * Small "premium site" touches, all in one place:
 *  - magnetic buttons (they lean towards the cursor)
 */
export default function Interactions() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

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
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
    };
  }, []);
  return null;
}
