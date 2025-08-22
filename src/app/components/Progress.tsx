"use client";
import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const height = document.body.scrollHeight - window.innerHeight;
      setWidth(Math.min(100, Math.max(0, (scrolled / height) * 100)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent">
      <div
        style={{ width: `${width}%` }}
        className="h-full bg-gradient-to-r from-emerald-300 to-cyan-400 transition-[width] duration-150"
      />
    </div>
  );
}
