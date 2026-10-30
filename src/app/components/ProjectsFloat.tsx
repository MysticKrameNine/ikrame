"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "./Icons";

type Project = { title: string; desc: string; tags: string[]; href: string };

// a soft gradient "cover" for each card (no images needed)
const COVERS = [
  ["#0f2347", "#67e8f9", "#60a5fa"],
  ["#0d2a3a", "#6ee7b7", "#67e8f9"],
  ["#13234f", "#60a5fa", "#6ee7b7"],
  ["#0b2238", "#a5f3fc", "#3b82f6"],
  ["#102a43", "#6ee7b7", "#60a5fa"],
  ["#0f1f45", "#93c5fd", "#67e8f9"],
]

/**
 * Projects as floating cards on a reflective floor. Scroll (or drag) sideways: the card in the
 * middle faces you, the others turn away in perspective.
 */

export default function ProjectsFloat({ projects }: { projects: Project[] }) {
  // a flat, readable slider: swipe / drag / arrows, every card faces you
  const trackRef = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [ends, setEnds] = useState({ start: true, end: false });

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const onScroll = () => {
      const card = t.querySelector<HTMLElement>(".slide-card");
      const step = (card?.offsetWidth ?? 300) + 22;
      setAt(Math.round(t.scrollLeft / step));
      setEnds({ start: t.scrollLeft < 8, end: t.scrollLeft + t.clientWidth > t.scrollWidth - 8 });
    };
    onScroll();
    t.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // drag with the mouse
    let down = false, sx = 0, sl = 0, moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = e.clientX; sl = t.scrollLeft;
      t.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) moved = true;
      t.scrollLeft = sl - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      t.classList.remove("is-dragging");
    };
    const onClick = (e: MouseEvent) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    };
    t.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    t.addEventListener("click", onClick, true);
    return () => {
      t.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      t.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      t.removeEventListener("click", onClick, true);
    };
  }, []);

  const go = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const cards = t.querySelectorAll<HTMLElement>(".slide-card");
    const k = Math.max(0, Math.min(cards.length - 1, i));
    t.scrollTo({ left: cards[k].offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
  };

  return (
    <div className="slider">
      <div className="slider-track" ref={trackRef}>
        {projects.map((p, i) => {
          const c = COVERS[i % COVERS.length];
          return (
            <a key={p.title} href={p.href} target="_blank" rel="noreferrer" className="slide-card pc" draggable={false} style={{ ["--c1" as string]: c[1], ["--c2" as string]: c[2] } as React.CSSProperties}>
              <span className="pc-glow" aria-hidden="true" />
              <div className="pc-top">
                <span className="pc-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="pc-path">~/{p.href.split("/").pop()}</span>
              </div>
              <h3 className="pc-title">{p.title}</h3>
              <p className="pc-desc">{p.desc}</p>
              <div className="pc-foot">
                <div className="chips">
                  {p.tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
                <span className="pc-open">view code <ArrowUpRight /></span>
              </div>
            </a>
          );
        })}
      </div>
      <div className="slider-nav">
        <button type="button" className="icon-btn" aria-label="Previous project" disabled={ends.start} onClick={() => go(at - 1)}>←</button>
        <div className="slider-dots">
          {projects.map((p, i) => (
            <button key={p.title} type="button" aria-label={`Go to ${p.title}`} className={i === at ? "is-on" : ""} onClick={() => go(i)} />
          ))}
        </div>
        <button type="button" className="icon-btn" aria-label="Next project" disabled={ends.end} onClick={() => go(at + 1)}>→</button>
      </div>
    </div>
  );
}
