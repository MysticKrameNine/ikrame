"use client";

import { useEffect, useRef, useState } from "react";
import { CREDENTIALS, LANGUAGES, RESUME_URL, type Credential } from "../data/career";

/**
 * A little solar system of credentials: a small, realistic sun in the middle, each credential is a planet
 * on its own tilted orbit (inner ones go faster), lit from the sun, passing behind it, with an
 * asteroid belt. Drag (or swipe) to spin the whole system; hover / tap a planet to read it.
 */

// orbit index for each credential (0 = closest to the sun)
const ORBIT: Record<string, number> = { secnumedu: 0, siem: 0, keycloak: 0, anssi: 1, comcyber: 1, cisco: 1, oscp: 2, microsoft: 2, hospitals: 2, jpmorgan: 3, proguard: 3 };
const SIZE: Record<string, number> = { anssi: 94, secnumedu: 90, comcyber: 94, hospitals: 92, keycloak: 76, siem: 70, oscp: 84, cisco: 76, microsoft: 84, jpmorgan: 80, proguard: 82 };

const ORBIT_R = [0.4, 0.58, 0.77, 0.98]; // fraction of the max horizontal radius
const BELT_R = 0.875;
const TILT = 0.4; // vertical squash of the orbits (3D tilt)

type Rock = { a: number; r: number; s: number; spin: number; rot: number; pts: number[]; shade: number };

export default function CredentialOrbit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const shadesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState<Credential | null>(null);
  const activeRef = useRef<Credential | null>(null);
  const hoverRef = useRef(false);
  const dragRef = useRef({ down: false, x: 0, moved: false, vel: 0, offset: 0 });

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current, gcan = globeRef.current;
    if (!stage || !canvas || !gcan) return;
    const ctx = canvas.getContext("2d");
    const gtx = gcan.getContext("2d");
    if (!ctx || !gtx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, t = 0, last = performance.now(), visible = true, w = 0, h = 0;

    // each planet starts at its own place on its orbit
    const phase = CREDENTIALS.map((c, i) => {
      const sameOrbit = CREDENTIALS.filter((d) => ORBIT[d.id] === ORBIT[c.id]);
      return (sameOrbit.indexOf(c) / sameOrbit.length) * Math.PI * 2 + ORBIT[c.id] * 0.9 + i * 0.05;
    });
    const rocks: Rock[] = Array.from({ length: 280 }, () => {
      const n = 6 + Math.floor(Math.random() * 4);
      return {
        a: Math.random() * Math.PI * 2,
        r: BELT_R + (Math.random() - 0.5) * 0.12,
        s: 0.8 + Math.pow(Math.random(), 3) * 4.2,
        spin: (Math.random() - 0.5) * 0.04,
        rot: Math.random() * 6,
        pts: Array.from({ length: n }, () => 0.65 + Math.random() * 0.45),
        shade: 0.55 + Math.random() * 0.45,
      };
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = stage.clientWidth;
      h = stage.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // star canvas: room for the glow and flares
      const hr = w < 600 ? 13 : 19;
      holeR = hr;
      HW = HH = Math.round(hr * 7);
      gcan.width = HW * dpr;
      gcan.height = HH * dpr;
      gcan.style.width = HW + "px";
      gcan.style.height = HH + "px";
      gtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    let holeR = 32, HW = 270, HH = 160;
    resize();

    // a small, realistic sun: granulated photosphere, limb darkening, a faint warm corona
    const gran = document.createElement("canvas");
    const GS = 128;
    gran.width = gran.height = GS;
    {
      const g = gran.getContext("2d")!;
      const img = g.createImageData(GS, GS);
      // a few octaves of cheap value noise -> convection cells
      const rnd = (x: number, y: number) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
      const smooth = (x: number, y: number) => {
        const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
        const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
        const a = rnd(xi, yi), b2 = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1);
        return a + (b2 - a) * u + (c - a) * v + (a - b2 - c + d) * u * v;
      };
      for (let y = 0; y < GS; y++)
        for (let x = 0; x < GS; x++) {
          const n = smooth(x / 4, y / 4) * 0.6 + smooth(x / 2, y / 2) * 0.3 + smooth(x, y) * 0.1;
          const k = (y * GS + x) * 4;
          const v = Math.round(n * 255);
          img.data[k] = 255; img.data[k + 1] = 200 + Math.round(n * 55); img.data[k + 2] = 120 + Math.round(n * 80);
          img.data[k + 3] = Math.round(40 + (1 - n) * 70) * (v > 0 ? 1 : 1);
        }
      g.putImageData(img, 0, 0);
    }
    let st = 0;
    const drawGlobe = (dt: number) => {
      const R = holeR, cx = HW / 2, cy = HH / 2;
      st += dt;
      gtx.clearRect(0, 0, HW, HH);
      // faint corona
      const cor = gtx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.6);
      cor.addColorStop(0, "rgba(255,214,150,0.32)");
      cor.addColorStop(0.35, "rgba(255,190,110,0.10)");
      cor.addColorStop(1, "rgba(255,190,110,0)");
      gtx.fillStyle = cor;
      gtx.beginPath(); gtx.arc(cx, cy, R * 2.6, 0, Math.PI * 2); gtx.fill();
      // photosphere
      const body = gtx.createRadialGradient(cx, cy, 0, cx, cy, R);
      body.addColorStop(0, "#fffaf0");
      body.addColorStop(0.55, "#ffe6b0");
      body.addColorStop(0.85, "#ffc266");
      body.addColorStop(1, "#f29a38");
      gtx.fillStyle = body;
      gtx.beginPath(); gtx.arc(cx, cy, R, 0, Math.PI * 2); gtx.fill();
      // granulation, drifting very slowly with the sun's rotation
      gtx.save();
      gtx.beginPath(); gtx.arc(cx, cy, R, 0, Math.PI * 2); gtx.clip();
      gtx.globalCompositeOperation = "multiply";
      gtx.globalAlpha = 0.55;
      gtx.translate(cx, cy); gtx.rotate(st * 0.02);
      gtx.drawImage(gran, -R * 1.5, -R * 1.5, R * 3, R * 3);
      gtx.restore();
      // limb darkening: the edge of a real star is dimmer and redder
      const limb = gtx.createRadialGradient(cx, cy, R * 0.45, cx, cy, R);
      limb.addColorStop(0, "rgba(180,70,10,0)");
      limb.addColorStop(0.8, "rgba(180,70,10,0.18)");
      limb.addColorStop(1, "rgba(150,50,5,0.5)");
      gtx.fillStyle = limb;
      gtx.beginPath(); gtx.arc(cx, cy, R, 0, Math.PI * 2); gtx.fill();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(stage);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const d = dragRef.current;
      const paused = hoverRef.current || !!activeRef.current;
      if (visible) {
        if (!d.down) {
          d.offset += d.vel;
          d.vel *= 0.94;
          if (!reduced && !paused) t += dt * 0.12;
        }
        draw();
        drawGlobe(dt);
      }
      raf = requestAnimationFrame(frame);
    };

    const draw = () => {
      const cx = w / 2, cy = h / 2;
      const narrow = w < 600;
      const R = narrow ? w * 0.45 : Math.min(w * 0.47, 520);
      const tilt = narrow ? 1.05 : TILT;
      const spinAll = dragRef.current.offset;
      ctx.clearRect(0, 0, w, h);

      // orbit lines
      ORBIT_R.forEach((f, i) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * f, R * f * tilt, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(165, 243, 252, ${0.1 + i * 0.015})`;
        ctx.lineWidth = 1;
        ctx.setLineDash(i % 2 ? [3, 6] : []);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // asteroid belt (rocky, lit from the sun)
      for (const k of rocks) {
        const a = k.a + spinAll * 0.8 + t * 0.55;
        const x = cx + Math.cos(a) * R * k.r, y = cy + Math.sin(a) * R * k.r * tilt;
        const depth = (Math.sin(a) + 1) / 2;
        const sz = k.s * (0.55 + depth * 0.7) * (narrow ? 0.8 : 1);
        k.rot += k.spin;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(k.rot);
        ctx.beginPath();
        k.pts.forEach((p, j) => {
          const aa = (j / k.pts.length) * Math.PI * 2;
          const px = Math.cos(aa) * sz * p, py = Math.sin(aa) * sz * p;
          if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        });
        ctx.closePath();
        // light comes from the sun (centre)
        const lx = (cx - x), ly = (cy - y);
        const ll = Math.hypot(lx, ly) || 1;
        const g = ctx.createLinearGradient(-lx / ll * sz, -ly / ll * sz, lx / ll * sz, ly / ll * sz);
        const b = Math.round(70 + 60 * k.shade);
        g.addColorStop(0, `rgb(${b * 0.45},${b * 0.42},${b * 0.48})`);
        g.addColorStop(1, `rgb(${b + 40},${b + 22},${b - 4})`);
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.45 + depth * 0.55;
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // planets (DOM medallions)
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        const c = CREDENTIALS[i];
        const o = ORBIT[c.id];
        const speed = 1 / Math.pow(ORBIT_R[o], 1.5); // inner planets are faster (Kepler-ish)
        const a = phase[i] + t * speed + spinAll;
        const x = Math.cos(a) * R * ORBIT_R[o], y = Math.sin(a) * R * ORBIT_R[o] * tilt;
        const depth = (Math.sin(a) + 1) / 2;
        const base = (SIZE[c.id] ?? 80) / 92 * (narrow ? 0.5 : 0.88);
        const isActive = activeRef.current?.id === c.id;
        const sc = base * (0.62 + depth * 0.5) * (isActive ? 1.15 : 1);
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${sc})`;
        el.style.zIndex = String((Math.sin(a) > 0 ? 200 : 50) + Math.round(depth * 40) + (isActive ? 100 : 0));
        el.style.filter = depth < 0.3 ? `blur(${(0.3 - depth) * 2.5}px) brightness(${0.7 + depth})` : "none";
        // day/night side facing the sun
        const sh = shadesRef.current[i];
        if (sh) {
          const ang = Math.atan2(-y, -x) * (180 / Math.PI);
          sh.style.background = `linear-gradient(${ang + 90}deg, rgba(255,240,200,0.35) 0%, rgba(255,240,200,0) 38%, rgba(4,8,20,0) 52%, rgba(4,8,20,0.62) 100%)`;
        }
      });
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // drag / swipe to spin
  const onDown = (e: React.PointerEvent) => {
    const d = dragRef.current;
    d.down = true;
    d.moved = false;
    d.x = e.clientX;
    d.vel = 0;
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 3) {
      d.moved = true;
      setActive(null);
    }
    d.x = e.clientX;
    const delta = dx * 0.006;
    d.offset += delta;
    d.vel = delta;
  };
  const onUp = () => {
    dragRef.current.down = false;
  };

  return (
    <div className="orbit-cred reveal">
      <div
        className="oc-stage"
        ref={stageRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") hoverRef.current = false; }}
        onPointerLeave={() => { onUp(); hoverRef.current = false; setActive(null); }}
      >
        <canvas ref={canvasRef} className="oc-canvas" aria-hidden="true" />

        {/* the Earth, turned towards France */}
        <div className="oc-earth" aria-hidden="true">
          <canvas ref={globeRef} />
        </div>

        {/* label under the sun, or the selected planet's card */}
        <div className="oc-caption">
          {active ? (
            <div className="oc-detail" key={active.id}>
              <span className="oc-kind mono">
                {active.status === "progress" ? "in progress" : active.kind === "company" ? "worked with" : active.kind === "mission" ? "field experience" : active.kind === "skill" ? "expertise" : "certified"}
              </span>
              <strong>{active.name}</strong>
              <p>{active.detail}</p>
            </div>
          ) : null}
        </div>

        {CREDENTIALS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            ref={(el) => { itemsRef.current[i] = el; }}
            className={`oc-item${c.fill ? " is-fill" : ""}${c.dark ? " is-dark" : ""}${c.status === "progress" ? " is-wip" : ""}${active?.id === c.id ? " is-active" : ""} k-${c.kind}`}
            onPointerEnter={(e) => { if (e.pointerType === "mouse" && !dragRef.current.down) { hoverRef.current = true; setActive(c); } }}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") { hoverRef.current = false; setActive(null); } }}
            onClick={() => { if (!dragRef.current.moved) setActive((a) => (a?.id === c.id ? null : c)); }}
            aria-label={`${c.name}: ${c.detail}`}
          >
            <span className="oc-medal">
              <Medallion c={c} />
              <span className="oc-shade" ref={(el) => { shadesRef.current[i] = el; }} />
            </span>
            <span className="oc-name">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="oc-langs">
        {LANGUAGES.map((l) => (
          <div key={l.name} className="oc-lang">
            <span className="oc-lang-name">{l.name}</span>
            <span className="oc-bar"><i style={{ width: l.level === "fluent" ? "100%" : "35%" }} /></span>
            <span className="oc-lang-level mono">{l.level}</span>
          </div>
        ))}
        <div className="oc-lang oc-smile">
          <span className="oc-lang-name">Mood</span>
          <span className="oc-bar"><i style={{ width: "100%" }} /></span>
          <span className="oc-lang-level mono">always smiling ☺</span>
        </div>
      </div>

      <a className="creds-more mono" href={RESUME_URL} target="_blank" rel="noreferrer">
        all my certifications are on my resume →
      </a>
    </div>
  );
}

/** Official logo if the file exists (svg, then png), otherwise an icon or an engraved seal. */
function Medallion({ c }: { c: Credential }) {
  const [src, setSrc] = useState<string | null>(c.logo ?? null);
  const onErr = () => setSrc(null);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" onError={onErr} draggable={false} />;
  }
  if (c.icon) return <Icon kind={c.icon} />;
  return <Seal c={c} />;
}

function Seal({ c }: { c: Credential }) {
  const text = `${c.name.toUpperCase()} · ${c.status === "progress" ? "IN PROGRESS" : c.kind === "company" ? "EXPERIENCE" : "CERTIFIED"} · `;
  const id = `seal-${c.id}`;
  return (
    <svg viewBox="0 0 100 100" className="oc-seal">
      <defs>
        <path id={id} d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
      </defs>
      <circle cx="50" cy="50" r="46" className="s-out" />
      <circle cx="50" cy="50" r="27" className="s-in" />
      <text className="s-ring">
        <textPath href={`#${id}`} startOffset="0">{text.repeat(2)}</textPath>
      </text>
      <text x="50" y="57" textAnchor="middle" className="s-mono">
        {c.name.replace(/[^A-Za-z]/g, "").slice(0, c.name.length > 6 ? 2 : 4).toUpperCase()}
      </text>
    </svg>
  );
}

function Icon({ kind }: { kind: "shield" | "radar" | "code" | "cross" | "key" }) {
  if (kind === "cross")
    return (
      <svg viewBox="0 0 100 100" className="oc-icon cross">
        <path d="M40 22 H60 V40 H78 V60 H60 V78 H40 V60 H22 V40 H40 Z" />
        <path d="M18 50 H32 L38 40 L46 62 L54 34 L60 50 H82" className="pulse-line" />
      </svg>
    );
  if (kind === "key")
    return (
      <svg viewBox="0 0 100 100" className="oc-icon key">
        <circle cx="36" cy="50" r="14" />
        <path d="M50 50 H82 M70 50 V62 M78 50 V58" />
      </svg>
    );
  if (kind === "radar")
    return (
      <svg viewBox="0 0 100 100" className="oc-icon radar">
        <circle cx="50" cy="50" r="34" /><circle cx="50" cy="50" r="22" /><circle cx="50" cy="50" r="10" />
        <path d="M50 50 L50 16" className="sweep" />
        <circle cx="66" cy="38" r="3.5" className="blip" /><circle cx="38" cy="64" r="2.5" className="blip b2" />
      </svg>
    );
  if (kind === "code")
    return (
      <svg viewBox="0 0 100 100" className="oc-icon code">
        <path d="M36 32 L18 50 L36 68" />
        <path d="M64 32 L82 50 L64 68" />
        <path d="M56 26 L44 74" className="slash" />
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" className="oc-icon shield">
      <path d="M50 14 L80 26 V48 C80 68 66 80 50 87 C34 80 20 68 20 48 V26 Z" />
      <path d="M38 50 L47 59 L64 41" className="check" />
    </svg>
  );
}
