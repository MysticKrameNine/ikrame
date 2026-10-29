"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS, type Landmark } from "../data/career";
import { LAND_ROWS, EU_BOX, EU_ROWS } from "../data/landDots";
import { drawRider, drawLandmark } from "./draw";
import { ArrowLeft, ArrowRight, Pause, Play, Plus, Minus, Globe as GlobeIcon } from "./Icons";

/**
 * Career mode: a dotted 3D globe you can drag around. Each job is a city with its landmark
 * floating above it. When you move to the next chapter, little Ikrame cycles along the route
 * to the new city, and the card tells what happened there.
 * Starts a guided tour on the `ik:career` window event.
 */

const DEG = Math.PI / 180;
const TOUR_MS = 8500;
const ZOOM_CITY = 4.8;
const TRAVEL_SPEED = 0.0075; // share of an arc per frame

type View = { lon: number; lat: number; zoom: number };

function buildDots() {
  const coarse: number[] = [];
  for (const row of LAND_ROWS) {
    const [lat, n, ...runs] = row;
    for (let r = 0; r < runs.length; r += 2) {
      for (let i = runs[r]; i < runs[r] + runs[r + 1]; i++) {
        const lon = -180 + ((i + 0.5) * 360) / n;
        const inBox = lon > EU_BOX.lon0 && lon < EU_BOX.lon1 && lat > EU_BOX.lat0 && lat < EU_BOX.lat1;
        coarse.push(lon, lat, inBox ? 1 : 0);
      }
    }
  }
  const fine: number[] = [];
  for (const row of EU_ROWS) {
    const [lat, ...runs] = row;
    for (let r = 0; r < runs.length; r += 2) {
      for (let i = runs[r]; i < runs[r] + runs[r + 1]; i++) fine.push(EU_BOX.lon0 + (i + 0.5) * EU_BOX.step, lat);
    }
  }
  return { coarse: new Float32Array(coarse), fine: new Float32Array(fine) };
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const wrapLon = (l: number) => ((((l + 180) % 360) + 360) % 360) - 180;

/** Small landmark drawing for the chapter card. */
function LandmarkIcon({ kind, color }: { kind: Landmark; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 64 * dpr;
    c.height = 64 * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 64, 64);
    drawLandmark(ctx, kind, 32, 58, 50, color);
  }, [kind, color]);
  return <canvas ref={ref} className="landmark-icon" style={{ width: 64, height: 64 }} aria-hidden="true" />;
}

export default function CareerGlobe() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(-1); // -1 = intro card
  const [touring, setTouring] = useState(false);
  const activeRef = useRef(-1);
  const api = useRef<{ fly: (v: View, ms?: number) => void; zoomBy: (k: number) => void } | null>(null);

  const go = useCallback((i: number) => {
    const n = CHAPTERS.length;
    const idx = ((i % n) + n) % n;
    activeRef.current = idx;
    setActive(idx);
    const c = CHAPTERS[idx];
    api.current?.fly({ lon: c.lon, lat: c.lat - 0.9, zoom: ZOOM_CITY });
  }, []);

  const overview = useCallback(() => {
    activeRef.current = -1;
    setActive(-1);
    setTouring(false);
    api.current?.fly({ lon: 5, lat: 32, zoom: 1 }, 1600);
  }, []);

  useEffect(() => {
    if (!touring) return;
    const id = window.setInterval(() => {
      if (activeRef.current >= CHAPTERS.length - 1) {
        setTouring(false);
        return;
      }
      go(activeRef.current + 1);
    }, TOUR_MS);
    return () => window.clearInterval(id);
  }, [touring, go]);

  useEffect(() => {
    const start = () => {
      const section = wrapRef.current?.closest("section");
      if (section) {
        const y = section.getBoundingClientRect().top + window.scrollY - 64;
        window.dispatchEvent(new CustomEvent("ik:scrollto", { detail: y }));
      }
      window.setTimeout(() => {
        go(0);
        setTouring(true);
      }, 700);
    };
    window.addEventListener("ik:career", start);
    return () => window.removeEventListener("ik:career", start);
  }, [go]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { coarse, fine } = buildDots();

    const view: View = { lon: 5, lat: 32, zoom: 1 };
    let flight: { from: View; to: View; start: number; ms: number } | null = null;
    let size = 500, dpr = 1, raf = 0, t = 0;
    let dragging = false;
    let lastX = 0, lastY = 0, velX = 0, velY = 0;
    let idleSince = performance.now();
    let hoverIdx = -1;
    let visible = true;

    const resize = () => {
      size = wrap.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let sinLat0 = 0, cosLat0 = 1, R = 200, cx = 250, cy = 250;
    const setup = () => {
      sinLat0 = Math.sin(view.lat * DEG);
      cosLat0 = Math.cos(view.lat * DEG);
      R = size * 0.42 * view.zoom;
      cx = size / 2;
      cy = size / 2;
    };
    const project = (lon: number, lat: number, lift = 1) => {
      const la = lat * DEG;
      const dl = (lon - view.lon) * DEG;
      const cl = Math.cos(la);
      const x = cl * Math.sin(dl);
      const y = cosLat0 * Math.sin(la) - sinLat0 * cl * Math.cos(dl);
      const z = sinLat0 * Math.sin(la) + cosLat0 * cl * Math.cos(dl);
      return { x: cx + R * x * lift, y: cy - R * y * lift, z };
    };

    let tick: (now: number) => void = () => {};
    const fly = (to: View, ms = 1800) => {
      const from = { ...view };
      const dLon = wrapLon(to.lon - from.lon);
      flight = { from, to: { ...to, lon: from.lon + dLon }, start: performance.now(), ms: reduced ? 1 : ms };
      velX = velY = 0;
      if (reduced) tick(performance.now());
    };
    const zoomBy = (k: number) => fly({ lon: view.lon, lat: view.lat, zoom: Math.min(9, Math.max(0.8, view.zoom * k)) }, 500);
    api.current = { fly, zoomBy };

    // great-circle route between two chapters, lifted off the ground
    type P = { lon: number; lat: number; lift: number };
    const arcPoints = (a: (typeof CHAPTERS)[number], b: (typeof CHAPTERS)[number], steps = 60): P[] => {
      const toV = (lon: number, lat: number) => [
        Math.cos(lat * DEG) * Math.cos(lon * DEG),
        Math.cos(lat * DEG) * Math.sin(lon * DEG),
        Math.sin(lat * DEG),
      ];
      const va = toV(a.lon, a.lat);
      const vb = toV(b.lon, b.lat);
      const dot = Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]);
      const om = Math.acos(dot) || 1e-6;
      const pts: P[] = [];
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const s1 = Math.sin((1 - f) * om) / Math.sin(om);
        const s2 = Math.sin(f * om) / Math.sin(om);
        const v = [va[0] * s1 + vb[0] * s2, va[1] * s1 + vb[1] * s2, va[2] * s1 + vb[2] * s2];
        pts.push({
          lat: Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG,
          lon: Math.atan2(v[1], v[0]) / DEG,
          lift: 1 + Math.sin(Math.PI * f) * Math.min(0.035, om * 0.8),
        });
      }
      return pts;
    };
    const arcs = CHAPTERS.slice(1).map((c, i) => arcPoints(CHAPTERS[i], c));

    // the cyclist
    const girl = { arc: -1, t: 1, at: 0, pedal: 0, wave: 0, facing: 1 as 1 | -1 };
    let lastActive = -1;

    const pathAt = (pts: P[], f: number) => {
      const x = Math.min(pts.length - 1.0001, Math.max(0, f * (pts.length - 1)));
      const i = Math.floor(x);
      const k = x - i;
      const a = pts[i];
      const b = pts[i + 1];
      return { lon: a.lon + (b.lon - a.lon) * k, lat: a.lat + (b.lat - a.lat) * k, lift: a.lift + (b.lift - a.lift) * k };
    };

    const draw = () => {
      setup();
      ctx.clearRect(0, 0, size, size);
      const act = activeRef.current;

      // react to chapter changes
      if (act !== lastActive) {
        if (act > 0 && act > lastActive && lastActive >= -1) {
          girl.arc = act - 1;
          girl.t = lastActive === act - 1 ? 0 : 0.35; // a jump skips straight into the last leg
        } else {
          girl.arc = -1;
          girl.t = 1;
        }
        girl.at = Math.max(0, act);
        lastActive = act;
      }

      // atmosphere
      const atm = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
      atm.addColorStop(0, "rgba(103,232,249,0.30)");
      atm.addColorStop(0.45, "rgba(96,165,250,0.10)");
      atm.addColorStop(1, "rgba(96,165,250,0)");
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fill();

      const sea = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      sea.addColorStop(0, "#14244a");
      sea.addColorStop(0.7, "#0c1530");
      sea.addColorStop(1, "#070c1c");
      ctx.fillStyle = sea;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // graticule
      ctx.strokeStyle = "rgba(103,232,249,0.07)";
      ctx.lineWidth = 1;
      const gStep = view.zoom > 3 ? 5 : 30;
      const line = (pts: [number, number][]) => {
        ctx.beginPath();
        let pen = false;
        for (const [lo, la] of pts) {
          const p = project(lo, la);
          if (p.z > 0) {
            if (!pen) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
      };
      for (let lon = -180; lon < 180; lon += gStep) {
        const pts: [number, number][] = [];
        for (let lat = -85; lat <= 85; lat += 2.5) pts.push([lon, lat]);
        line(pts);
      }
      for (let lat = -75; lat <= 75; lat += gStep) {
        const pts: [number, number][] = [];
        for (let lon = -180; lon <= 180; lon += 2.5) pts.push([lon, lat]);
        line(pts);
      }

      // land
      const fineMix = Math.max(0, Math.min(1, (view.zoom - 1.8) / 1.2));
      const coarseSize = Math.max(1.1, Math.min(3.2, R * 0.0075));
      for (let i = 0; i < coarse.length; i += 3) {
        if (coarse[i + 2] && fineMix >= 1) continue;
        const p = project(coarse[i], coarse[i + 1]);
        if (p.z <= 0.02 || p.x < -4 || p.y < -4 || p.x > size + 4 || p.y > size + 4) continue;
        const a = (0.25 + 0.75 * p.z) * (coarse[i + 2] ? 1 - fineMix : 1);
        ctx.fillStyle = `rgba(203,213,225,${a * 0.8})`;
        ctx.fillRect(p.x - coarseSize / 2, p.y - coarseSize / 2, coarseSize, coarseSize);
      }
      if (fineMix > 0) {
        const fs = Math.max(1, Math.min(2.6, R * 0.00125));
        const focus = act >= 0 ? CHAPTERS[act] : null;
        for (let i = 0; i < fine.length; i += 2) {
          const p = project(fine[i], fine[i + 1]);
          if (p.z <= 0.02 || p.x < -4 || p.y < -4 || p.x > size + 4 || p.y > size + 4) continue;
          let a = (0.3 + 0.7 * p.z) * fineMix;
          let col = "203,213,225";
          if (focus) {
            const dx = fine[i] - focus.lon;
            const dy = fine[i + 1] - focus.lat;
            const d = dx * dx + dy * dy;
            if (d < 2.4) {
              col = "110,231,183";
              a = Math.min(1, a + (1 - d / 2.4) * 0.5);
            }
          }
          ctx.fillStyle = `rgba(${col},${a * 0.8})`;
          ctx.fillRect(p.x - fs / 2, p.y - fs / 2, fs, fs);
        }
      }

      const limb = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R);
      limb.addColorStop(0, "rgba(0,0,0,0)");
      limb.addColorStop(1, "rgba(4,8,20,0.55)");
      ctx.fillStyle = limb;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // routes travelled so far
      const travelling = girl.arc >= 0 && girl.t < 1;
      const upto = act < 0 ? 0 : act;
      for (let k = 0; k < upto; k++) {
        const pts = arcs[k];
        const isLeg = k === girl.arc && travelling;
        const count = isLeg ? Math.max(1, Math.floor(pts.length * ease(girl.t))) : pts.length;
        ctx.lineWidth = isLeg ? 2.2 : 1.6;
        ctx.setLineDash(isLeg ? [] : [5, 5]);
        ctx.strokeStyle = isLeg ? "rgba(110,231,183,0.95)" : "rgba(103,232,249,0.6)";
        ctx.shadowColor = isLeg ? "rgba(110,231,183,0.8)" : "transparent";
        ctx.shadowBlur = isLeg ? 8 : 0;
        ctx.beginPath();
        let pen = false;
        for (let j = 0; j < count; j++) {
          const p = project(pts[j].lon, pts[j].lat, pts[j].lift);
          if (p.z > 0) {
            if (!pen) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      }

      // city pins
      const pulse = (t % 2) / 2;
      const pts = CHAPTERS.map((c) => project(c.lon, c.lat));
      const order = CHAPTERS.map((_, i) => i).sort((a, b) => (a === act ? 1 : 0) - (b === act ? 1 : 0));
      for (const i of order) {
        const c = CHAPTERS[i];
        const p = pts[i];
        if (p.z <= 0) continue;
        const on = i === act;
        const base = on ? 6 : hoverIdx === i ? 5.5 : 4;
        if (on || hoverIdx === i) {
          ctx.strokeStyle = c.color;
          ctx.globalAlpha = 1 - pulse;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, base + pulse * 24, (base + pulse * 24) * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, base * 3);
        g.addColorStop(0, c.color);
        g.addColorStop(1, c.color + "00");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, base * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, base * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // landmarks floating above the cities (active first, others where there is room)
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const fits = (b: { x: number; y: number; w: number; h: number }) =>
        !placed.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
      if (view.zoom > 2.2) {
        const k = Math.min(1, (view.zoom - 2.2) / 1.6);
        const lmOrder = CHAPTERS.map((_, i) => i).sort((a, b) => {
          const rank = (i: number) => (i === act ? 0 : i === hoverIdx ? 1 : 2);
          return rank(a) - rank(b);
        });
        for (const i of lmOrder) {
          const c = CHAPTERS[i];
          const p = pts[i];
          if (p.z <= 0) continue;
          const on = i === act;
          const h = (on ? 66 : 40) * k;
          const float = Math.sin(t * 1.6 + i) * 3;
          const base = p.y - 14 - float;
          const box = { x: p.x - h * 0.6, y: base - h * 1.1, w: h * 1.2, h: h * 1.1 + 10 };
          if (!fits(box)) continue;
          placed.push(box);
          // light beam from the pin
          const beam = ctx.createLinearGradient(p.x, p.y, p.x, base);
          beam.addColorStop(0, c.color + "00");
          beam.addColorStop(1, c.color + (on ? "66" : "33"));
          ctx.strokeStyle = beam;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, base);
          ctx.stroke();
          drawLandmark(ctx, c.landmark, p.x, base, h, c.color, on ? 1 : 0.7);
        }
      }

      // labels
      if (view.zoom > 2.4) {
        const labelOrder = CHAPTERS.map((_, i) => i).sort((a, b) => {
          const rank = (i: number) => (i === act ? 0 : i === hoverIdx ? 1 : 2);
          return rank(a) - rank(b);
        });
        for (const i of labelOrder) {
          const c = CHAPTERS[i];
          const p = pts[i];
          if (p.z <= 0) continue;
          const on = i === act;
          const hov = i === hoverIdx;
          if (!on && !hov && view.zoom < 3.6) continue;
          const label = on || hov ? `${c.company} · ${c.city}` : c.company;
          ctx.font = `${on ? 600 : 500} ${on ? 13 : 11}px "Sora", "DM Sans", system-ui, sans-serif`;
          const tw = ctx.measureText(label).width;
          const candidates = [
            { x: p.x + 14, y: p.y - 4 },
            { x: p.x - tw - 26, y: p.y - 4 },
            { x: p.x + 14, y: p.y + 14 },
            { x: p.x - tw - 26, y: p.y + 14 },
            { x: p.x - tw / 2 - 6, y: p.y + 16 },
          ];
          const box = candidates.map((q) => ({ x: q.x - 6, y: q.y, w: tw + 12, h: 20 })).find(fits);
          if (!box) continue;
          placed.push(box);
          ctx.fillStyle = on ? "rgba(11,16,32,0.9)" : "rgba(11,16,32,0.65)";
          ctx.strokeStyle = on ? c.color : "rgba(51,65,85,0.9)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(box.x, box.y, box.w, box.h, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = on ? "#f1f5f9" : "rgba(203,213,225,0.85)";
          ctx.fillText(label, box.x + 6, box.y + 14);
        }
      }

      // the cyclist
      if (act >= 0 && view.zoom > 2) {
        let gx: number, gy: number, visibleGirl = true;
        if (travelling) {
          const legPts = arcs[girl.arc];
          const f = ease(girl.t);
          const here = pathAt(legPts, f);
          const ahead = pathAt(legPts, Math.min(1, f + 0.02));
          const p = project(here.lon, here.lat, here.lift);
          const q = project(ahead.lon, ahead.lat, ahead.lift);
          gx = p.x;
          gy = p.y;
          visibleGirl = p.z > 0;
          if (Math.abs(q.x - p.x) > 0.05) girl.facing = q.x >= p.x ? 1 : -1;
          girl.t = Math.min(1, girl.t + (reduced ? 1 : TRAVEL_SPEED));
          girl.pedal += 0.32;
          if (girl.t >= 1) girl.wave = 1;
        } else {
          const p = pts[girl.at];
          gx = p.x - 16 * girl.facing;
          gy = p.y + 2;
          visibleGirl = p.z > 0;
          girl.pedal += 0.02;
          girl.wave = Math.max(0, girl.wave - 0.006);
        }
        if (visibleGirl) {
          const s = Math.max(4, Math.min(8.5, R * 0.0068));
          // shadow
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.ellipse(gx, gy + 1, s * 2.6, s * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          drawRider(ctx, CHAPTERS[Math.max(0, act)].ride, gx, gy, s, { pedal: girl.pedal, facing: girl.facing, wave: girl.wave, glow: true, bob: travelling ? Math.sin(girl.pedal) * 0.06 : 0 });
        }
      }
    };

    let last = performance.now();
    tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (flight) {
        const f = Math.min(1, (now - flight.start) / flight.ms);
        const e = ease(f);
        view.lon = flight.from.lon + (flight.to.lon - flight.from.lon) * e;
        view.lat = flight.from.lat + (flight.to.lat - flight.from.lat) * e;
        const base = flight.from.zoom + (flight.to.zoom - flight.from.zoom) * e;
        const hop = Math.min(flight.from.zoom, flight.to.zoom) > 3 ? Math.sin(Math.PI * e) * 0.25 : 0;
        view.zoom = base * (1 - hop);
        if (f >= 1) {
          flight = null;
          view.lon = wrapLon(view.lon);
        }
      } else if (!dragging) {
        view.lon = wrapLon(view.lon - velX);
        view.lat = Math.max(-70, Math.min(75, view.lat + velY));
        velX *= 0.93;
        velY *= 0.93;
        if (activeRef.current < 0 && now - idleSince > 1500 && !reduced) view.lon = wrapLon(view.lon + dt * 6);
      }
      draw();
      if (!reduced && visible) raf = requestAnimationFrame(tick);
    };

    const hitTest = (x: number, y: number) => {
      setup();
      let best = -1, bestD = 20 * 20;
      CHAPTERS.forEach((c, i) => {
        const p = project(c.lon, c.lat);
        if (p.z <= 0) return;
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    let downX = 0, downY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      flight = null;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      velX = velY = 0;
      canvas.setPointerCapture(e.pointerId);
      setTouring(false);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (dragging) {
        const k = 180 / (Math.PI * R);
        velX = (e.clientX - lastX) * k;
        velY = (e.clientY - lastY) * k;
        view.lon = wrapLon(view.lon - velX);
        view.lat = Math.max(-70, Math.min(75, view.lat + velY));
        lastX = e.clientX;
        lastY = e.clientY;
        idleSince = performance.now();
        if (reduced) draw();
      } else {
        const h = hitTest(e.clientX - r.left, e.clientY - r.top);
        if (h !== hoverIdx) {
          hoverIdx = h;
          canvas.style.cursor = h >= 0 ? "pointer" : "grab";
          if (reduced) draw();
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      idleSince = performance.now();
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) < 6) {
        const r = canvas.getBoundingClientRect();
        const h = hitTest(e.clientX - r.left, e.clientY - r.top);
        if (h >= 0) go(h);
      }
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    resize();
    draw();

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      api.current = null;
    };
  }, [go]);

  const c = active >= 0 ? CHAPTERS[active] : null;

  return (
    <div className="journey">
      <div className="journey-stage">
        <div ref={wrapRef} className="globe-wrap">
          <canvas
            ref={canvasRef}
            className="globe-canvas"
            role="img"
            aria-label="Interactive globe of my career. Drag to rotate, click a glowing city."
          />
          <div className="globe-hint">drag to spin · click a city</div>
          <div className="globe-zoom">
            <button type="button" aria-label="Zoom in" onClick={() => api.current?.zoomBy(1.5)}><Plus /></button>
            <button type="button" aria-label="Zoom out" onClick={() => api.current?.zoomBy(1 / 1.5)}><Minus /></button>
            <button type="button" aria-label="Whole world" onClick={overview}><GlobeIcon /></button>
          </div>
        </div>

        <div className="chapter-card" aria-live="polite" style={c ? ({ ["--accent" as string]: c.color } as React.CSSProperties) : undefined}>
          {c ? (
            <div key={c.id} className="chapter-inner">
              <div className="chapter-top">
                <div className="chapter-meta">
                  <span className="mono">chapter {String(active + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}</span>
                  <span className="chapter-place">{c.city}, {c.country}</span>
                </div>
                <div className="chapter-badge" title={c.landmarkName}>
                  {c.logo ? <img src={c.logo} alt={`${c.company} logo`} /> : <LandmarkIcon kind={c.landmark} color={c.color} />}
                </div>
              </div>
              {c.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="chapter-photo" src={c.photo} alt={c.photoAlt || c.company} loading="lazy" />
              ) : null}
              <h3 className="chapter-role">
                {c.role} <span className="t-accent">@ {c.company}</span>
              </h3>
              <p className="chapter-period mono">{c.period}</p>
              {c.highlight ? <p className="chapter-highlight">{c.highlight}</p> : null}
              <ul className="chapter-did">
                {c.bullets.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <div className="chips">
                {c.stack.map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="chapter-inner">
              <span className="mono chapter-meta">career mode</span>
              <h3 className="chapter-title">5 experiences, 3 countries.</h3>
              <p className="chapter-highlight">
                Rennes, Leuven, Paris and Frankfurt, through to my current role keeping hospital systems running across France. Press play to ride through each chapter, or click a city.
              </p>
              <button type="button" className="btn btn-primary journey-cta" onClick={() => { go(0); setTouring(true); }}>
                <Play /> Start the journey
              </button>
            </div>
          )}

          <div className="chapter-controls">
            <button type="button" className="icon-btn" aria-label="Previous chapter" onClick={() => { setTouring(false); go(active <= 0 ? CHAPTERS.length - 1 : active - 1); }}>
              <ArrowLeft />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={touring ? "Pause tour" : "Play tour"}
              onClick={() => {
                if (touring) setTouring(false);
                else {
                  if (active < 0 || active >= CHAPTERS.length - 1) go(0);
                  setTouring(true);
                }
              }}
            >
              {touring ? <Pause /> : <Play />}
            </button>
            <button type="button" className="icon-btn" aria-label="Next chapter" onClick={() => { setTouring(false); go(active + 1); }}>
              <ArrowRight />
            </button>
            {touring && <span key={active} className="tour-bar" style={{ animationDuration: `${TOUR_MS}ms` }} />}
          </div>
        </div>
      </div>

      <ol className="timeline">
        {CHAPTERS.map((ch, i) => (
          <li key={ch.id}>
            <button
              type="button"
              className={`timeline-stop${i === active ? " is-active" : ""}${active >= 0 && i < active ? " is-past" : ""}`}
              onClick={() => { setTouring(false); go(i); }}
              style={{ ["--stop" as string]: ch.color } as React.CSSProperties}
            >
              <span className="timeline-dot" />
              <span className="timeline-year mono">{ch.period.split(" – ")[0]}</span>
              <span className="timeline-name">{ch.company}</span>
              <span className="timeline-city">{ch.city}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
