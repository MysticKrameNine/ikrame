"use client";

import { useEffect, useRef } from "react";

/**
 * A realistic night sky behind the whole site, generated once in the browser (no images):
 * a Milky Way band with dark dust lanes, soft nebula clouds (teal, violet, rose), thousands of
 * tiny stars in natural star colours, plus a few bright twinkling stars and the odd shooting star.
 * The painted sky sits on its own canvas and drifts very slowly with the scroll (parallax).
 */

type Star = { x: number; y: number; r: number; depth: number; tw: number; sp: number; color: string; spikes: boolean };
type Shooting = { x: number; y: number; vx: number; vy: number; life: number };

// ---------- tiny seeded value noise + fbm ----------
function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = new Float32Array(256);
  for (let i = 0; i < 256; i++) val[i] = rnd();
  const fade = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = val[perm[(xi & 255) + perm[yi & 255]]];
    const b = val[perm[((xi + 1) & 255) + perm[yi & 255]]];
    const c = val[perm[(xi & 255) + perm[(yi + 1) & 255]]];
    const d = val[perm[((xi + 1) & 255) + perm[(yi + 1) & 255]]];
    const u = fade(xf), v = fade(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x: number, y: number, oct = 5) => {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += noise(x * f, y * f) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  };
}

const STAR_COLORS = ["#cfe0ff", "#e2ecff", "#f1f5f9", "#ffffff", "#a5f3fc", "#dbeafe", "#f8fafc", "#bfdbfe"];

/** Paints the deep sky (Milky Way + nebulae + faint star dust) into a canvas of the given size. */
function paintSky(W: number, H: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const g = out.getContext("2d")!;

  // 1. low-res gas & dust, scaled up smoothly
  const S = W > 1600 ? 4 : 3;
  const w = Math.ceil(W / S), h = Math.ceil(H / S);
  const lo = document.createElement("canvas");
  lo.width = w;
  lo.height = h;
  const lg = lo.getContext("2d")!;
  const img = lg.createImageData(w, h);
  const fbm = makeNoise(7);
  const fbm2 = makeNoise(42);
  const asp = W / H;
  // the Milky Way crosses the sky diagonally
  const ax = -0.1, ay = 0.92, bx = 1.1, by = 0.12;
  const lx = bx - ax, ly = by - ay;
  const ll = Math.hypot(lx * asp, ly);
  const nebulae = [
    { x: 0.8, y: 0.22, r: 0.34, c: [40, 150, 190] }, // soft teal glow
    { x: 0.18, y: 0.66, r: 0.38, c: [30, 80, 170] }, // deep blue glow
    { x: 0.55, y: 0.45, r: 0.4, c: [30, 110, 160] }, // blue-teal haze
  ];
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const u = i / w, v = j / h;
      // base: very deep blue, slightly lighter towards the bottom
      let r = 9 + v * 3, gg = 14 + v * 5, b = 30 + v * 10; // navy #0b1020 → slightly lighter
      // distance to the galactic plane
      const t = ((u - ax) * asp * lx * asp + (v - ay) * ly) / (ll * ll);
      const px = ax + lx * t, py = ay + ly * t;
      const d = Math.hypot((u - px) * asp, v - py);
      const along = Math.min(1, Math.max(0, t));
      const width = 0.16 + 0.06 * Math.sin(along * 5.0);
      const band = Math.exp(-(d * d) / (2 * width * width));
      const n = fbm(u * 4 * asp, v * 4);
      const fine = fbm2(u * 14 * asp, v * 14, 4);
      let dens = band * (0.45 + 0.75 * n) * (0.7 + 0.5 * fine);
      // dark dust lanes along the middle of the band
      const dust = fbm2(u * 6 * asp + 3, v * 6, 5);
      const lane = Math.exp(-(d * d) / (2 * (width * 0.35) ** 2));
      dens *= 1 - Math.min(1, Math.max(0, (dust - 0.45) * 4)) * 0.85 * lane;
      // a brighter, warmer core
      const core = Math.exp(-((along - 0.58) ** 2) / 0.02) * band;
      // a faint, cool Milky Way (blue-white, no warm core)
      r += (dens * 110 + core * 20) * 0.28;
      gg += (dens * 140 + core * 30) * 0.28;
      b += (dens * 200 + core * 45) * 0.28;
      // nebulae
      for (const nb of nebulae) {
        const dd = Math.hypot((u - nb.x) * asp, v - nb.y) / nb.r;
        if (dd > 1.6) continue;
        const fall = Math.exp(-dd * dd * 1.8);
        const wisp = fbm(u * 5 * asp + nb.x * 10, v * 5 + nb.y * 10, 6);
        const k = fall * Math.max(0, wisp - 0.42) * 0.9;
        r += nb.c[0] * k;
        gg += nb.c[1] * k;
        b += nb.c[2] * k;
      }
      // gentle tone mapping so bright areas stay soft
      const tm = (x: number) => 235 * (1 - Math.exp(-x / 210));
      const o = (j * w + i) * 4;
      img.data[o] = tm(r);
      img.data[o + 1] = tm(gg);
      img.data[o + 2] = tm(b);
      img.data[o + 3] = 255;
    }
  }
  lg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.filter = "blur(2px)";
  g.drawImage(lo, 0, 0, W, H);
  g.filter = "none";

  // 2. star dust: thousands of tiny stars, denser inside the Milky Way
  const count = Math.floor((W * H) / 420);
  for (let k = 0; k < count; k++) {
    const u = Math.random(), v = Math.random();
    const t = ((u - ax) * asp * lx * asp + (v - ay) * ly) / (ll * ll);
    const d = Math.hypot((u - (ax + lx * t)) * asp, v - (ay + ly * t));
    const inBand = Math.exp(-(d * d) / 0.02);
    if (Math.random() > 0.25 + 0.75 * inBand) continue;
    const big = Math.random();
    const rad = big < 0.94 ? 0.35 + Math.random() * 0.45 : 0.8 + Math.random() * 0.7;
    g.globalAlpha = 0.35 + Math.random() * 0.6;
    g.fillStyle = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    g.beginPath();
    g.arc(u * W, v * H, rad, 0, Math.PI * 2);
    g.fill();
  }
  // a few soft star clusters
  for (let c = 0; c < 6; c++) {
    const cx = Math.random() * W, cy = Math.random() * H;
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, rr = Math.abs((Math.random() + Math.random() - 1) * 40);
      g.globalAlpha = 0.5 + Math.random() * 0.5;
      g.fillStyle = STAR_COLORS[Math.floor(Math.random() * 4)];
      g.beginPath();
      g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.4 + Math.random() * 0.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  return out;
}

export default function CosmosBackground() {
  const skyRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const skyCanvas = skyRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !skyCanvas) return;
    const ctx = canvas.getContext("2d");
    const sctx = skyCanvas.getContext("2d");
    if (!ctx || !sctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, raf = 0, t = 0, nextShoot = 3;
    let stars: Star[] = [];
    const shooting: Shooting[] = [];
    let paintTimer = 0;
    // the Earth, rising from the bottom of the screen as you scroll down the page
    let earth: HTMLCanvasElement | null = null;
    const R = () => Math.max(w, h) * 2.4;
    const paintEarth = () => {
      const RR = R();
      const EH = Math.ceil(h * 0.85);
      const S = 2.5;
      const tw = Math.ceil(w / S), th = Math.ceil(EH / S);
      const lo = document.createElement("canvas");
      lo.width = tw;
      lo.height = th;
      const lg = lo.getContext("2d")!;
      const img = lg.createImageData(tw, th);
      const land = makeNoise(11), cloud = makeNoise(23), detail = makeNoise(5);
      for (let j = 0; j < th; j++) {
        for (let i = 0; i < tw; i++) {
          const X = (i / tw) * w, Y = (j / th) * EH;
          const dx = X - w / 2, dy = RR - Y;
          const dist = Math.hypot(dx, dy);
          const o = (j * tw + i) * 4;
          if (dist > RR) { img.data[o + 3] = 0; continue; }
          const depth = RR - dist;
          const u = (Math.atan2(dx, dy) * RR) / 420;
          const v = Math.pow(depth / 420, 0.62) * 1.6;
          const ln = land(u * 1.3 + 7, v * 1.3 + 2, 6);
          const isLand = ln > 0.56;
          let r: number, g: number, b: number;
          if (isLand) {
            const dd = detail(u * 6, v * 6, 4);
            const dry = Math.min(1, Math.max(0, (ln - 0.56) * 5));
            r = 52 + 90 * dry * dd + 20 * dd;
            g = 92 + 40 * dd - 10 * dry;
            b = 48 + 20 * dd;
          } else {
            const shallow = Math.max(0, 1 - (0.56 - ln) * 9);
            r = 10 + 25 * shallow;
            g = 52 + 70 * shallow;
            b = 120 + 70 * shallow;
          }
          const c1 = cloud(u * 2.2 + Math.sin(v * 3) * 0.4, v * 3.2, 6);
          const cl = Math.min(1, Math.max(0, (c1 - 0.5) * 2.6));
          r += (245 - r) * cl;
          g += (248 - g) * cl;
          b += (255 - b) * cl;
          const day = Math.min(1, Math.max(0.12, 1.15 - (X / w) * 0.95));
          r *= day; g *= day; b *= day;
          const haze = Math.exp(-depth / (h * 0.05));
          r += (150 - r) * haze * 0.75;
          g += (200 - g) * haze * 0.75;
          b += (255 - b) * haze * 0.75;
          img.data[o] = r;
          img.data[o + 1] = g;
          img.data[o + 2] = b;
          img.data[o + 3] = 255;
        }
      }
      lg.putImageData(img, 0, 0);
      const ec = document.createElement("canvas");
      ec.width = Math.ceil(w);
      ec.height = EH;
      const eg = ec.getContext("2d")!;
      eg.imageSmoothingEnabled = true;
      eg.imageSmoothingQuality = "high";
      eg.filter = "blur(0.6px)";
      eg.drawImage(lo, 0, 0, w, EH);
      earth = ec;
    };
    const ease = (x: number) => x * x * (3 - 2 * x);
    let earthK = 0;
    const drawEarth = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - h);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      const k = ease(Math.min(1, Math.max(0, (p - 0.36) / 0.64)));
      earthK = k;
      const top = h + 40 - k * (h * 0.68 + 40);
      if (top > h + 30 || !earth) return;
      const RR = R();
      const cx = w * 0.5, cy = top + RR;
      const atm = ctx.createRadialGradient(cx, cy, RR * 0.998, cx, cy, RR + h * 0.14);
      atm.addColorStop(0, "rgba(140,205,255,0.85)");
      atm.addColorStop(0.1, "rgba(100,170,255,0.38)");
      atm.addColorStop(0.4, "rgba(80,130,240,0.1)");
      atm.addColorStop(1, "rgba(60,100,220,0)");
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, RR + h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(earth, 0, top, w, earth.height);
      if (top + earth.height < h) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, RR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "#0b1c38";
        ctx.fillRect(0, top + earth.height - 1, w, h - top - earth.height + 2);
        ctx.restore();
      }
      const veil = ctx.createLinearGradient(0, top, 0, h);
      veil.addColorStop(0, "rgba(5,7,20,0.05)");
      veil.addColorStop(0.35, "rgba(5,7,20,0.35)");
      veil.addColorStop(1, "rgba(5,7,20,0.55)");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, RR, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = veil;
      ctx.fillRect(0, top, w, h - top);
      ctx.restore();
      ctx.strokeStyle = "rgba(190,230,255,0.9)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, RR, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
      const dawn = Math.max(0, (p - 0.78) / 0.22);
      if (dawn > 0) {
        const sa = -0.13;
        const sx = cx + RR * Math.sin(sa), sy = cy - RR * Math.cos(sa);
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.5);
        sg.addColorStop(0, `rgba(255,244,220,${dawn})`);
        sg.addColorStop(0.05, `rgba(255,205,150,${0.55 * dawn})`);
        sg.addColorStop(0.3, `rgba(255,150,130,${0.14 * dawn})`);
        sg.addColorStop(1, "rgba(255,150,130,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, w * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,215,160,${0.85 * dawn})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(cx, cy, RR + 0.5, Math.PI * 1.5 + sa - 0.16, Math.PI * 1.5 + sa + 0.16);
        ctx.stroke();
      }
    };

    const PAR = 0.035; // how much the painted sky drifts with the scroll

    const paint = () => {
      // the sky is a little taller than the screen so it can drift with the scroll
      const W = Math.floor(w * dpr), H = Math.floor(h * 1.25 * dpr);
      const sky = paintSky(W, H);
      skyCanvas.width = W;
      skyCanvas.height = H;
      skyCanvas.style.width = w + "px";
      skyCanvas.style.height = h * 1.25 + "px";
      sctx.drawImage(sky, 0, 0);
      paintEarth();
      skyCanvas.classList.add("is-ready");
      onScroll();
    };

    const resize = () => {
      const nw = window.innerWidth, nh = window.innerHeight;
      const big = Math.abs(nw - w) > 80 || nh > h * 1.15 || nh < h * 0.75;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = nw;
      h = nh;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // a few bright stars that twinkle (some with diffraction spikes)
      const count = Math.min(70, Math.floor((w * h) / 22000));
      stars = Array.from({ length: count }, () => {
        const roll = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: roll < 0.12 ? 1.4 + Math.random() * 0.9 : 0.6 + Math.random() * 0.7,
          depth: 0.06 + Math.random() * 0.2,
          tw: Math.random() * Math.PI * 2,
          sp: 0.3 + Math.random() * 1.2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          spikes: roll < 0.12,
        };
      });
      if (big) {
        window.clearTimeout(paintTimer);
        paintTimer = window.setTimeout(paint, 120);
      }
    };

    const onScroll = () => {
      const max = h * 0.25;
      const off = Math.min(max, window.scrollY * PAR);
      skyCanvas.style.transform = `translate3d(0, ${-off}px, 0)`;
      if (skyCanvas.classList.contains("is-ready")) skyCanvas.style.opacity = String(1 - 0.4 * earthK);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      const sy = window.scrollY;
      for (const s of stars) {
        let y = (s.y - sy * s.depth) % h;
        if (y < 0) y += h;
        const a = reduced ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(t * s.sp * 0.6 + s.tw));
        // soft halo
        const halo = ctx.createRadialGradient(s.x, y, 0, s.x, y, s.r * 5);
        halo.addColorStop(0, s.color);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        if (s.spikes) {
          const L = s.r * 9 * (0.7 + 0.3 * a);
          ctx.globalAlpha = a * 0.5;
          const gh = ctx.createLinearGradient(s.x - L, y, s.x + L, y);
          gh.addColorStop(0, "rgba(255,255,255,0)");
          gh.addColorStop(0.5, s.color);
          gh.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = gh;
          ctx.fillRect(s.x - L, y - 0.5, L * 2, 1);
          const gv = ctx.createLinearGradient(s.x, y - L, s.x, y + L);
          gv.addColorStop(0, "rgba(255,255,255,0)");
          gv.addColorStop(0.5, s.color);
          gv.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = gv;
          ctx.fillRect(s.x - 0.5, y - L, 1, L * 2);
        }
      }
      ctx.globalAlpha = 1;
      drawEarth();

      if (!reduced) {
        nextShoot -= dt;
        if (nextShoot <= 0) {
          nextShoot = 6 + Math.random() * 8;
          shooting.push({ x: Math.random() * w * 0.8, y: Math.random() * h * 0.35, vx: 10 + Math.random() * 4, vy: 4 + Math.random() * 2, life: 1 });
        }
        for (let i = shooting.length - 1; i >= 0; i--) {
          const s = shooting[i];
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.02;
          if (s.life <= 0) {
            shooting.splice(i, 1);
            continue;
          }
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
          g.addColorStop(0, `rgba(240,253,255,${s.life})`);
          g.addColorStop(1, "rgba(240,253,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9);
          ctx.stroke();
        }
        raf = requestAnimationFrame(frame);
      }
    };

    let last = performance.now();
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const onScrollReduced = () => frame(performance.now());

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    if (reduced) {
      window.addEventListener("scroll", onScrollReduced, { passive: true });
      frame(performance.now());
    } else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(paintTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScrollReduced);
    };
  }, []);

  return (
    <div className="cosmos" aria-hidden="true">
      <canvas ref={skyRef} className="cosmos-sky" />
      <canvas ref={canvasRef} className="cosmos-canvas" />
    </div>
  );
}
