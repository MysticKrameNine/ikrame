"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Particle = {
  id: number; x: number; y: number; vx: number; vy: number;
  life: number; size: number; spin: number;
};

const MAX_PARTICLES = 120;   // a bit lighter
const CHAIN_LEN = 22;        // ribbon length
const SEG_DIST = 10;         // distance between ribbon links
const SPRING   = 0.28;       // how strongly links follow each other
const DAMP     = 0.85;       // damping = stability
const FIXED_ANGLE_DEG = -22; // 👈 constant tilt (incliné)

export default function MagicCursor() {
  // mouse + lightly-smoothed position (no wobble)
  const [mouse, setMouse] = useState({ x: -100, y: -100 });
  const [pos, setPos]     = useState({ x: -100, y: -100 });

  // flexible ribbon chain
  const chain = useRef(Array.from({ length: CHAIN_LEN }, () => ({ x: -100, y: -100, vx: 0, vy: 0 })));
  const parts = useRef<Particle[]>([]);
  const pid   = useRef(0);

  const rafFollow = useRef<number | null>(null);
  const rafTick   = useRef<number | null>(null);

  // activity tracking – run physics only when moving
  const lastMoveAt = useRef<number>(Date.now());
  const running    = useRef(false);

  const reduced = useMemo(
    () => typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  // capture mouse, spawn particles only on movement
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
      spawn(e.clientX, e.clientY, 3); // fewer particles per move
      lastMoveAt.current = Date.now();
      if (!running.current && !reduced) {
        running.current = true;
        rafTick.current = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // gentle positional smoothing (fixed-angle wand; no angle calc)
  useEffect(() => {
    if (reduced) { setPos(mouse); return; }
    const follow = () => {
      setPos(p => ({
        x: p.x + (mouse.x - p.x) * 0.25,   // slightly snappier but stable
        y: p.y + (mouse.y - p.y) * 0.25,
      }));
      rafFollow.current = requestAnimationFrame(follow);
    };
    rafFollow.current = requestAnimationFrame(follow);
    return () => { if (rafFollow.current) cancelAnimationFrame(rafFollow.current); };
  }, [mouse, reduced]);

  // physics loop (chain + particles) — pauses when idle
  const tick = () => {
    const idleFor = Date.now() - lastMoveAt.current;
    const isStill = idleFor > 240 && parts.current.length === 0; // stop sooner for stability
    if (isStill) {
      running.current = false;
      if (rafTick.current) cancelAnimationFrame(rafTick.current);
      return;
    }

    // chain head follows cursor directly (no oscillation)
    const head = chain.current[0];
    head.vx = (pos.x - head.x) * 0.55;
    head.vy = (pos.y - head.y) * 0.55;
    head.x += head.vx;
    head.y += head.vy;

    // each segment springs toward the previous one (damped)
    for (let i = 1; i < chain.current.length; i++) {
      const a = chain.current[i - 1];
      const b = chain.current[i];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      const diff = (dist - SEG_DIST) / dist;
      const fx = dx * diff * SPRING;
      const fy = dy * diff * SPRING;
      b.vx = (b.vx + fx) * DAMP;
      b.vy = (b.vy + fy) * DAMP;
      b.x += b.vx;
      b.y += b.vy;
    }

    // particles fade out
    parts.current = parts.current
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.02,
        life: p.life - 0.016,
        size: Math.max(0, p.size - 0.018),
        spin: p.spin + 2.5,
      }))
      .filter(p => p.life > 0);

    rafTick.current = requestAnimationFrame(tick);
  };

  function spawn(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.28 + Math.random() * 0.9;
      const size = 2.0 + Math.random() * 2.4;
      parts.current.push({
        id: pid.current++,
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.22,
        life: 1,
        size,
        spin: Math.random() * 360,
      });
      if (parts.current.length > MAX_PARTICLES) parts.current.shift();
    }
  }

  // fixed offset so the “handle” sits right under the cursor
  const OFFSET_X = -4;
  const OFFSET_Y = -22;

  return (
    <>
      {/* FLEXIBLE RIBBON (soft, stable) */}
      {chain.current.map((p, i) => {
        const t = 1 - i / CHAIN_LEN;
        const size = 9 * Math.pow(t, 0.9) + 1;
        const opacity = 0.10 + 0.55 * t;
        const hue = 46 + 60 * (1 - t); // warm gold → subtle teal
        return (
          <span
            key={i}
            style={{
              left: p.x, top: p.y, width: size, height: size, opacity,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, hsl(${hue} 90% 70%) 0%, hsla(${hue} 90% 60% / .8) 40%, transparent 70%)`,
              filter: "blur(0.5px)",
            }}
            className="fixed z-[9997] rounded-full pointer-events-none"
          />
        );
      })}

      {/* GLITTER (only while moving) */}
      {parts.current.map(p => (
        <span
          key={p.id}
          style={{
            left: p.x, top: p.y, opacity: p.life, width: p.size, height: p.size,
            transform: `translate(-50%, -50%) rotate(${p.spin}deg)`,
            background: "linear-gradient(45deg, #ffd36a, #ffb84a)",
            boxShadow: "0 0 10px rgba(255,190,60,.85), 0 0 16px rgba(255,170,40,.55)",
          }}
          className="fixed z-[9998] pointer-events-none"
        />
      ))}

      {/* WAND — fixed tilt (incliné), no dancing */}
      <div
        className="fixed z-[10000] pointer-events-none"
        style={{
          left: pos.x + OFFSET_X,
          top:  pos.y + OFFSET_Y,
          transform: `translate(-50%, -50%) rotate(${FIXED_ANGLE_DEG}deg)`, // 👈 fixed angle
          transformOrigin: "50% 50%",
        }}
      >
        {/* shaft */}
        <div className="relative" style={{ width: 4, height: 28 }}>
          <div className="absolute inset-0 rounded-full"
               style={{ background: "linear-gradient(180deg, #0b0b0b 0%, #2d2d2d 60%, #0b0b0b 100%)", boxShadow: "0 2px 6px rgba(0,0,0,.35)" }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-[2px]"
               style={{ background: "linear-gradient(180deg,#caa660,#a27828)", boxShadow:"0 0 6px rgba(202,166,96,.45)" }} />
        </div>

        {/* glowing star tip */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div
            className="relative"
            style={{
              width: 14, height: 14,
              clipPath: "polygon(50% 0%, 63% 38%, 100% 50%, 63% 62%, 50% 100%, 37% 62%, 0% 50%, 37% 38%)",
              background: "radial-gradient(circle at 50% 40%, #ffe6a0 0%, #ffd36a 55%, #ffb84a 100%)",
              boxShadow: "0 0 14px 6px rgba(255,210,110,.65)",
              animation: "spin 3.6s linear infinite",
            }}
          />
          <div className="absolute -inset-2 rounded-full animate-ping" style={{ border: "1px solid rgba(255,220,140,.5)" }} />
          <div className="absolute inset-0 rounded-full"
               style={{ background: "radial-gradient(circle, rgba(255,250,220,.9), rgba(255,220,140,.55) 60%, transparent 70%)", filter: "blur(1px)", animation: "pulse 2s ease-in-out infinite" }} />
        </div>
      </div>
    </>
  );
}
