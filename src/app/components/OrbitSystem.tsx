"use client";

import { useEffect, useRef } from "react";
import { ORBIT_WORDS } from "../data/career";

/**
 * The moon, top-right of the hero: a real 3D sphere (per-pixel lighting, slowly turning,
 * craters and maria), with keywords on tilted orbits that pass in front of and behind it.
 * The whole system tilts toward the cursor.
 */

const TEX_W = 256;
const TEX_H = 128;
const RES = 200; // moon render resolution (px)

function makeMoonTexture(): Float32Array {
  const tex = new Float32Array(TEX_W * TEX_H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < tex.length; i++) tex[i] = 0.86 + rnd() * 0.04;
  const blob = (cx: number, cy: number, r: number, depth: number, rim: number) => {
    for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) {
      if (y < 0 || y >= TEX_H) continue;
      const stretch = 1 / Math.max(0.2, Math.cos(((y / TEX_H) - 0.5) * Math.PI));
      for (let dx = Math.floor(-r * stretch - 2); dx <= r * stretch + 2; dx++) {
        const x = (((Math.round(cx + dx)) % TEX_W) + TEX_W) % TEX_W;
        const d = Math.hypot(dx / stretch, y - cy) / r;
        const i = y * TEX_W + x;
        if (d < 1) tex[i] -= depth * (1 - d * d * 0.6);
        else if (d < 1.25 && rim) tex[i] += rim * (1 - (d - 1) / 0.25);
      }
    }
  };
  // maria (large dark plains)
  const maria: [number, number, number][] = [
    [60, 48, 16], [82, 40, 12], [96, 58, 14], [70, 70, 10], [120, 50, 9], [40, 62, 8], [180, 70, 11], [200, 52, 8],
  ];
  for (const [x, y, r] of maria) blob(x, y, r, 0.2, 0);
  // craters
  for (let k = 0; k < 140; k++) {
    const r = 1.2 + Math.pow(rnd(), 3) * 7;
    blob(rnd() * TEX_W, 14 + rnd() * (TEX_H - 28), r, 0.1 + rnd() * 0.08, 0.06);
  }
  // one bright ray crater
  blob(150, 92, 4, -0.08, 0.1);
  return tex;
}

type Word = { text: string; ring: number; angle: number };

export default function OrbitSystem() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tex = makeMoonTexture();
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = moonCanvas.height = RES;
    const mctx = moonCanvas.getContext("2d")!;
    const img = mctx.createImageData(RES, RES);

    // precompute sphere normals
    const normals: number[] = [];
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const nx = (x + 0.5) / (RES / 2) - 1;
        const ny = (y + 0.5) / (RES / 2) - 1;
        const r2 = nx * nx + ny * ny;
        if (r2 <= 1) normals.push(y * RES + x, nx, ny, Math.sqrt(1 - r2));
      }
    }
    const L = (() => {
      const v = [-0.55, -0.35, 0.76];
      const m = Math.hypot(v[0], v[1], v[2]);
      return v.map((c) => c / m);
    })();

    const renderMoon = (spin: number, tiltX: number) => {
      const d = img.data;
      const cs = Math.cos(spin), sn = Math.sin(spin);
      const ct = Math.cos(tiltX), st = Math.sin(tiltX);
      for (let k = 0; k < normals.length; k += 4) {
        const idx = normals[k];
        const nx = normals[k + 1], ny = normals[k + 2], nz = normals[k + 3];
        // lighting in view space
        let lum = nx * L[0] + ny * L[1] + nz * L[2];
        lum = Math.max(0, lum);
        // texture lookup in body space (tilt, then spin around Y)
        const y1 = ny * ct - nz * st;
        const z1 = ny * st + nz * ct;
        const x2 = nx * cs + z1 * sn;
        const z2 = -nx * sn + z1 * cs;
        const lon = Math.atan2(x2, z2);
        const lat = Math.asin(Math.max(-1, Math.min(1, -y1)));
        const u = Math.floor(((lon / (Math.PI * 2) + 0.5) * TEX_W)) % TEX_W;
        const v = Math.min(TEX_H - 1, Math.floor((0.5 - lat / Math.PI) * TEX_H));
        const albedo = tex[v * TEX_W + u];
        const rim = Math.pow(1 - nz, 3) * 0.25; // earthshine on the rim
        const s = Math.min(1.08, 0.07 + albedo * (lum * 1.02) + rim * 0.5);
        const o = idx * 4;
        d[o] = Math.min(255, 255 * s);
        d[o + 1] = Math.min(255, 247 * s);
        d[o + 2] = Math.min(255, 226 * s);
        d[o + 3] = 255;
      }
      mctx.putImageData(img, 0, 0);
    };

    // orbits
    const rings = [
      { r: 1.5, incl: 0.42, node: -0.35, speed: 0.22, color: "#67e8f9" },
      { r: 1.85, incl: -0.28, node: 0.5, speed: 0.15, color: "#6ee7b7" },
      { r: 2.2, incl: 0.16, node: 0.1, speed: 0.1, color: "#60a5fa" },
    ];
    // spread the words evenly on each ring so they never bunch up
    const words: Word[] = ORBIT_WORDS.map((text, i) => {
      const ring = i % rings.length;
      const onRing = Math.ceil((ORBIT_WORDS.length - ring) / rings.length);
      const j = Math.floor(i / rings.length);
      return { text, ring, angle: (j / onRing) * Math.PI * 2 + ring * 1.1 };
    });
    const dust = Array.from({ length: 160 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 1.25 + Math.random() * 0.25,
      y: (Math.random() - 0.5) * 0.04,
      tw: Math.random() * Math.PI * 2,
    }));

    let size = 480, dpr = 1, raf = 0, t = 0;
    const rot = { x: 0.12, y: 0 };
    const target = { x: 0.12, y: 0 };
    let boost = 1;

    const resize = () => {
      size = wrap.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // 3D → screen. Moon radius = 1 unit.
    const project = (x: number, y: number, z: number) => {
      // global tilt toward the cursor
      const cy = Math.cos(rot.y), sy = Math.sin(rot.y);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cx = Math.cos(rot.x), sx = Math.sin(rot.x);
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const unit = size * 0.15;
      const persp = 6 / (6 - z2); // z2 > 0 = toward viewer
      return { x: size / 2 + x1 * unit * persp, y: size / 2 + y2 * unit * persp, z: z2, s: persp };
    };
    const ringPoint = (ring: (typeof rings)[number], a: number, r = ring.r, dy = 0) => {
      // circle in XZ plane, inclined around X, then rotated around Y (node)
      let x = Math.cos(a) * r;
      let y = dy;
      let z = Math.sin(a) * r;
      const ci = Math.cos(ring.incl), si = Math.sin(ring.incl);
      const y1 = y * ci - z * si;
      const z1 = y * si + z * ci;
      y = y1;
      z = z1;
      const cn = Math.cos(ring.node), sn = Math.sin(ring.node);
      const x2 = x * cn - y * sn;
      const y2 = x * sn + y * cn;
      x = x2;
      y = y2;
      return project(x, y, z);
    };

    const drawRing = (ring: (typeof rings)[number], front: boolean) => {
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = front ? 0.5 : 0.18;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= 120; i++) {
        const p = ringPoint(ring, (i / 120) * Math.PI * 2);
        if (p.z >= 0 === front) {
          if (!pen) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
          pen = true;
        } else pen = false;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    const drawWord = (w: Word) => {
      const ring = rings[w.ring];
      const p = ringPoint(ring, w.angle);
      const depth = (p.z + 2.4) / 4.8; // 0 far .. 1 near
      const fs = Math.max(10, size * 0.026 * p.s);
      ctx.font = `600 ${fs}px "Sora", "DM Sans", system-ui, sans-serif`;
      const tw = ctx.measureText(w.text).width;
      ctx.globalAlpha = 0.35 + depth * 0.65;
      // glowing node
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10 * p.s);
      g.addColorStop(0, ring.color);
      g.addColorStop(1, ring.color + "00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10 * p.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2 * p.s, 0, Math.PI * 2);
      ctx.fill();
      // pill label
      const px = p.x + 9 * p.s;
      const py = p.y - fs * 0.75;
      ctx.fillStyle = "rgba(11,16,32,0.72)";
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px, py, tw + fs * 0.9, fs * 1.5, fs * 0.75);
      ctx.fill();
      ctx.globalAlpha *= 0.6;
      ctx.stroke();
      ctx.globalAlpha = 0.35 + depth * 0.65;
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(w.text, px + fs * 0.45, py + fs * 1.08);
      ctx.globalAlpha = 1;
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      rot.x += (target.x - rot.x) * 0.05;
      rot.y += (target.y - rot.y) * 0.05;
      boost += ((wrap.matches(":hover") ? 2.6 : 1) - boost) * 0.05;
      for (const w of words) w.angle += rings[w.ring].speed * dt * boost;
      for (const d of dust) d.a += 0.18 * dt * boost;

      ctx.clearRect(0, 0, size, size);
      const c = project(0, 0, 0);
      const moonR = size * 0.15 * c.s;

      // halo
      const halo = ctx.createRadialGradient(c.x, c.y, moonR * 0.9, c.x, c.y, moonR * 2.6);
      halo.addColorStop(0, "rgba(255,245,210,0.30)");
      halo.addColorStop(0.35, "rgba(103,232,249,0.08)");
      halo.addColorStop(1, "rgba(103,232,249,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(c.x, c.y, moonR * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // dust ring around the moon's equator
      const dustRing = { r: 1.3, incl: 0.95, node: -0.5, speed: 0, color: "#e2e8f0" };
      const drawDust = (front: boolean) => {
        for (const d of dust) {
          const p = ringPoint(dustRing, d.a, d.r, d.y);
          if (p.z >= 0 !== front) continue;
          ctx.globalAlpha = (front ? 0.65 : 0.25) * (0.5 + 0.5 * Math.sin(t * 2 + d.tw));
          ctx.fillStyle = "#fff8e6";
          ctx.fillRect(p.x, p.y, 1.4 * p.s, 1.4 * p.s);
        }
        ctx.globalAlpha = 1;
      };

      for (const r of rings) drawRing(r, false);
      const behind = words.filter((w) => ringPoint(rings[w.ring], w.angle).z < 0);
      const before = words.filter((w) => ringPoint(rings[w.ring], w.angle).z >= 0);
      behind.sort((a, b) => ringPoint(rings[a.ring], a.angle).z - ringPoint(rings[b.ring], b.angle).z).forEach(drawWord);
      drawDust(false);

      renderMoon(t * 0.12 + rot.y, rot.x * 0.6 + 0.25);
      ctx.drawImage(moonCanvas, c.x - moonR, c.y - moonR, moonR * 2, moonR * 2);

      drawDust(true);
      for (const r of rings) drawRing(r, true);
      before.sort((a, b) => ringPoint(rings[a.ring], a.angle).z - ringPoint(rings[b.ring], b.angle).z).forEach(drawWord);

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      target.y = nx * 0.7;
      target.x = 0.12 + ny * 0.5;
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) frame(performance.now());
    });
    ro.observe(wrap);
    resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(wrap);
    frame(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} className="moon-orbit" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
