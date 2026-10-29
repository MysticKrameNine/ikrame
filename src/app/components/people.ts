// Anime-style standing people for the game (mentors met along the road).
// Drawn facing left (towards the rider), cel-shaded with a soft ink outline.
import type { MentorLook } from "../data/mentors";

const INK = "#2b1a33";

const shadeHex = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// a limb: thick ink stroke, then the colour on top → outlined tube
const tube = (ctx: CanvasRenderingContext2D, pts: [number, number][], wdt: number, color: string) => {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [lw, c] of [[wdt + 1.6, INK], [wdt, color]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
};

/**
 * @param x,gy  feet position on screen
 * @param u     game unit (scale)
 * @param talking  mouth moves + hand gestures
 * @param wave  0..1, raises the front hand to wave
 */
export function drawPerson(ctx: CanvasRenderingContext2D, L: MentorLook, x: number, gy: number, u: number, t: number, talking: boolean, wave: number) {
  const S = (100 * u) / 100;
  ctx.save();
  ctx.translate(x, gy);
  ctx.scale(S, S);

  const g = L.girth;
  const legLen = 46 * Math.pow(L.height, 1.6);
  const breath = Math.sin(t * 2.2) * 0.5;
  const hipY = -legLen;
  const sy = hipY - 33 + breath; // shoulders
  const sw = 10.5 * Math.sqrt(g);
  const ww = 8.5 * g;
  const belly = (g - 1) * 9;

  // soft ground shadow
  ctx.fillStyle = "rgba(30,40,70,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 14 * Math.sqrt(g), 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  const sleeve = L.jacket ?? L.top;

  // back arm
  tube(ctx, [[sw - 3, sy + 4], [sw + 0.5, sy + 17], [sw - 0.5, hipY + 3]], 5.6, shadeHex(sleeve.startsWith("#") ? sleeve : "#888888", 0.8));
  ctx.fillStyle = L.skin;
  ctx.beginPath();
  ctx.arc(sw - 0.5, hipY + 4.5, 2.1, 0, Math.PI * 2);
  ctx.fill();

  // legs
  tube(ctx, [[2.5, hipY + 2], [3, hipY * 0.5], [3.2, -2.5]], 7, shadeHex(L.pants, 0.82));
  tube(ctx, [[-3.5, hipY + 2], [-4, hipY * 0.5], [-4.5, -2.5]], 7.4, L.pants);
  // shoes
  for (const [fx, c] of [[1, shadeHex(L.shoes, 0.85)], [-6.5, L.shoes]] as const) {
    ctx.fillStyle = c;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(fx, -1.8, 6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // torso
  const torso = () => {
    ctx.beginPath();
    ctx.moveTo(-sw + 1.5, sy + 1);
    ctx.quadraticCurveTo(0, sy - 2, sw - 1.5, sy + 1);
    ctx.quadraticCurveTo(sw + 1, sy + 4, sw, sy + 9);
    ctx.lineTo(ww * 0.95, hipY + 3);
    ctx.lineTo(-ww * 0.95, hipY + 3);
    ctx.quadraticCurveTo(-ww - belly * 1.3, (sy + hipY) / 2 + 6, -sw - 0.5, sy + 9);
    ctx.quadraticCurveTo(-sw - 0.5, sy + 3, -sw + 1.5, sy + 1);
    ctx.closePath();
  };
  torso();
  ctx.fillStyle = L.jacket ?? L.top;
  ctx.fill();
  ctx.save();
  torso();
  ctx.clip();
  if (L.jacket) {
    // the open jacket shows the tee underneath
    ctx.fillStyle = L.top;
    ctx.beginPath();
    ctx.moveTo(-7.5, sy);
    ctx.lineTo(-1.5, sy);
    ctx.lineTo(-2.5, hipY + 4);
    ctx.lineTo(-9 - belly, hipY + 4);
    ctx.closePath();
    ctx.fill();
  }
  // cel shade on the side away from the sun
  ctx.fillStyle = "rgba(30,30,70,0.22)";
  ctx.fillRect(2.5, sy - 4, 30, 60);
  // belt line
  ctx.fillStyle = shadeHex(L.pants, 0.7);
  ctx.fillRect(-30, hipY, 60, 3);
  ctx.restore();
  torso();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  if (L.hoodie) {
    ctx.fillStyle = shadeHex(L.top, 0.88);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(4.5, sy - 0.5, 6, 3.6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f4f1ea";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-3.5, sy + 1);
    ctx.lineTo(-4, sy + 10);
    ctx.moveTo(-1, sy + 1);
    ctx.lineTo(-1.2, sy + 9);
    ctx.stroke();
    // front pocket
    ctx.strokeStyle = "rgba(43,26,51,0.5)";
    ctx.beginPath();
    ctx.moveTo(-8, hipY - 7);
    ctx.lineTo(4, hipY - 7);
    ctx.stroke();
  }
  if (L.lanyard) {
    ctx.strokeStyle = "#2f7ad6";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-5, sy);
    ctx.lineTo(-4, sy + 14);
    ctx.lineTo(0, sy);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    ctx.fillRect(-6.5, sy + 14, 5, 6.5);
    ctx.strokeRect(-6.5, sy + 14, 5, 6.5);
    ctx.fillStyle = "#e0566f";
    ctx.fillRect(-6.5, sy + 14, 5, 1.6);
  }

  // neck
  ctx.fillStyle = L.skin;
  ctx.fillRect(-2.6, sy - 6, 5, 7);
  ctx.fillStyle = "rgba(120,60,50,0.18)";
  ctx.fillRect(-2.6, sy - 1.5, 5, 2.5);

  if (L.scarf) {
    ctx.fillStyle = L.scarf;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(-0.5, sy - 0.5, 6.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, sy + 1);
    ctx.quadraticCurveTo(-7 + Math.sin(t * 2.5) * 0.8, sy + 9, -6 + Math.sin(t * 2.5), sy + 15);
    ctx.lineTo(-2.5, sy + 15);
    ctx.quadraticCurveTo(-3, sy + 8, -1.5, sy + 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(-6, sy + 13);
    ctx.lineTo(-2.7, sy + 13);
    ctx.stroke();
  }

  // head
  const hx = -1, hy = sy - 12;
  // ear
  ctx.fillStyle = L.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(hx + 4, hy + 1.5, 1.7, 2.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // face with a pointed anime chin
  ctx.beginPath();
  ctx.moveTo(hx + 7.4, hy - 1);
  ctx.quadraticCurveTo(hx + 7.6, hy - 9.5, hx - 0.5, hy - 9.6);
  ctx.quadraticCurveTo(hx - 8.4, hy - 9.4, hx - 8, hy - 1);
  ctx.quadraticCurveTo(hx - 8.2 - (g - 1) * 2, hy + 5, hx - 5, hy + 8.5);
  ctx.quadraticCurveTo(hx - 2.5, hy + 10.2 + (g - 1) * 1.5, hx + 1.5, hy + 8.6);
  ctx.quadraticCurveTo(hx + 6, hy + 5.5, hx + 7.4, hy - 1);
  ctx.fillStyle = L.skin;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.stroke();
  // cheek shade on the far side
  ctx.fillStyle = "rgba(160,80,70,0.12)";
  ctx.beginPath();
  ctx.ellipse(hx + 4, hy + 3, 3.4, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes (3/4 view: near eye bigger, far eye narrower)
  const blink = Math.sin(t * 1.1 + x * 0.003) > 0.985;
  for (const [ex, sc] of [[hx - 5, 1], [hx + 0.6, 0.82]] as const) {
    const ey = hy + 0.6;
    if (blink) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(ex - 1.6 * sc, ey + 0.4);
      ctx.quadraticCurveTo(ex, ey + 1.2, ex + 1.6 * sc, ey + 0.4);
      ctx.stroke();
    } else if (!L.shades) {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 1.25 * sc, 1.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex - 0.45 * sc, ey - 0.7, 0.5, 0, Math.PI * 2);
      ctx.fill();
      // upper lid
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(ex - 1.9 * sc, ey - 1.6);
      ctx.quadraticCurveTo(ex, ey - 2.6, ex + 1.8 * sc, ey - 1.5);
      ctx.stroke();
    }
    // eyebrow
    ctx.strokeStyle = shadeHex(L.hair, 0.7);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(ex - 1.8 * sc, ey - 4);
    ctx.lineTo(ex + 1.6 * sc, ey - 4.4 - (talking ? Math.abs(Math.sin(t * 3)) * 0.5 : 0));
    ctx.stroke();
  }
  if (L.glasses) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(hx - 5, hy + 0.7, 2.6, 0, Math.PI * 2);
    ctx.moveTo(hx + 3.1, hy + 0.7);
    ctx.arc(hx + 0.8, hy + 0.7, 2.3, 0, Math.PI * 2);
    ctx.moveTo(hx - 2.4, hy + 0.4);
    ctx.lineTo(hx - 1.5, hy + 0.4);
    ctx.moveTo(hx + 3.1, hy + 0.4);
    ctx.lineTo(hx + 4.5, hy + 0.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(hx - 6.5, hy - 0.6, 1, 2);
  }
  if (L.shades) {
    ctx.fillStyle = "#1b1b26";
    ctx.beginPath();
    ctx.roundRect(hx - 8, hy - 1.2, 5.6, 3.6, 1.4);
    ctx.roundRect(hx - 1.5, hy - 1.2, 4.6, 3.4, 1.4);
    ctx.fill();
    ctx.fillRect(hx - 2.6, hy - 0.8, 1.4, 0.8);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(hx - 7, hy - 0.4);
    ctx.lineTo(hx - 5.2, hy - 0.4);
    ctx.stroke();
  }
  // nose
  ctx.strokeStyle = "rgba(120,60,50,0.55)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(hx - 7.6, hy + 2.6);
  ctx.lineTo(hx - 7, hy + 3.5);
  ctx.stroke();
  // mouth
  const open = talking && Math.sin(t * 15) > -0.2;
  if (open) {
    ctx.fillStyle = "#7a2f3a";
    ctx.beginPath();
    ctx.ellipse(hx - 4.6, hy + 5.6, 1.4, 0.6 + Math.abs(Math.sin(t * 15)) * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx - 6.2, hy + 5.2);
    ctx.quadraticCurveTo(hx - 4.6, hy + 6.4, hx - 3, hy + 5.1);
    ctx.stroke();
  }

  // hair
  ctx.fillStyle = L.hair;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  const st = L.hairStyle;
  const top = st === "crop" ? hy - 10.6 : st === "quiff" ? hy - 12 : hy - 12.4;
  ctx.moveTo(hx + 7.2, hy + (st === "crop" ? 1 : 4.5));
  ctx.quadraticCurveTo(hx + 10, hy - 6, hx + 2, top);
  if (st === "quiff") {
    ctx.quadraticCurveTo(hx - 4, top - 4.5, hx - 9.5, hy - 9);
    ctx.quadraticCurveTo(hx - 10.5, hy - 5, hx - 7.5, hy - 5.5);
  } else {
    ctx.quadraticCurveTo(hx - 6, top - 0.5, hx - 9, hy - 3);
  }
  // fringe along the forehead
  const fringe: [number, number][] =
    st === "messy" ? [[-8.6, 0.5], [-6.5, -4], [-5.4, 0], [-3.2, -4.6], [-1.6, -0.8], [0.6, -5], [2.2, -1.5], [4.4, -4.5]]
    : st === "side" ? [[-8.4, -1.5], [-5.5, -2.5], [-2, -4.6], [1.5, -5.6], [4.5, -5]]
    : st === "quiff" ? [[-7.4, -5], [-3, -6.5], [1.5, -6.6], [4.5, -5.2]]
    : st === "crop" ? [[-8, -5.4], [-4, -7.2], [0, -7.4], [4.2, -6]]
    : [[-8.4, -2.5], [-6.4, -4.8], [-4.6, -2.6], [-2.4, -5.5], [0, -3.6], [2.2, -6], [4.5, -4.5]];
  for (const [fx, fy] of fringe) ctx.lineTo(hx + fx, hy + fy);
  ctx.lineTo(hx + 5, hy - 1.5);
  ctx.lineTo(hx + 4.8, hy + (st === "crop" ? 0 : 3));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // messy top spikes
  if (st === "messy") {
    ctx.beginPath();
    ctx.moveTo(hx - 3, top + 1);
    ctx.lineTo(hx - 1, top - 3.5);
    ctx.lineTo(hx + 1.5, top + 0.5);
    ctx.lineTo(hx + 4, top - 2.6);
    ctx.lineTo(hx + 5.5, top + 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // glossy anime highlight band
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(hx, hy - 2, 8, -2.4, -1.5);
  ctx.stroke();
  if (L.shades && st === "quiff") {
    // nothing extra: the shades already say "cool"
  }

  // front arm: waving, gesturing while talking, or relaxed
  let elbow: [number, number], hand: [number, number];
  if (wave > 0.01) {
    const sw2 = Math.sin(t * 11) * 2.2 * wave;
    elbow = [-sw - 4, sy + 6 - 10 * wave];
    hand = [-sw - 3 + sw2, sy + 12 - 27 * wave];
  } else if (talking) {
    elbow = [-sw - 1.5, sy + 14];
    hand = [-sw - 7, sy + 14 + Math.sin(t * 4.5) * 2];
  } else {
    elbow = [-sw - 0.5, sy + 15];
    hand = [-sw - 1, hipY + 3];
  }
  tube(ctx, [[-sw + 2.5, sy + 3.5], elbow, hand], 5.8, sleeve);
  ctx.fillStyle = L.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(hand[0], hand[1], 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  // top of the head on screen, for name tags / speech marks
  return gy - (legLen + 33 + 24) * S;
}

/** A little "…" speech bubble above whoever is talking. */
export function drawTalkMark(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, t: number) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 4) * 1.5 * u);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  ctx.roundRect(-15 * u, -22 * u, 30 * u, 17 * u, 8 * u);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4 * u, -5.5 * u);
  ctx.lineTo(0, 1 * u);
  ctx.lineTo(3 * u, -5.5 * u);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4.5 * u, -7.2 * u, 8 * u, 2.5 * u);
  ctx.fillStyle = INK;
  for (let i = 0; i < 3; i++) {
    const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 6 - i * 0.8));
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc((i - 1) * 7 * u, -13.5 * u, 2 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
