"use client";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-[#0b1020]/75 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="#home" className="font-semibold tracking-tight text-[15px] text-slate-100">
          Ikrame Bakkari
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#home" className="hover:text-slate-100">Home</a>
          <a href="#about" className="hover:text-slate-100">About</a>
          <a href="#experience" className="hover:text-slate-100">Experience</a>
          <a href="#projects" className="hover:text-slate-100">Projects</a>
          <a href="#contact" className="hover:text-slate-100">Contact</a>
        </nav>
      </div>
    </header>
  );
}
