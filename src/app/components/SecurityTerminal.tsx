"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "../data/career";

type Line = { kind: "cmd" | "out" | "ok" | "wip" | "smile"; text: string };

const SCRIPT: Line[] = [
  { kind: "cmd", text: "whoami" },
  { kind: "out", text: "ikrame — senior infrastructure engineer, security at heart" },
  { kind: "cmd", text: "cat credentials.txt" },
  { kind: "ok", text: "Engineering degree certified by the ANSSI (SecNumEdu)" },
  { kind: "ok", text: "Crisis simulation exercises with the French Cyber Command (COMCYBER)" },
  { kind: "ok", text: "SIEM: log collection, correlation & detection (ELK, Grafana)" },
  { kind: "wip", text: "OSCP — in progress" },
  { kind: "cmd", text: "cat languages.txt" },
  { kind: "out", text: LANGUAGES.map((l) => `${l.name} · ${l.level}`).join("   ") },
  { kind: "cmd", text: "uptime" },
  { kind: "smile", text: "always smiling :)" },
];

/** A terminal that types itself out the first time it scrolls into view. */
export default function SecurityTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0); // fully shown lines
  const [chars, setChars] = useState(0); // chars of the line being typed
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(SCRIPT.length);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setStarted(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started || shown >= SCRIPT.length) return;
    const line = SCRIPT[shown];
    if (line.kind !== "cmd") {
      const t = window.setTimeout(() => { setShown((s) => s + 1); setChars(0); }, 140);
      return () => window.clearTimeout(t);
    }
    if (chars < line.text.length) {
      const t = window.setTimeout(() => setChars((c) => c + 1), 38 + Math.random() * 40);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => { setShown((s) => s + 1); setChars(0); }, 260);
    return () => window.clearTimeout(t);
  }, [started, shown, chars]);

  const done = shown >= SCRIPT.length;
  const typing = !done && SCRIPT[shown]?.kind === "cmd" ? SCRIPT[shown] : null;

  return (
    <div className="sec-wrap">
      <div className="term reveal" ref={ref}>
        <div className="term-bar">
          <i /><i /><i />
          <span className="mono">ikrame@paris: ~/security</span>
        </div>
        <div className="term-body mono" aria-live="polite">
          {SCRIPT.slice(0, shown).map((l, i) => <TermLine key={i} l={l} />)}
          {typing && (
            <div className="t-line">
              <span className="t-prompt">❯</span> {typing.text.slice(0, chars)}
              <span className="t-caret" />
            </div>
          )}
          {done && (
            <div className="t-line">
              <span className="t-prompt">❯</span> <span className="t-caret" />
            </div>
          )}
        </div>
        <span className="term-scan" aria-hidden="true" />
      </div>


    </div>
  );
}

function TermLine({ l }: { l: Line }) {
  if (l.kind === "cmd") return <div className="t-line"><span className="t-prompt">❯</span> {l.text}</div>;
  const mark = l.kind === "ok" ? "✓" : l.kind === "wip" ? "◌" : l.kind === "smile" ? "☺" : "";
  return (
    <div className={`t-line t-${l.kind}`}>
      {mark ? <span className="t-mark">{mark}</span> : null}
      {l.text}
    </div>
  );
}
