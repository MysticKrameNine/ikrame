"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 120;

export default function FairyBackground() {
  const driftRef = useRef<HTMLDivElement>(null);
  const shootRef = useRef<HTMLDivElement>(null);

  // gentle parallax drift
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) return;
    const el = driftRef.current!;
    let t = 0, raf = 0;
    const loop = () => {
      t += 0.0022;
      el.style.transform = `translate3d(${Math.sin(t)*8}px, ${Math.cos(t*1.15)*6}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // shooting stars
  useEffect(() => {
    const root = shootRef.current!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) return;

    const shoot = () => {
      const el = document.createElement("span");
      const startX = Math.random() * 100; // vw
      const startY = Math.random() * 40;  // vh (upper half)
      el.style.position = "absolute";
      el.style.left = `${startX}vw`;
      el.style.top = `${startY}vh`;
      el.style.width = "2px";
      el.style.height = "2px";
      el.style.borderRadius = "2px";
      el.style.background = "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))";
      el.style.boxShadow = "0 0 8px rgba(255,255,255,.9)";
      el.style.transform = "translateZ(0) rotate(35deg)";
      el.style.opacity = "0.85";
      el.style.transition = "transform 1.2s cubic-bezier(.2,.8,.2,1), opacity 1.2s";
      root.appendChild(el);

      // next frame for transition
      requestAnimationFrame(() => {
        el.style.transform = "translate3d(18vw, 14vh, 0) rotate(35deg)";
        el.style.opacity = "0";
      });

      setTimeout(() => el.remove(), 1300);
    };

    const id = setInterval(shoot, 2200 + Math.random() * 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {/* deep night gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b16] via-[#0b1224] to-[#0a1325]" />

      {/* moon */}
      <div className="absolute right-[7%] top-[8%] w-32 h-32 rounded-full"
           style={{
             background: "radial-gradient(circle at 30% 30%, #fff8e6 0%, #f1e6c2 40%, #d8caa0 60%, rgba(255,255,255,0) 70%)",
             boxShadow: "0 0 60px rgba(255,245,210,.35)",
           }} />

      {/* drifting color glows */}
      <div ref={driftRef} className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[65%] h-80 w-80 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="absolute right-[14%] top-[40%] h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute left-[55%] top-[25%] h-64 w-64 rounded-full bg-emerald-300/12 blur-3xl" />
      </div>

      {/* starfield */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: STAR_COUNT }).map((_, i) => {
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const delay = Math.random() * 4;
          const size = 1 + Math.random() * 2;
          return (
            <span
              key={i}
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDelay: `${delay}s` }}
              className="absolute rounded-full bg-white/80 opacity-70 animate-twinkle"
            />
          );
        })}
      </div>

      {/* shooting stars mount */}
      <div ref={shootRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
}
