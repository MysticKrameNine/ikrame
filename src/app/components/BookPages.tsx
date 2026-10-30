"use client";

import { useEffect, useRef, useState } from "react";
import { BOOK_PAGES, BOOK_IDEAS } from "../data/bookPages";

/**
 * A little stack of real pages from the book. They riffle into place when you scroll to them,
 * then shuffle on their own: the top page lifts, slides away and slips to the back of the pile.
 * Swipe / drag, click the arrows, or pick one of the floating "little ideas" to open its page.
 */
export default function BookPages() {
  const n = BOOK_PAGES.length;
  const [top, setTop] = useState(0); // index of the page on top
  const [leaving, setLeaving] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const [entered, setEntered] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, down: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setEntered(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (dir: 1 | -1, to?: number) => {
    if (leaving) return;
    setLeaving({ i: top, dir });
    window.setTimeout(() => {
      setTop((t) => (to !== undefined ? to : (t + dir + n) % n));
      setLeaving(null);
    }, 520);
  };

  // gentle auto-shuffle while nobody is reading
  useEffect(() => {
    if (!entered || hover) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, hover, top, leaving]);

  return (
    <div className={`bp${entered ? " is-in" : ""}`} ref={ref}>
      <div className="bp-head">
        <span className="mono kicker">a few pages</span>
        <span className="bp-hint mono">swipe · or pick a little idea</span>
      </div>

      <div className="bp-scene">
        {/* little ideas drifting around */}
        <div className="bp-ideas" aria-label="Little ideas from the book">
          {BOOK_IDEAS.map((q, i) => (
            <button
              key={q.text}
              type="button"
              className={`bp-idea i${i}${q.page === top ? " is-on" : ""}`}
              style={{ ["--d" as string]: `${i * -2.3}s` } as React.CSSProperties}
              onClick={() => { if (q.page !== top) go(1, q.page); }}
            >
              {q.text}
            </button>
          ))}
        </div>

        <div
          className="bp-stack"
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => { setHover(false); drag.current.down = false; }}
          onPointerDown={(e) => { drag.current = { x: e.clientX, down: true }; }}
          onPointerUp={(e) => {
            if (!drag.current.down) return;
            drag.current.down = false;
            const dx = e.clientX - drag.current.x;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          }}
        >
          {BOOK_PAGES.map((p, i) => {
            const depth = (i - top + n) % n; // 0 = on top
            const isLeaving = leaving?.i === i;
            const fan = entered ? 0 : (i - n / 2) * 9;
            const style = {
              ["--depth" as string]: depth,
              ["--fan" as string]: `${fan}deg`,
              ["--rot" as string]: `${((i * 37) % 7) - 3}deg`,
              ["--dir" as string]: leaving?.dir ?? 1,
              zIndex: isLeaving ? n + 2 : n - depth,
            } as React.CSSProperties;
            return (
              <article key={i} className={`bp-page${depth === 0 ? " is-top" : ""}${isLeaving ? " is-leaving" : ""}`} style={style} aria-hidden={depth !== 0}>
                <header className="bp-run">
                  <span>THE GEOMETRY OF BECOMING</span>
                </header>
                <span className="bp-chap">{p.chapter}</span>
                <h4 className="bp-title">{p.title}</h4>
                {p.text.map((t, k) => (
                  <p key={k} className={k === 0 ? "bp-drop" : ""}>{t}</p>
                ))}
                <footer className="bp-num">{p.page}</footer>
              </article>
            );
          })}
        </div>
      </div>

      <div className="bp-nav">
        <button type="button" className="icon-btn" aria-label="Previous page" onClick={() => go(-1)}>←</button>
        <span className="mono">{String(top + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
        <button type="button" className="icon-btn" aria-label="Next page" onClick={() => go(1)}>→</button>
      </div>
    </div>
  );
}
