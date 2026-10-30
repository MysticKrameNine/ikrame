"use client";

import { useEffect, useRef, useState } from "react";
import { CREDENTIALS, LANGUAGES, RESUME_URL, type Credential } from "../data/career";

/**
 * A little solar system of credentials: a small pink star in the middle, each credential is a planet
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
      const hr = w < 600 ? 16 : 24;
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

    // a small pink star: white-hot core, rosy photosphere, soft breathing corona and a few thin flares
    const flares = Array.from({ length: 14 }, (_, i) => ({
      a: (i / 14) * Math.PI * 2 + Math.random() * 0.3,
      len: 1.5 + Math.random() * 1.1,
      sp: 0.3 + Math.random() * 0.8,
      ph: Math.random() * 6,
    }));
    let st = 0;
    const drawGlobe = (dt: number) => {
      const R = holeR, cx = HW / 2, cy = HH / 2;
      st += dt;
      gtx.clearRect(0, 0, HW, HH);
      const breathe = 1 + Math.sin(st * 1.3) * 0.04;
      // wide soft glow
      const halo = gtx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 3.4 * breathe);
      halo.addColorStop(0, "rgba(251,182,206,0.55)");
      halo.addColorStop(0.35, "rgba(244,114,182,0.18)");
      halo.addColorStop(1, "rgba(244,114,182,0)");
      gtx.fillStyle = halo;
      gtx.beginPath(); gtx.arc(cx, cy, R * 3.4 * breathe, 0, Math.PI * 2); gtx.fill();
      // corona flares, slowly turning and breathing
      gtx.globalCompositeOperation = "lighter";
      for (const f of flares) {
        const a = f.a + st * 0.05;
        const l = R * (1 + (f.len - 1) * (0.75 + 0.25 * Math.sin(st * f.sp + f.ph)));
        const g = gtx.createLinearGradient(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9, cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        g.addColorStop(0, "rgba(253,164,200,0.22)");
        g.addColorStop(1, "rgba(253,164,200,0)");
        gtx.strokeStyle = g;
        gtx.lineWidth = R * 0.22;
        gtx.lineCap = "round";
        gtx.beginPath();
        gtx.moveTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
        gtx.quadraticCurveTo(cx + Math.cos(a + 0.12) * (R + l) / 2, cy + Math.sin(a + 0.12) * (R + l) / 2, cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        gtx.stroke();
      }
      gtx.globalCompositeOperation = "source-over";
      // photosphere
      const body = gtx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.05, cx, cy, R);
      body.addColorStop(0, "#fffafc");
      body.addColorStop(0.35, "#fde2ee");
      body.addColorStop(0.75, "#f9a8d4");
      body.addColorStop(1, "#ec4899");
      gtx.fillStyle = body;
      gtx.shadowColor = "rgba(244,114,182,0.9)";
      gtx.shadowBlur = R * 0.9;
      gtx.beginPath(); gtx.arc(cx, cy, R, 0, Math.PI * 2); gtx.fill();
      gtx.shadowBlur = 0;
      // shimmering surface
      gtx.save();
      gtx.beginPath(); gtx.arc(cx, cy, R, 0, Math.PI * 2); gtx.clip();
      gtx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + st * (0.15 + i * 0.03);
        const rr = R * (0.25 + (i % 3) * 0.2);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a * 1.3) * rr;
        const sp = gtx.createRadialGradient(x, y, 0, x, y, R * 0.45);
        sp.addColorStop(0, "rgba(255,255,255,0.18)");
        sp.addColorStop(1, "rgba(255,255,255,0)");
        gtx.fillStyle = sp;
        gtx.beginPath(); gtx.arc(x, y, R * 0.45, 0, Math.PI * 2); gtx.fill();
      }
      gtx.restore();
      // limb darkening for a round, 3D feel
      const limb = gtx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
      limb.addColorStop(0, "rgba(190,24,93,0)");
      limb.addColorStop(1, "rgba(190,24,93,0.35)");
      gtx.fillStyle = limb;
      gtx.beginPath(); gtx.arc(cx, cy, R, 0, Math.PI * 2); gtx.fill();
      // thin starburst spikes
      gtx.globalCompositeOperation = "lighter";
      for (const [ang, ln] of [[0, 3.2], [Math.PI / 2, 2.6]] as const) {
        const L = R * ln * breathe;
        const dx = Math.cos(ang) * L, dy = Math.sin(ang) * L;
        const g = gtx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
        g.addColorStop(0, "rgba(255,230,242,0)");
        g.addColorStop(0.5, "rgba(255,240,248,0.55)");
        g.addColorStop(1, "rgba(255,230,242,0)");
        gtx.strokeStyle = g;
        gtx.lineWidth = 1.1;
        gtx.beginPath(); gtx.moveTo(cx - dx, cy - dy); gtx.lineTo(cx + dx, cy + dy); gtx.stroke();
      }
      gtx.globalCompositeOperation = "source-over";
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
