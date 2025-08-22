"use client";
import { useEffect, useRef, useState } from "react";

type Props = { lines: string[]; typingSpeed?: number; pauseBetween?: number; loop?: boolean; className?: string; };

export default function Typewriter({ lines, typingSpeed = 24, pauseBetween = 700, loop = true, className = "" }: Props) {
  const [text, setText] = useState(""); const [iLine, setILine] = useState(0); const [iChar, setIChar] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const line = lines[iLine] ?? "";
      if (iChar < line.length) { setText(p => p + line[iChar]); setIChar(iChar + 1); timer.current = window.setTimeout(tick, typingSpeed); }
      else if (iLine < lines.length - 1) { timer.current = window.setTimeout(() => { setText(p => p + "\n"); setILine(iLine + 1); setIChar(0); }, pauseBetween); }
      else if (loop) { timer.current = window.setTimeout(() => { setText(""); setILine(0); setIChar(0); }, pauseBetween + 400); }
    };
    timer.current = window.setTimeout(tick, typingSpeed);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [iLine, iChar, lines, typingSpeed, pauseBetween, loop]);

  return (
    <pre className={`whitespace-pre-wrap ${className}`}>
      {text}<span className="inline-block w-[0.6ch] align-baseline caret-blink">|</span>
    </pre>
  );
}
