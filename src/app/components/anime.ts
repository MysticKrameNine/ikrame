// Anime-style art for the game: chibi enemies with big shiny eyes, seasonal trees and weather.
// Everything is drawn with canvas paths: bold outlines, two-tone cel shading and highlights.

type Ctx = CanvasRenderingContext2D;

export type Season = "spring" | "summer" | "autumn" | "winter";
export const LEVEL_SEASONS: Season[] = ["spring", "summer", "autumn", "winter", "spring"];
export const SEASON_LABEL: Record<Season, string> = {
  spring: "spring · cherry blossoms",
  summer: "summer · fireflies",
  autumn: "autumn · maple leaves",
  winter: "winter · first snow",
};

const INK = "#2b1a33"; // anime outline colour

/* ---------------- shared bits ---------------- */

/** Big sparkly anime eyes. (x, y) = centre between the eyes. */
function eyes(ctx: Ctx, x: number, y: number, r: number, gap: number, mood: "angry" | "sly" | "sad" | "cute", t: number, iris = "#3b1f4a") {
  const blink = Math.sin(t * 1.3 + x * 0.01) > 0.992 ? 0.15 : 1;
  for (const sx of [-1, 1]) {
    const ex = x + sx * gap;
    ctx.save();
    ctx.translate(ex, y);
    ctx.scale(1, blink);
    // white
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // iris with gradient
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, "#1a0f22");
    g.addColorStop(1, iris);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(r * 0.08, r * 0.12, r * 0.6, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    // highlights
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.3, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.28, r * 0.35, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // brows
    if (mood !== "cute") {
      ctx.strokeStyle = INK;
      ctx.lineWidth = r * 0.28;
      ctx.lineCap = "round";
      ctx.beginPath();
      const tilt = mood === "angry" ? 0.45 : mood === "sad" ? -0.35 : 0.15;
      ctx.moveTo(ex - sx * r * 0.9, y - r * 1.35 - tilt * r * 0.5);
      ctx.lineTo(ex + sx * r * 0.7, y - r * 1.35 + tilt * r * 0.5);
      ctx.stroke();
    }
  }
}

function blush(ctx: Ctx, x: number, y: number, r: number) {
  ctx.fillStyle = "rgba(255,120,160,0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function sparkle(ctx: Ctx, x: number, y: number, r: number, color = "#ffffff") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

/* ---------------- enemies ---------------- */

/** Glitch slime (the "bug"): a bouncy jelly with pixel glitches. Bottom centre at (x, gy). */
export function drawSlime(ctx: Ctx, x: number, gy: number, w: number, h: number, t: number, ph: number) {
  const hop = Math.abs(Math.sin(t * 6 + ph));
  const squash = 1 + (1 - hop) * 0.18;
  const bw = w * squash;
  const bh = h * (2 - squash) * 1.1;
  const y0 = gy - hop * h * 0.35;
  ctx.save();
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x, gy + 2, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  const g = ctx.createLinearGradient(x, y0 - bh, x, y0);
  g.addColorStop(0, "#c084fc");
  g.addColorStop(1, "#7c3aed");
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, w * 0.06);
  ctx.beginPath();
  ctx.moveTo(x - bw / 2, y0);
  ctx.bezierCurveTo(x - bw / 2, y0 - bh * 0.8, x - bw * 0.25, y0 - bh, x, y0 - bh);
  ctx.bezierCurveTo(x + bw * 0.25, y0 - bh, x + bw / 2, y0 - bh * 0.8, x + bw / 2, y0);
  ctx.quadraticCurveTo(x, y0 + h * 0.08, x - bw / 2, y0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // cel shade + gloss
  ctx.fillStyle = "rgba(76,29,149,0.35)";
  ctx.beginPath();
  ctx.ellipse(x + bw * 0.18, y0 - bh * 0.3, bw * 0.28, bh * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(x - bw * 0.22, y0 - bh * 0.72, bw * 0.1, bh * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // glitch pixels
  for (let i = 0; i < 3; i++) {
    if (Math.sin(t * 12 + i * 2 + ph) > 0.4) {
      ctx.fillStyle = i % 2 ? "#22d3ee" : "#f472b6";
      ctx.fillRect(x + (i - 1) * bw * 0.3, y0 - bh * (0.2 + i * 0.25), w * 0.1, w * 0.1);
    }
  }
  eyes(ctx, x, y0 - bh * 0.52, w * 0.14, w * 0.2, "angry", t + ph);
  // little fang mouth
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y0 - bh * 0.22, w * 0.07, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.04, y0 - bh * 0.22);
  ctx.lineTo(x - w * 0.02, y0 - bh * 0.16);
  ctx.lineTo(x, y0 - bh * 0.22);
  ctx.fill();
  ctx.restore();
}

/** Daruma doll of legacy code: a wobbling red daruma with "v1.0" on the belly. */
export function drawDaruma(ctx: Ctx, x: number, gy: number, w: number, h: number, t: number, ph: number) {
  ctx.save();
  ctx.translate(x, gy);
  ctx.rotate(Math.sin(t * 3 + ph) * 0.12);
  const r = w / 2;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 2, r * 0.9, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  const g = ctx.createRadialGradient(-r * 0.3, -h * 0.65, r * 0.2, 0, -h * 0.45, h * 0.7);
  g.addColorStop(0, "#ff6b6b");
  g.addColorStop(1, "#c81e3a");
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, w * 0.05);
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.48, r, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // face panel
  ctx.fillStyle = "#fff4e6";
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.62, r * 0.62, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // gold belly label
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.25, r * 0.45, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.max(8, w * 0.2)}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("v1.0", 0, -h * 0.25);
  // eyes (one painted, one blank — classic daruma), grumpy
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-r * 0.25, -h * 0.64, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.2, w * 0.04);
  ctx.beginPath();
  ctx.arc(r * 0.25, -h * 0.64, r * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-r * 0.29, -h * 0.68, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  // golden brows + moustache
  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = Math.max(1.5, w * 0.06);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -h * 0.78);
  ctx.quadraticCurveTo(-r * 0.25, -h * 0.84, -r * 0.08, -h * 0.76);
  ctx.moveTo(r * 0.45, -h * 0.78);
  ctx.quadraticCurveTo(r * 0.25, -h * 0.84, r * 0.08, -h * 0.76);
  ctx.moveTo(-r * 0.3, -h * 0.5);
  ctx.quadraticCurveTo(0, -h * 0.56, r * 0.3, -h * 0.5);
  ctx.stroke();
  // gloss
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.6, -h * 0.55, r * 0.1, h * 0.18, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Foxfire pillar (the "firewall"): a column of kitsune-bi flames with a fox mask. */
export function drawFoxfire(ctx: Ctx, x: number, gy: number, w: number, h: number, t: number, ph: number) {
  ctx.save();
  // glow
  const glow = ctx.createRadialGradient(x, gy - h * 0.5, 4, x, gy - h * 0.5, h * 0.8);
  glow.addColorStop(0, "rgba(129,140,248,0.45)");
  glow.addColorStop(1, "rgba(129,140,248,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, gy - h * 0.5, h * 0.8, 0, Math.PI * 2);
  ctx.fill();
  // stacked flames
  const layers: [string, string, number][] = [["#6366f1", "#a5b4fc", 1], ["#a78bfa", "#e0e7ff", 0.72], ["#f0abfc", "#ffffff", 0.45]];
  for (const [c0, c1, k] of layers) {
    const fw = w * k;
    const g = ctx.createLinearGradient(x, gy, x, gy - h);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - fw / 2, gy);
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const yy = gy - u * h * (0.9 + 0.1 * k);
      const sway = Math.sin(t * 8 + u * 6 + ph) * fw * 0.12 * u;
      ctx.lineTo(x - (fw / 2) * (1 - u * 0.85) + sway, yy);
    }
    ctx.quadraticCurveTo(x + Math.sin(t * 6 + ph) * fw * 0.3, gy - h * (1.05 + 0.08 * Math.sin(t * 9)), x + fw * 0.08, gy - h * (0.9 + 0.1 * k));
    for (let i = 8; i >= 0; i--) {
      const u = i / 8;
      const yy = gy - u * h * (0.9 + 0.1 * k);
      const sway = Math.sin(t * 8 + u * 6 + ph + 1) * fw * 0.12 * u;
      ctx.lineTo(x + (fw / 2) * (1 - u * 0.85) + sway, yy);
    }
    ctx.closePath();
    ctx.fill();
  }
  // fox mask
  const my = gy - h * 0.45;
  const mr = w * 0.32;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.4, w * 0.04);
  ctx.beginPath();
  ctx.moveTo(x - mr, my - mr * 0.9);
  ctx.lineTo(x - mr * 0.45, my - mr * 0.4);
  ctx.lineTo(x + mr * 0.45, my - mr * 0.4);
  ctx.lineTo(x + mr, my - mr * 0.9);
  ctx.lineTo(x + mr * 0.85, my + mr * 0.2);
  ctx.quadraticCurveTo(x, my + mr * 1.1, x - mr * 0.85, my + mr * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = Math.max(1.2, w * 0.035);
  ctx.beginPath();
  ctx.moveTo(x - mr * 0.55, my - mr * 0.05);
  ctx.quadraticCurveTo(x - mr * 0.3, my - mr * 0.25, x - mr * 0.1, my - mr * 0.05);
  ctx.moveTo(x + mr * 0.55, my - mr * 0.05);
  ctx.quadraticCurveTo(x + mr * 0.3, my - mr * 0.25, x + mr * 0.1, my - mr * 0.05);
  ctx.stroke();
  ctx.fillStyle = "#e11d48";
  ctx.beginPath();
  ctx.arc(x, my - mr * 0.55, mr * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // floating wisps
  for (let i = 0; i < 3; i++) {
    const a = t * 2 + i * 2.1 + ph;
    const wx = x + Math.cos(a) * w * 0.9;
    const wy = gy - h * (0.4 + 0.25 * Math.sin(a * 1.3));
    ctx.fillStyle = "rgba(196,181,253,0.85)";
    ctx.beginPath();
    ctx.arc(wx, wy, w * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Flying koi (the "phish"!): a little koi with fins fluttering, holding a hook. Centre (x, y). */
export function drawKoi(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, ph: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 4 + ph) * 0.08);
  const L = w * 0.55;
  const H = h * 0.5;
  // tail (swishing) — the koi swims toward the rider (left)
  const sw = Math.sin(t * 10 + ph) * H * 0.5;
  ctx.fillStyle = "#fb923c";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.4, w * 0.035);
  ctx.beginPath();
  ctx.moveTo(L * 0.8, 0);
  ctx.quadraticCurveTo(L * 1.2, -H - sw, L * 1.55, -H * 1.1 - sw);
  ctx.quadraticCurveTo(L * 1.3, 0, L * 1.55, H * 1.1 - sw);
  ctx.quadraticCurveTo(L * 1.2, H - sw, L * 0.8, 0);
  ctx.fill();
  ctx.stroke();
  // body
  const g = ctx.createLinearGradient(0, -H, 0, H);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#ffe4d6");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, L, H, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // koi spots
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, L, H, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.ellipse(L * 0.2, -H * 0.5, L * 0.35, H * 0.55, 0.3, 0, Math.PI * 2);
  ctx.ellipse(-L * 0.25, H * 0.45, L * 0.22, H * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // fin
  const flap = Math.sin(t * 14 + ph) * 0.5;
  ctx.fillStyle = "#fdba74";
  ctx.beginPath();
  ctx.ellipse(L * 0.1, H * 0.9, L * 0.25, H * 0.3, 0.6 + flap, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  eyes(ctx, -L * 0.5, -H * 0.05, H * 0.28, 0.0001, "sly", t + ph, "#7c2d12");
  // whiskers
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, w * 0.02);
  ctx.beginPath();
  ctx.moveTo(-L * 0.9, H * 0.2);
  ctx.quadraticCurveTo(-L * 1.2, H * 0.5, -L * 1.1, H * 0.9);
  ctx.stroke();
  // fishing hook + line dangling (it's a phish)
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1, w * 0.025);
  ctx.beginPath();
  ctx.moveTo(-L * 0.95, 0);
  ctx.lineTo(-L * 0.95, H * 2.1);
  ctx.arc(-L * 1.1, H * 2.1, L * 0.15, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

/** Spam ghost: a little obake floating up and down with a "SPAM" tag. Centre (x, y). */
export function drawGhost(ctx: Ctx, x: number, y: number, r: number, t: number, ph: number) {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createLinearGradient(0, -r, 0, r * 1.2);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#dbeafe");
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.4, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.lineTo(r, r * 0.9);
  for (let i = 0; i < 4; i++) {
    const x0 = r - (i + 0.5) * (r / 2);
    const wob = Math.sin(t * 8 + i + ph) * r * 0.1;
    ctx.quadraticCurveTo(x0, r * 1.35 + wob, r - (i + 1) * (r / 2), r * 0.9);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // cel shade
  ctx.fillStyle = "rgba(147,197,253,0.35)";
  ctx.beginPath();
  ctx.ellipse(r * 0.45, r * 0.3, r * 0.35, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, 0, -r * 0.12, r * 0.24, r * 0.36, "cute", t + ph, "#1e3a8a");
  blush(ctx, -r * 0.55, r * 0.15, r * 0.16);
  blush(ctx, r * 0.55, r * 0.15, r * 0.16);
  // tongue out
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 0.12, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.ellipse(r * 0.03, r * 0.33, r * 0.07, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // SPAM tag
  ctx.fillStyle = "#fde68a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.roundRect(-r * 0.55, -r * 1.45, r * 1.1, r * 0.42, r * 0.1);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.max(7, r * 0.3)}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPAM", 0, -r * 1.24);
  sparkle(ctx, r * 1.1, -r * 0.8, r * 0.18, "#fff7d6");
  ctx.restore();
}

/** Anime skill star: chunky outlined star with a face-less shine. */
export function drawAnimeStar(ctx: Ctx, x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.shadowColor = "#fde68a";
  ctx.shadowBlur = 14;
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, "#fff7c2");
  g.addColorStop(1, "#fbbf24");
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.5 : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = Math.max(1.2, r * 0.1);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, -r * 0.3, r * 0.14, r * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------------- seasons ---------------- */

/** A cel-shaded roadside tree for the season. Base at (x, gy). */
export function drawSeasonTree(ctx: Ctx, x: number, gy: number, s: number, season: Season, seed: number, t: number) {
  const trunkH = 60 * s;
  ctx.save();
  // trunk
  ctx.fillStyle = "#4a2f3a";
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, gy);
  ctx.quadraticCurveTo(x - 3 * s, gy - trunkH * 0.6, x - 8 * s, gy - trunkH);
  ctx.lineTo(x + 6 * s, gy - trunkH);
  ctx.quadraticCurveTo(x + 3 * s, gy - trunkH * 0.6, x + 5 * s, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,200,170,0.25)";
  ctx.fillRect(x - 5 * s, gy - trunkH, 2.5 * s, trunkH);

  if (season === "winter") {
    // bare branches with snow
    ctx.strokeStyle = "#4a2f3a";
    ctx.lineCap = "round";
    const branch = (bx: number, by: number, a: number, len: number, d: number) => {
      const ex = bx + Math.cos(a) * len;
      const ey = by + Math.sin(a) * len;
      ctx.lineWidth = Math.max(1.2, (6 - d * 1.4) * s);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, (3 - d * 0.6) * s);
      ctx.beginPath();
      ctx.moveTo(bx + (ex - bx) * 0.3, by + (ey - by) * 0.3 - 2 * s);
      ctx.lineTo(ex, ey - 2 * s);
      ctx.stroke();
      ctx.strokeStyle = "#4a2f3a";
      if (d < 3) {
        branch(ex, ey, a - 0.5, len * 0.7, d + 1);
        branch(ex, ey, a + 0.45, len * 0.65, d + 1);
      }
    };
    branch(x, gy - trunkH, -Math.PI / 2 - 0.35, 30 * s, 0);
    branch(x, gy - trunkH, -Math.PI / 2 + 0.4, 28 * s, 0);
    // snow pile at the foot
    ctx.fillStyle = "#f5f8ff";
    ctx.beginPath();
    ctx.ellipse(x, gy, 18 * s, 6 * s, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    return;
  }

  const palettes: Record<Exclude<Season, "winter">, [string, string, string]> = {
    spring: ["#fbcfe8", "#f9a8d4", "#ec4899"],
    summer: ["#86efac", "#4ade80", "#15803d"],
    autumn: ["#fdba74", "#f97316", "#b91c1c"],
  };
  const [lite, mid, dark] = palettes[season];
  const sway = Math.sin(t * 1.4 + seed) * 2 * s;
  const puffs: [number, number, number][] = [
    [0, -trunkH - 22 * s, 30], [-24, -trunkH - 6 * s, 24], [24, -trunkH - 8 * s, 26],
    [-12, -trunkH - 36 * s, 22], [14, -trunkH - 34 * s, 22], [0, -trunkH + 8 * s, 20],
  ];
  // dark outline layer
  ctx.fillStyle = dark;
  for (const [px, py, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x + px * s + sway, gy + py + 3 * s, (r + 2) * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // mid tone
  ctx.fillStyle = mid;
  for (const [px, py, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x + px * s + sway, gy + py, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // lit highlights (top-left)
  ctx.fillStyle = lite;
  for (const [px, py, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x + px * s + sway - r * s * 0.25, gy + py - r * s * 0.3, r * s * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  if (season === "spring") {
    // tiny white blossoms
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 10; i++) {
      const a = seed * 7 + i * 2.4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 28 * s + sway, gy - trunkH - 16 * s + Math.sin(a) * 20 * s, 1.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export type WeatherPart = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; ph: number };

export function makeWeather(n: number): WeatherPart[] {
  return Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: -0.3 - Math.random() * 0.5,
    vy: 0.4 + Math.random() * 0.7,
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.08,
    size: 0.6 + Math.random() * 0.8,
    ph: Math.random() * 6,
  }));
}

/** Falling sakura / fireflies / maple leaves / snow across the screen. */
export function drawWeather(ctx: Ctx, parts: WeatherPart[], season: Season, w: number, h: number, t: number, k: number, unit: number, alpha: number) {
  if (alpha <= 0.01) return;
  for (const p of parts) {
    if (season === "summer") {
      // fireflies wander slowly
      p.x += (Math.sin(t * 0.7 + p.ph) * 0.4 - 0.15) * 0.0012 * k;
      p.y += Math.cos(t * 0.6 + p.ph * 2) * 0.0008 * k;
    } else {
      const speed = season === "winter" ? 0.7 : 1;
      p.x += (p.vx + Math.sin(t + p.ph) * 0.3) * 0.0016 * k * speed;
      p.y += p.vy * 0.0016 * k * speed;
    }
    p.rot += p.vr * k;
    if (p.y > 1.02) p.y = -0.02;
    if (p.y < -0.05) p.y = 1;
    if (p.x < -0.02) p.x = 1.02;
    const x = p.x * w;
    const y = p.y * h;
    const s = p.size * unit;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (season === "spring") {
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55 + 0.45 * Math.cos(t * 3 + p.ph));
      ctx.fillStyle = "#fbcfe8";
      ctx.beginPath();
      ctx.moveTo(0, 6 * s);
      ctx.bezierCurveTo(-6 * s, 2 * s, -5 * s, -5 * s, -1.5 * s, -6 * s);
      ctx.lineTo(0, -4 * s);
      ctx.lineTo(1.5 * s, -6 * s);
      ctx.bezierCurveTo(5 * s, -5 * s, 6 * s, 2 * s, 0, 6 * s);
      ctx.fill();
    } else if (season === "summer") {
      const blink = 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.5 + p.ph * 3));
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 9 * s);
      g.addColorStop(0, `rgba(236,252,140,${blink})`);
      g.addColorStop(1, "rgba(236,252,140,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,220,${blink})`;
      ctx.beginPath();
      ctx.arc(0, 0, 1.8 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (season === "autumn") {
      ctx.rotate(p.rot);
      ctx.scale(0.5 + 0.5 * Math.cos(t * 2 + p.ph), 1);
      ctx.fillStyle = p.ph > 3 ? "#f97316" : "#dc2626";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = (i % 2 ? 3 : 8) * s;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, 2.4 * s, 0, Math.PI * 2);
      ctx.fill();
      if (p.size > 1.1) {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(-5 * s, 0);
          ctx.lineTo(5 * s, 0);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
