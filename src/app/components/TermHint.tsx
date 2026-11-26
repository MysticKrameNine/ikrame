"use client";

import { useEffect, useState } from "react";

/**
 * A small floating chip that invites visitors to the hidden terminal.
 * Shows up once you scroll past the hero, and disappears for good once the terminal has been opened.
 */
const KEY = "ik-term-seen";

export default function TermHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(KEY) === "1"; } catch {}
    if (seen) return;
    let timer = 0;
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.6) {
        window.removeEventListener("scroll", onScroll);
        timer = window.setTimeout(() => setShow(true), 600);
      }
    };
    const onOpen = () => {
      setShow(false);
      try { localStorage.setItem(KEY, "1"); } catch {}
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("ik:term", onOpen);
    const onKey = (e: KeyboardEvent) => { if (e.key === "`" || e.key === "~") onOpen(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("ik:term", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!show) return null;
  return (
    <button type="button" className="term-hint mono" onClick={() => window.dispatchEvent(new Event("ik:term"))} aria-label="Open the terminal">
      <span className="term-hint-prompt">&gt;_</span>
      <span className="term-hint-text">there&apos;s a terminal in here</span>
      <span className="term-hint-key"><kbd>`</kbd></span>
      <span className="term-hint-caret" aria-hidden="true" />
    </button>
  );
}
