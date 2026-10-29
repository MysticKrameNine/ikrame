"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS, SKILLS, EMAIL, type Chapter, type Ride } from "../data/career";
import { drawRider, drawLandmark, RIDE_HEAD } from "./draw";
import { drawFlower } from "./illustration";
import { LEVEL_SEASONS, SEASON_LABEL, drawAnimeStar, drawDaruma, drawFoxfire, drawGhost, drawKoi, drawSeasonTree, drawSlime, drawWeather, makeWeather } from "./anime";
import { X, Play, Heart, Mail } from "./Icons";
import { MENTORS } from "../data/mentors";
import { drawPerson, drawTalkMark } from "./people";

/**
 * Game mode: "Ikrame's Ride".
 * Ride the bike through every city of the career: Rennes → Leuven → Paris → Frankfurt → hospitals.
 * Jump over bugs, legacy code and firewalls, catch skill stars, grab a ProGuard shield.
 * Opens on the `ik:game` window event.
 */

type Kind = "bug" | "crate" | "firewall" | "star" | "shield" | "turbo" | "phish" | "gap" | "ghost";
type Thing = { kind: Kind; x: number; y: number; w: number; h: number; label?: string; done?: boolean; passed?: boolean; phase: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; petal?: boolean; rot: number };
type Theme = { sky: [string, string, string]; glow: string; shade: string; far: string; mid: string; win: string; coast: number; stars: number };

// Shinkai-style skies, one per city: Rennes dusk by the sea, Leuven twilight, Paris golden hour,
// Frankfurt blue hour, and dawn for the hospitals.
const THEMES: Theme[] = [
  // Rennes, spring: clear blue sky over the Breton coast
  { sky: ["#2a6fd0", "#62a9ec", "#d6eeff"], glow: "#fffdf3", shade: "#a9bfdc", far: "#a8bcd6", mid: "#8ea4c2", win: "rgba(255,255,255,0.55)", coast: 1, stars: 0 },
  // Leuven, summer: deep saturated blue, big cumulus
  { sky: ["#1a63c9", "#4f9fe8", "#cdeaff"], glow: "#fffbe8", shade: "#9db5da", far: "#b0c1d8", mid: "#8b9ebd", win: "rgba(255,255,255,0.55)", coast: 0, stars: 0 },
  // Paris, autumn: softer blue with a warm horizon
  { sky: ["#3471c0", "#7fb4e4", "#f4e9d4"], glow: "#fff4dc", shade: "#b4b6cf", far: "#c4bfcd", mid: "#a19ab0", win: "rgba(255,248,230,0.6)", coast: 0, stars: 0 },
  // Frankfurt, winter: pale crisp sky
  { sky: ["#4a82c4", "#9ec3e8", "#eef6fc"], glow: "#ffffff", shade: "#b6c5db", far: "#b9c6d8", mid: "#95a5bd", win: "rgba(255,255,255,0.6)", coast: 0, stars: 0 },
  // Paris region, spring again: the brightest one
  { sky: ["#2370d6", "#6ab2f0", "#e0f2ff"], glow: "#fffdf3", shade: "#a6bfe0", far: "#acc0da", mid: "#8fa6c6", win: "rgba(255,255,255,0.55)", coast: 0, stars: 0 },
];
const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const mixHex = (a: string, b: string, k: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};
const mixToHex = (a: string, b: string, k: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
};
const ROAD_FLOWERS = ["#f9a8c9", "#ffffff", "#fbcfe0", "#f0abfc", "#fde68a"];

type Pop = { x: number; y: number; text: string; color: string; life: number };
type Building = { x: number; w: number; h: number; seed: number };
type Screen = "intro" | "playing" | "paused" | "over" | "won";

/* ---------- tiny synth for sound effects (no audio files) ---------- */
let audio: AudioContext | null = null;
let muted = false;
try {
  muted = typeof window !== "undefined" && localStorage.getItem("ik-ride-muted") === "1";
} catch {
  /* ignore */
}
function sfx(kind: "jump" | "star" | "hit" | "turbo" | "check" | "shield" | "win" | "land", pitch = 0) {
  if (muted || typeof window === "undefined") return;
  try {
    if (!audio) audio = new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const now = audio.currentTime;
    const tone = (f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, now + delay);
      o.frequency.exponentialRampToValueAtTime(f1, now + delay + dur);
      g.gain.setValueAtTime(0.0001, now + delay);
      g.gain.exponentialRampToValueAtTime(vol, now + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      o.connect(g).connect(audio!.destination);
      o.start(now + delay);
      o.stop(now + delay + dur + 0.02);
    };
    const semis = (n: number) => Math.pow(2, n / 12);
    switch (kind) {
      case "jump": tone(320, 560, 0.12, "sine", 0.08); break;
      case "land": tone(140, 90, 0.06, "triangle", 0.05); break;
      case "star": tone(880 * semis(pitch), 1320 * semis(pitch), 0.12, "triangle", 0.08); tone(1320 * semis(pitch), 1760 * semis(pitch), 0.1, "sine", 0.05, 0.06); break;
      case "hit": tone(220, 70, 0.3, "sawtooth", 0.08); break;
      case "shield": tone(520, 1040, 0.25, "sine", 0.07); break;
      case "turbo": tone(200, 1600, 0.45, "sawtooth", 0.05); break;
      case "check": [0, 4, 7, 12].forEach((n, i) => tone(523 * semis(n), 523 * semis(n), 0.14, "triangle", 0.07, i * 0.08)); break;
      case "win": [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523 * semis(n), 523 * semis(n), 0.2, "triangle", 0.08, i * 0.1)); break;
    }
  } catch {
    /* audio unavailable */
  }
}

const LEVEL_LEN = 6000; // world px per city
const MAX_HEARTS = 5;

function readNum(key: string) {
  try {
    return Number(localStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}
function writeNum(key: string, v: number) {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    /* ignore */
  }
}
/** Daily ride streak: consecutive days with at least one ride. */
function bumpStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem("ik-ride-day");
    let streak = Number(localStorage.getItem("ik-ride-streak") || 0);
    if (last !== today) {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = last === y ? streak + 1 : 1;
      localStorage.setItem("ik-ride-day", today);
      localStorage.setItem("ik-ride-streak", String(streak));
    }
    return streak;
  } catch {
    return 0;
  }
}
function readStreak() {
  try {
    const last = localStorage.getItem("ik-ride-day");
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return last === today || last === y ? Number(localStorage.getItem("ik-ride-streak") || 0) : 0;
  } catch {
    return 0;
  }
}
function readBest() {
  try {
    return Number(localStorage.getItem("ik-ride-best") || 0);
  } catch {
    return 0;
  }
}
function saveBest(v: number) {
  try {
    localStorage.setItem("ik-ride-best", String(v));
  } catch {
    /* best score just isn't kept */
  }
}

export default function GameMode() {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("intro");
  const [hud, setHud] = useState({ score: 0, hearts: MAX_HEARTS, level: 0, km: 0, shield: false, turbo: false, combo: 1 });
  const [best, setBest] = useState(0);
  const [postcard, setPostcard] = useState<Chapter | null>(null);
  const [talk, setTalk] = useState<{ name: string; company: string; color: string; who: "me" | "them"; text: string; i: number; n: number } | null>(null);
  const talkNextRef = useRef<() => void>(() => {});
  const [arriving, setArriving] = useState(false);
  const arrivalSkipRef = useRef<() => void>(() => {});
  const talkSkipRef = useRef<() => void>(() => {});
  const [collected, setCollected] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<Screen>("intro");
  const resetRef = useRef<() => void>(() => {});
  const jumpRef = useRef<() => void>(() => {});
  const releaseRef = useRef<() => void>(() => {});
  const endlessRef = useRef<() => void>(() => {});
  const [sound, setSound] = useState(!muted);
  const [rank, setRank] = useState(0);
  const [streak, setStreak] = useState(0);
  const [prevBest, setPrevBest] = useState(0);
  const [prog, setProg] = useState(0);
  const [handDrawn, setHandDrawn] = useState(true);
  const boilRef = useRef<SVGFETurbulenceElement>(null);
  const toggleSound = () => {
    muted = !muted;
    setSound(!muted);
    try {
      localStorage.setItem("ik-ride-muted", muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const setScreenBoth = useCallback((s: Screen) => {
    screenRef.current = s;
    setScreen(s);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setScreenBoth("intro");
    setPostcard(null);
  }, [setScreenBoth]);

  const start = useCallback(() => {
    setStreak(bumpStreak());
    setPrevBest(readBest());
    resetRef.current();
    setScreenBoth("playing");
  }, [setScreenBoth]);

  useEffect(() => {
    const onOpen = () => {
      setBest(readBest());
      setStreak(readStreak());
      setOpen(true);
      setScreenBoth("intro");
    };
    window.addEventListener("ik:game", onOpen);
    return () => window.removeEventListener("ik:game", onOpen);
  }, [setScreenBoth]);

  // "line boil": re-seed the hand-drawn wobble ~8 times a second, like redrawn anime frames.
  // If the device struggles (low frame rate), quietly switch the effect off.
  useEffect(() => {
    if (!open || !handDrawn) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHandDrawn(false);
      return;
    }
    let seed = 1;
    const id = window.setInterval(() => {
      seed = (seed % 6) + 1;
      boilRef.current?.setAttribute("seed", String(seed));
    }, 125);
    let frames = 0, raf = 0;
    const t0 = performance.now();
    const count = () => {
      frames++;
      const el = performance.now() - t0;
      if (el < 3000) raf = requestAnimationFrame(count);
      else if (frames / (el / 1000) < 40) setHandDrawn(false);
    };
    raf = requestAnimationFrame(count);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [open, handDrawn]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("game-open");
    return () => document.documentElement.classList.remove("game-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const s = screenRef.current;
      if (e.key === "Escape") {
        if (s === "playing") setScreenBoth("paused");
        else close();
      } else if (e.key === "p" || e.key === "P") {
        if (s === "playing") setScreenBoth("paused");
        else if (s === "paused") setScreenBoth("playing");
      } else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "Enter") {
        e.preventDefault();
        if (e.repeat) return;
        if (s === "playing") jumpRef.current();
        else if (s === "intro" || s === "over") start();
        else if (s === "won") endlessRef.current();
        else if (s === "paused") setScreenBoth("playing");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") releaseRef.current();
    };
    // pause automatically when the tab is hidden
    const onHide = () => {
      if (document.hidden && screenRef.current === "playing") setScreenBoth("paused");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [open, close, start, setScreenBoth]);

  // ---------------- the game loop ----------------
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, raf = 0, ground = 0, unit = 1;
    let things: Thing[] = [];
    let pops: Pop[] = [];
    let dist = 0, speed = 6, level = 0, hearts = MAX_HEARTS, stars = 0, shield = false, invuln = 0, t = 0;
    let turbo = 0; // frames of super speed left
    let bonus = 0; // points from stars, smashes, checkpoints
    let combo = 0, comboTimer = 0;
    let themeFrom = 0, themeK = 1; // blend between city moods
    let sparks: Spark[] = [];
    const trail: { y: number; tilt: number; pedal: number }[] = [];
    let nextSpawn = 600, grace = 0, shake = 0, hudTick = 0;
    // the people met along the road
    let mentor: { i: number; x: number; done: boolean } | null = null;
    let metLevel = -1, talkIdx = -1;
    // what she rides changes with the years: backpack → bike → on foot → roadster
    const rideAt = (d: number): Ride => {
      const lv = Math.min(CHAPTERS.length - 1, Math.floor(d / LEVEL_LEN));
      const c = CHAPTERS[lv];
      const u = d / LEVEL_LEN - lv;
      return c.rideChange && u >= c.rideChange.at ? c.rideChange.ride : c.ride;
    };
    let ride: Ride = CHAPTERS[0].ride;
    let shine = 0; // light sweep over the car when it first appears
    let got = new Set<string>();
    const rider = { y: 0, vy: 0, jumps: 0, pedal: 0, tilt: 0 };
    let clouds: { x: number; y: number; s: number; parts: [number, number, number][]; depth: number }[] = [];
    const weather = makeWeather(70);
    let comet: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let nextComet = 6;
    const dust = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), sp: 0.2 + Math.random() * 0.6, ph: Math.random() * 6, r: 0.6 + Math.random() * 1.4 }));
    let cloudSprites: HTMLCanvasElement[] = [];
    let spriteGlow = "";
    let spriteTick = 0;
    // pre-paint each cloud once (soft, blurred, lit from below) and reuse it every frame
    const paintClouds = (glowC: string, shadeC: string) => {
      cloudSprites = clouds.map((c) => {
        const S = c.s;
        const cw = Math.ceil(S * 4.4), chh = Math.ceil(S * 2.7);
        const cv = document.createElement("canvas");
        cv.width = cw;
        cv.height = chh;
        const g = cv.getContext("2d")!;
        const ox = cw / 2, oy = chh * 0.82;
        const puffs: [number, number, number][] = [];
        c.parts.forEach(([px, py, r], i) => {
          puffs.push([px, py, r]);
          for (let k = 0; k < 3; k++) {
            const a = -Math.PI * (0.15 + 0.7 * seeded(i * 9 + k));
            puffs.push([px + Math.cos(a) * r * 0.45, py + Math.sin(a) * r * 0.42, r * (0.45 + 0.2 * seeded(i * 3 + k))]);
          }
        });
        const blob = (dx: number, dy: number, scale: number, style: string | CanvasGradient, blur: number) => {
          g.filter = blur ? `blur(${blur}px)` : "none";
          g.fillStyle = style;
          for (const [px, py, r] of puffs) {
            g.beginPath();
            g.arc(ox + px * S + dx, oy + py * S + dy, r * S * 0.55 * scale, 0, Math.PI * 2);
            g.fill();
          }
        };
        // 1. warm rim of light underneath (soft, like light bleeding through)
        g.globalAlpha = 0.55;
        blob(0, S * 0.05, 1.02, glowC, 7);
        g.globalAlpha = 1;
        // 2. shaded body
        const body = g.createLinearGradient(0, oy - S * 0.95, 0, oy + S * 0.1);
        body.addColorStop(0, "#ffffff");
        body.addColorStop(0.55, mixToHex("#f6f8ff", shadeC, 0.35));
        body.addColorStop(1, mixToHex(shadeC, "#ffffff", 0.15));
        blob(0, 0, 1, body, 2.5);
        // 3. sunlit tops, offset up-left
        const lit = g.createLinearGradient(0, oy - S, 0, oy - S * 0.2);
        lit.addColorStop(0, "#fffaf5");
        lit.addColorStop(1, mixToHex("#fff1f6", glowC, 0.35) + "00");
        blob(-S * 0.05, -S * 0.07, 0.78, lit, 3);
        g.filter = "none";
        return cv;
      });
      spriteGlow = glowC;
    };
    const makeClouds = () => {
      clouds = Array.from({ length: 7 }, (_, i) => {
        const parts: [number, number, number][] = [];
        const n = 9 + Math.floor(Math.random() * 6);
        for (let k = 0; k < n; k++) {
          const u = k / (n - 1);
          // a flat-bottomed cumulus: bigger puffs in the middle, rising tops
          const r = (0.35 + Math.sin(Math.PI * u) * 0.65) * (0.6 + Math.random() * 0.5);
          parts.push([(u - 0.5) * 2.4, -r * 0.55 - Math.random() * 0.25, r]);
        }
        return { x: Math.random() * w * 1.6, y: h * (0.12 + Math.random() * 0.36), s: (60 + Math.random() * 90) * unit * (i < 2 ? 1.5 : 1), parts, depth: 0.03 + Math.random() * 0.06 };
      });
    };
    let far: Building[] = [];
    let mid: Building[] = [];
    let landmarkX = Infinity;

    const makeSkyline = (count: number, minH: number, maxH: number, minW: number, maxW: number) => {
      const out: Building[] = [];
      let x = 0;
      for (let i = 0; i < count; i++) {
        const bw = minW + Math.random() * (maxW - minW);
        out.push({ x, w: bw, h: minH + Math.random() * (maxH - minH), seed: Math.random() * 1000 });
        x += bw + 4 + Math.random() * 18;
      }
      return out;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ground = Math.round(h * 0.8);
      unit = Math.max(0.65, Math.min(1.25, h / 820));
      far = makeSkyline(40, h * 0.12, h * 0.32, 40, 110);
      mid = makeSkyline(34, h * 0.1, h * 0.24, 50, 120);
      makeClouds();
      spriteGlow = "";
    };

    const levelOf = (d: number) => Math.min(CHAPTERS.length - 1, Math.floor(d / LEVEL_LEN));

    const reset = () => {
      things = [];
      pops = [];
      dist = 0;
      speed = 6;
      level = 0;
      hearts = MAX_HEARTS;
      stars = 0;
      bonus = 0;
      combo = 0;
      comboTimer = 0;
      themeFrom = 0;
      themeK = 1;
      sparks = [];
      shield = false;
      turbo = 0;
      invuln = 0;
      nextSpawn = 700;
      grace = 90;
      got = new Set();
      rider.y = 0;
      rider.vy = 0;
      rider.jumps = 0;
      won = false;
      endless = false;
      hits = 0;
      bestDist = readNum("ik-ride-bestdist");
      confetti.length = 0;
      landmarkX = w * 0.75;
      mentor = null;
      arrival = -1;
      setArriving(false);
      ride = CHAPTERS[0].ride;
      metLevel = -1;
      talkIdx = -1;
      setTalk(null);
      setCollected([]);
      setHud({ score: 0, hearts: MAX_HEARTS, level: 0, km: 0, shield: false, turbo: false, combo: 1 });
      showPostcard(0);
    };
    resetRef.current = reset;

    let postcardTimer = 0;
    const showPostcard = (i: number) => {
      window.clearTimeout(postcardTimer);
      setPostcard(CHAPTERS[i]);
      postcardTimer = window.setTimeout(() => setPostcard(null), 3200);
    };

    let jumpBuffer = 0; // a press just before landing still counts
    const jump = () => {
      if (rider.jumps < 2) {
        rider.vy = (rider.jumps === 0 ? -16.8 : -14.5) * unit;
        rider.jumps += 1;
        sfx("jump");
      } else {
        jumpBuffer = 9;
      }
    };
    // release early = short hop (hold for a full jump)
    const release = () => {
      if (rider.vy < -6 * unit) rider.vy *= 0.5;
    };
    let arrival = -1; // seconds since crossing the finish (−1 = not yet)
    let arrivalT0 = 0;
    const ARRIVAL_SECONDS = 9;
    const finishRide = () => {
      if (won) return;
      won = true;
      arrival = -1;
      setArriving(false);
      bonus += 500 + hearts * 200;
      const sc = score();
      const prev = readBest();
      if (sc > prev) saveBest(sc);
      if (dist > bestDist) writeNum("ik-ride-bestdist", dist);
      setBest(Math.max(prev, sc));
      setCollected([...got]);
      setRank(hits === 0 ? 3 : hits <= 2 ? 2 : 1);
      setHud({ score: sc, hearts, level, km: dist / 1000, shield, turbo: false, combo: 1 });
      screenRef.current = "won";
      setScreen("won");
    };
    arrivalSkipRef.current = finishRide;
    const endTalk = () => {
      talkIdx = -1;
      if (mentor) mentor.done = true;
      setTalk(null);
      grace = 70;
      nextSpawn = 500 * unit;
      invuln = Math.max(invuln, 40);
    };
    const talkNext = () => {
      if (!mentor) return;
      const m = MENTORS[mentor.i];
      talkIdx += 1;
      if (talkIdx >= m.lines.length) {
        endTalk();
        return;
      }
      const line = m.lines[talkIdx];
      sfx("star", line.who === "me" ? 4 : -2);
      setTalk({ name: m.name, company: CHAPTERS[mentor.i].company, color: CHAPTERS[mentor.i].color, who: line.who, text: line.text, i: talkIdx, n: m.lines.length });
    };
    talkNextRef.current = talkNext;
    talkSkipRef.current = endTalk;
    jumpRef.current = () => {
      if (arrival >= 1.5) finishRide();
      else if (arrival >= 0) return;
      else if (talkIdx >= 0) talkNext();
      else jump();
    };
    releaseRef.current = release;
    let won = false, endless = false, hits = 0;
    let bestDist = readNum("ik-ride-bestdist");
    const FINISH = LEVEL_LEN * CHAPTERS.length;
    const confetti: { x: number; y: number; vx: number; vy: number; rot: number; c: string }[] = [];
    endlessRef.current = () => {
      endless = true;
      grace = 90;
      invuln = 60;
      screenRef.current = "playing";
      setScreen("playing");
    };

    const pop = (x: number, y: number, text: string, color: string) => pops.push({ x, y, text, color, life: 1 });

    const score = () => Math.floor(dist / 10) + bonus;
    const mult = () => Math.min(5, 1 + Math.floor(combo / 3));
    const burst = (x: number, y: number, color: string, n = 14) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 3.5;
        sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, color, rot: Math.random() * 6 });
      }
    };

    const spawn = () => {
      const lv = level;
      const r = Math.random();
      const x = w + 60;
      if (r < 0.45) {
        // a skill star, sometimes high up
        const high = Math.random() < 0.5;
        things.push({ kind: "star", x, y: ground - (high ? 190 : 70) * unit, w: 26 * unit, h: 26 * unit, label: SKILLS[Math.floor(Math.random() * SKILLS.length)], phase: Math.random() * 6 });
        if (Math.random() < 0.4) {
          things.push({ kind: "star", x: x + 70 * unit, y: ground - (high ? 220 : 110) * unit, w: 26 * unit, h: 26 * unit, label: SKILLS[Math.floor(Math.random() * SKILLS.length)], phase: Math.random() * 6 });
        }
        nextSpawn = 220 + Math.random() * 200;
        return;
      }
      if (r > 0.965 && !shield) {
        things.push({ kind: "shield", x, y: ground - 150 * unit, w: 30 * unit, h: 34 * unit, phase: 0 });
        nextSpawn = 300;
        return;
      }
      if (r > 0.935 && r <= 0.965 && turbo <= 0) {
        // turbo orb: a few seconds of super speed
        things.push({ kind: "turbo", x, y: ground - (Math.random() < 0.5 ? 70 : 160) * unit, w: 32 * unit, h: 32 * unit, phase: 0 });
        nextSpawn = 300;
        return;
      }
      const roll = Math.random();
      // phishing emails fly at head height: stay low to pass under them
      if (lv >= 1 && roll > 0.72) {
        things.push({ kind: "phish", x, y: ground - 108 * unit, w: 44 * unit, h: 30 * unit, phase: Math.random() * 6 });
        if (false) {
          // (easy mode: no bug under the phish any more)
          things.push({ kind: "bug", x: x + 150 * unit, y: ground, w: 42 * unit, h: 32 * unit, phase: 2 });
        }
        nextSpawn = Math.max(640, 900 - lv * 30) * unit + Math.random() * 300 * unit;
        return;
      }
      // spam ghosts float up and down: time your jump
      if (lv >= 1 && roll > 0.6 && roll <= 0.72) {
        things.push({ kind: "ghost", x, y: ground - 80 * unit, w: 40 * unit, h: 40 * unit, phase: Math.random() * 6 });
        nextSpawn = Math.max(660, 920 - lv * 30) * unit + Math.random() * 300 * unit;
        return;
      }
      // outages: a hole in the road you have to jump
      if (lv >= 3 && roll < 0.06) {
        const gw = (80 + Math.random() * 30) * unit;
        things.push({ kind: "gap", x: x + gw / 2, y: ground, w: gw, h: 40, phase: 0 });
        nextSpawn = gw + 640 * unit;
        return;
      }
      let kind: Kind = "bug";
      if (lv >= 1 && roll < 0.35) kind = "crate";
      if (lv >= 3 && roll < 0.12) kind = "firewall";
      const dims = ({ bug: [42, 32], crate: [46, 58], firewall: [46, 112] } as Record<string, number[]>)[kind];
      things.push({ kind, x, y: ground, w: dims[0] * unit, h: dims[1] * unit, phase: Math.random() * 6 });
      // pairs of bugs later on
      if (false) {
        things.push({ kind: "bug", x: x + 60 * unit, y: ground, w: 42 * unit, h: 32 * unit, phase: 1 });
      }
      const gap = Math.max(620, (lv === 0 ? 1050 : 950) - lv * 30) * unit;
      nextSpawn = gap + Math.random() * 300 * unit;
    };

    const gameOver = () => {
      if (dist > bestDist) writeNum("ik-ride-bestdist", dist);
      const s = score();
      const prev = readBest();
      if (s > prev) saveBest(s);
      setBest(Math.max(prev, s));
      setCollected([...got]);
      setHud({ score: s, hearts: 0, level, km: dist / 1000, shield: false, turbo: false, combo: 1 });
      screenRef.current = "over";
      setScreen("over");
    };

    // ---------- drawing ----------
    const seeded = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    const drawSkyline = (list: Building[], parallax: number, color: string, windowColor: string, base: number, rim = "rgba(255,255,255,0.2)") => {
      const total = list[list.length - 1].x + list[list.length - 1].w + 20;
      const off = (dist * parallax) % total;
      for (let rep = 0; rep < 2; rep++) {
        for (const b of list) {
          const x = b.x - off + rep * total;
          if (x > w || x + b.w < 0) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x, base - b.h, b.w, b.h);
          // cel shading: lit edge facing the horizon glow + a darker side
          ctx.fillStyle = rim;
          ctx.fillRect(x, base - b.h, 3, b.h);
          ctx.fillRect(x, base - b.h, b.w, 2);
          ctx.fillStyle = "rgba(40,50,90,0.16)";
          ctx.fillRect(x + b.w * 0.62, base - b.h, b.w * 0.38, b.h);
          // lit windows
          ctx.fillStyle = windowColor;
          for (let wy = base - b.h + 10; wy < base - 8; wy += 14) {
            for (let wx = x + 6; wx < x + b.w - 8; wx += 12) {
              if (seeded(b.seed + wx * 0.37 + wy * 1.7) > 0.72) ctx.fillRect(wx, wy, 5, 6);
            }
          }
        }
      }
    };




    const drawStar = (th: Thing) => {
      const bob = Math.sin(t * 3 + th.phase) * 6;
      const r = th.w / 2;
      drawAnimeStar(ctx, th.x, th.y + bob, r, Math.sin(t * 2 + th.phase) * 0.3);
      ctx.font = `600 ${11 * unit}px "Sora", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.strokeText(th.label || "", th.x, th.y + bob + r + 14 * unit);
      ctx.fillStyle = "#1e2a48";
      ctx.fillText(th.label || "", th.x, th.y + bob + r + 14 * unit);
    };


    const drawGap = (th: Thing) => {
      const x = th.x - th.w / 2;
      const g = ctx.createLinearGradient(0, ground, 0, h);
      g.addColorStop(0, "#000000");
      g.addColorStop(1, "#05070f");
      ctx.fillStyle = g;
      ctx.fillRect(x, ground - 1, th.w, h - ground + 1);
      // glowing hazard edges
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#fb7185";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, ground);
      ctx.lineTo(x, ground + 18);
      ctx.moveTo(x + th.w, ground);
      ctx.lineTo(x + th.w, ground + 18);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(251,113,133,0.9)";
      ctx.font = `700 ${12 * unit}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("503", th.x, ground + 30 * unit);
    };

    const drawTurbo = (th: Thing) => {
      // a pink magic orb with a sparkle: catch it to become a spin-ball
      const bob = Math.sin(t * 3 + th.phase) * 5;
      const r = th.w / 2;
      ctx.save();
      ctx.translate(th.x, th.y + bob);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.7);
      g.addColorStop(0, "rgba(249,168,201,0.6)");
      g.addColorStop(1, "rgba(249,168,201,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      const ball = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 0.75);
      ball.addColorStop(0, "#ffffff");
      ball.addColorStop(0.5, "#f6a5c4");
      ball.addColorStop(1, "#c7608a");
      ctx.fillStyle = ball;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(t * 2);
      ctx.fillStyle = "#ffffff";
      const k2 = r * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, -k2);
      ctx.quadraticCurveTo(0, 0, k2, 0);
      ctx.quadraticCurveTo(0, 0, 0, k2);
      ctx.quadraticCurveTo(0, 0, -k2, 0);
      ctx.quadraticCurveTo(0, 0, 0, -k2);
      ctx.fill();
      ctx.restore();
    };

    const drawShield = (th: Thing, x = th.x, y = th.y, s = 1) => {
      const bob = Math.sin(t * 3) * 5;
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.scale(unit * s, unit * s);
      ctx.shadowColor = "#6ee7b7";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(110,231,183,0.25)";
      ctx.strokeStyle = "#6ee7b7";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(14, -11);
      ctx.lineTo(14, 1);
      ctx.quadraticCurveTo(12, 13, 0, 18);
      ctx.quadraticCurveTo(-12, 13, -14, 1);
      ctx.lineTo(-14, -11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-1, 5);
      ctx.lineTo(7, -5);
      ctx.stroke();
      ctx.restore();
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const k = dt * 60; // frame-rate independence
      const playing = screenRef.current === "playing";
      const riderX = w * 0.22;

      if (playing) {
        t += dt;
        speed = Math.min(8.2, 4.6 + dist / 12000 + level * 0.15) * (turbo > 0 ? 1.5 : 1);
        // a stop in every city: someone who helped me is waiting by the road
        if (!mentor && !won && !endless && arrival < 0 && level > metLevel && level < MENTORS.length && dist >= level * LEVEL_LEN + (level === 0 ? 500 : 1800)) {
          mentor = { i: level, x: w + 80 * unit, done: false };
          turbo = 0; // slow down for the chat
          metLevel = level;
          things = things.filter((th) => th.x < w - 20);
        }
        if (mentor && !mentor.done) {
          grace = Math.max(grace, 30);
          if (talkIdx >= 0) speed = 0;
          else {
            const gapX = mentor.x - riderX;
            speed *= Math.max(0.22, Math.min(1, (gapX - 95 * unit) / (300 * unit)));
            if (gapX <= 112 * unit && rider.y <= 0) talkNext();
          }
        }
        if (arrival >= 0) speed *= Math.max(0.4, 1 - arrival / 3.2); // ease to a cruise: the road keeps going
        if (mentor) {
          mentor.x -= speed * k;
          if (mentor.done && mentor.x < -160 * unit) mentor = null;
        }
        dist += speed * k;
        if (turbo > 0) {
          turbo = Math.max(0, turbo - k);
          trail.unshift({ y: rider.y, tilt: rider.tilt, pedal: rider.pedal });
          if (trail.length > 12) trail.pop();
        } else if (trail.length) trail.pop();
        grace = Math.max(0, grace - k);
        invuln = Math.max(0, invuln - k);
        rider.pedal += speed * 0.03 * k;
        themeK = Math.min(1, themeK + 0.008 * k);
        if (comboTimer > 0) {
          comboTimer -= k;
          if (comboTimer <= 0) combo = 0;
        }
        // petals blowing out of the basket
        if (ride === "bike" && Math.random() < 0.18 * k) {
          sparks.push({
            x: riderX + 26 * unit, y: ground - rider.y - 36 * unit,
            vx: -1.5 - Math.random() * 1.5 - speed * 0.15, vy: -0.6 + Math.random() * 0.6,
            life: 1, color: ROAD_FLOWERS[Math.floor(Math.random() * 3)], petal: true, rot: Math.random() * 6,
          });
        }

        // the finish line: slow down and take in the view before the results
        if (!won && !endless && arrival < 0 && dist >= FINISH) {
          arrival = 0;
          arrivalT0 = now;
          things = things.filter((th) => th.x < riderX - 60 * unit);
          grace = 99999;
          turbo = 0;
          sfx("win");
          for (let i = 0; i < 120; i++) {
            confetti.push({ x: Math.random() * w, y: -Math.random() * h * 0.6, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, rot: Math.random() * 6, c: ["#f9a8c9", "#67e8f9", "#6ee7b7", "#fde68a", "#c4b5fd"][i % 5] });
          }
          setArriving(true);
        }
        if (arrival >= 0 && !won) {
          arrival = (now - arrivalT0) / 1000;
          if (arrival >= ARRIVAL_SECONDS) finishRide();
        }

        // level / city change
        const lv = levelOf(dist);
        if (lv !== level) {
          level = lv;
          grace = 120;
          landmarkX = w + 40;
          showPostcard(lv);
          pop(w / 2, h * 0.32, `Welcome to ${CHAPTERS[lv].city}!`, CHAPTERS[lv].color);
          pop(w / 2, h * 0.44, SEASON_LABEL[LEVEL_SEASONS[lv]], "#ffffff");
          turbo = Math.max(turbo, 150); // a little speed burst into every new city
          themeFrom = lv - 1;
          themeK = 0;
          bonus += 150;
          const healed = hearts < MAX_HEARTS;
          hearts = Math.min(MAX_HEARTS, hearts + 1);
          pop(w / 2, h * 0.38, healed ? "checkpoint +150 · +1 ♥" : "checkpoint +150", "#fde68a");
          burst(w / 2, h * 0.36, CHAPTERS[lv].color, 30);
          sfx("check");
        }

        // new ride?
        const nr = rideAt(dist);
        if (nr !== ride) {
          ride = nr;
          const c = CHAPTERS[level];
          const label = c.rideChange && nr === c.rideChange.ride ? c.rideChange.label : c.rideLabel;
          if (label) pop(riderX + 20 * unit, ground - 140 * unit, label, "#f9a8c9");
          burst(riderX, ground - 40 * unit, "#f9a8c9", 26);
          sfx("shield");
          if (nr === "car") {
            shine = 1;
            burst(riderX, ground - 30 * unit, "#fde68a", 30);
          }
        }

        // rider physics
        rider.vy += 0.75 * unit * k;
        rider.y -= rider.vy * k;
        if (rider.y <= 0) {
          if (rider.jumps > 0 && rider.vy > 4 * unit) {
            for (let i = 0; i < 8; i++) {
              sparks.push({ x: riderX - 10 * unit + Math.random() * 30 * unit, y: ground - 2, vx: -1 - Math.random() * 2, vy: -Math.random() * 1.6, life: 0.7, color: "rgba(226,232,240,0.7)", rot: 0 });
            }
            sfx("land");
          }
          rider.y = 0;
          rider.vy = 0;
          rider.jumps = 0;
          if (jumpBuffer > 0) {
            jumpBuffer = 0;
            jump();
          }
        }
        jumpBuffer = Math.max(0, jumpBuffer - k);
        rider.tilt += ((rider.y > 0 ? -0.18 : 0) - rider.tilt) * 0.2;

        // spawn
        nextSpawn -= speed * k;
        if (nextSpawn <= 0 && grace <= 0) spawn();

        // move + collide
        const s = 13 * unit;
        const box = { x: riderX - 1.4 * s, y: ground - rider.y - 4.2 * s, w: 3.0 * s, h: 4.0 * s }; // forgiving hitbox
        for (const th of things) {
          th.x -= speed * k * (th.kind === "bug" ? 1.12 : th.kind === "phish" ? 1.3 : 1);
          if (th.kind === "phish") th.y = ground - 108 * unit + Math.sin(t * 5 + th.phase) * 5 * unit;
          if (th.kind === "ghost") th.y = ground - 95 * unit + Math.sin(t * 1.8 + th.phase) * 32 * unit;
          if (th.done) continue;
          const centered = th.kind === "star" || th.kind === "shield" || th.kind === "turbo" || th.kind === "phish" || th.kind === "ghost";
          const tb = centered
            ? { x: th.x - th.w * 0.4, y: th.y - th.h * 0.4, w: th.w * 0.8, h: th.h * 0.8 }
            : { x: th.x - th.w * 0.35, y: th.y - th.h * 0.85, w: th.w * 0.7, h: th.h * 0.85 };
          const hit = th.kind === "gap"
            ? rider.y < 2 && riderX > th.x - th.w / 2 + 12 * unit && riderX < th.x + th.w / 2 - 12 * unit
            : box.x < tb.x + tb.w && box.x + box.w > tb.x && box.y < tb.y + tb.h && box.y + box.h > tb.y;
          if (!hit) {
            // near miss: cleared an obstacle by a hair → small bonus
            const danger = th.kind === "bug" || th.kind === "crate" || th.kind === "firewall" || th.kind === "phish" || th.kind === "gap" || th.kind === "ghost";
            if (danger && !th.passed && th.x + th.w / 2 < box.x && turbo <= 0) {
              th.passed = true;
              const clearance = th.kind === "phish" || th.kind === "ghost" ? th.y - th.h / 2 - (ground - rider.y) : rider.y - (th.kind === "gap" ? 0 : th.h);
              if (clearance >= 0 && clearance < 26 * unit && th.kind !== "gap") {
                bonus += 15;
                pop(riderX, ground - rider.y - 80 * unit, "close one · +15", "#e2e8f0");
                sfx("star", -5);
              }
            }
            continue;
          }
          if (th.kind === "star") {
            th.done = true;
            stars += 1;
            combo += 1;
            comboTimer = 200;
            const pts = 25 * mult();
            bonus += pts;
            if (th.label) got.add(th.label);
            pop(th.x, th.y - 20, mult() > 1 ? `${th.label} +${pts} ×${mult()}` : `${th.label} +${pts}`, "#a5f3fc");
            sfx("star", Math.min(12, combo));
            burst(th.x, th.y, "#a5f3fc", 12);
          } else if (th.kind === "turbo") {
            th.done = true;
            turbo = 300;
            burst(riderX, ground - rider.y - 30 * unit, "#f9a8c9", 24); // poof: she turns into a spin-ball
            sfx("turbo");
            pop(th.x, th.y - 24, "spin!", "#f9a8c9");
          } else if (turbo > 0) {
            // super speed smashes straight through obstacles (and flies over outages)
            th.done = true;
            if (th.kind === "gap") continue;
            bonus += 25;
            burst(th.x, th.y - th.h / 2, "#67e8f9", 16);
            shake = 6;
            pop(th.x, th.y - th.h - 10, "+25", "#f9a8c9");
          } else if (th.kind === "shield") {
            th.done = true;
            shield = true;
            sfx("shield");
            pop(th.x, th.y - 24, "ProGuard shield!", "#6ee7b7");
          } else if (invuln <= 0) {
            th.done = true;
            if (shield) {
              shield = false;
              invuln = 50;
              pop(riderX, ground - rider.y - 90 * unit, "blocked by ProGuard ✦", "#6ee7b7");
            } else {
              hearts -= 1;
              hits += 1;
              sfx("hit");
              invuln = 150;
              shake = 14;
              combo = 0;
              if (th.kind === "gap") {
                rider.vy = -14 * unit; // bounce back out of the hole
                rider.y = 1;
              }
              const msg = th.kind === "bug" ? "slimed by a bug!" : th.kind === "crate" ? "legacy daruma!" : th.kind === "phish" ? "the phish got you!" : th.kind === "ghost" ? "boo! spam!" : th.kind === "gap" ? "outage!" : "foxfire!";
              pop(riderX, ground - rider.y - 90 * unit, msg, "#fb7185");
            }
          }
        }
        things = things.filter((th) => th.x + th.w / 2 > -120 && !(th.done && (th.kind === "star" || th.kind === "shield" || th.kind === "turbo")));
        if (landmarkX > -400) landmarkX -= speed * 0.35 * k;
        hudTick += 1;
        if (hudTick % 10 === 0) setProg(Math.min(1, dist / FINISH));
        if (hudTick % 5 === 0 || hearts <= 0) setHud({ score: score(), hearts, level, km: dist / 1000, shield, turbo: turbo > 0, combo: mult() });
        if (hearts <= 0) gameOver();
      } else {
        rider.pedal += 0.04;
      }

      // ---------- render ----------
      const ch = CHAPTERS[level];
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.85;
        if (shake < 0.5) shake = 0;
      }

      // Shinkai-style sky (blends into the next city's mood)
      const A = THEMES[Math.max(0, Math.min(THEMES.length - 1, themeK < 1 ? themeFrom : level))];
      const B = THEMES[Math.min(THEMES.length - 1, level)];
      const tk = themeK < 1 ? themeK : 1;
      // after the finish: the sky slowly turns to golden hour
      const gk = arrival >= 0 ? Math.min(1, arrival / 4) : won ? 1 : 0;
      const GOLD = { sky: ["#3d58a8", "#e98fa6", "#ffd3a1"], glow: "#ffd9a8" };
      const glow = mixToHex(mixToHex(A.glow, B.glow, tk), GOLD.glow, gk);
      const sky = ctx.createLinearGradient(0, 0, 0, ground);
      sky.addColorStop(0, mixHex(mixToHex(A.sky[0], B.sky[0], tk), GOLD.sky[0], gk));
      sky.addColorStop(0.5, mixHex(mixToHex(A.sky[1], B.sky[1], tk), GOLD.sky[1], gk));
      sky.addColorStop(0.92, mixHex(mixToHex(A.sky[2], B.sky[2], tk), GOLD.sky[2], gk));
      sky.addColorStop(1, glow);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      const coast = A.coast + (B.coast - A.coast) * tk;
      const starAmt = A.stars + (B.stars - A.stars) * tk;

      // stars, only in the deep part of the sky
      for (let i = 0; i < 140; i++) {
        const sx = ((seeded(i * 3.1) * w * 1.3 - dist * 0.01) % (w * 1.3) + w * 1.3) % (w * 1.3);
        const sy = seeded(i * 7.7) * ground * 0.5;
        ctx.globalAlpha = starAmt * (0.25 + 0.75 * Math.abs(Math.sin(t * 1.3 + i))) * (1 - sy / (ground * 0.55));
        ctx.fillStyle = "#ffffff";
        const sz = i % 11 === 0 ? 2.4 : 1.3;
        ctx.fillRect(sx, sy, sz, sz);
        if (i % 11 === 0) {
          ctx.globalAlpha *= 0.4;
          ctx.fillRect(sx - 4, sy + sz / 2 - 0.4, 8 + sz, 0.8);
          ctx.fillRect(sx + sz / 2 - 0.4, sy - 4, 0.8, 8 + sz);
        }
      }
      ctx.globalAlpha = 1;

      // the setting sun glow on the horizon, with soft light rays
      // a bright overexposed sun high on the left, light streaming down (TV-anime daylight)
      const sunX = w * (0.12 + 0.5 * gk), sunY = h * 0.07 + (ground - h * 0.14 - h * 0.07) * gk;
      const sun = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, h * 0.75);
      sun.addColorStop(0, "#ffffff");
      sun.addColorStop(0.18, glow + "aa");
      sun.addColorStop(1, glow + "00");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, ground);
      ctx.save();
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 40 * unit;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26 * unit, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.3 + (i - 3) * 0.11 + Math.sin(t * 0.15 + i) * 0.02;
        const len = h * (1.1 + 0.15 * Math.sin(t * 0.3 + i * 2));
        const spread = 0.025 + (i % 3) * 0.012;
        const g2 = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(a) * len, sunY + Math.sin(a) * len);
        g2.addColorStop(0, "rgba(255,255,245,0.11)");
        g2.addColorStop(1, "rgba(255,255,245,0)");
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(a - spread) * len, sunY + Math.sin(a - spread) * len);
        ctx.lineTo(sunX + Math.cos(a + spread) * len, sunY + Math.sin(a + spread) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // lens flare from the sun toward the centre of the screen
      {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const vx = w * 0.5 - sunX, vy = h * 0.45 - sunY;
        const flares: [number, number, string][] = [[0.35, 14, "rgba(255,255,240,0.06)"], [0.6, 26, "rgba(200,230,255,0.04)"], [0.85, 8, "rgba(255,255,255,0.08)"], [1.15, 38, "rgba(255,220,240,0.03)"]];
        for (const [k2, r, col] of flares) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(sunX + vx * k2, sunY + vy * k2, r * unit, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // the comet (Your Name): a bright head with two soft tails across the sky
      nextComet -= dt;
      if (!comet && nextComet <= 0 && starAmt > 0.3) {
        comet = { x: w * (0.5 + Math.random() * 0.5), y: -20, vx: -(2.2 + Math.random()), vy: 1.1 + Math.random() * 0.5, life: 1 };
        nextComet = 14 + Math.random() * 10;
      }
      if (comet) {
        comet.x += comet.vx * (dt * 60);
        comet.y += comet.vy * (dt * 60);
        if (comet.y > ground * 0.6 || comet.x < -100) comet = null;
        else {
          for (const [ang, col, len] of [[0, "rgba(180,220,255,", 1], [0.12, "rgba(255,190,220,", 0.75]] as const) {
            const dx = -comet.vx, dy = -comet.vy;
            const m = Math.hypot(dx, dy);
            const ux = dx / m, uy = dy / m;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            const tx = ux * ca - uy * sa, ty = ux * sa + uy * ca;
            const L = h * 0.35 * len;
            const cg = ctx.createLinearGradient(comet.x, comet.y, comet.x + tx * L, comet.y + ty * L);
            cg.addColorStop(0, col + "0.9)");
            cg.addColorStop(1, col + "0)");
            ctx.strokeStyle = cg;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(comet.x, comet.y);
            ctx.lineTo(comet.x + tx * L, comet.y + ty * L);
            ctx.stroke();
          }
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#cfe8ff";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(comet.x, comet.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // moon (night themes only)
      const mx = w * 0.82, my = h * 0.16, mr = Math.min(60, h * 0.07);
      ctx.globalAlpha = Math.min(1, starAmt * 1.5);
      const mg = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
      mg.addColorStop(0, "rgba(255,245,210,0.28)");
      mg.addColorStop(1, "rgba(255,245,210,0)");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 3, 0, Math.PI * 2);
      ctx.fill();
      const mb = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
      mb.addColorStop(0, "#fff9e9");
      mb.addColorStop(0.6, "#f1e6c2");
      mb.addColorStop(1, "#cbbd92");
      ctx.fillStyle = mb;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // big painted clouds, lit from below by the horizon glow (Shinkai style)
      spriteTick++;
      if (spriteGlow !== glow && (spriteGlow === "" || spriteTick % 12 === 0)) paintClouds(glow, mixToHex(A.shade, B.shade, tk));
      clouds.forEach((c, i) => {
        let cx = c.x - dist * c.depth - t * 4 * c.depth * 10;
        const span = w * 1.6;
        cx = ((cx % span) + span) % span - w * 0.3;
        const sp = cloudSprites[i];
        if (!sp) return;
        ctx.globalAlpha = 0.96;
        ctx.drawImage(sp, cx - sp.width / 2, c.y - sp.height * 0.82);
        ctx.globalAlpha = 1;
      });

      // distant hills in layers of haze (atmospheric perspective)
      if (coast < 0.99) {
        const horizonCol = mixHex(A.sky[2], B.sky[2], tk);
        for (let li = 0; li < 3; li++) {
          const base = ground - h * (0.2 - li * 0.045);
          const amp = h * (0.05 - li * 0.01);
          const par = 0.02 + li * 0.04;
          const ss = LEVEL_SEASONS[Math.min(LEVEL_SEASONS.length - 1, level)];
          const land = ss === "winter" ? "#e4ecf5" : ss === "autumn" ? "#c7a46c" : "#7fb47c";
          const col = mixToHex(li === 2 ? land : li === 1 ? mixToHex(land, mixToHex(A.far, B.far, tk), 0.5) : mixToHex(A.far, B.far, tk), mixToHex(A.sky[2], B.sky[2], tk), 0.6 - li * 0.22);
          ctx.globalAlpha = 1 - coast;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(0, ground);
          for (let x = 0; x <= w + 20; x += 20) {
            const X = x + dist * par;
            const y = base - amp * (0.6 * Math.sin(X * 0.0021 + li * 2) + 0.3 * Math.sin(X * 0.0057 + li) + 0.1 * Math.sin(X * 0.013));
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, ground);
          ctx.closePath();
          ctx.fill();
          // haze on top of each layer
          const hz = ctx.createLinearGradient(0, base - amp, 0, ground);
          hz.addColorStop(0, horizonCol.replace("rgb(", "rgba(").replace(")", ",0)"));
          hz.addColorStop(1, horizonCol.replace("rgb(", "rgba(").replace(")", ",0.35)"));
          ctx.fillStyle = hz;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // floating light dust
      for (const d of dust) {
        d.y -= 0.0006 * d.sp * (dt * 60);
        d.x -= 0.0004 * d.sp * (dt * 60);
        if (d.y < 0) d.y = 1;
        if (d.x < 0) d.x = 1;
        ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 2 + d.ph));
        ctx.fillStyle = "#fff6e6";
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * ground, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Brittany: the sea, with the moon's reflection and waves
      if (coast > 0.01) {
        ctx.globalAlpha = coast;
        const horizon = ground - h * 0.2;
        const sea = ctx.createLinearGradient(0, horizon, 0, ground);
        sea.addColorStop(0, "#7cc0ea");
        sea.addColorStop(1, "#2f86c4");
        ctx.fillStyle = sea;
        ctx.fillRect(0, horizon, w, ground - horizon);
        for (let r = 0; r < 14; r++) {
          const yy = horizon + 6 + r * ((ground - horizon) / 14);
          const ww = 30 + r * 6;
          ctx.fillStyle = `rgba(255,255,255,${0.6 - r * 0.035})`;
          ctx.fillRect(sunX + w * 0.1 - ww / 2 + Math.sin(t * 2 + r) * 6, yy, ww * 1.6, 2);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1.2;
        for (let r = 0; r < 6; r++) {
          const yy = horizon + 12 + r * ((ground - horizon) / 6);
          ctx.beginPath();
          for (let x = 0; x <= w; x += 12) {
            const wy = yy + Math.sin(x * 0.03 + t * 1.5 + r - dist * 0.004) * 2;
            if (x === 0) ctx.moveTo(x, wy);
            else ctx.lineTo(x, wy);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // city landmark drifting by in the background
      if (landmarkX > -400) {
        drawLandmark(ctx, ch.landmark, landmarkX, ground - 30 * unit, h * 0.42, ch.color, 0.55);
      }

      const farCol = mixHex(A.far, B.far, tk);
      const midCol = mixHex(A.mid, B.mid, tk);
      const win = tk < 0.5 ? A.win : B.win;
      if (coast < 0.99) {
        ctx.globalAlpha = 1 - coast;
        drawSkyline(far, 0.15, farCol, win, ground - 26 * unit, glow + "55");
        drawSkyline(mid, 0.45, midCol, win, ground, glow + "88");
        ctx.globalAlpha = 1;
      }
      if (coast > 0.01) {
        // little Breton stone houses with slate roofs along the coast road
        ctx.globalAlpha = coast;
        const total = mid[mid.length - 1].x + mid[mid.length - 1].w + 20;
        const off = (dist * 0.45) % total;
        for (let rep = 0; rep < 2; rep++) {
          for (const bd of mid) {
            const bw = bd.w * 0.7;
            const bh = bd.h * 0.35 + 18;
            const x = bd.x - off + rep * total;
            if (x > w || x + bw < 0) continue;
            ctx.fillStyle = "#f1ebe0";
            ctx.fillRect(x, ground - bh, bw, bh);
            ctx.fillStyle = "rgba(90,100,140,0.18)";
            ctx.fillRect(x + bw * 0.65, ground - bh, bw * 0.35, bh);
            ctx.fillStyle = "#56627e";
            ctx.beginPath();
            ctx.moveTo(x - 4, ground - bh);
            ctx.lineTo(x + bw / 2, ground - bh - bw * 0.45);
            ctx.lineTo(x + bw + 4, ground - bh);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(92,138,180,0.85)";
            if (seeded(bd.seed) > 0.3) ctx.fillRect(x + bw * 0.2, ground - bh * 0.7, 6, 7);
            if (seeded(bd.seed + 1) > 0.4) ctx.fillRect(x + bw * 0.62, ground - bh * 0.7, 6, 7);
          }
        }
        ctx.globalAlpha = 1;
      }

      // seasonal trees along the road
      const season = LEVEL_SEASONS[Math.min(LEVEL_SEASONS.length - 1, level)];
      const prevSeason = LEVEL_SEASONS[Math.max(0, Math.min(LEVEL_SEASONS.length - 1, themeFrom))];
      {
        const spacing = 230 * unit;
        const off = (dist * 0.75) % spacing;
        for (let i = -1; i < w / spacing + 2; i++) {
          const idx = Math.floor((dist * 0.75) / spacing) + i;
          const tx = i * spacing - off + seeded(idx * 2.3) * 60 * unit;
          if (seeded(idx * 5.1) < 0.25) continue;
          const sc = unit * (0.9 + seeded(idx * 1.9) * 0.4);
          if (tk < 1) {
            ctx.globalAlpha = 1 - tk;
            drawSeasonTree(ctx, tx, ground, sc, prevSeason, idx, t);
            ctx.globalAlpha = tk;
          }
          drawSeasonTree(ctx, tx, ground, sc, season, idx, t);
          ctx.globalAlpha = 1;
        }
      }

      // roadside guardrail
      {
        const ry = ground - 16 * unit;
        ctx.strokeStyle = "rgba(235,232,255,0.55)";
        ctx.lineWidth = 2.5 * unit;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(w, ry);
        ctx.moveTo(0, ry + 6 * unit);
        ctx.lineTo(w, ry + 6 * unit);
        ctx.stroke();
        const ps = 38 * unit;
        const off = dist % ps;
        ctx.fillStyle = "rgba(220,215,245,0.6)";
        for (let x = -off; x < w + ps; x += ps) ctx.fillRect(x, ry - 2 * unit, 3 * unit, 18 * unit);
      }

      // telephone poles with sagging power lines + glowing street lamps (anime staples)
      {
        const spacing = 520 * unit;
        const PH = h * 0.46;
        const poleX = (i: number) => i * spacing - (dist % spacing);
        const first = -1, last = Math.ceil(w / spacing) + 1;
        const ink = "rgba(58,62,80,0.95)";
        // wires first (behind the poles)
        ctx.strokeStyle = "rgba(50,54,72,0.7)";
        ctx.lineWidth = 1.2;
        for (let i = first; i < last; i++) {
          const x0 = poleX(i), x1 = poleX(i + 1);
          for (let wi = 0; wi < 4; wi++) {
            const y0 = ground - PH + 10 * unit + (wi % 2) * 14 * unit;
            const dx0 = (wi < 2 ? -1 : 1) * 22 * unit;
            ctx.beginPath();
            ctx.moveTo(x0 + dx0, y0);
            ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 38 * unit + wi * 3 * unit, x1 + dx0, y0);
            ctx.stroke();
          }
        }
        for (let i = first; i < last; i++) {
          const x = poleX(i);
          // pole
          ctx.fillStyle = ink;
          ctx.fillRect(x - 3.5 * unit, ground - PH, 7 * unit, PH);
          ctx.fillStyle = "rgba(255,220,200,0.25)";
          ctx.fillRect(x - 3.5 * unit, ground - PH, 2 * unit, PH);
          // cross arms + insulators
          ctx.fillStyle = ink;
          ctx.fillRect(x - 30 * unit, ground - PH + 8 * unit, 60 * unit, 4 * unit);
          ctx.fillRect(x - 24 * unit, ground - PH + 22 * unit, 48 * unit, 3.5 * unit);
          for (const ix of [-22, -10, 10, 22]) {
            ctx.beginPath();
            ctx.arc(x + ix * unit, ground - PH + 6 * unit, 2.6 * unit, 0, Math.PI * 2);
            ctx.fill();
          }
          // a small transformer box on some poles
          if (seeded(Math.floor(dist / spacing) + i) > 0.5) {
            ctx.fillRect(x + 4 * unit, ground - PH * 0.62, 12 * unit, 18 * unit);
          }
          // street lamp halfway to the next pole
          const lx = x + spacing / 2;
          const LH = h * 0.26;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 3 * unit;
          ctx.beginPath();
          ctx.moveTo(lx, ground);
          ctx.lineTo(lx, ground - LH);
          ctx.quadraticCurveTo(lx, ground - LH - 12 * unit, lx + 18 * unit, ground - LH - 10 * unit);
          ctx.stroke();
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = starAmt;
          const lg = ctx.createRadialGradient(lx + 18 * unit, ground - LH - 6 * unit, 1, lx + 18 * unit, ground - LH - 6 * unit, 46 * unit);
          lg.addColorStop(0, "rgba(255,236,190,0.9)");
          lg.addColorStop(0.2, "rgba(255,220,170,0.35)");
          lg.addColorStop(1, "rgba(255,220,170,0)");
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.arc(lx + 18 * unit, ground - LH - 6 * unit, 46 * unit, 0, Math.PI * 2);
          ctx.fill();
          // light cone onto the road
          const cg2 = ctx.createLinearGradient(0, ground - LH, 0, ground);
          cg2.addColorStop(0, "rgba(255,230,190,0.16)");
          cg2.addColorStop(1, "rgba(255,230,190,0.03)");
          ctx.fillStyle = cg2;
          ctx.beginPath();
          ctx.moveTo(lx + 12 * unit, ground - LH - 4 * unit);
          ctx.lineTo(lx + 24 * unit, ground - LH - 4 * unit);
          ctx.lineTo(lx + 70 * unit, ground + 8 * unit);
          ctx.lineTo(lx - 34 * unit, ground + 8 * unit);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // road
      const road = ctx.createLinearGradient(0, ground, 0, h);
      road.addColorStop(0, "#9aa0ad");
      road.addColorStop(0.3, "#7d8392");
      road.addColorStop(1, "#5a6070");
      ctx.fillStyle = road;
      ctx.fillRect(0, ground, w, h - ground);
      // the sunset reflecting on the road
      const refl = ctx.createRadialGradient(sunX, ground + 6, 4, sunX, ground + 6, Math.min(w * 0.35, (h - ground) * 1.6));
      refl.addColorStop(0, glow + "55");
      refl.addColorStop(1, glow + "00");
      ctx.fillStyle = refl;
      ctx.fillRect(0, ground, w, h - ground);
      // wet-asphalt reflections of the street lamps
      {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = starAmt;
        const spacing = 520 * unit;
        for (let i = -1; i < Math.ceil(w / spacing) + 1; i++) {
          const lx = i * spacing - (dist % spacing) + spacing / 2 + 18 * unit;
          const rg = ctx.createLinearGradient(0, ground, 0, h);
          rg.addColorStop(0, "rgba(255,226,180,0.22)");
          rg.addColorStop(1, "rgba(255,226,180,0)");
          ctx.fillStyle = rg;
          for (let k = 0; k < 5; k++) {
            const yy = ground + 6 + k * (h - ground) * 0.16;
            const ww = (10 - k * 1.4) * unit;
            ctx.fillRect(lx - ww / 2 + Math.sin(t * 2 + k) * 2, yy, ww, (h - ground) * 0.1);
          }
        }
        ctx.restore();
      }
      ctx.strokeStyle = ch.color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(w, ground);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([26, 22]);
      ctx.lineDashOffset = dist % 48;
      ctx.beginPath();
      ctx.moveTo(0, ground + (h - ground) * 0.45);
      ctx.lineTo(w, ground + (h - ground) * 0.45);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // winter snow along the roadside
      const snowAmt = (season === "winter" ? tk : 0) + (prevSeason === "winter" && tk < 1 ? 1 - tk : 0);
      if (snowAmt > 0.01) {
        ctx.globalAlpha = snowAmt;
        ctx.fillStyle = "#eef4ff";
        ctx.fillRect(0, ground - 3, w, 6);
        ctx.fillStyle = "rgba(238,244,255,0.25)";
        ctx.fillRect(0, ground + 3, w, (h - ground) * 0.25);
        ctx.globalAlpha = 1;
      }

      // roadside flowers scrolling with the road (snow mounds in winter)
      if (season === "winter" && tk >= 1) {
        const spacing = 46 * unit;
        const off = dist % spacing;
        ctx.fillStyle = "#f5f8ff";
        for (let i = -1; i < w / spacing + 2; i++) {
          const idx = Math.floor(dist / spacing) + i;
          const fx = i * spacing - off + seeded(idx * 1.7) * 20;
          ctx.beginPath();
          ctx.ellipse(fx, ground - 1, (6 + seeded(idx) * 6) * unit, (3 + seeded(idx * 3) * 3) * unit, 0, Math.PI, 0);
          ctx.fill();
        }
      } else {
        const spacing = 46 * unit;
        const off = dist % spacing;
        for (let i = -1; i < w / spacing + 2; i++) {
          const idx = Math.floor(dist / spacing) + i;
          const fx = i * spacing - off + seeded(idx * 1.7) * 20;
          const kindRoll = seeded(idx * 3.3);
          ctx.strokeStyle = "rgba(134,199,154,0.7)";
          ctx.lineWidth = 1.2;
          const stem = (8 + seeded(idx) * 10) * unit;
          ctx.beginPath();
          ctx.moveTo(fx, ground);
          ctx.lineTo(fx + Math.sin(t * 2 + idx) * 2, ground - stem);
          ctx.stroke();
          drawFlower(ctx, kindRoll > 0.6 ? "daisy" : kindRoll > 0.25 ? "blossom" : "rose", fx + Math.sin(t * 2 + idx) * 2, ground - stem, (3.2 + seeded(idx * 5) * 2.2) * unit, idx, ROAD_FLOWERS[idx % ROAD_FLOWERS.length]);
        }
      }

      // rails while she's on the train
      if (ride === "train") {
        const sp = 22 * unit;
        const off = dist % sp;
        ctx.fillStyle = "#7a5a46";
        for (let x = -off; x < w + sp; x += sp) ctx.fillRect(x, ground + 1, 12 * unit, 4 * unit);
        ctx.fillStyle = "#c9cfda";
        ctx.fillRect(0, ground - 1, w, 2.5 * unit);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(0, ground - 1, w, 0.8 * unit);
      }

      // things
      for (const th of things) {
        if (th.kind === "gap") {
          drawGap(th);
          continue;
        }
        if (th.done && th.kind !== "star" && th.kind !== "shield" && th.kind !== "turbo") ctx.globalAlpha = 0.3;
        if (th.kind === "bug") drawSlime(ctx, th.x, th.y, th.w, th.h, t, th.phase);
        else if (th.kind === "crate") drawDaruma(ctx, th.x, th.y, th.w, th.h, t, th.phase);
        else if (th.kind === "firewall") drawFoxfire(ctx, th.x, th.y, th.w, th.h, t, th.phase);
        else if (th.kind === "ghost") drawGhost(ctx, th.x, th.y, th.w / 2, t, th.phase);
        else if (th.kind === "star") drawStar(th);
        else if (th.kind === "turbo") drawTurbo(th);
        else if (th.kind === "phish") drawKoi(ctx, th.x, th.y, th.w * 1.25, th.h * 1.3, t, th.phase);
        else drawShield(th);
        ctx.globalAlpha = 1;
      }

      // the person waiting by the road
      if (mentor) {
        const m = MENTORS[mentor.i];
        const line = talkIdx >= 0 ? m.lines[talkIdx] : null;
        const near = mentor.x - riderX < 520 * unit;
        const wave = mentor.done ? 1 : !line && near ? 1 : 0;
        const headTop = drawPerson(ctx, m.look, mentor.x, ground, unit, t, line?.who === "them", wave);
        if (line?.who === "them") drawTalkMark(ctx, mentor.x - 6 * unit, headTop - 4 * unit, unit, t);
        else if (line?.who === "me") drawTalkMark(ctx, riderX + 6 * unit, ground - rider.y - RIDE_HEAD[ride] * 13 * unit - 30 * unit, unit, t);
        else if (!mentor.done) {
          // name tag while approaching
          ctx.font = `600 ${12 * unit}px "Sora", system-ui, sans-serif`;
          const label = m.name;
          const tw = ctx.measureText(label).width + 16 * unit;
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.beginPath();
          ctx.roundRect(mentor.x - tw / 2, headTop - 26 * unit, tw, 20 * unit, 10 * unit);
          ctx.fill();
          ctx.fillStyle = "#1e2a48";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, mentor.x, headTop - 16 * unit);
          ctx.textBaseline = "alphabetic";
        }
      }

      // rider
      const s = 13 * unit;
      if ((ride !== "car" && ride !== "train") || rider.y > 2 || turbo > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(riderX, ground + 3, s * 2.6 * (1 - Math.min(0.6, rider.y / 400)), s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // turbo: she turns into a sparkling spin-ball with a soft comet tail
      const blink = invuln > 0 && turbo <= 0 && Math.floor(invuln / 6) % 2 === 0;
      if (turbo > 0) {
        const r = 2.3 * s;
        const by = ground - rider.y - r;
        const fade = Math.min(1, turbo / 30);
        // comet tail
        const tail = ctx.createLinearGradient(riderX - r * 5, by, riderX, by);
        tail.addColorStop(0, "rgba(249,168,201,0)");
        tail.addColorStop(1, `rgba(249,168,201,${0.55 * fade})`);
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.moveTo(riderX, by - r * 0.9);
        ctx.quadraticCurveTo(riderX - r * 3, by - r * 0.6, riderX - r * 5, by);
        ctx.quadraticCurveTo(riderX - r * 3, by + r * 0.6, riderX, by + r * 0.9);
        ctx.fill();
        // the ball
        const ball = ctx.createRadialGradient(riderX - r * 0.35, by - r * 0.35, r * 0.1, riderX, by, r);
        ball.addColorStop(0, "#fff1f6");
        ball.addColorStop(0.45, "#f6a5c4");
        ball.addColorStop(1, "#c7608a");
        ctx.save();
        ctx.shadowColor = "#f9a8c9";
        ctx.shadowBlur = 22;
        ctx.fillStyle = ball;
        ctx.beginPath();
        ctx.arc(riderX, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // spinning chestnut swirl (her hair) + a little flower
        ctx.save();
        ctx.translate(riderX, by);
        ctx.rotate(t * 18);
        ctx.strokeStyle = "rgba(168,117,76,0.85)";
        ctx.lineWidth = r * 0.16;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.arc(r * 0.25, 0, r * 0.55, -0.6, 1.4);
          ctx.stroke();
        }
        drawFlower(ctx, "blossom", r * 0.55, -r * 0.2, r * 0.22, 0, "#ffffff");
        ctx.restore();
        // twinkles around
        for (let i = 0; i < 4; i++) {
          const a = t * 6 + i * 1.6;
          const sx = riderX + Math.cos(a) * r * 1.4;
          const sy = by + Math.sin(a) * r * 1.4;
          ctx.fillStyle = "rgba(255,248,230,0.9)";
          ctx.beginPath();
          ctx.arc(sx, sy, 1.6 * unit, 0, Math.PI * 2);
          ctx.fill();
        }
        if (turbo <= 2) burst(riderX, by, "#f9a8c9", 18); // poof back to herself
      } else if (!blink) {
        if (shine > 0) shine = Math.max(0, shine - dt * 0.7);
        // at the end, the camera settles on her and the car
        const zr = arrival >= 0 ? Math.min(1, arrival / 4) : won && !endless ? 1 : 0;
        const z = zr * zr * (3 - 2 * zr);
        const rx = riderX + (w * 0.2 - riderX) * z;
        drawRider(ctx, ride, rx, ground - rider.y, s * (1 + 0.9 * z), { pedal: rider.pedal, tilt: rider.tilt, glow: ride !== "car" && ride !== "train", shine: shine > 0 ? 1 - shine : 0 });
      }
      if (shield) drawShield({ kind: "shield", x: 0, y: 0, w: 0, h: 0, phase: 0 }, riderX + 3.2 * s, ground - rider.y - 5.4 * s, 0.6);

      // "your best" flag where your best ride ended
      if (bestDist > 0) {
        const bx = riderX + (bestDist - dist);
        if (bx > -40 && bx < w + 40) {
          ctx.strokeStyle = "rgba(226,232,240,0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx, ground);
          ctx.lineTo(bx, ground - 70 * unit);
          ctx.stroke();
          ctx.fillStyle = "#fde68a";
          ctx.beginPath();
          ctx.moveTo(bx, ground - 70 * unit);
          ctx.lineTo(bx + 30 * unit, ground - 62 * unit);
          ctx.lineTo(bx, ground - 54 * unit);
          ctx.closePath();
          ctx.fill();
          ctx.font = `500 ${11 * unit}px "DM Sans", system-ui, sans-serif`;
          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(226,232,240,0.85)";
          ctx.fillText("your best", bx + 4, ground - 76 * unit);
        }
      }

      // finish arch
      if (!endless) {
        const fx = riderX + (FINISH - dist);
        if (fx < w + 200 && fx > -200) {
          const ah = h * 0.32;
          ctx.save();
          ctx.lineWidth = 6;
          ctx.strokeStyle = "#f9a8c9";
          ctx.shadowColor = "#f9a8c9";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(fx - 70 * unit, ground);
          ctx.lineTo(fx - 70 * unit, ground - ah);
          ctx.quadraticCurveTo(fx, ground - ah - 40 * unit, fx + 70 * unit, ground - ah);
          ctx.lineTo(fx + 70 * unit, ground);
          ctx.stroke();
          ctx.shadowBlur = 0;
          for (let i = 0; i < 10; i++) {
            const k2 = i / 9;
            const ax = fx - 70 * unit + 140 * unit * k2;
            const ay = ground - ah - Math.sin(Math.PI * k2) * 20 * unit;
            drawFlower(ctx, i % 2 ? "rose" : "daisy", ax, ay, 9 * unit, i, i % 2 ? "#f472b6" : "#ffffff");
          }
          ctx.fillStyle = "#fde68a";
          ctx.font = `700 ${13 * unit}px "Sora", system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("WHAT'S NEXT?", fx, ground - ah + 30 * unit);
          // checkered line on the road
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 ? "#ffffff" : "#0b1020";
            ctx.fillRect(fx - 6, ground + i * 8, 12, 8);
          }
          ctx.restore();
        }
      }

      // confetti
      for (const c of confetti) {
        c.x += c.vx;
        c.y += c.vy;
        c.rot += 0.1;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.c;
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();
      }
      for (let i = confetti.length - 1; i >= 0; i--) if (confetti[i].y > h + 20) confetti.splice(i, 1);

      // seasonal weather in front of everything
      if (tk < 1 && prevSeason !== season) drawWeather(ctx, weather, prevSeason, w, h, t, k, unit, 1 - tk);
      drawWeather(ctx, weather, season, w, h, t, k, unit, tk < 1 && prevSeason !== season ? tk : 1);

      // sparkles + petals
      for (const sp of sparks) {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += sp.petal ? 0.02 : 0.08;
        sp.vx *= sp.petal ? 0.995 : 0.97;
        sp.rot += 0.08;
        sp.life -= sp.petal ? 0.012 : 0.025;
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = sp.color;
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rot);
        if (sp.petal) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.6 * unit, 2 * unit, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const r = 3 * unit * sp.life + 1;
          ctx.beginPath();
          ctx.moveTo(0, -r * 1.6);
          ctx.quadraticCurveTo(0, 0, r * 1.6, 0);
          ctx.quadraticCurveTo(0, 0, 0, r * 1.6);
          ctx.quadraticCurveTo(0, 0, -r * 1.6, 0);
          ctx.quadraticCurveTo(0, 0, 0, -r * 1.6);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      sparks = sparks.filter((sp) => sp.life > 0);

      // floating texts
      for (const p of pops) {
        p.y -= 0.35;
        p.life -= 0.014;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
        // subtitle style: white text in a little black box, like anime captions
        ctx.font = `500 ${14 * unit}px "DM Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const tw = ctx.measureText(p.text).width;
        const ph2 = 22 * unit;
        ctx.fillStyle = "rgba(10,10,14,0.82)";
        ctx.fillRect(p.x - tw / 2 - 8 * unit, p.y - ph2 / 2, tw + 16 * unit, ph2);
        ctx.fillStyle = p.color === "#fb7185" ? "#ffd6dc" : "#ffffff";
        ctx.fillText(p.text, p.x, p.y + 1);
        ctx.textBaseline = "alphabetic";
      }
      ctx.globalAlpha = 1;
      pops = pops.filter((p) => p.life > 0);
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (screenRef.current !== "playing") return;
      if ((e.target as HTMLElement).closest("button")) return;
      if (arrival >= 1.5) finishRide();
      else if (arrival >= 0) return;
      else if (talkIdx >= 0) talkNext();
      else jump();
    };
    const onPointerUp = () => release();

    resize();
    landmarkX = w * 0.75;
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(postcardTimer);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [open]);

  if (!open) return null;
  const ch = CHAPTERS[hud.level];
  const isBest = hud.score > 0 && hud.score >= best;

  return (
    <div className="game" role="dialog" aria-modal="true" aria-label="Game mode: Ikrame's Ride">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="ik-boil" x="0" y="0" width="100%" height="100%">
          <feTurbulence ref={boilRef} type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1" />
          <feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <canvas ref={canvasRef} className={`game-canvas${handDrawn ? " is-hand-drawn" : ""}`} />
      <div className="game-paper" aria-hidden="true" />

      <div className={`game-hud${arriving ? " is-hidden" : ""}`}>
        <div className="game-hud-left">
          <span className="mono game-level">{ch.city} · {hud.km.toFixed(2)} km</span>
          <span className="game-score">{hud.score}</span>
        </div>
        <div className="game-hearts" aria-label={`${hud.hearts} lives`}>
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <Heart key={i} className={i < hud.hearts ? "on" : ""} />
          ))}
          {hud.shield && <span className="game-shield">shield</span>}
          {hud.combo > 1 && <span className="game-combo">×{hud.combo}</span>}
        </div>
        <div className="game-hud-right">
          {screen === "playing" && (
            <button type="button" className="icon-btn" onClick={() => setScreenBoth("paused")} aria-label="Pause">
              <span className="mono">II</span>
            </button>
          )}
          <button type="button" className="icon-btn" onClick={toggleSound} aria-label={sound ? "Mute sound" : "Turn sound on"} title={sound ? "Mute" : "Sound on"}>
            <span className="mono">{sound ? "♪" : "×♪"}</span>
          </button>
          <button type="button" className="icon-btn" onClick={close} aria-label="Exit game mode">
            <X />
          </button>
        </div>
      </div>

      {screen === "playing" && (
        <div className="game-track" aria-hidden="true">
          <div className="game-track-line">
            <span style={{ width: `${prog * (CHAPTERS.length / (CHAPTERS.length + 1)) * 100}%` }} />
          </div>
          {CHAPTERS.map((c, i) => (
            <span key={c.id} className={`game-track-stop${i <= hud.level ? " on" : ""}`} style={{ left: `${((i + 0.5) / (CHAPTERS.length + 1)) * 100}%` }}>
              <i />
              <em>{c.city}</em>
            </span>
          ))}
          <span className="game-track-stop next" style={{ left: `${((CHAPTERS.length + 0.5) / (CHAPTERS.length + 1)) * 100}%` }}>
            <i />
            <em>next?</em>
          </span>
        </div>
      )}

      {postcard && screen === "playing" && (
        <div key={postcard.id} className="title-card" style={{ ["--c" as string]: postcard.color } as React.CSSProperties}>
          <span className="title-card-big">{postcard.city}</span>
          <div className="title-card-paper">
            <span className="title-card-chapter">chapter {CHAPTERS.indexOf(postcard) + 1}</span>
            <strong>{postcard.company}</strong>
            <span>{postcard.role}</span>
          </div>
        </div>
      )}

      {arriving && screen === "playing" && (
        <div className="arrival" onPointerDown={() => arrivalSkipRef.current()}>
          <div className="arrival-bar top" />
          <div className="arrival-bar bottom" />
          <div className="arrival-text">
            <span className="arrival-l1">To be continued…</span>
            <span className="arrival-l2">Rennes, Leuven, Paris, Frankfurt, the hospitals of France… and the road keeps going.</span>
            <span className="arrival-l3">Thank you to every kind person on the way. The next chapter isn&apos;t written yet.</span>
          </div>
        </div>
      )}

      {talk && screen === "playing" && (
        <div
          className={`talk-box is-${talk.who}`}
          style={{ ["--c" as string]: talk.color } as React.CSSProperties}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            talkNextRef.current();
          }}
        >
          <span className="talk-name">{talk.who === "me" ? "Ikrame" : talk.name}{talk.who === "them" && <em>{talk.company}</em>}</span>
          <TalkText key={`${talk.name}-${talk.i}`} text={talk.text} />
          <div className="talk-foot">
            <span>tap or space ▸</span>
            <button type="button" onClick={() => talkSkipRef.current()}>Skip</button>
          </div>
        </div>
      )}

      {screen !== "playing" && (
        <div className="game-panel">
          {screen === "intro" && (
            <>
              <span className="game-kicker">game mode</span>
              <h2 className="game-title">Ikrame&apos;s Ride</h2>
              <p className="game-sub">Five cities, four seasons. From a backpack to a bike, a train and finally a red roadster. Ride through my career, from Rennes to the hospitals of France.</p>
              <div className="game-how">
                <div><strong>Jump</strong><span>Space or tap. Hold for higher.</span></div>
                <div><strong>Collect</strong><span>Skills, shields, a little magic.</span></div>
                <div><strong>Arrive</strong><span>Cross the finish for three stars.</span></div>
              </div>
              <details className="game-rules">
                <summary>What you&apos;ll meet on the road</summary>
                <ul>
                  <li><span className="lg-star" />Skill stars, chained quickly for a combo</li>
                  <li><span className="lg-shield" />A ProGuard shield that blocks one hit</li>
                  <li><span className="lg-turbo" />A magic orb that turns you into a spin-ball</li>
                  <li><span className="lg-bug" />Glitch slimes, legacy daruma and foxfire to jump</li>
                  <li><span className="lg-phish" />Flying koi &quot;phish&quot; to ride under</li>
                  <li><span className="lg-ghost" />Spam ghosts that bob up and down: time it</li>
                  <li><span className="lg-gap" />Outages: holes in the road</li>
                </ul>
              </details>
              <button type="button" className="btn btn-primary game-start" onClick={start}><Play /> Start riding</button>
              {(best > 0 || streak > 1) && (
                <p className="game-meta">
                  {best > 0 && <>Best {best}</>}
                  {best > 0 && streak > 1 && <> · </>}
                  {streak > 1 && <>{streak}-day streak</>}
                </p>
              )}
            </>
          )}
          {screen === "paused" && (
            <>
              <h2 className="game-title">Paused</h2>
              <button type="button" className="btn btn-primary" onClick={() => setScreenBoth("playing")}><Play /> Resume</button>
              <button type="button" className="btn btn-ghost" onClick={close}>Back to the portfolio</button>
            </>
          )}
          {screen === "won" && (
            <>
              <span className="game-kicker">chapter 5 of ?</span>
              <h2 className="game-title"><span className="shimmer-text">To be continued…</span></h2>
              <div className="game-rank" aria-label={`${rank} out of 3 stars`}>
                {[1, 2, 3].map((i) => (
                  <span key={i} className={i <= rank ? "on" : ""}>★</span>
                ))}
              </div>
              <p>
                <b>{hud.score} pts</b> · {hud.km.toFixed(2)} km, from Rennes to the hospitals of France, and still riding.
                {rank === 3 ? " Flawless ride ✦" : rank === 2 ? " Almost flawless." : ""}
                {isBest ? " New personal best!" : ` Best: ${best}.`}
              </p>
              {collected.length > 0 && (
                <div className="chips center">
                  {collected.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              )}
              <div className="game-actions">
                <button type="button" className="btn btn-primary" onClick={() => endlessRef.current()}><Play /> Keep riding, see what&apos;s next</button>
                <button type="button" className="btn btn-ghost" onClick={start}>Ride again</button>
                <a className="btn btn-ghost" href={`mailto:${EMAIL}`}><Mail /> Got an idea for chapter 6? Say hi</a>
                <button type="button" className="btn btn-ghost" onClick={close}>Back to the portfolio</button>
              </div>
            </>
          )}
          {screen === "over" && (
            <>
              <span className="game-kicker">end of the ride</span>
              <h2 className="game-title">{hud.score}</h2>
              <p className="game-sub">
                {isBest && prevBest > 0
                  ? `New personal best, ${hud.score - prevBest} points above your last record.`
                  : !isBest && best - hud.score <= Math.max(150, best * 0.25)
                  ? `So close: only ${best - hud.score} points from your best. One more?`
                  : `You reached ${ch.city} (${ch.company}) after ${hud.km.toFixed(2)} km.`}
              </p>
              {collected.length > 0 && (
                <>
                  <p className="mono small">skills collected</p>
                  <div className="chips center">
                    {collected.map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                </>
              )}
              <div className="game-actions">
                <button type="button" className="btn btn-primary game-start" onClick={start} autoFocus><Play /> One more ride</button>
                <a className="btn btn-ghost" href={`mailto:${EMAIL}?subject=I%20rode%20${hud.km.toFixed(1)}%20km%20in%20your%20game`}>
                  <Mail /> Send me your score
                </a>
                <button type="button" className="btn btn-ghost" onClick={close}>Back to the portfolio</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// visual-novel style typewriter text
function TalkText({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <p className="talk-text" aria-live="polite">
      {text.slice(0, n)}
      <span className="talk-ghost">{text.slice(n)}</span>
    </p>
  );
}
