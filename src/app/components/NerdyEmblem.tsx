"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function NerdyEmblem() {
  const [phase, setPhase] = useState<"flower"|"cube">("flower");
  useEffect(() => { const t = setInterval(() => setPhase(p => p === "flower" ? "cube" : "flower"), 3500); return () => clearInterval(t); }, []);

  return (
    <div className="h-24 w-24 relative">
      {/* Flower */}
      <motion.svg key="flower" initial={{opacity:0}} animate={{opacity: phase==="flower"?1:0}} transition={{duration:.8}} viewBox="0 0 100 100" className="absolute inset-0">
        <g stroke="hsl(190 100% 70%)" strokeWidth="1.3" fill="none" strokeLinecap="round">
          {[...Array(8)].map((_, i) => { const a=(i/8)*Math.PI*2; const x=50+Math.cos(a)*26; const y=50+Math.sin(a)*26; return <circle key={i} cx={x} cy={y} r="12" opacity=".85"/>; })}
          <circle cx="50" cy="50" r="5" stroke="hsl(320 100% 75%)"/>
        </g>
      </motion.svg>
      {/* Cube */}
      <motion.svg key="cube" initial={{opacity:0}} animate={{opacity: phase==="cube"?1:0}} transition={{duration:.8}} viewBox="0 0 100 100" className="absolute inset-0">
        <g stroke="hsl(280 100% 75%)" strokeWidth="1.3" fill="none">
          <rect x="28" y="30" width="36" height="36" />
          <rect x="36" y="24" width="36" height="36" />
          <line x1="28" y1="30" x2="36" y2="24"/> <line x1="64" y1="30" x2="72" y2="24"/>
          <line x1="28" y1="66" x2="36" y2="60"/> <line x1="64" y1="66" x2="72" y2="60"/>
        </g>
        <text x="50" y="88" textAnchor="middle" fontSize="7" fill="hsl(190 100% 70%)">e = mc²</text>
      </motion.svg>
    </div>
  );
}
