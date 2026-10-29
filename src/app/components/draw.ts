// Shared canvas drawings: the little cyclist (Ikrame's avatar) and the city landmarks.
// Everything is drawn with plain canvas paths so it stays crisp at any size.

import type { Landmark, Ride } from "../data/career";
import { drawFlower, drawLeaf } from "./illustration";

export const PALETTE = {
  cyan: "#67e8f9",
  emerald: "#6ee7b7",
  blue: "#60a5fa",
  slate: "#e2e8f0",
  moon: "#fff8e6",
};

type Ctx = CanvasRenderingContext2D;

export type GirlPose = {
  pedal: number; // crank angle (rad)
  facing?: 1 | -1; // 1 = to the right
  wave?: number; // 0..1 raise the free arm and wave
  bob?: number; // small vertical bounce
  tilt?: number; // lean (rad), e.g. when jumping
  glow?: boolean;
  shine?: number; // 0..1 light sweep across the car paint
};

/** Two-bone IK: returns the knee/elbow point between a and b. */
function joint(ax: number, ay: number, bx: number, by: number, l1: number, l2: number, bend: 1 | -1) {
  const dx = bx - ax;
  const dy = by - ay;
  let d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 1e-3);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = ax + (a * dx) / d;
  const my = ay + (a * dy) / d;
  return { x: mx + (bend * h * -dy) / d, y: my + (bend * h * dx) / d };
}


/** Smooth closed shape through points (quadratic midpoints), no bumps. */
function smoothShape(ctx: Ctx, pts: { x: number; y: number }[]) {
  const n = pts.length;
  ctx.beginPath();
  ctx.moveTo((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
  for (let i = 1; i <= n; i++) {
    const p = pts[i % n];
    const q = pts[(i + 1) % n];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  ctx.closePath();
}

/**
 * Long, softly wavy hair streaming behind the head (to the left), drawn as layered ribbons.
 * Head centre at (hx, hy), head radius r.
 */
function drawFlowingHair(ctx: Ctx, hx: number, hy: number, r: number, phase: number, detail: boolean) {
  const layer = (len: number, drop: number, width: number, amp: number, ph: number, c0: string, c1: string) => {
    const top: { x: number; y: number }[] = [];
    const bot: { x: number; y: number }[] = [];
    const N = 16;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const cx = hx - r * 0.2 - len * u;
      const cy = hy - r * 0.15 + drop * Math.pow(u, 1.25) + Math.sin(u * 5.5 - phase * 1.4 + ph) * amp * u;
      const wv = width * (1 - 0.15 * u) * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.4)));
      const tilt = Math.cos(u * 5.5 - phase * 1.4 + ph) * amp * 0.6 * u;
      top.push({ x: cx + tilt * 0.3, y: cy - wv * 0.5 });
      bot.push({ x: cx - tilt * 0.3, y: cy + wv * 0.5 });
    }
    // soft wavy tips
    const end = top[N];
    const g = ctx.createLinearGradient(hx, hy, hx - len, hy + drop);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    smoothShape(ctx, [
      { x: hx + r * 0.55, y: hy - r * 0.55 },
      ...top,
      { x: end.x - width * 0.25, y: end.y + width * 0.55 },
      ...bot.reverse(),
      { x: hx - r * 0.1, y: hy + r * 0.85 },
    ]);
    ctx.fill();
  };
  layer(r * 6.6, r * 2.9, r * 2.9, r * 0.6, 0, "#6b4428", "#a8754c");
  layer(r * 6.0, r * 2.4, r * 2.1, r * 0.7, 1.4, "#80553a", "#c08c5f");
  layer(r * 4.8, r * 1.8, r * 1.3, r * 0.8, 2.6, "#946446", "#d3a274");
  if (detail) {
    // fine strands catching the light
    ctx.lineCap = "round";
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = k % 2 ? "rgba(236,196,150,0.6)" : "rgba(120,80,50,0.45)";
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const u = i / 14;
        const x = hx - r * 0.3 - r * (4.6 + k * 0.4) * u;
        const y = hy - r * (0.35 - k * 0.22) + r * (1.8 + k * 0.2) * Math.pow(u, 1.25) + Math.sin(u * 5.5 - phase * 1.4 + k) * r * 0.45 * u;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

/** Profile face looking right, with side-swept bangs. Centre (0,0), radius ~1. */
function drawProfileHead(ctx: Ctx, phase: number, detail: boolean) {
  const skin = ctx.createLinearGradient(-0.8, -0.8, 0.9, 0.9);
  skin.addColorStop(0, "#f7d9c4");
  skin.addColorStop(1, "#ecbfa0");
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(0.1, -0.98);
  ctx.bezierCurveTo(0.55, -0.98, 0.8, -0.7, 0.8, -0.35); // forehead
  ctx.quadraticCurveTo(0.82, -0.18, 0.9, -0.02); // brow → nose bridge
  ctx.quadraticCurveTo(1.04, 0.12, 0.96, 0.18); // nose tip
  ctx.quadraticCurveTo(0.9, 0.24, 0.86, 0.26); // under the nose
  ctx.quadraticCurveTo(0.92, 0.34, 0.86, 0.4); // upper lip
  ctx.quadraticCurveTo(0.9, 0.48, 0.84, 0.54); // lower lip
  ctx.quadraticCurveTo(0.84, 0.7, 0.66, 0.82); // chin
  ctx.quadraticCurveTo(0.35, 0.95, 0.05, 0.85); // jaw
  ctx.bezierCurveTo(-0.6, 0.6, -0.8, -0.2, -0.55, -0.65);
  ctx.bezierCurveTo(-0.4, -0.9, -0.15, -0.98, 0.1, -0.98);
  ctx.fill();

  // eye (profile almond), lashes, brow
  if (detail) {
    ctx.fillStyle = "#fffaf6";
    ctx.beginPath();
    ctx.moveTo(0.42, -0.1);
    ctx.quadraticCurveTo(0.56, -0.2, 0.66, -0.1);
    ctx.quadraticCurveTo(0.56, -0.02, 0.42, -0.1);
    ctx.fill();
    ctx.fillStyle = "#4a2a18";
    ctx.beginPath();
    ctx.arc(0.6, -0.1, 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#1c110b";
  ctx.lineCap = "round";
  ctx.lineWidth = 0.06;
  ctx.beginPath();
  ctx.moveTo(0.4, -0.1);
  ctx.quadraticCurveTo(0.55, -0.22, 0.7, -0.12);
  ctx.stroke();
  if (detail) {
    ctx.lineWidth = 0.035;
    for (const [lx, ly, dx, dy] of [[0.62, -0.17, 0.08, -0.07], [0.67, -0.14, 0.1, -0.04], [0.55, -0.19, 0.05, -0.08]]) {
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + dx, ly + dy);
      ctx.stroke();
    }
    ctx.strokeStyle = "#6b4428";
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.moveTo(0.42, -0.32);
    ctx.quadraticCurveTo(0.58, -0.4, 0.74, -0.32);
    ctx.stroke();
    // blush + lips
    const b = ctx.createRadialGradient(0.52, 0.22, 0, 0.52, 0.22, 0.24);
    b.addColorStop(0, "rgba(240,120,145,0.4)");
    b.addColorStop(1, "rgba(240,120,145,0)");
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.arc(0.52, 0.22, 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#d9677a";
  ctx.beginPath();
  ctx.ellipse(0.84, 0.44, 0.07, 0.1, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // hair on top of the head + bangs sweeping over the forehead
  const hg = ctx.createLinearGradient(0, -1.2, 0, 0.8);
  hg.addColorStop(0, "#8a5c3c");
  hg.addColorStop(1, "#6b4428");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-0.95, 0.55);
  ctx.bezierCurveTo(-1.2, -0.6, -0.5, -1.3, 0.25, -1.18);
  ctx.bezierCurveTo(0.75, -1.1, 0.98, -0.75, 0.86, -0.42);
  ctx.quadraticCurveTo(0.62, -0.62 + Math.sin(phase) * 0.03, 0.3, -0.5);
  ctx.quadraticCurveTo(0.05, -0.38, -0.1, -0.05);
  ctx.quadraticCurveTo(-0.2, 0.3, -0.35, 0.75);
  ctx.closePath();
  ctx.fill();
  if (detail) {
    ctx.strokeStyle = "rgba(236,196,150,0.7)";
    ctx.lineWidth = 0.07;
    ctx.beginPath();
    ctx.arc(-0.1, -0.25, 0.75, Math.PI * 1.15, Math.PI * 1.55);
    ctx.stroke();
    // a small flower tucked behind the ear
    ctx.fillStyle = "#f9a8c9";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + phase * 0.2;
      ctx.beginPath();
      ctx.arc(-0.2 + Math.cos(a) * 0.12, -0.55 + Math.sin(a) * 0.12, 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(-0.2, -0.55, 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}


/** A soft tapered limb a→b→c with widths w0 (at a), w1 (at b), w2 (at c). */
function limb(ctx: Ctx, a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, w0: number, w1: number, w2: number) {
  const seg = (p: { x: number; y: number }, q: { x: number; y: number }, wa: number, wb: number) => {
    const dx = q.x - p.x, dy = q.y - p.y;
    const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m, ny = dx / m;
    ctx.beginPath();
    ctx.moveTo(p.x + nx * wa / 2, p.y + ny * wa / 2);
    ctx.lineTo(q.x + nx * wb / 2, q.y + ny * wb / 2);
    ctx.lineTo(q.x - nx * wb / 2, q.y - ny * wb / 2);
    ctx.lineTo(p.x - nx * wa / 2, p.y - ny * wa / 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(q.x, q.y, wb / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.beginPath();
  ctx.arc(a.x, a.y, w0 / 2, 0, Math.PI * 2);
  ctx.fill();
  seg(a, b, w0, w1);
  seg(b, c, w1, w2);
}

/** Pink dress bodice (fitted, ribbon at the waist), drawn in the torso frame at `hip`, leaning by `lean`. */
function drawBodice(ctx: Ctx, hip: { x: number; y: number }, lean: number, flutter: number, detail: boolean) {
  const DRESS = "#f6b8cf", DRESS_DARK = "#e48fb1", DRESS_LIGHT = "#fde4ee";
  ctx.save();
  ctx.translate(hip.x, hip.y);
  ctx.rotate(lean);
  // torso frame: hip at (0,0), up = -y. waist at y=-0.5, shoulders at y=-1.12, facing +x
  const bod = ctx.createLinearGradient(-0.25, 0, 0.3, 0);
  bod.addColorStop(0, DRESS_DARK);
  bod.addColorStop(0.55, DRESS);
  bod.addColorStop(1, DRESS_LIGHT);
  ctx.fillStyle = bod;
  ctx.beginPath();
  ctx.moveTo(-0.1, -0.5); // small waist (back)
  ctx.bezierCurveTo(-0.17, -0.7, -0.17, -0.95, -0.12, -1.1); // back
  ctx.quadraticCurveTo(0.02, -1.14, 0.14, -1.08); // neckline
  ctx.bezierCurveTo(0.3, -0.98, 0.3, -0.78, 0.16, -0.68); // bust
  ctx.quadraticCurveTo(0.1, -0.58, 0.11, -0.5); // waist (front)
  ctx.closePath();
  ctx.fill();
  // skin at the sweetheart neckline + collarbone
  ctx.fillStyle = "#f3cdb3";
  ctx.beginPath();
  ctx.moveTo(-0.04, -1.12);
  ctx.quadraticCurveTo(0.06, -1.2, 0.15, -1.12);
  ctx.quadraticCurveTo(0.12, -1.04, 0.06, -1.06);
  ctx.quadraticCurveTo(0.02, -1.04, -0.04, -1.12);
  ctx.fill();
  // puff sleeve
  ctx.fillStyle = DRESS;
  ctx.beginPath();
  ctx.ellipse(0.02, -1.02, 0.12, 0.1, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // satin ribbon at the waist with a bow at the back
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-0.12, -0.56, 0.24, 0.07);
  if (detail) {
    ctx.beginPath();
    ctx.ellipse(-0.2, -0.56, 0.08, 0.045, -0.5, 0, Math.PI * 2);
    ctx.ellipse(-0.2, -0.5, 0.08, 0.045, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.03;
    ctx.beginPath();
    ctx.moveTo(-0.16, -0.52);
    ctx.quadraticCurveTo(-0.3, -0.45 + flutter, -0.4, -0.38 + flutter * 1.5);
    ctx.stroke();
  }
  ctx.restore();

}

/**
 * Draws Ikrame on her bicycle. (x, y) is the ground point under the bike, `s` the wheel radius in px.
 * Total height is about 5 × s. Outfit from the Paris-by-night photo: pink floral top, brown belt,
 * grey pleated skirt with a lace hem, dark tights, white sneakers — and long curly hair in the wind.
 */
export function drawGirl(ctx: Ctx, x: number, y: number, s: number, pose: GirlPose) {
  const f = pose.facing ?? 1;
  const p = pose.pedal;
  const wind = p * 0.45;
  const detail = s >= 6; // skip the finest strokes when tiny
  ctx.save();
  ctx.translate(x, y - (pose.bob ?? 0) * s);
  if (pose.tilt) ctx.rotate(pose.tilt * f);
  ctx.scale(s * f, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const C = {
    skin: "#f1c9a8",
    skinShade: "#d9a582",
    hair: "#3a2216",
    hairLight: "#7a4a2c",
    top: "#f7dbe3",
    topShade: "#e9bccb",
    flower: "#d9879f",
    belt: "#7a4a2d",
    skirt: "#4b4b55",
    lace: "#fbf7f0",
    tights: "#26202f",
    shoe: "#fbfbfb",
    lips: "#d9727f",
  };

  if (pose.glow) {
    const g = ctx.createRadialGradient(0, -2.6, 0.2, 0, -2.6, 3.8);
    g.addColorStop(0, "rgba(103,232,249,0.28)");
    g.addColorStop(1, "rgba(103,232,249,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -2.6, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const rear = { x: -1.55, y: -1 };
  const front = { x: 1.55, y: -1 };
  const crank = { x: 0, y: -1.05 };
  const seat = { x: -0.62, y: -2.3 };
  const headTube = { x: 1.0, y: -2.25 };
  const bar = { x: 1.18, y: -2.66 };
  // riding pose: sitting on the saddle, leaning forward toward the handlebar
  const lean = 0.3; // radians from vertical: upright, elegant
  const hip = { x: -0.6, y: -2.44 };
  const up = { x: Math.sin(lean), y: -Math.cos(lean) };
  const shoulder = { x: hip.x + up.x * 1.12, y: hip.y + up.y * 1.12 };
  const waist = { x: hip.x + up.x * 0.5, y: hip.y + up.y * 0.5 };
  const head = { x: shoulder.x + 0.18, y: shoulder.y - 0.46 };
  const pedalA = { x: crank.x + Math.cos(p) * 0.45, y: crank.y + Math.sin(p) * 0.45 };
  const pedalB = { x: crank.x - Math.cos(p) * 0.45, y: crank.y - Math.sin(p) * 0.45 };

  // ---- long wavy hair streaming behind in the wind ----
  drawFlowingHair(ctx, head.x, head.y, 0.34, wind, detail);

  // ---- far leg (shaded skin, fuller thigh, slim calf) + ballet flat ----
  const kneeB = joint(hip.x, hip.y, pedalB.x, pedalB.y, 1.02, 1.0, -1);
  const ankleB = { x: pedalB.x - 0.04, y: pedalB.y - 0.08 };
  ctx.fillStyle = "#d9a585";
  limb(ctx, hip, kneeB, ankleB, 0.36, 0.17, 0.1);
  ctx.fillStyle = "#e58fb0";
  ctx.beginPath();
  ctx.ellipse(pedalB.x + 0.08, pedalB.y - 0.03, 0.2, 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- bicycle ----
  for (const w of [rear, front]) {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 0.95, 0, Math.PI * 2);
    ctx.stroke();
    if (detail) {
      ctx.strokeStyle = "rgba(226,232,240,0.4)";
      ctx.lineWidth = 0.04;
      for (let k = 0; k < 6; k++) {
        const a = p + (k * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(w.x + Math.cos(a) * 0.9, w.y + Math.sin(a) * 0.9);
        ctx.lineTo(w.x - Math.cos(a) * 0.9, w.y - Math.sin(a) * 0.9);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(w.x, w.y, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  // pink step-through frame with a soft highlight
  const framePath = () => {
    ctx.beginPath();
    ctx.moveTo(rear.x, rear.y);
    ctx.lineTo(crank.x, crank.y);
    ctx.lineTo(seat.x, seat.y);
    ctx.lineTo(rear.x, rear.y);
    ctx.moveTo(crank.x, crank.y);
    ctx.lineTo(headTube.x, headTube.y);
    ctx.moveTo(seat.x + 0.1, seat.y + 0.2);
    ctx.quadraticCurveTo(0.3, -2.0, headTube.x, headTube.y);
    ctx.moveTo(headTube.x, headTube.y);
    ctx.lineTo(front.x, front.y);
    ctx.moveTo(headTube.x, headTube.y);
    ctx.lineTo(bar.x, bar.y);
    ctx.quadraticCurveTo(bar.x + 0.25, bar.y - 0.1, bar.x + 0.15, bar.y + 0.12);
  };
  framePath();
  ctx.strokeStyle = "#e47fa7";
  ctx.lineWidth = 0.19;
  ctx.stroke();
  ctx.strokeStyle = "#f6a5c4";
  ctx.lineWidth = 0.13;
  ctx.stroke();
  if (detail) {
    ctx.strokeStyle = "#ffd3e3";
    ctx.lineWidth = 0.04;
    ctx.stroke();
  }
  // pink fenders
  ctx.strokeStyle = "#f6a5c4";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.arc(rear.x, rear.y, 1.08, Math.PI * 1.05, Math.PI * 1.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(front.x, front.y, 1.08, Math.PI * 1.3, Math.PI * 1.95);
  ctx.stroke();
  // flower vine along the frame
  if (detail) {
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const vx = seat.x + 0.1 + (headTube.x - seat.x - 0.1) * k;
      const vy = seat.y + 0.2 + (headTube.y - seat.y - 0.2) * k + Math.sin(k * Math.PI) * 0.28;
      drawLeaf(ctx, vx, vy, 0.22, i % 2 ? -0.8 : 0.9, "#86c79a");
      if (i % 2 === 0) drawFlower(ctx, "blossom", vx + 0.05, vy - 0.06, 0.1, i, i === 2 ? "#ffffff" : "#f9a8c9");
    }
  }
  // seat
  ctx.fillStyle = "#5b3a26";
  ctx.beginPath();
  ctx.ellipse(seat.x - 0.02, seat.y - 0.04, 0.3, 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  // wicker basket with flowers
  ctx.fillStyle = "#c99464";
  ctx.beginPath();
  ctx.moveTo(1.32, -2.5);
  ctx.lineTo(2.08, -2.5);
  ctx.lineTo(1.98, -1.98);
  ctx.lineTo(1.42, -1.98);
  ctx.closePath();
  ctx.fill();
  if (detail) {
    ctx.strokeStyle = "#8a5d36";
    ctx.lineWidth = 0.03;
    for (const yy of [-2.37, -2.24, -2.11]) {
      ctx.beginPath();
      ctx.moveTo(1.36, yy);
      ctx.lineTo(2.04, yy);
      ctx.stroke();
    }
  }
  // an overflowing bouquet
  for (let i = 0; i < 4; i++) drawLeaf(ctx, 1.4 + i * 0.2, -2.5, 0.3, -Math.PI / 2 + (i - 1.5) * 0.5, "#86c79a");
  const bouquet: [("rose" | "daisy" | "blossom" | "peony"), number, number, number, string][] = [
    ["peony", 1.5, -2.66, 0.2, "#f9a8c9"],
    ["daisy", 1.76, -2.74, 0.17, "#ffffff"],
    ["rose", 1.98, -2.62, 0.18, "#f472b6"],
    ["blossom", 1.66, -2.95, 0.12, "#f0abfc"],
    ["rose", 1.86, -2.92, 0.14, "#fbcfe0"],
    ["blossom", 2.12, -2.84, 0.1, "#ffffff"],
  ];
  for (const [kind, fx, fy, r, col] of bouquet) {
    if (detail || kind !== "blossom") drawFlower(ctx, kind, fx, fy, r, fx * 3, col);
  }
  // crank
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.09;
  ctx.beginPath();
  ctx.moveTo(pedalA.x, pedalA.y);
  ctx.lineTo(pedalB.x, pedalB.y);
  ctx.stroke();

  // ---- near leg: bare, curvy thigh, slim calf, pink ballet flat ----
  const kneeA = joint(hip.x, hip.y, pedalA.x, pedalA.y, 1.02, 1.0, -1);
  const ankleA = { x: pedalA.x - 0.04, y: pedalA.y - 0.08 };
  const legG = ctx.createLinearGradient(hip.x, hip.y, ankleA.x, ankleA.y);
  legG.addColorStop(0, "#f3cdb3");
  legG.addColorStop(1, "#ebbd9c");
  ctx.fillStyle = legG;
  limb(ctx, hip, kneeA, ankleA, 0.4, 0.18, 0.1);
  ctx.fillStyle = "#f29bbd";
  ctx.beginPath();
  ctx.ellipse(pedalA.x + 0.08, pedalA.y - 0.04, 0.21, 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  if (detail) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pedalA.x + 0.05, pedalA.y - 0.1, 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- the dress: fitted bodice, tiny cinched waist, flared skirt over the thighs ----
  const DRESS = "#f6b8cf", DRESS_DARK = "#e48fb1";
  const flutter = Math.sin(wind * 2.2) * 0.07;
  drawBodice(ctx, hip, lean, flutter, detail);

  // flared skirt: from the waist, over the hips and thighs, hem fluttering behind
  const thigh = { x: hip.x + (kneeA.x - hip.x) * 0.62, y: hip.y + (kneeA.y - hip.y) * 0.62 };
  const wB = { x: waist.x - Math.cos(lean) * 0.11, y: waist.y - Math.sin(lean) * 0.11 };
  const wF = { x: waist.x + Math.cos(lean) * 0.12, y: waist.y + Math.sin(lean) * 0.12 };
  const hemF = { x: thigh.x + 0.1, y: thigh.y - 0.06 + flutter };
  const hemB = { x: hip.x - 0.62 - flutter * 2, y: hip.y + 0.06 };
  const sk = ctx.createLinearGradient(wB.x, wB.y, hemF.x, hemF.y + 0.3);
  sk.addColorStop(0, DRESS);
  sk.addColorStop(1, DRESS_DARK);
  ctx.fillStyle = sk;
  ctx.beginPath();
  ctx.moveTo(wB.x, wB.y);
  ctx.lineTo(wF.x, wF.y);
  ctx.bezierCurveTo(wF.x + 0.2, wF.y + 0.15, thigh.x - 0.1, thigh.y - 0.32, hemF.x, hemF.y);
  // scalloped hem
  const scallops = 6;
  for (let i = 1; i <= scallops; i++) {
    const k = i / scallops;
    const px = hemF.x + (hemB.x - hemF.x) * k;
    const py = hemF.y + (hemB.y - hemF.y) * k + Math.sin(Math.PI * k) * 0.22;
    const mx = hemF.x + (hemB.x - hemF.x) * (k - 0.5 / scallops);
    const my = hemF.y + (hemB.y - hemF.y) * (k - 0.5 / scallops) + Math.sin(Math.PI * (k - 0.5 / scallops)) * 0.22 + 0.07;
    ctx.quadraticCurveTo(mx, my, px, py);
  }
  ctx.bezierCurveTo(hip.x - 0.5, hip.y - 0.25, wB.x - 0.2, wB.y + 0.1, wB.x, wB.y);
  ctx.closePath();
  ctx.fill();
  if (detail) {
    // soft folds + tiny white flowers
    ctx.strokeStyle = "rgba(200,90,140,0.35)";
    ctx.lineWidth = 0.025;
    for (const k of [0.3, 0.55, 0.8]) {
      ctx.beginPath();
      ctx.moveTo(wB.x + (wF.x - wB.x) * k, wB.y + (wF.y - wB.y) * k);
      ctx.quadraticCurveTo(hip.x - 0.1, hip.y + 0.05, hemF.x + (hemB.x - hemF.x) * (1 - k), hemF.y + (hemB.y - hemF.y) * (1 - k) + Math.sin(Math.PI * (1 - k)) * 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const [fx, fy] of [[-0.85, -2.38], [-0.55, -2.2], [-0.3, -2.4], [-1.0, -2.25], [-0.15, -2.28], [-0.7, -2.55]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, 0.025, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- arm: bare, slender, elbow softly bent down to the handlebar ----
  const sh = { x: shoulder.x + 0.04, y: shoulder.y + 0.12 };
  const hand = { x: bar.x + 0.04, y: bar.y + 0.02 };
  const elbow = joint(sh.x, sh.y, hand.x, hand.y, 0.74, 0.74, 1);
  ctx.fillStyle = "#f1c6a8";
  limb(ctx, sh, elbow, hand, 0.13, 0.09, 0.07);
  ctx.fillStyle = "#f3cdb3";
  ctx.beginPath();
  ctx.ellipse(hand.x + 0.02, hand.y, 0.07, 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  if (detail) {
    // a thin bracelet
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.arc(hand.x - 0.08, hand.y, 0.045, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- slim neck + profile head ----
  ctx.strokeStyle = "#efc3a5";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.moveTo(shoulder.x + 0.03, shoulder.y + 0.02);
  ctx.lineTo(head.x - 0.02, head.y + 0.24);
  ctx.stroke();
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.scale(0.34, 0.34);
  drawProfileHead(ctx, wind, detail);
  ctx.restore();

  // ---- waving arm (in front of everything) ----
  if (pose.wave && pose.wave > 0.01) {
    const a = -Math.PI / 2 - 0.35 + Math.sin(p * 3) * 0.35;
    const wh = { x: shoulder.x + Math.cos(a) * 1.25 * pose.wave, y: shoulder.y + Math.sin(a) * 1.25 * pose.wave };
    ctx.strokeStyle = "#f1c6a8";
    ctx.lineWidth = 0.11;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y + 0.05);
    ctx.lineTo(wh.x, wh.y);
    ctx.stroke();
    ctx.fillStyle = C.skin;
    ctx.beginPath();
    ctx.arc(wh.x, wh.y, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Line-art landmark, base centred on (x, y), `h` px tall. Stroke colour from `color`.
 */
export function drawLandmark(ctx: Ctx, kind: Landmark, x: number, y: number, h: number, color: string, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(h, h);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.035;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  switch (kind) {
    case "lighthouse": {
      // tapered tower with stripes, lantern room, light beams; rocks at the base
      ctx.beginPath();
      ctx.moveTo(-0.17, -0.06);
      ctx.lineTo(-0.11, -0.72);
      ctx.lineTo(0.11, -0.72);
      ctx.lineTo(0.17, -0.06);
      ctx.closePath();
      ctx.stroke();
      for (const [y0, y1] of [[-0.22, -0.32], [-0.46, -0.56]]) {
        const hw0 = 0.17 - (0.06 * -y0) / 0.66;
        const hw1 = 0.17 - (0.06 * -y1) / 0.66;
        ctx.globalAlpha *= 0.45;
        ctx.beginPath();
        ctx.moveTo(-hw0, y0);
        ctx.lineTo(hw0, y0);
        ctx.lineTo(hw1, y1);
        ctx.lineTo(-hw1, y1);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha /= 0.45;
      }
      ctx.beginPath();
      ctx.moveTo(-0.16, -0.72);
      ctx.lineTo(0.16, -0.72);
      ctx.moveTo(-0.08, -0.72);
      ctx.lineTo(-0.08, -0.86);
      ctx.lineTo(0.08, -0.86);
      ctx.lineTo(0.08, -0.72);
      ctx.moveTo(-0.11, -0.86);
      ctx.lineTo(0, -0.97);
      ctx.lineTo(0.11, -0.86);
      ctx.stroke();
      // the light and its beams
      ctx.beginPath();
      ctx.arc(0, -0.79, 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= 0.25;
      ctx.beginPath();
      ctx.moveTo(0, -0.79);
      ctx.lineTo(0.6, -0.9);
      ctx.lineTo(0.6, -0.68);
      ctx.closePath();
      ctx.moveTo(0, -0.79);
      ctx.lineTo(-0.6, -0.9);
      ctx.lineTo(-0.6, -0.68);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha /= 0.25;
      // rocks + waves
      ctx.beginPath();
      ctx.moveTo(-0.38, 0);
      ctx.quadraticCurveTo(-0.28, -0.12, -0.14, -0.06);
      ctx.quadraticCurveTo(0, -0.1, 0.14, -0.06);
      ctx.quadraticCurveTo(0.28, -0.13, 0.38, 0);
      ctx.moveTo(-0.55, 0.02);
      ctx.quadraticCurveTo(-0.47, -0.04, -0.4, 0.02);
      ctx.moveTo(0.4, 0.02);
      ctx.quadraticCurveTo(0.47, -0.04, 0.55, 0.02);
      ctx.stroke();
      break;
    }
    case "eiffel": {
      ctx.beginPath();
      // legs
      ctx.moveTo(-0.34, 0);
      ctx.quadraticCurveTo(-0.12, -0.35, -0.06, -0.72);
      ctx.lineTo(-0.02, -0.95);
      ctx.moveTo(0.34, 0);
      ctx.quadraticCurveTo(0.12, -0.35, 0.06, -0.72);
      ctx.lineTo(0.02, -0.95);
      // arch
      ctx.moveTo(-0.22, -0.02);
      ctx.quadraticCurveTo(0, -0.24, 0.22, -0.02);
      // platforms
      ctx.moveTo(-0.24, -0.26);
      ctx.lineTo(0.24, -0.26);
      ctx.moveTo(-0.11, -0.55);
      ctx.lineTo(0.11, -0.55);
      ctx.moveTo(-0.05, -0.8);
      ctx.lineTo(0.05, -0.8);
      // antenna
      ctx.moveTo(0, -0.95);
      ctx.lineTo(0, -1.05);
      // lattice
      ctx.moveTo(-0.2, -0.26);
      ctx.lineTo(-0.08, -0.55);
      ctx.moveTo(0.2, -0.26);
      ctx.lineTo(0.08, -0.55);
      ctx.stroke();
      break;
    }
    case "atomium": {
      const c = { x: 0, y: -0.62 };
      const ring = Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return { x: Math.cos(a) * 0.36, y: c.y + Math.sin(a) * 0.16 + (i % 2 ? 0.13 : -0.13) };
      });
      const top = { x: 0, y: -1.0 };
      const bottom = { x: 0, y: -0.26 };
      ctx.lineWidth = 0.03;
      ctx.beginPath();
      for (const p of [...ring, top, bottom]) {
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(p.x, p.y);
      }
      ring.forEach((p, i) => {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(i % 2 ? bottom.x : top.x, i % 2 ? bottom.y : top.y);
      });
      // tripod
      ctx.moveTo(bottom.x, bottom.y);
      ctx.lineTo(-0.2, 0);
      ctx.moveTo(bottom.x, bottom.y);
      ctx.lineTo(0.2, 0);
      ctx.moveTo(bottom.x, bottom.y);
      ctx.lineTo(0, 0);
      ctx.stroke();
      for (const p of [c, ...ring, top, bottom]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.06, 0, Math.PI * 2);
        ctx.globalAlpha *= 0.35;
        ctx.fill();
        ctx.globalAlpha /= 0.35;
        ctx.stroke();
      }
      break;
    }
    case "cathedral": {
      ctx.beginPath();
      // two towers
      for (const sx of [-1, 1]) {
        ctx.moveTo(sx * 0.4, 0);
        ctx.lineTo(sx * 0.4, -0.72);
        ctx.lineTo(sx * 0.18, -0.72);
        ctx.lineTo(sx * 0.18, 0);
        // crown
        ctx.moveTo(sx * 0.4, -0.72);
        ctx.lineTo(sx * 0.38, -0.82);
        ctx.lineTo(sx * 0.2, -0.82);
        ctx.lineTo(sx * 0.18, -0.72);
        // tower windows
        ctx.moveTo(sx * 0.29, -0.5);
        ctx.lineTo(sx * 0.29, -0.62);
      }
      // nave + portal
      ctx.moveTo(-0.18, -0.5);
      ctx.lineTo(0.18, -0.5);
      ctx.moveTo(-0.08, 0);
      ctx.lineTo(-0.08, -0.14);
      ctx.quadraticCurveTo(0, -0.24, 0.08, -0.14);
      ctx.lineTo(0.08, 0);
      // central spire behind
      ctx.moveTo(-0.05, -0.5);
      ctx.lineTo(0, -1.05);
      ctx.lineTo(0.05, -0.5);
      ctx.stroke();
      // rose window
      ctx.beginPath();
      ctx.arc(0, -0.34, 0.08, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "skyline": {
      ctx.beginPath();
      const towers: [number, number, number, "flat" | "pyr" | "tri" | "ant"][] = [
        [-0.45, 0.14, 0.5, "flat"],
        [-0.28, 0.16, 0.86, "pyr"], // pyramid-top tower
        [-0.08, 0.17, 1.0, "tri"], // tallest, triangular crown
        [0.13, 0.13, 0.7, "ant"],
        [0.3, 0.15, 0.55, "flat"],
      ];
      for (const [bx, w, h2, top] of towers) {
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx, -h2);
        if (top === "pyr") ctx.lineTo(bx + w / 2, -h2 - 0.12);
        if (top === "tri") ctx.lineTo(bx + w / 2, -h2 - 0.06);
        ctx.lineTo(bx + w, -h2);
        ctx.lineTo(bx + w, 0);
        if (top === "ant") {
          ctx.moveTo(bx + w / 2, -h2);
          ctx.lineTo(bx + w / 2, -h2 - 0.15);
        }
        // windows
        for (let wy = -0.12; wy > -h2 + 0.08; wy -= 0.16) {
          ctx.moveTo(bx + w * 0.3, wy);
          ctx.lineTo(bx + w * 0.7, wy);
        }
      }
      ctx.moveTo(-0.55, 0);
      ctx.lineTo(0.55, 0);
      ctx.stroke();
      break;
    }
    case "hospital": {
      // heart
      ctx.beginPath();
      ctx.moveTo(0, -0.1);
      ctx.bezierCurveTo(-0.55, -0.45, -0.38, -1.0, 0, -0.75);
      ctx.bezierCurveTo(0.38, -1.0, 0.55, -0.45, 0, -0.1);
      ctx.stroke();
      // heartbeat line through it
      ctx.beginPath();
      ctx.moveTo(-0.55, -0.5);
      ctx.lineTo(-0.2, -0.5);
      ctx.lineTo(-0.12, -0.66);
      ctx.lineTo(-0.02, -0.3);
      ctx.lineTo(0.08, -0.6);
      ctx.lineTo(0.14, -0.5);
      ctx.lineTo(0.55, -0.5);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/** Same girl, same dress — the ride changes with the years. Units match drawGirl (s ≈ wheel radius). */
export function drawRider(ctx: Ctx, ride: Ride, x: number, y: number, s: number, pose: GirlPose) {
  if (ride === "bike") drawGirl(ctx, x, y, s, pose);
  else if (ride === "walk") drawWalker(ctx, x, y, s, pose);
  else if (ride === "train") drawTrain(ctx, x, y, s, pose);
  else drawRoadster(ctx, x, y, s, pose);
}

/** Head height (in units of s) for each ride, for speech marks above her head. */
export const RIDE_HEAD: Record<Ride, number> = { bike: 3.9, walk: 3.75, car: 4.0, train: 4.6 };

const SKIN_ARM = "#f1c6a8";

function waveArm(ctx: Ctx, shoulder: { x: number; y: number }, p: number, wave: number) {
  const a = -Math.PI / 2 - 0.35 + Math.sin(p * 3) * 0.35;
  const wh = { x: shoulder.x + Math.cos(a) * 1.15 * wave, y: shoulder.y + Math.sin(a) * 1.15 * wave };
  ctx.strokeStyle = SKIN_ARM;
  ctx.lineWidth = 0.11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y + 0.05);
  ctx.lineTo(wh.x, wh.y);
  ctx.stroke();
  ctx.fillStyle = "#f1c9a8";
  ctx.beginPath();
  ctx.arc(wh.x, wh.y, 0.1, 0, Math.PI * 2);
  ctx.fill();
}

/** On foot with a little lavender backpack (her first years, and Frankfurt). */
function drawWalker(ctx: Ctx, x: number, y: number, s: number, pose: GirlPose) {
  const f = pose.facing ?? 1;
  const p = pose.pedal * 0.75; // stride phase
  const wind = pose.pedal * 0.45;
  const detail = s >= 6;
  ctx.save();
  ctx.translate(x, y - (pose.bob ?? 0) * s);
  if (pose.tilt) ctx.rotate(pose.tilt * f);
  ctx.scale(s * f, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (pose.glow) {
    const g = ctx.createRadialGradient(0, -2.3, 0.2, 0, -2.3, 3.4);
    g.addColorStop(0, "rgba(103,232,249,0.22)");
    g.addColorStop(1, "rgba(103,232,249,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -2.3, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const lean = 0.06;
  const bob = Math.abs(Math.sin(p)) * 0.07;
  const hip = { x: -0.1, y: -2.0 + bob };
  const up = { x: Math.sin(lean), y: -Math.cos(lean) };
  const shoulder = { x: hip.x + up.x * 1.12, y: hip.y + up.y * 1.12 };
  const head = { x: shoulder.x + 0.16, y: shoulder.y - 0.46 };
  const sh = { x: shoulder.x + 0.02, y: shoulder.y + 0.12 };
  const foot = (ph: number) => ({ x: hip.x + Math.sin(ph) * 0.6, y: -0.07 - Math.max(0, Math.cos(ph)) * 0.24 });
  const arm = (ph: number) => {
    const a = -Math.sin(ph) * 0.5;
    const elbow = { x: sh.x + Math.sin(a) * 0.5, y: sh.y + Math.cos(a) * 0.5 };
    const hand = { x: elbow.x + Math.sin(a + 0.35) * 0.46, y: elbow.y + Math.cos(a + 0.35) * 0.46 };
    return { elbow, hand };
  };

  // far arm + far leg (shaded)
  const fa = arm(p + Math.PI);
  ctx.fillStyle = "#dcae8e";
  limb(ctx, sh, fa.elbow, fa.hand, 0.12, 0.085, 0.07);
  const fB = foot(p + Math.PI);
  const ankleB = { x: fB.x - 0.04, y: fB.y - 0.08 };
  const kneeB = joint(hip.x, hip.y, ankleB.x, ankleB.y, 1.0, 0.98, -1);
  ctx.fillStyle = "#d9a585";
  limb(ctx, hip, kneeB, ankleB, 0.36, 0.17, 0.1);
  ctx.fillStyle = "#e58fb0";
  ctx.beginPath();
  ctx.ellipse(fB.x + 0.08, fB.y - 0.03, 0.2, 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // near leg
  const fA = foot(p);
  const ankleA = { x: fA.x - 0.04, y: fA.y - 0.08 };
  const kneeA = joint(hip.x, hip.y, ankleA.x, ankleA.y, 1.0, 0.98, -1);
  const legG = ctx.createLinearGradient(hip.x, hip.y, ankleA.x, ankleA.y);
  legG.addColorStop(0, "#f3cdb3");
  legG.addColorStop(1, "#ebbd9c");
  ctx.fillStyle = legG;
  limb(ctx, hip, kneeA, ankleA, 0.4, 0.18, 0.1);
  ctx.fillStyle = "#f29bbd";
  ctx.beginPath();
  ctx.ellipse(fA.x + 0.08, fA.y - 0.04, 0.21, 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // swishy skater skirt over the hips and thighs
  const DRESS = "#f6b8cf", DRESS_DARK = "#e48fb1";
  const sway = Math.sin(p) * 0.06;
  const waist = { x: hip.x + up.x * 0.5, y: hip.y + up.y * 0.5 };
  const hemY = hip.y + 0.58;
  const hemF = { x: hip.x + 0.52 + sway, y: hemY - 0.04 };
  const hemB = { x: hip.x - 0.58 + sway * 1.5, y: hemY + 0.02 };
  const sk = ctx.createLinearGradient(waist.x - 0.4, waist.y, waist.x + 0.5, hemY);
  sk.addColorStop(0, DRESS_DARK);
  sk.addColorStop(0.6, DRESS);
  sk.addColorStop(1, DRESS_DARK);
  ctx.fillStyle = sk;
  ctx.beginPath();
  ctx.moveTo(waist.x - 0.12, waist.y);
  ctx.lineTo(waist.x + 0.13, waist.y);
  ctx.quadraticCurveTo(hip.x + 0.42, hip.y - 0.05, hemF.x, hemF.y);
  const sc = 7;
  for (let i = 1; i <= sc; i++) {
    const k = i / sc;
    const px = hemF.x + (hemB.x - hemF.x) * k;
    const py = hemF.y + (hemB.y - hemF.y) * k;
    const mk = k - 0.5 / sc;
    ctx.quadraticCurveTo(hemF.x + (hemB.x - hemF.x) * mk, hemF.y + (hemB.y - hemF.y) * mk + 0.08, px, py);
  }
  ctx.quadraticCurveTo(hip.x - 0.45, hip.y - 0.05, waist.x - 0.12, waist.y);
  ctx.closePath();
  ctx.fill();
  if (detail) {
    ctx.strokeStyle = "rgba(200,90,140,0.35)";
    ctx.lineWidth = 0.025;
    for (const k of [-0.25, 0, 0.25]) {
      ctx.beginPath();
      ctx.moveTo(waist.x + k * 0.3, waist.y + 0.05);
      ctx.quadraticCurveTo(hip.x + k * 0.9, hip.y + 0.1, hip.x + k * 1.6 + sway, hemY);
      ctx.stroke();
    }
  }

  // bodice
  drawBodice(ctx, hip, lean, Math.sin(wind * 2.2) * 0.07, detail);

  // long hair, falling behind the backpack
  drawFlowingHair(ctx, head.x, head.y, 0.34, wind * 0.6, detail);

  // lavender backpack on her back
  ctx.save();
  ctx.translate(hip.x, hip.y);
  ctx.rotate(lean);
  ctx.fillStyle = "#8f7cc6";
  ctx.beginPath();
  ctx.roundRect(-0.66, -1.1, 0.52, 0.76, 0.15);
  ctx.fill();
  ctx.fillStyle = "#a998de";
  ctx.beginPath();
  ctx.roundRect(-0.62, -1.06, 0.42, 0.68, 0.13);
  ctx.fill();
  ctx.fillStyle = "#c4b6ef";
  ctx.beginPath();
  ctx.roundRect(-0.55, -0.68, 0.3, 0.24, 0.07);
  ctx.fill();
  ctx.strokeStyle = "#7a68b3";
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.moveTo(-0.53, -0.62);
  ctx.lineTo(-0.27, -0.62);
  ctx.stroke();
  // a little flower charm hanging from the zip
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 0.02;
  ctx.beginPath();
  ctx.moveTo(-0.3, -0.62);
  ctx.lineTo(-0.3 + Math.sin(p) * 0.03, -0.5);
  ctx.stroke();
  if (detail) drawFlower(ctx, "blossom", -0.3 + Math.sin(p) * 0.03, -0.47, 0.06, 1, "#f9a8c9");
  ctx.restore();

  // neck + head
  ctx.strokeStyle = "#efc3a5";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.moveTo(shoulder.x + 0.03, shoulder.y + 0.02);
  ctx.lineTo(head.x - 0.02, head.y + 0.24);
  ctx.stroke();
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.scale(0.34, 0.34);
  drawProfileHead(ctx, wind, detail);
  ctx.restore();

  // backpack strap over the shoulder
  ctx.strokeStyle = "#7a68b3";
  ctx.lineWidth = 0.07;
  ctx.beginPath();
  ctx.moveTo(shoulder.x - 0.12, shoulder.y + 0.02);
  ctx.quadraticCurveTo(shoulder.x + 0.12, shoulder.y + 0.2, hip.x + 0.08, hip.y - 0.55);
  ctx.stroke();

  // near arm, swinging (or waving)
  if (pose.wave && pose.wave > 0.01) waveArm(ctx, shoulder, pose.pedal, pose.wave);
  else {
    const na = arm(p);
    ctx.fillStyle = SKIN_ARM;
    limb(ctx, sh, na.elbow, na.hand, 0.13, 0.09, 0.07);
    if (detail) {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 0.02;
      ctx.beginPath();
      ctx.arc(na.hand.x, na.hand.y - 0.06, 0.045, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Senior era: a little red two-seater roadster, top down, hair in the wind. */
function drawRoadster(ctx: Ctx, x: number, y: number, s: number, pose: GirlPose) {
  const f = pose.facing ?? 1;
  const p = pose.pedal;
  const wind = p * 0.45;
  const detail = s >= 6;
  ctx.save();
  ctx.translate(x, y - (pose.bob ?? 0) * s);
  if (pose.tilt) ctx.rotate(pose.tilt * f * 0.6);
  ctx.scale(s * f * 1.35, s * 1.35);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const bounce = Math.sin(p * 2.3) * 0.015;
  ctx.translate(0, bounce);

  const W1 = { x: -1.75, y: -0.55 }, W2 = { x: 1.85, y: -0.55 };
  const DOOR = -1.36;

  // roll hoops behind the seats
  ctx.strokeStyle = "#3a3540";
  ctx.lineWidth = 0.08;
  ctx.beginPath();
  ctx.moveTo(-1.32, DOOR);
  ctx.quadraticCurveTo(-1.25, -1.8, -0.98, -1.78);
  ctx.quadraticCurveTo(-0.85, -1.7, -0.86, DOOR);
  ctx.stroke();

  // her: seated, leaning back a little, one hand on the wheel
  const lean = -0.1;
  const hip = { x: -0.42, y: -1.12 };
  const up = { x: Math.sin(lean), y: -Math.cos(lean) };
  const shoulder = { x: hip.x + up.x * 1.12, y: hip.y + up.y * 1.12 };
  const head = { x: shoulder.x + 0.16, y: shoulder.y - 0.46 };
  drawFlowingHair(ctx, head.x, head.y, 0.34, wind * 1.3, detail);
  drawBodice(ctx, hip, lean, Math.sin(wind * 2.2) * 0.07, detail);
  // steering wheel
  ctx.strokeStyle = "#2a2530";
  ctx.lineWidth = 0.07;
  ctx.beginPath();
  ctx.ellipse(0.28, -1.62, 0.07, 0.24, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  const sh = { x: shoulder.x + 0.04, y: shoulder.y + 0.12 };
  const hand = { x: 0.24, y: -1.78 };
  if (!(pose.wave && pose.wave > 0.01)) {
    const elbow = joint(sh.x, sh.y, hand.x, hand.y, 0.48, 0.46, 1);
    ctx.fillStyle = SKIN_ARM;
    limb(ctx, sh, elbow, hand, 0.13, 0.09, 0.07);
    ctx.fillStyle = "#f3cdb3";
    ctx.beginPath();
    ctx.ellipse(hand.x, hand.y, 0.07, 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#efc3a5";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.moveTo(shoulder.x + 0.03, shoulder.y + 0.02);
  ctx.lineTo(head.x - 0.02, head.y + 0.24);
  ctx.stroke();
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.scale(0.34, 0.34);
  drawProfileHead(ctx, wind, detail);
  // heart-shaped sunglasses pushed up in the hair
  ctx.fillStyle = "#2a1d2e";
  ctx.beginPath();
  ctx.ellipse(0.25, -0.95, 0.24, 0.12, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---- the car: long bonnet, short tail, glossy red paint ----
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-2.62, -0.42);
    ctx.quadraticCurveTo(-2.88, -0.46, -2.9, -0.7);
    ctx.lineTo(-2.9, -0.92);
    ctx.quadraticCurveTo(-2.86, -1.28, -2.42, -1.37);
    ctx.lineTo(-1.05, -1.4);
    ctx.lineTo(0.55, DOOR);
    ctx.quadraticCurveTo(1.55, -1.34, 2.32, -1.16);
    ctx.quadraticCurveTo(2.98, -1.02, 3.06, -0.76);
    ctx.quadraticCurveTo(3.1, -0.5, 2.86, -0.42);
    ctx.closePath();
  };
  // soft contact shadow under the car
  const sh2 = ctx.createRadialGradient(0.05, -0.02, 0.2, 0.05, -0.02, 3.2);
  sh2.addColorStop(0, "rgba(20,10,30,0.35)");
  sh2.addColorStop(1, "rgba(20,10,30,0)");
  ctx.fillStyle = sh2;
  ctx.beginPath();
  ctx.ellipse(0.05, -0.02, 3.3, 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  const paint = ctx.createLinearGradient(0, -1.42, 0, -0.42);
  paint.addColorStop(0, "#ff6b7d");
  paint.addColorStop(0.16, "#e8203f");
  paint.addColorStop(0.55, "#b3122c");
  paint.addColorStop(1, "#5c0614");
  body();
  ctx.fillStyle = paint;
  ctx.fill();

  ctx.save();
  body();
  ctx.clip();
  // sky reflected on the top surfaces
  ctx.strokeStyle = "rgba(205,228,255,0.55)";
  ctx.lineWidth = 0.09;
  ctx.beginPath();
  ctx.moveTo(-2.8, -1.2);
  ctx.quadraticCurveTo(-2.7, -1.36, -2.4, -1.39);
  ctx.lineTo(-1.05, -1.42);
  ctx.moveTo(0.6, -1.38);
  ctx.quadraticCurveTo(1.55, -1.36, 2.32, -1.18);
  ctx.quadraticCurveTo(2.9, -1.05, 3.02, -0.86);
  ctx.stroke();
  // crisp shoulder highlight (the character line)
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.moveTo(-2.75, -1.02);
  ctx.quadraticCurveTo(0, -1.12, 2.75, -0.98);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.moveTo(-2.8, -1.14);
  ctx.quadraticCurveTo(0, -1.24, 2.8, -1.08);
  ctx.lineTo(2.8, -1.0);
  ctx.quadraticCurveTo(0, -1.14, -2.8, -1.05);
  ctx.closePath();
  ctx.fill();
  // anime gloss streaks
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  for (const sx of [-1.4, 0.2, 1.6]) {
    ctx.beginPath();
    ctx.moveTo(sx, -1.45);
    ctx.lineTo(sx + 0.18, -1.45);
    ctx.lineTo(sx - 0.25, -0.4);
    ctx.lineTo(sx - 0.43, -0.4);
    ctx.closePath();
    ctx.fill();
  }
  // darker sill
  ctx.fillStyle = "rgba(40,0,10,0.38)";
  ctx.fillRect(-3, -0.64, 6.2, 0.24);
  // a light sweep across the paint (on reveal)
  if (pose.shine && pose.shine > 0) {
    const sx = -3.2 + (1 - pose.shine) * 6.6;
    const sg = ctx.createLinearGradient(sx - 0.5, 0, sx + 0.5, 0);
    sg.addColorStop(0, "rgba(255,255,255,0)");
    sg.addColorStop(0.5, "rgba(255,255,255,0.75)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(sx - 0.3, -1.5);
    ctx.lineTo(sx + 0.5, -1.5);
    ctx.lineTo(sx + 0.1, -0.35);
    ctx.lineTo(sx - 0.7, -0.35);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  body();
  ctx.strokeStyle = "#3e0410";
  ctx.lineWidth = 0.04;
  ctx.stroke();

  // wheel wells
  ctx.fillStyle = "#140c18";
  for (const W of [W1, W2]) {
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.68, Math.PI, 0);
    ctx.lineTo(W.x + 0.68, -0.43);
    ctx.lineTo(W.x - 0.68, -0.43);
    ctx.closePath();
    ctx.fill();
    // flared arch lip catching the light
    ctx.strokeStyle = "rgba(255,140,155,0.55)";
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.7, Math.PI * 1.08, Math.PI * 1.75);
    ctx.stroke();
  }
  // wheels: tyre, sidewall shine, ten-spoke silver rims, red caliper
  for (const W of [W1, W2]) {
    ctx.fillStyle = "#1b1820";
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.47, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();
    const rim = ctx.createRadialGradient(W.x - 0.12, W.y - 0.12, 0.02, W.x, W.y, 0.38);
    rim.addColorStop(0, "#ffffff");
    rim.addColorStop(0.6, "#c9cfda");
    rim.addColorStop(1, "#6f7888");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.37, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2b2f38";
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d63048";
    ctx.lineWidth = 0.09;
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.2, Math.PI * 1.15, Math.PI * 1.6);
    ctx.stroke();
    ctx.strokeStyle = "#e3e7ee";
    ctx.lineWidth = 0.045;
    for (let k = 0; k < 10; k++) {
      const a = p * 1.4 + (k * Math.PI * 2) / 10 + (k % 2) * 0.12;
      ctx.beginPath();
      ctx.moveTo(W.x + Math.cos(a) * 0.08, W.y + Math.sin(a) * 0.08);
      ctx.lineTo(W.x + Math.cos(a) * 0.32, W.y + Math.sin(a) * 0.32);
      ctx.stroke();
    }
    ctx.fillStyle = "#9aa3b2";
    ctx.beginPath();
    ctx.arc(W.x, W.y, 0.075, 0, Math.PI * 2);
    ctx.fill();
  }
  // door seam, handle, vent, mirror
  ctx.strokeStyle = "rgba(60,4,16,0.6)";
  ctx.lineWidth = 0.03;
  ctx.beginPath();
  ctx.moveTo(0.42, DOOR + 0.04);
  ctx.quadraticCurveTo(0.52, -0.9, 0.3, -0.6);
  ctx.moveTo(-0.98, -1.38);
  ctx.lineTo(-1.02, -0.66);
  ctx.stroke();
  ctx.fillStyle = "#d8dde6";
  ctx.fillRect(-0.42, -1.14, 0.26, 0.045);
  ctx.fillStyle = "#1a0d14";
  ctx.beginPath();
  ctx.moveTo(1.02, -0.98);
  ctx.lineTo(1.24, -0.95);
  ctx.lineTo(1.16, -0.78);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1a0d14";
  ctx.lineWidth = 0.04;
  ctx.beginPath();
  ctx.moveTo(0.55, DOOR);
  ctx.lineTo(0.62, DOOR - 0.1);
  ctx.stroke();
  ctx.fillStyle = "#d61f3c";
  ctx.beginPath();
  ctx.ellipse(0.68, DOOR - 0.14, 0.13, 0.08, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // front: smiling grille mouth + slim swept headlight with a soft glow
  ctx.fillStyle = "#170a12";
  ctx.beginPath();
  ctx.moveTo(3.06, -0.74);
  ctx.quadraticCurveTo(2.84, -0.76, 2.8, -0.58);
  ctx.quadraticCurveTo(2.94, -0.47, 3.07, -0.52);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.shadowColor = "rgba(255,250,235,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.moveTo(2.32, -1.12);
  ctx.quadraticCurveTo(2.65, -1.08, 2.9, -0.98);
  ctx.lineTo(2.84, -0.93);
  ctx.quadraticCurveTo(2.6, -0.98, 2.38, -1.04);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // rear: tail light + chrome exhaust tip
  ctx.fillStyle = "#ff4d63";
  ctx.beginPath();
  ctx.ellipse(-2.78, -1.1, 0.1, 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,200,205,0.8)";
  ctx.beginPath();
  ctx.arc(-2.8, -1.13, 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8ced8";
  ctx.beginPath();
  ctx.ellipse(-2.62, -0.44, 0.12, 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  // windscreen with a chrome frame
  ctx.fillStyle = "rgba(190,225,255,0.32)";
  ctx.beginPath();
  ctx.moveTo(0.54, DOOR);
  ctx.lineTo(0.16, -1.98);
  ctx.lineTo(0.05, -1.96);
  ctx.lineTo(0.38, DOOR);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e5e9f0";
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.moveTo(0.54, DOOR);
  ctx.lineTo(0.15, -1.99);
  ctx.lineTo(0.03, -1.97);
  ctx.stroke();
  // twinkles on the paint
  if (detail) {
    for (const [gx, gy, ph] of [[1.7, -1.22, 0], [-1.9, -1.33, 2.1]] as const) {
      const a = Math.max(0, Math.sin(p * 0.9 + ph));
      if (a < 0.05) continue;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      const r = 0.12 * a;
      ctx.beginPath();
      ctx.moveTo(gx, gy - r);
      ctx.lineTo(gx + r * 0.25, gy - r * 0.25);
      ctx.lineTo(gx + r, gy);
      ctx.lineTo(gx + r * 0.25, gy + r * 0.25);
      ctx.lineTo(gx, gy + r);
      ctx.lineTo(gx - r * 0.25, gy + r * 0.25);
      ctx.lineTo(gx - r, gy);
      ctx.lineTo(gx - r * 0.25, gy - r * 0.25);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (pose.wave && pose.wave > 0.01) waveArm(ctx, shoulder, p, pose.wave);
  ctx.restore();
}

/** Little friendly faces in the other windows (the lovely people from the Frankfurt years). */
function drawFriend(ctx: Ctx, x: number, y: number, hair: string, skin: string, top: string, p: number, waving: boolean, longHair: boolean) {
  // shoulders
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(x, y + 0.42, 0.3, 0.2, 0, Math.PI, 0);
  ctx.fill();
  if (longHair) {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(x - 0.04, y + 0.1, 0.24, 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x - 0.01, y - 0.05, 0.21, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(x + 0.05, y - 0.1, x - 0.2, y - 0.02);
  ctx.fill();
  // happy closed eyes + smile
  ctx.strokeStyle = "#2b1a33";
  ctx.lineWidth = 0.025;
  ctx.lineCap = "round";
  for (const ex of [-0.07, 0.07]) {
    ctx.beginPath();
    ctx.arc(x + ex, y + 0.02, 0.035, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y + 0.07, 0.05, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = "rgba(240,120,145,0.45)";
  ctx.beginPath();
  ctx.arc(x - 0.12, y + 0.07, 0.035, 0, Math.PI * 2);
  ctx.arc(x + 0.12, y + 0.07, 0.035, 0, Math.PI * 2);
  ctx.fill();
  if (waving) {
    const a = Math.sin(p * 2) * 0.35;
    ctx.strokeStyle = skin;
    ctx.lineWidth = 0.07;
    ctx.beginPath();
    ctx.moveTo(x + 0.2, y + 0.35);
    ctx.lineTo(x + 0.28 + Math.sin(a) * 0.1, y - 0.12);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x + 0.28 + Math.sin(a) * 0.1, y - 0.16, 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Frankfurt years: a little white regional train, Ikrame leaning out of the window, friends inside. */
function drawTrain(ctx: Ctx, x: number, y: number, s: number, pose: GirlPose) {
  const f = pose.facing ?? 1;
  const p = pose.pedal;
  const wind = p * 0.45;
  const detail = s >= 6;
  ctx.save();
  ctx.translate(x, y - (pose.bob ?? 0) * s);
  if (pose.tilt) ctx.rotate(pose.tilt * f * 0.5);
  ctx.scale(s * f * 1.45, s * 1.45);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.translate(0, Math.sin(p * 3.1) * 0.012);

  const L = -3.4, TOP = -3.25, BOT = -0.5;
  const shell = () => {
    ctx.beginPath();
    ctx.moveTo(L, BOT);
    ctx.lineTo(L, TOP + 0.2);
    ctx.quadraticCurveTo(L, TOP, L + 0.25, TOP);
    ctx.lineTo(1.7, TOP);
    ctx.quadraticCurveTo(2.55, TOP + 0.05, 2.95, -1.7);
    ctx.quadraticCurveTo(3.1, -1.1, 3.05, -0.75);
    ctx.quadraticCurveTo(3.02, BOT, 2.8, BOT);
    ctx.closePath();
  };
  // contact shadow
  ctx.fillStyle = "rgba(20,10,30,0.28)";
  ctx.beginPath();
  ctx.ellipse(-0.2, -0.04, 3.5, 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // bogies + wheels
  for (const bx of [-2.4, 1.8]) {
    ctx.fillStyle = "#3a3f4b";
    ctx.fillRect(bx - 0.75, -0.62, 1.5, 0.22);
    for (const wx of [bx - 0.42, bx + 0.42]) {
      ctx.fillStyle = "#2b2f38";
      ctx.beginPath();
      ctx.arc(wx, -0.3, 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9aa3b2";
      ctx.lineWidth = 0.04;
      ctx.beginPath();
      ctx.arc(wx, -0.3, 0.17, 0, Math.PI * 2);
      const a = p * 2.2;
      ctx.moveTo(wx + Math.cos(a) * 0.17, -0.3 + Math.sin(a) * 0.17);
      ctx.lineTo(wx - Math.cos(a) * 0.17, -0.3 - Math.sin(a) * 0.17);
      ctx.stroke();
    }
  }
  // pantograph on the roof
  ctx.strokeStyle = "#4b5160";
  ctx.lineWidth = 0.04;
  const pz = Math.sin(p * 0.7) * 0.03;
  ctx.beginPath();
  ctx.moveTo(-1.6, TOP);
  ctx.lineTo(-1.2, TOP - 0.45 + pz);
  ctx.lineTo(-0.8, TOP);
  ctx.moveTo(-1.55, TOP - 0.47 + pz);
  ctx.lineTo(-0.85, TOP - 0.47 + pz);
  ctx.stroke();

  // white body with a soft gradient
  const bodyG = ctx.createLinearGradient(0, TOP, 0, BOT);
  bodyG.addColorStop(0, "#ffffff");
  bodyG.addColorStop(0.6, "#eef1f6");
  bodyG.addColorStop(1, "#c9cfda");
  shell();
  ctx.fillStyle = bodyG;
  ctx.fill();
  ctx.save();
  shell();
  ctx.clip();
  // red band + grey skirt
  ctx.fillStyle = "#d8283f";
  ctx.fillRect(L, -1.42, 7, 0.26);
  ctx.fillStyle = "#f05d72";
  ctx.fillRect(L, -1.42, 7, 0.05);
  ctx.fillStyle = "#8a92a2";
  ctx.fillRect(L, -0.82, 7, 0.32);
  // roof shading
  ctx.fillStyle = "rgba(180,195,220,0.45)";
  ctx.fillRect(L, TOP, 7, 0.16);
  ctx.restore();
  shell();
  ctx.strokeStyle = "#5c6475";
  ctx.lineWidth = 0.04;
  ctx.stroke();

  // windows: two with friends, an open one with her, then the cab
  const winY = -2.75, winH = 0.95;
  const glass = (x0: number, w: number) => {
    const g = ctx.createLinearGradient(0, winY, 0, winY + winH);
    g.addColorStop(0, "#8fb6e3");
    g.addColorStop(1, "#3c5c8f");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x0, winY, w, winH, 0.12);
    ctx.fill();
  };
  const friends: [number, string, string, string, boolean, boolean][] = [
    [-1.55, "#3b2a24", "#f1cdb3", "#7da7d9", false, true],
    [-1.05, "#d9b46a", "#f6d7c0", "#f4a6b8", true, false],
    [0.35, "#1f1a1c", "#c99a78", "#8bc7a4", false, false],
    [0.9, "#8a6440", "#f5d5bf", "#e8c27a", true, true],
  ];
  glass(0.05, 1.15);
  glass(-1.85, 1.0);
  for (const [fx, hc, sk, tc, wv, lh] of friends) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(fx < -0.5 ? -1.85 : 0.05, winY, fx < -0.5 ? 1.0 : 1.15, winH, 0.12);
    ctx.clip();
    drawFriend(ctx, fx, winY + 0.45, hc, sk, tc, p + fx, wv, lh);
    ctx.restore();
  }
  // glass shine
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  for (const x0 of [0.05, -1.85]) {
    ctx.beginPath();
    ctx.moveTo(x0 + 0.15, winY);
    ctx.lineTo(x0 + 0.35, winY);
    ctx.lineTo(x0 + 0.05, winY + winH);
    ctx.lineTo(x0 - 0.15 + 0.15, winY + winH);
    ctx.closePath();
    ctx.fill();
  }
  // door with yellow handrails
  ctx.strokeStyle = "#9aa3b2";
  ctx.lineWidth = 0.035;
  ctx.strokeRect(-0.7, -2.9, 0.62, 2.3);
  ctx.fillStyle = "rgba(143,182,227,0.8)";
  ctx.fillRect(-0.62, -2.8, 0.2, 0.9);
  ctx.fillRect(-0.36, -2.8, 0.2, 0.9);
  ctx.fillStyle = "#f2c94c";
  ctx.fillRect(-0.4, -1.75, 0.04, 0.5);
  // her open window, at the back
  glass(-3.15, 1.0);
  // driver cab window, sloped
  ctx.fillStyle = "#2e4670";
  ctx.beginPath();
  ctx.moveTo(1.45, -2.8);
  ctx.lineTo(2.25, -2.8);
  ctx.quadraticCurveTo(2.7, -2.5, 2.88, -1.85);
  ctx.lineTo(1.45, -1.85);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(1.6, -2.8);
  ctx.lineTo(1.8, -2.8);
  ctx.lineTo(1.6, -1.85);
  ctx.lineTo(1.45, -1.85);
  ctx.closePath();
  ctx.fill();
  // headlight
  ctx.save();
  ctx.shadowColor = "rgba(255,250,230,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.ellipse(2.82, -1.12, 0.13, 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ikrame leaning out of her window, hair in the wind
  const hip = { x: -2.75, y: -1.75 };
  const lean = 0.18;
  const up = { x: Math.sin(lean), y: -Math.cos(lean) };
  const shoulder = { x: hip.x + up.x * 1.12, y: hip.y + up.y * 1.12 };
  const head = { x: shoulder.x + 0.18, y: shoulder.y - 0.46 };
  drawFlowingHair(ctx, head.x, head.y, 0.34, wind, detail);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-5, -5, 10, 5 - (-winY - winH));
  ctx.clip();
  drawBodice(ctx, hip, lean, Math.sin(wind * 2.2) * 0.07, detail);
  ctx.restore();
  ctx.strokeStyle = "#efc3a5";
  ctx.lineWidth = 0.1;
  ctx.beginPath();
  ctx.moveTo(shoulder.x + 0.03, shoulder.y + 0.02);
  ctx.lineTo(head.x - 0.02, head.y + 0.24);
  ctx.stroke();
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.scale(0.34, 0.34);
  drawProfileHead(ctx, wind, detail);
  ctx.restore();
  // arm resting on the window frame (or waving)
  if (pose.wave && pose.wave > 0.01) waveArm(ctx, shoulder, p, pose.wave);
  else {
    const sh = { x: shoulder.x + 0.04, y: shoulder.y + 0.12 };
    const elbow = { x: sh.x + 0.16, y: winY + 0.05 };
    const hand = { x: elbow.x + 0.24, y: winY - 0.02 };
    ctx.fillStyle = SKIN_ARM;
    limb(ctx, sh, elbow, hand, 0.13, 0.09, 0.07);
  }
  // window frame over her waist
  ctx.fillStyle = "#e6eaf1";
  ctx.fillRect(-3.2, winY - 0.04, 1.1, 0.07);

  // little hearts drifting up from the friends' windows
  if (detail) {
    for (let i = 0; i < 3; i++) {
      const ph = (p * 0.18 + i / 3) % 1;
      const hx = -1.4 + i * 0.85 - ph * 0.8;
      const hy = winY - 0.1 - ph * 1.4;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.85;
      ctx.fillStyle = i % 2 ? "#f9a8c9" : "#fb7185";
      const r = 0.09;
      ctx.beginPath();
      ctx.moveTo(hx, hy + r);
      ctx.bezierCurveTo(hx - r * 2, hy - r * 0.4, hx - r * 0.6, hy - r * 1.6, hx, hy - r * 0.5);
      ctx.bezierCurveTo(hx + r * 0.6, hy - r * 1.6, hx + r * 2, hy - r * 0.4, hx, hy + r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
