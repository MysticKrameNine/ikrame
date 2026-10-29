// The dreamy hero illustration: Ikrame seen from behind, a pink bicycle overflowing with flowers,
// looking up at the moon while petals float out of the basket and turn into stars.
// Drawn in a 560 × 700 logical space; ground at y = 680.

import { drawHairMass, LOOK } from "./avatar";

type Ctx = CanvasRenderingContext2D;

export const SCENE_W = 560;
export const SCENE_H = 700;

/* ---------------- flowers ---------------- */

export type FlowerKind = "rose" | "daisy" | "blossom" | "peony";

export function drawFlower(ctx: Ctx, kind: FlowerKind, x: number, y: number, r: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (kind === "rose" || kind === "peony") {
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, "#fff1f5");
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, -0.18));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    // swirl of petals
    ctx.strokeStyle = shade(color, -0.25);
    ctx.globalAlpha *= 0.55;
    ctx.lineWidth = r * 0.09;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let a = 0; a < Math.PI * (kind === "rose" ? 4.2 : 3); a += 0.2) {
      const rr = r * (0.12 + a / (Math.PI * (kind === "rose" ? 5 : 3.6)));
      const px = Math.cos(a) * rr * 0.9;
      const py = Math.sin(a) * rr * 0.8;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha /= 0.55;
  } else if (kind === "daisy") {
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.58, r * 0.17, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#f8c54a";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.5, r * 0.36, r * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawLeaf(ctx: Ctx, x: number, y: number, len: number, rot: number, color = "#7fb88a") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawLavender(ctx: Ctx, x: number, y: number, len: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = "#7fa886";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -len);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const yy = -len * (0.45 + i * 0.08);
    ctx.fillStyle = i % 2 ? "#b39ddb" : "#9575cd";
    ctx.beginPath();
    ctx.ellipse(-2, yy, 2.4, 3.4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(2, yy - 2, 2.4, 3.4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}

// a seeded, stable bouquet so flowers don't jump between frames
function seeded(i: number) {
  const x = Math.sin(i * 91.37 + 7.1) * 43758.5453;
  return x - Math.floor(x);
}

const FLOWER_COLORS = ["#f9a8c9", "#f472b6", "#fbcfe0", "#ffffff", "#fda4af", "#f0abfc"];

/* ---------------- petals → stars ---------------- */

export type Petal = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; size: number; color: string };

export function spawnPetal(from: { x: number; y: number }): Petal {
  return {
    x: from.x + (Math.random() - 0.5) * 40,
    y: from.y + (Math.random() - 0.5) * 16,
    vx: 0.25 + Math.random() * 0.5,
    vy: -(0.6 + Math.random() * 0.7),
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.06,
    life: 1,
    size: 3 + Math.random() * 4,
    color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
  };
}

export function stepAndDrawPetals(ctx: Ctx, petals: Petal[], target: { x: number; y: number }, t: number) {
  for (const p of petals) {
    // drift toward the moon with a gentle wobble
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    p.vx += (dx / d) * 0.012 + Math.sin(t * 2 + p.rot) * 0.01;
    p.vy += (dy / d) * 0.012;
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    if (d < 120) p.life -= 0.012;
    else p.life -= 0.0018;

    const starness = Math.max(0, Math.min(1, 1 - (d - 40) / 220)); // petals turn into stars near the moon
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
    if (starness < 0.7) {
      ctx.rotate(p.rot);
      ctx.scale(1, 0.6 + 0.4 * Math.cos(t * 3 + p.rot * 3));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, p.size);
      ctx.bezierCurveTo(-p.size, p.size * 0.3, -p.size * 0.7, -p.size * 0.8, 0, -p.size * 0.5);
      ctx.bezierCurveTo(p.size * 0.7, -p.size * 0.8, p.size, p.size * 0.3, 0, p.size);
      ctx.fill();
    }
    if (starness > 0.3) {
      const s = p.size * (0.6 + starness * 0.6);
      ctx.globalAlpha *= starness;
      ctx.fillStyle = "#fff8e6";
      ctx.shadowColor = "#fff3c4";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
    }
    ctx.restore();
  }
  for (let i = petals.length - 1; i >= 0; i--) if (petals[i].life <= 0) petals.splice(i, 1);
}

/* ---------------- the scene ---------------- */

export const BASKET_MOUTH = { x: 345, y: 478 };

/**
 * Draws the whole figure + bike (no background). `t` = time in seconds, `wind` 0..1 strength.
 */
export function drawHeroScene(ctx: Ctx, t: number, wind: number) {
  const gust = Math.sin(t * 0.8) * 0.5 + Math.sin(t * 1.9) * 0.25;
  const W = wind * (1 + gust * 0.4);

  // soft dreamy glow behind her
  const glow = ctx.createRadialGradient(260, 480, 20, 260, 480, 230);
  glow.addColorStop(0, "rgba(255,228,236,0.35)");
  glow.addColorStop(0.5, "rgba(249,168,212,0.10)");
  glow.addColorStop(1, "rgba(249,168,212,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(260, 480, 230, 0, Math.PI * 2);
  ctx.fill();

  // ground: a little moonlit path with wildflowers
  const path = ctx.createRadialGradient(260, 676, 10, 260, 676, 220);
  path.addColorStop(0, "rgba(255,240,230,0.30)");
  path.addColorStop(1, "rgba(255,240,230,0)");
  ctx.fillStyle = path;
  ctx.beginPath();
  ctx.ellipse(260, 676, 220, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 22; i++) {
    const gx = 70 + seeded(i + 300) * 400;
    const gy = 668 + seeded(i + 400) * 18;
    const sway = Math.sin(t * 1.5 + i) * 2 * wind;
    ctx.strokeStyle = "rgba(127,184,138,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + sway, gy - 8, gx + sway * 1.5, gy - 14 - seeded(i) * 10);
    ctx.stroke();
    if (i % 3 === 0) drawFlower(ctx, i % 2 ? "daisy" : "blossom", gx + sway * 1.5, gy - 16 - seeded(i) * 10, 3.2, i, i % 2 ? "#ffffff" : "#f9a8c9");
  }

  // shadows
  ctx.fillStyle = "rgba(10,10,30,0.35)";
  ctx.beginPath();
  ctx.ellipse(300, 684, 120, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(175, 682, 48, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBike(ctx, t, W);
  drawGirlFromBehind(ctx, t, W);
  drawBasketFlowers(ctx, t, W);
}

function wheel(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, spin: number) {
  // tyre
  ctx.strokeStyle = "#5b5363";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#fdf2f6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  // spokes
  ctx.strokeStyle = "rgba(255,240,245,0.55)";
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 12; k++) {
    const a = spin + (k * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (rx - 5), cy + Math.sin(a) * (ry - 5));
    ctx.stroke();
  }
  ctx.fillStyle = "#e5d9df";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

const PINK = "#f6a5c4";
const PINK_DARK = "#e47fa7";
const PINK_LIGHT = "#ffd3e3";

function drawBike(ctx: Ctx, t: number, W: number) {
  // rear wheel (closer, seen a bit from behind) and front wheel (further, more side-on)
  wheel(ctx, 222, 605, 34, 76, 0);
  wheel(ctx, 365, 575, 56, 70, 0);

  // pink fenders
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(222, 605, 40, 84, 0, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(365, 575, 63, 78, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  // little red reflector
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(214, 548, 12, 8);

  // frame: step-through, pink with a highlight line
  const tube = (pts: [number, number][], w: number) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = PINK_DARK;
    ctx.lineWidth = w + 2;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.strokeStyle = PINK;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.strokeStyle = PINK_LIGHT;
    ctx.lineWidth = w * 0.3;
    ctx.stroke();
  };
  tube([[222, 605], [262, 590]], 6); // chain stay
  tube([[222, 605], [236, 500]], 6); // seat stay
  tube([[236, 495], [262, 590]], 7); // seat tube
  tube([[262, 590], [300, 520], [345, 488]], 8); // swooping down tube
  tube([[345, 470], [352, 520], [365, 575]], 6); // head tube + fork

  // crank + pedal
  ctx.fillStyle = "#cbbfc7";
  ctx.beginPath();
  ctx.arc(262, 590, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8b7f88";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(262, 590);
  ctx.lineTo(250, 618);
  ctx.stroke();
  ctx.fillStyle = "#4b4452";
  ctx.fillRect(238, 616, 22, 6);

  // saddle (brown leather)
  ctx.strokeStyle = "#8b7f88";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(236, 495);
  ctx.lineTo(234, 478);
  ctx.stroke();
  const sg = ctx.createLinearGradient(0, 466, 0, 484);
  sg.addColorStop(0, "#9a6a48");
  sg.addColorStop(1, "#5e3c27");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(232, 474, 26, 10, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // handlebar (cream grips)
  ctx.strokeStyle = "#d7c9d1";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(345, 470);
  ctx.lineTo(346, 456);
  ctx.moveTo(316, 458);
  ctx.quadraticCurveTo(346, 448, 376, 452);
  ctx.stroke();
  ctx.strokeStyle = "#fff4e8";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(312, 459);
  ctx.lineTo(322, 456);
  ctx.moveTo(372, 452);
  ctx.lineTo(384, 452);
  ctx.stroke();

  // flower vine winding around the frame
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    const x = 262 + (345 - 262) * k;
    const y = 590 + (488 - 590) * k - Math.sin(k * Math.PI) * 30;
    drawLeaf(ctx, x, y, 9, (i % 2 ? -1 : 1) * 0.9 + Math.sin(t + i) * 0.1 * W);
    if (i % 2 === 0) drawFlower(ctx, "blossom", x + 3, y - 4, 4.5, i, i % 4 ? "#ffffff" : "#f9a8c9");
  }
  for (let i = 0; i < 4; i++) {
    const y = 500 + i * 25;
    drawLeaf(ctx, 236 + (262 - 236) * (i / 3), y, 8, (i % 2 ? -1.2 : 1.2));
    if (i % 2) drawFlower(ctx, "blossom", 236 + (262 - 236) * (i / 3) + 3, y, 4, i, "#fbcfe0");
  }
}

function drawBasketFlowers(ctx: Ctx, t: number, W: number) {
  // wicker basket hanging from the handlebar
  const bx = 318, by = 470, bw = 64, bh = 44;
  const g = ctx.createLinearGradient(0, by, 0, by + bh);
  g.addColorStop(0, "#d9a774");
  g.addColorStop(1, "#a8764a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bw, by - 4);
  ctx.lineTo(bx + bw - 6, by + bh);
  ctx.lineTo(bx + 6, by + bh + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(110,70,40,0.55)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const yy = by + (bh * i) / 5;
    ctx.beginPath();
    ctx.moveTo(bx + 2 + i * 0.8, yy);
    ctx.lineTo(bx + bw - 2 - i * 0.8, yy - 4 + (i * 4) / 5);
    ctx.stroke();
  }
  for (let i = 1; i < 7; i++) {
    const xx = bx + (bw * i) / 7;
    ctx.beginPath();
    ctx.moveTo(xx, by - (4 * i) / 7);
    ctx.lineTo(xx + (i < 3.5 ? 2 : -2), by + bh);
    ctx.stroke();
  }
  ctx.strokeStyle = "#f6dcc0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx - 2, by);
  ctx.lineTo(bx + bw + 2, by - 4);
  ctx.stroke();

  // the overflowing bouquet
  const sway = Math.sin(t * 1.4) * 2 * W;
  for (let i = 0; i < 10; i++) drawLeaf(ctx, bx + 6 + seeded(i) * (bw - 4), by - 2, 14 + seeded(i + 9) * 8, -Math.PI / 2 + (seeded(i + 3) - 0.5) * 2.2 + sway * 0.02);
  for (let i = 0; i < 5; i++) drawLavender(ctx, bx + 12 + i * 11, by, 34 + seeded(i + 40) * 16, (seeded(i + 50) - 0.5) * 0.7 + sway * 0.01);
  const kinds: ("rose" | "daisy" | "blossom" | "peony")[] = ["peony", "rose", "daisy", "rose", "blossom", "peony", "daisy", "rose", "blossom", "daisy", "rose", "peony", "daisy", "blossom"];
  kinds.forEach((k, i) => {
    const fx = bx + 2 + seeded(i + 11) * (bw + 6) + sway * (0.3 + seeded(i) * 0.4);
    const fy = by - 4 - seeded(i + 21) * 26;
    const r = k === "peony" ? 11 : k === "rose" ? 9 : k === "daisy" ? 8 : 5;
    const col = k === "daisy" ? "#ffffff" : FLOWER_COLORS[i % FLOWER_COLORS.length];
    drawFlower(ctx, k, fx, fy, r, seeded(i + 31) * 6, col === "#ffffff" && k !== "daisy" ? "#fbcfe0" : col);
  });
  // baby's breath
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(bx + seeded(i + 60) * (bw + 10) - 4 + sway * 0.5, by - 10 - seeded(i + 70) * 34, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // a few flowers spilling over the front of the basket
  drawFlower(ctx, "blossom", bx + bw - 4, by + 12, 6, 1, "#f9a8c9");
  drawLeaf(ctx, bx + bw - 2, by + 18, 12, 0.8);
  drawFlower(ctx, "daisy", bx + 10, by + 30, 5, 0, "#ffffff");
}

function drawGirlFromBehind(ctx: Ctx, t: number, W: number) {
  const breathe = Math.sin(t * 1.6) * 0.8;
  const cx = 175;

  // legs: dark floral tights, white high-top sneakers
  ctx.lineCap = "round";
  const legs: [number, number, number, number][] = [
    [cx - 14, 540, cx - 22, 668],
    [cx + 14, 540, cx + 20, 666],
  ];
  for (const [hx, hy, fx, fy] of legs) {
    const lg = ctx.createLinearGradient(hx, hy, fx, fy);
    lg.addColorStop(0, "#2a2434");
    lg.addColorStop(1, "#3a3346");
    ctx.strokeStyle = lg;
    ctx.lineWidth = 19;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo((hx + fx) / 2 + (hx < cx ? -3 : 3), (hy + fy) / 2, fx, fy - 12);
    ctx.stroke();
    ctx.fillStyle = "rgba(170,140,200,0.35)";
    for (const k of [0.35, 0.62]) {
      ctx.beginPath();
      ctx.arc(hx + (fx - hx) * k, hy + (fy - hy) * k, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // sneaker seen from behind
    ctx.fillStyle = LOOK.shoe;
    ctx.beginPath();
    ctx.roundRect(fx - 12, fy - 22, 24, 22, 7);
    ctx.fill();
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(fx - 13, fy - 4, 26, 5);
  }

  // left arm (hanging, slightly away from the body)
  ctx.strokeStyle = "#fbe0e8";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(cx - 44, 432);
  ctx.quadraticCurveTo(cx - 62, 470, cx - 56, 510);
  ctx.stroke();
  ctx.fillStyle = LOOK.skin;
  ctx.beginPath();
  ctx.ellipse(cx - 55, 518, 7, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // right arm reaching to the handlebar
  ctx.strokeStyle = "#fbe0e8";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(cx + 40, 430);
  ctx.quadraticCurveTo(cx + 95, 455, cx + 138, 456);
  ctx.stroke();
  ctx.fillStyle = LOOK.skin;
  ctx.beginPath();
  ctx.ellipse(cx + 142, 457, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // skirt: grey, pleated, flaring and fluttering in the wind, lace hem
  const fl = Math.sin(t * 2.2) * 4 * W;
  const sk = ctx.createLinearGradient(0, 495, 0, 575);
  sk.addColorStop(0, "#55555f");
  sk.addColorStop(1, "#3c3c46");
  ctx.fillStyle = sk;
  ctx.beginPath();
  ctx.moveTo(cx - 30, 498);
  ctx.lineTo(cx + 30, 498);
  ctx.quadraticCurveTo(cx + 46, 522, cx + 50 + fl * 0.3, 550);
  ctx.quadraticCurveTo(cx + 8, 562, cx - 54 - fl, 552 - fl * 0.6);
  ctx.quadraticCurveTo(cx - 52, 530, cx - 30, 498);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1.2;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(cx + k * 8, 500);
    ctx.lineTo(cx + k * 14 - (k < 0 ? fl * 0.5 : 0), 556);
    ctx.stroke();
  }
  ctx.strokeStyle = LOOK.lace;
  ctx.lineWidth = 4;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(cx - 54 - fl, 553 - fl * 0.6);
  ctx.quadraticCurveTo(cx + 8, 564, cx + 50 + fl * 0.3, 551);
  ctx.stroke();
  ctx.setLineDash([]);

  // blouse: soft pink, puff sleeves, cinched at the waist with the brown belt
  const bg = ctx.createLinearGradient(cx - 50, 410, cx + 50, 500);
  bg.addColorStop(0, "#fde8ee");
  bg.addColorStop(1, "#f2c4d3");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(cx - 32, 500);
  ctx.quadraticCurveTo(cx - 40, 460, cx - 50, 425 + breathe);
  ctx.quadraticCurveTo(cx, 410 + breathe, cx + 50, 425 + breathe);
  ctx.quadraticCurveTo(cx + 40, 460, cx + 32, 500);
  ctx.closePath();
  ctx.fill();
  // puff sleeves
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + sx * 46, 432 + breathe, 15, 13, sx * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // tiny flower print
  ctx.fillStyle = LOOK.flower;
  for (let i = 0; i < 16; i++) {
    const px = cx - 36 + seeded(i + 80) * 72;
    const py = 428 + seeded(i + 90) * 66;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // belt
  ctx.fillStyle = LOOK.belt;
  ctx.fillRect(cx - 33, 494, 66, 8);

  // neck + a hint of her cheek and ear, turned toward the moon
  ctx.fillStyle = LOOK.skinMid;
  ctx.fillRect(cx - 8, 392 + breathe, 18, 26);
  ctx.fillStyle = LOOK.skin;
  ctx.beginPath();
  ctx.ellipse(cx + 24, 366 + breathe, 13, 22, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(240,128,150,0.35)";
  ctx.beginPath();
  ctx.arc(cx + 25, 375 + breathe, 6, 0, Math.PI * 2);
  ctx.fill();

  // hair: long, curly, ombré, flowing to the left in the wind; flowers tucked in
  const head = { x: cx + 2, y: 362 + breathe };
  // back of the head
  const hg = ctx.createRadialGradient(head.x - 6, head.y - 14, 4, head.x, head.y, 40);
  hg.addColorStop(0, "#4a2a19");
  hg.addColorStop(1, LOOK.hairRoot);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, 32, 38, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const locks = [
    { dx: -20, len: 170, spread: -70, w: 15, ph: 0 },
    { dx: -10, len: 186, spread: -48, w: 18, ph: 1.3 },
    { dx: 1, len: 192, spread: -26, w: 19, ph: 2.1 },
    { dx: 12, len: 180, spread: -10, w: 17, ph: 3.0 },
    { dx: 21, len: 150, spread: 4, w: 13, ph: 4.2 },
  ];
  const lockGeom = (L: (typeof locks)[number]) => {
    const spine: { x: number; y: number }[] = [];
    const widths: number[] = [];
    const startY = head.y - 30 + Math.abs(L.dx) * 0.55;
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const blow = (L.spread - 30 * W) * u * u + Math.sin(t * 1.7 + L.ph + u * 4) * 6 * W * u;
      spine.push({ x: head.x + L.dx * (1 + u * 0.3) + blow, y: startY + u * L.len + Math.sin(u * 7 + t * 2 + L.ph) * 3 * u });
      widths.push(L.w * (0.55 + 0.7 * Math.sin(Math.PI * Math.min(1, u * 0.8 + 0.1))));
    }
    return { spine, widths };
  };
  // underlay: fills the gaps so the hair reads as one voluminous mass
  for (const L of locks) {
    const g = lockGeom(L);
    drawHairMass(ctx, g.spine, g.widths.map((w) => w * 1.35), t + L.ph, false, 0.6);
  }
  for (const L of locks) {
    const spine: { x: number; y: number }[] = [];
    const widths: number[] = [];
    const startY = head.y - 30 + Math.abs(L.dx) * 0.55;
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const blow = (L.spread - 30 * W) * u * u + Math.sin(t * 1.7 + L.ph + u * 4) * 6 * W * u;
      spine.push({ x: head.x + L.dx * (1 + u * 0.3) + blow, y: startY + u * L.len + Math.sin(u * 7 + t * 2 + L.ph) * 3 * u });
      widths.push(L.w * (0.55 + 0.7 * Math.sin(Math.PI * Math.min(1, u * 0.8 + 0.1))));
    }
    drawHairMass(ctx, spine, widths, t * 1.2 + L.ph, true, 0.75);
  }
  // rounded crown on top, with a soft sheen
  const crown = ctx.createRadialGradient(head.x - 8, head.y - 22, 3, head.x, head.y - 6, 36);
  crown.addColorStop(0, "#6b3f25");
  crown.addColorStop(0.5, "#3a2216");
  crown.addColorStop(1, LOOK.hairRoot);
  ctx.fillStyle = crown;
  ctx.beginPath();
  ctx.ellipse(head.x, head.y - 4, 30, 34, 0.08, Math.PI * 0.95, Math.PI * 2.05);
  ctx.quadraticCurveTo(head.x + 10, head.y + 22, head.x - 28, head.y + 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(196,140,98,0.55)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(head.x - 2, head.y - 4, 24, Math.PI * 1.15, Math.PI * 1.55);
  ctx.stroke();
  // a few loose wavy strands in the wind
  ctx.strokeStyle = "rgba(138,87,50,0.7)";
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) {
    const sx = head.x - 30 - k * 14 - 30 * W;
    const sy = head.y + 40 + k * 34;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let j = 1; j <= 10; j++) {
      const u = j / 10;
      ctx.lineTo(sx - u * (50 + 20 * W), sy - u * 12 + Math.sin(u * 9 + t * 2.5 + k) * 4);
    }
    ctx.stroke();
  }
  // little flowers tucked in her hair
  drawLeaf(ctx, head.x + 24, head.y - 20, 11, -0.7);
  drawFlower(ctx, "rose", head.x + 22, head.y - 12, 7, 0.4, "#f9a8c9");
  drawFlower(ctx, "blossom", head.x + 12, head.y - 24, 5.5, t * 0.2, "#ffffff");
  drawFlower(ctx, "blossom", head.x + 28, head.y - 1, 4.5, 1, "#fbcfe0");
}
