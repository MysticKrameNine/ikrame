"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMAIL, GITHUB, LANGUAGES, LINKEDIN, RESUME_URL } from "../data/career";

/**
 * A hidden terminal. Nothing on the page until someone presses ` (backtick) or clicks the tiny >_ in the menu.
 * It types an intro by itself, then visitors can run a few commands of their own.
 */
type Kind = "cmd" | "out" | "ok" | "wip" | "smile" | "err" | "link";
type Line = { kind: Kind; text: string; href?: string };

const INTRO: Line[] = [
  { kind: "cmd", text: "whoami" },
  { kind: "out", text: "ikrame — senior infrastructure engineer, security at heart" },
  { kind: "cmd", text: "cat credentials.txt" },
  { kind: "ok", text: "Engineering degree certified by the ANSSI (SecNumEdu)" },
  { kind: "ok", text: "Crisis simulation exercises with the French Cyber Command (COMCYBER)" },
  { kind: "ok", text: "SIEM: log collection, correlation & detection (ELK, Grafana)" },
  { kind: "wip", text: "OSCP — in progress" },
  { kind: "cmd", text: "uptime" },
  { kind: "smile", text: "always smiling :)" },
  { kind: "out", text: "type `help` to look around" },
];

const run = (raw: string): Line[] | "clear" | "exit" => {
  const cmd = raw.trim().toLowerCase();
  switch (cmd.split(/\s+/)[0]) {
    case "":
      return [];
    case "help":
      return [{ kind: "out", text: "whoami · credentials · languages · uptime · contact · resume · github · clear · exit" }];
    case "whoami":
      return [{ kind: "out", text: "ikrame — senior infrastructure engineer, security at heart" }];
    case "credentials":
    case "cat":
      return INTRO.slice(3, 7);
    case "languages":
      return [{ kind: "out", text: LANGUAGES.map((l) => `${l.name} · ${l.level}`).join("   ") }];
    case "uptime":
      return [{ kind: "smile", text: "always smiling :)" }];
    case "contact":
      return [
        { kind: "link", text: EMAIL, href: `mailto:${EMAIL}` },
        { kind: "link", text: "linkedin", href: LINKEDIN },
      ];
    case "resume":
      return [{ kind: "link", text: "open resume →", href: RESUME_URL }];
    case "github":
      return [{ kind: "link", text: GITHUB.replace("https://", ""), href: GITHUB }];
    case "sudo":
      return [{ kind: "err", text: "nice try ;) this incident will be reported" }];
    case "ls":
      return [{ kind: "out", text: "credentials.txt  languages.txt  resume.pdf  secrets/" }];
    case "clear":
      return "clear";
    case "exit":
    case "quit":
      return "exit";
    default:
      return [{ kind: "err", text: `command not found: ${cmd.split(/\s+/)[0]} — try \`help\`` }];
  }
};

export default function HiddenTerminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState<{ text: string; n: number } | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const played = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  // open with ` (or ~), from the menu button, or from the footer hint; close with Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.key === "`" || e.key === "~") && !inField) { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ik:term", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("ik:term", onOpen); };
  }, []);

  // play the intro the first time it opens
  useEffect(() => {
    if (!open || played.current) return;
    played.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLines(INTRO); setIntroDone(true); return;
    }
    let i = 0, n = 0, timer = 0;
    const step = () => {
      if (i >= INTRO.length) { setTyping(null); setIntroDone(true); return; }
      const l = INTRO[i];
      if (l.kind !== "cmd") {
        setLines((ls) => [...ls, l]); i++;
        timer = window.setTimeout(step, 120);
        return;
      }
      if (n < l.text.length) {
        n++; setTyping({ text: l.text, n });
        timer = window.setTimeout(step, 34 + Math.random() * 40);
      } else {
        setTyping(null); setLines((ls) => [...ls, l]); i++; n = 0;
        timer = window.setTimeout(step, 220);
      }
    };
    timer = window.setTimeout(step, 250);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open && introDone) inputRef.current?.focus();
  }, [open, introDone]);

  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [lines, typing]);

  useEffect(() => {
    document.documentElement.classList.toggle("term-open", open);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = run(input);
    const echo: Line = { kind: "cmd", text: input };
    setInput("");
    if (res === "exit") { close(); return; }
    if (res === "clear") { setLines([]); return; }
    setLines((ls) => [...ls, echo, ...res]);
  };

  if (!open) return null;

  return (
    <div className="hterm-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="term hterm" role="dialog" aria-label="Terminal" onMouseDown={() => introDone && inputRef.current?.focus()}>
        <div className="term-bar">
          <button type="button" className="hterm-dot" aria-label="Close terminal" onClick={close} />
          <i /><i />
          <span className="mono">ikrame@ikrame.space: ~</span>
          <span className="hterm-esc mono">esc</span>
        </div>
        <div className="term-body mono" ref={bodyRef} aria-live="polite">
          {lines.map((l, i) => <TermLine key={i} l={l} />)}
          {typing && (
            <div className="t-line">
              <span className="t-prompt">❯</span> {typing.text.slice(0, typing.n)}
              <span className="t-caret" />
            </div>
          )}
          {introDone && (
            <form className="t-line hterm-input" onSubmit={submit}>
              <span className="t-prompt">❯</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                aria-label="Command"
              />
            </form>
          )}
        </div>
        <span className="term-scan" aria-hidden="true" />
      </div>
    </div>
  );
}

function TermLine({ l }: { l: Line }) {
  if (l.kind === "cmd") return <div className="t-line"><span className="t-prompt">❯</span> {l.text}</div>;
  if (l.kind === "link") return <div className="t-line t-out"><a href={l.href} target="_blank" rel="noreferrer" className="hterm-link">{l.text}</a></div>;
  const mark = l.kind === "ok" ? "✓" : l.kind === "wip" ? "◌" : l.kind === "smile" ? "☺" : l.kind === "err" ? "!" : "";
  return (
    <div className={`t-line t-${l.kind}`}>
      {mark ? <span className="t-mark">{mark}</span> : null}
      {l.text}
    </div>
  );
}
