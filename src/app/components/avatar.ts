// Ikrame's avatar — shared head, hair and outfit drawing, plus the swing pose used in the hero.
// Plain canvas paths + gradients. Units: the head radius is 1 unless noted.

type Ctx = CanvasRenderingContext2D;
type Pt = { x: number; y: number };

export const LOOK = {
  skin: "#f5d2b8",
  skinMid: "#ebbd9c",
  skinShade: "#d49c7c",
  hairRoot: "#24140d",
  hairMid: "#4a2a19",
  hairTip: "#8a5732", // the warm ombré from the studio photo
  hairShine: "#b77c4e",
  iris: "#5b3520",
  lips: "#d46e7e",
  lipsShine: "#f3a9b4",
  top: "#f8dde5",
  topShade: "#e8bccb",
  flower: "#d9879f",
  belt: "#7a4a2d",
  skirt: "#4a4a55",
  skirtShade: "#34343d",
  lace: "#fbf7f0",
  tights: "#272231",
  shoe: "#fafafa",
};

/**
 * A voluminous, curly mass of hair following a spine (list of points), `widths` per point.
 * Bumpy ringlets on the outline + soft spiral highlights. `phase` animates the curls.
 */
export function drawHairMass(ctx: Ctx, spine: Pt[], widths: number[], phase: number, detail = true, curl = 1) {
  const n = spine.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m, ny = dx / m;
    const w = widths[i];
    left.push({ x: spine[i].x + nx * w, y: spine[i].y + ny * w });
    right.push({ x: spine[i].x - nx * w, y: spine[i].y - ny * w });
  }
  const g = ctx.createLinearGradient(spine[0].x, spine[0].y, spine[n - 1].x, spine[n - 1].y);
  g.addColorStop(0, LOOK.hairRoot);
  g.addColorStop(0.45, LOOK.hairMid);
  g.addColorStop(1, LOOK.hairTip);
  ctx.fillStyle = g;

  // body of the hair
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) {
    const p = left[i - 1], q = left[i];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  ctx.lineTo(left[n - 1].x, left[n - 1].y);
  ctx.quadraticCurveTo(spine[n - 1].x + (spine[n - 1].x - spine[n - 2].x) * 0.8, spine[n - 1].y + (spine[n - 1].y - spine[n - 2].y) * 0.8, right[n - 1].x, right[n - 1].y);
  for (let i = n - 2; i >= 0; i--) {
    const p = right[i + 1], q = right[i];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  ctx.closePath();
  ctx.fill();

  // ringlets on the outline make the silhouette curly
  for (const side of [left, right]) {
    for (let i = 2; i < n; i += 1) {
      const w = widths[i];
      const r = w * (0.32 + 0.1 * Math.sin(i * 1.7 + phase)) * curl;
      const p = side[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // curly tips at the end
  const end = spine[n - 1];
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath();
    ctx.arc(end.x + k * widths[n - 1] * 0.6, end.y + Math.abs(k) * -widths[n - 1] * 0.2 + widths[n - 1] * 0.25, widths[n - 1] * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!detail) return;
  // curls catching the light: small soft arcs scattered along the mass
  ctx.lineCap = "round";
  ctx.strokeStyle = LOOK.hairShine;
  for (let i = 1; i < n - 1; i++) {
    const a = spine[i - 1], b = spine[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m, ny = dx / m;
    for (const off of [-0.45, 0.05, 0.5]) {
      const k = i * 3 + off * 10;
      const x = spine[i].x + nx * widths[i] * (off + 0.12 * Math.sin(k + phase));
      const y = spine[i].y + ny * widths[i] * (off + 0.12 * Math.sin(k + phase));
      const r = widths[i] * 0.22;
      const start = (k * 1.3 + phase) % (Math.PI * 2);
      ctx.globalAlpha *= 0.35;
      ctx.lineWidth = widths[i] * 0.07;
      ctx.beginPath();
      ctx.arc(x, y, r, start, start + Math.PI * 1.1);
      ctx.stroke();
      ctx.globalAlpha /= 0.35;
    }
  }
}

/**
 * Face + front hair. Centre (0,0), radius 1. `turn` from -1 (looking left) to 1 (looking right).
 * Draw the back hair mass before calling this.
 */
export function drawHead(ctx: Ctx, turn: number, phase: number, detail = true) {
  const tx = turn * 0.22;

  // neck shadow
  // face shape: soft oval with a gentle chin
  const skin = ctx.createRadialGradient(-0.2 + tx, -0.25, 0.1, 0, 0.1, 1.15);
  skin.addColorStop(0, "#fbe2cf");
  skin.addColorStop(0.6, LOOK.skin);
  skin.addColorStop(1, LOOK.skinMid);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-0.82 + tx * 0.3, -0.2);
  ctx.bezierCurveTo(-0.85 + tx * 0.3, -1.05, 0.85 + tx * 0.3, -1.05, 0.82 + tx * 0.3, -0.2);
  ctx.bezierCurveTo(0.8 + tx * 0.2, 0.4, 0.45 + tx, 0.95, 0.04 + tx, 1.02);
  ctx.bezierCurveTo(-0.4 + tx, 0.95, -0.8 + tx * 0.2, 0.4, -0.82 + tx * 0.3, -0.2);
  ctx.fill();

  if (detail) {
    // blush
    for (const sx of [-1, 1]) {
      const bx = sx * 0.48 + tx * 0.9;
      const b = ctx.createRadialGradient(bx, 0.38, 0, bx, 0.38, 0.28);
      b.addColorStop(0, "rgba(240,128,150,0.32)");
      b.addColorStop(1, "rgba(240,128,150,0)");
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.arc(bx, 0.38, 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    // freckles
    ctx.fillStyle = "rgba(160,95,60,0.35)";
    for (const [fx, fy] of [[-0.3, 0.26], [-0.2, 0.31], [-0.36, 0.34], [0.22, 0.27], [0.32, 0.32], [0.27, 0.36], [-0.05, 0.22], [0.08, 0.24]]) {
      ctx.beginPath();
      ctx.arc(fx + tx * 0.9, fy, 0.018, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // eyes
  const eye = (cx: number, size: number) => {
    const cy = 0.04;
    if (!detail) {
      ctx.fillStyle = "#2b1810";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 0.09 * size, 0.11 * size, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const w = 0.21 * size, h = 0.12 * size;
    // white
    ctx.fillStyle = "#fffaf6";
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx, cy - h * 1.6, cx + w, cy - h * 0.15);
    ctx.quadraticCurveTo(cx, cy + h * 1.2, cx - w, cy);
    ctx.fill();
    // iris
    const ix = cx + tx * 0.25;
    const ig = ctx.createRadialGradient(ix, cy - 0.02, 0.01, ix, cy, 0.12 * size);
    ig.addColorStop(0, "#8a5a3a");
    ig.addColorStop(0.7, LOOK.iris);
    ig.addColorStop(1, "#2a160c");
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx, cy - h * 1.6, cx + w, cy - h * 0.15);
    ctx.quadraticCurveTo(cx, cy + h * 1.2, cx - w, cy);
    ctx.clip();
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(ix, cy - 0.01, 0.115 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#140a05";
    ctx.beginPath();
    ctx.arc(ix, cy - 0.01, 0.05 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // sparkle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ix + 0.04 * size, cy - 0.05 * size, 0.032 * size, 0, Math.PI * 2);
    ctx.fill();
    // upper lash line with a little wing
    ctx.strokeStyle = "#1a0f0a";
    ctx.lineWidth = 0.04 * size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - w * 1.02, cy + 0.01);
    ctx.quadraticCurveTo(cx, cy - h * 1.75, cx + w * 1.05, cy - h * 0.3);
    ctx.lineTo(cx + w * 1.35, cy - h * 0.75);
    ctx.stroke();
    // lashes, flicked toward the outer corner
    ctx.lineWidth = 0.025 * size;
    const outer = cx > tx ? 1 : -1;
    for (let k = 0; k < 3; k++) {
      const t = outer > 0 ? 0.62 + k * 0.16 : 0.38 - k * 0.16;
      const lx = cx - w + 2 * w * t;
      const ly = cy - h * 1.3 * Math.sin(Math.PI * t) + 0.01;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lx + outer * 0.03 * size, ly - 0.04 * size, lx + outer * 0.07 * size, ly - 0.05 * size);
      ctx.stroke();
    }
    // lower lid hint
    ctx.strokeStyle = "rgba(120,70,50,0.35)";
    ctx.lineWidth = 0.018 * size;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.7, cy + h * 0.6);
    ctx.quadraticCurveTo(cx, cy + h * 1.15, cx + w * 0.8, cy + h * 0.25);
    ctx.stroke();
  };
  const near = 1 + Math.abs(turn) * 0.08;
  const far = 1 - Math.abs(turn) * 0.22;
  eye(-0.34 + tx * (turn > 0 ? 1.3 : 0.8), turn > 0 ? far : near);
  eye(0.34 + tx * (turn > 0 ? 0.8 : 1.3), turn > 0 ? near : far);

  if (detail) {
    // brows
    ctx.strokeStyle = "#3a2216";
    ctx.lineWidth = 0.055;
    for (const sx of [-1, 1]) {
      const bx = sx * 0.34 + tx * 1.05;
      ctx.beginPath();
      ctx.moveTo(bx - 0.17, -0.2 + (sx < 0 ? 0.02 : 0));
      ctx.quadraticCurveTo(bx + sx * 0.02, -0.33, bx + 0.19, -0.22 + (sx > 0 ? 0.02 : 0));
      ctx.stroke();
    }
    // nose
    ctx.strokeStyle = LOOK.skinShade;
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.moveTo(0.04 + tx * 1.3, 0.12);
    ctx.quadraticCurveTo(0.12 + tx * 1.4, 0.36, 0.02 + tx * 1.3, 0.42);
    ctx.stroke();
    ctx.fillStyle = "rgba(190,120,95,0.35)";
    ctx.beginPath();
    ctx.ellipse(-0.04 + tx * 1.3, 0.43, 0.05, 0.025, 0, 0, Math.PI * 2);
    ctx.ellipse(0.09 + tx * 1.3, 0.43, 0.05, 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // lips
  const mx = tx * 1.1;
  const lg = ctx.createLinearGradient(0, 0.55, 0, 0.78);
  lg.addColorStop(0, "#c95c6e");
  lg.addColorStop(1, LOOK.lips);
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(mx - 0.2, 0.64);
  ctx.quadraticCurveTo(mx - 0.1, 0.55, mx - 0.02, 0.6);
  ctx.quadraticCurveTo(mx + 0.06, 0.55, mx + 0.2, 0.64);
  ctx.quadraticCurveTo(mx + 0.02, 0.8, mx - 0.2, 0.64);
  ctx.fill();
  if (detail) {
    ctx.strokeStyle = "rgba(140,50,65,0.6)";
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(mx - 0.19, 0.645);
    ctx.quadraticCurveTo(mx, 0.67, mx + 0.19, 0.645);
    ctx.stroke();
    ctx.fillStyle = LOOK.lipsShine;
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.ellipse(mx + 0.02, 0.7, 0.06, 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.7;
  }

  // front hair: centre part + curly curtains framing the face
  const hg = ctx.createLinearGradient(0, -1.2, 0, 1.6);
  hg.addColorStop(0, LOOK.hairRoot);
  hg.addColorStop(0.5, LOOK.hairMid);
  hg.addColorStop(1, LOOK.hairTip);
  ctx.fillStyle = hg;
  const px = tx * 0.6; // part position
  // crown: covers the top of the head down to a soft hairline with a side-swept part
  ctx.beginPath();
  ctx.moveTo(-1.08, 0.25);
  ctx.bezierCurveTo(-1.2, -1.45, 1.2, -1.45, 1.08, 0.25);
  ctx.bezierCurveTo(0.98, -0.1, 0.85, -0.42, 0.55 + px * 0.5, -0.5);
  ctx.quadraticCurveTo(px + 0.15, -0.62, px, -0.72);
  ctx.quadraticCurveTo(px - 0.25, -0.5, -0.6 + px * 0.5, -0.46);
  ctx.bezierCurveTo(-0.88, -0.4, -0.98, -0.1, -1.08, 0.25);
  ctx.fill();
  // curly locks framing the face (same ringlet technique as the back hair)
  for (const sx of [-1, 1]) {
    const sway = Math.sin(phase + sx) * 0.06;
    const spine: Pt[] = [];
    const widths: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      spine.push({ x: sx * (0.72 + 0.42 * t) + sway * t + 0.05 * Math.sin(t * 9 + phase + sx), y: -0.62 + t * 2.5 });
      widths.push(0.2 + 0.14 * Math.sin(Math.PI * t * 0.9));
    }
    drawHairMass(ctx, spine, widths, phase + sx * 2, detail);
  }
}
