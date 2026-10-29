"use client";

import { useCallback, useEffect, useState } from "react";
import { ART } from "../data/career";
import { ArrowLeft, ArrowRight, X } from "./Icons";

/** Art section: a small gallery wall; click a piece to see it full screen. */
export default function ArtGallery() {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? null : (i + d + ART.length) % ART.length)), []);

  useEffect(() => {
    if (open === null) return;
    document.documentElement.classList.add("lightbox-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("lightbox-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const piece = open === null ? null : ART[open];

  return (
    <>
      <div className="art-wall">
        {ART.map((a, i) => (
          <figure key={a.src} className={`art-piece reveal art-${i}`} style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            <button type="button" className="art-frame" onClick={() => setOpen(i)} aria-label={`Open “${a.title}”`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.src} alt={`${a.title}, ${a.medium.toLowerCase()} by Ikrame`} width={a.w} height={a.h} loading="lazy" />
            </button>
            <figcaption>
              <span className="art-title">{a.title}</span>
              <span className="art-medium mono">{a.medium}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {piece && open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={piece.title} onClick={close}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={piece.src} src={piece.src} alt={`${piece.title}, ${piece.medium.toLowerCase()} by Ikrame`} />
            <div className="lightbox-bar">
              <div>
                <span className="art-title">{piece.title}</span>
                <span className="art-medium mono">{piece.medium} · {open + 1} / {ART.length}</span>
              </div>
              <div className="lightbox-actions">
                <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous artwork"><ArrowLeft /></button>
                <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next artwork"><ArrowRight /></button>
                <button type="button" className="icon-btn" onClick={close} aria-label="Close"><X /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
