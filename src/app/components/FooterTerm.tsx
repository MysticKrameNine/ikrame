"use client";

/** The only hint that a terminal exists. */
export default function FooterTerm() {
  return (
    <button type="button" className="footer-term" onClick={() => window.dispatchEvent(new Event("ik:term"))}>
      psst… press <kbd>`</kbd>
    </button>
  );
}
