"use client";

export default function UniverseBackground() {
  const STARS = 160;

  return (
    <div className="fixed inset-0 -z-10">
      {/* deep night gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060915] via-[#0a1225] to-[#0a1327]" />

      {/* MOON (soft, static) */}
      <div
        className="absolute right-[6%] top-[8%] w-36 h-36 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 35%, #fff9e9 0%, #f1e6c2 45%, #d8caa0 60%, rgba(255,255,255,0) 72%)",
          boxShadow: "0 0 70px rgba(255,245,210,.28)",
        }}
      />

      {/* static nebula glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[65%] h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute right-[12%] top-[38%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/8 blur-3xl" />
        <div className="absolute left-[50%] top-[20%] h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      {/* static starfield */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: STARS }).map((_, i) => {
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const size = 1 + Math.random() * 2;
          return (
            <span
              key={i}
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
              className="absolute rounded-full bg-white/80 opacity-70"
            />
          );
        })}
      </div>
    </div>
  );
}
