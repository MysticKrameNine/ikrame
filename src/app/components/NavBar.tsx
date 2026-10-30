"use client";

import { useEffect, useState } from "react";
import { Compass, Gamepad } from "./Icons";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "security", label: "Security" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "services", label: "Services" },
  { id: "creative", label: "Art" },
  { id: "contact", label: "Contact" },
];

export default function NavBar() {
  const [current, setCurrent] = useState("home");
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("section[id]").forEach((s) => io.observe(s));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-inner">
        <a href="#home" className="nav-logo" onClick={() => setMenu(false)}>
          Ikrame B<span className="t-cyan">.</span>
        </a>

        <nav className={`nav-links${menu ? " is-open" : ""}`} aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} className={current === l.id ? "is-current" : ""} onClick={() => setMenu(false)}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-modes">
          <button type="button" className="mode-btn" onClick={() => { setMenu(false); window.dispatchEvent(new Event("ik:career")); }}>
            <Compass /> <span>Career mode</span>
          </button>
          <button type="button" className="mode-btn mode-game" onClick={() => { setMenu(false); window.dispatchEvent(new Event("ik:game")); }}>
            <Gamepad /> <span>Game mode</span>
          </button>
          <button type="button" className="icon-btn nav-burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
