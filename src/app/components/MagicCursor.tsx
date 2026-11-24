"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The original wand cursor (ribbon + golden glitter + glowing star tip), same look as before,
 * but animated by writing transforms straight to the DOM instead of re-rendering React every frame.
 * The loop only runs while the mouse moves or glitter is still falling, so an idle page costs nothing.
 */
const MAX_PARTICLES = 120;
const CHAIN_LEN = 22;
const SEG_DIST = 10;
const SPRING = 0.28;
const DAMP = 0.85;
const FIXED_ANGLE_DEG = -22;
const TIP_OFFSET_LOCAL = { x: 0, y: -24 };
const OFFSET_X = -4;
const OFFSET_Y = 4;

export default function MagicCursor() {
  const [fine, setFine] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const wandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ok = window.matchMedia("(pointer: fine)").matches;
    setFine(ok);
    if (ok) document.documentElement.classList.add("has-wand");
    return () => document.documentElement.classList.remove("has-wand");
  }, []);

  useEffect(() => {
    if (!fine) return;
    const layer = layerRef.current, wand = wandRef.current;
    if (!layer || !wand) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ang = (FIXED_ANGLE_DEG * Math.PI) / 180;
    const tipDx = TIP_OFFSET_LOCAL.x * Math.cos(ang) - TIP_OFFSET_LOCAL.y * Math.sin(ang);
    const tipDy = TIP_OFFSET_LOCAL.x * Math.sin(ang) + TIP_OFFSET_LOCAL.y * Math.cos(ang);

    // ribbon links
    const chain = Array.from({ length: CHAIN_LEN }, (_, i) => {
      const el = document.createElement("span");
      const t = 1 - i / CHAIN_LEN;
      const size = 9 * Math.pow(t, 0.9) + 1;
      const hue = 46 + 60 * (1 - t);
      el.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;opacity:${0.1 + 0.55 * t};border-radius:50%;pointer-events:none;z-index:9997;filter:blur(.5px);will-change:transform;background:radial-gradient(circle, hsl(${hue} 90% 70%) 0%, hsla(${hue} 90% 60% / .8) 40%, transparent 70%);transform:translate3d(-100px,-100px,0)`;
      layer.appendChild(el);
      return { el, x: -100, y: -100, vx: 0, vy: 0 };
    });

    // glitter pool
    const pool = Array.from({ length: MAX_PARTICLES }, () => {
      const el = document.createElement("span");
      el.style.cssText = "position:fixed;left:0;top:0;pointer-events:none;z-index:9998;display:none;will-change:transform,opacity;background:linear-gradient(45deg,#ffd36a,#ffb84a);box-shadow:0 0 10px rgba(255,190,60,.85),0 0 16px rgba(255,170,40,.55)";
      layer.appendChild(el);
      return { el, x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 0, spin: 0, live: false };
    });
    let next = 0;
    const spawn = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const p = pool[next];
        next = (next + 1) % MAX_PARTICLES;
        const a = Math.random() * Math.PI * 2;
        const sp = 0.28 + Math.random() * 0.9;
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp - 0.22;
        p.life = 1;
        p.size = 2 + Math.random() * 2.4;
        p.spin = Math.random() * 360;
        p.live = true;
        p.el.style.display = "block";
      }
    };

    let mx = -100, my = -100, px = -100, py = -100;
    let raf = 0, running = false, lastMove = 0;

    const tick = () => {
      // wand follows with light smoothing
      px += (mx - px) * (reduced ? 1 : 0.25);
      py += (my - py) * (reduced ? 1 : 0.25);
      wand.style.transform = `translate3d(${px + OFFSET_X}px, ${py + OFFSET_Y}px, 0) translate(-50%, -50%) rotate(${FIXED_ANGLE_DEG}deg)`;

      // ribbon
      const head = chain[0];
      head.vx = (px - head.x) * 0.55;
      head.vy = (py - head.y) * 0.55;
      head.x += head.vx; head.y += head.vy;
      for (let i = 1; i < CHAIN_LEN; i++) {
        const a = chain[i - 1], b = chain[i];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy) || 1;
        const diff = (dist - SEG_DIST) / dist;
        b.vx = (b.vx + dx * diff * SPRING) * DAMP;
        b.vy = (b.vy + dy * diff * SPRING) * DAMP;
        b.x += b.vx; b.y += b.vy;
      }
      for (const c of chain) c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;

      // glitter
      let alive = 0;
      for (const p of pool) {
        if (!p.live) continue;
        p.x += p.vx; p.y += p.vy; p.vy += 0.02;
        p.life -= 0.016;
        p.size = Math.max(0, p.size - 0.018);
        p.spin += 2.5;
        if (p.life <= 0) { p.live = false; p.el.style.display = "none"; continue; }
        alive++;
        p.el.style.width = p.el.style.height = p.size + "px";
        p.el.style.opacity = String(p.life);
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(${p.spin}deg)`;
      }

      const settled = Math.abs(mx - px) < 0.3 && Math.abs(my - py) < 0.3;
      if (alive === 0 && settled && performance.now() - lastMove > 400) { running = false; return; }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      lastMove = performance.now();
      if (!reduced) spawn(mx + OFFSET_X + tipDx, my + OFFSET_Y + tipDy, 3);
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      chain.forEach((c) => c.el.remove());
      pool.forEach((p) => p.el.remove());
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div className="wand-layer" aria-hidden="true" ref={layerRef}>
      {/* WAND — fixed tilt */}
      <div
        ref={wandRef}
        style={{
          position: "fixed", left: 0, top: 0, zIndex: 10000, pointerEvents: "none", willChange: "transform",
          transform: "translate3d(-100px, -100px, 0)", transformOrigin: "50% 50%",
        }}
      >
        <div style={{ position: "relative", width: 4, height: 28 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "linear-gradient(180deg, #0b0b0b 0%, #2d2d2d 60%, #0b0b0b 100%)", boxShadow: "0 2px 6px rgba(0,0,0,.35)" }} />
          <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: 2, background: "linear-gradient(180deg,#caa660,#a27828)", boxShadow: "0 0 6px rgba(202,166,96,.45)" }} />
        </div>
        <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
          <div
            style={{
              position: "relative", width: 14, height: 14,
              clipPath: "polygon(50% 0%, 63% 38%, 100% 50%, 63% 62%, 50% 100%, 37% 62%, 0% 50%, 37% 38%)",
              background: "radial-gradient(circle at 50% 40%, #ffe6a0 0%, #ffd36a 55%, #ffb84a 100%)",
              boxShadow: "0 0 14px 6px rgba(255,210,110,.65)",
              animation: "spin 3.6s linear infinite",
            }}
          />
          <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(255,220,140,.5)", animation: "ping 1s cubic-bezier(0,0,.2,1) infinite" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,250,220,.9), rgba(255,220,140,.55) 60%, transparent 70%)", filter: "blur(1px)", animation: "pulse 2s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}
