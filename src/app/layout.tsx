import './globals.css'
import type { Metadata } from 'next'
import NavBar from './components/NavBar'
import FairyBackground from './components/FairyBackground'
import MagicCursor from './components/MagicCursor'
import ScrollProgress from "./components/ScrollProgress";
import UniverseBackground from "./components/UniverseBackground";

export const metadata: Metadata = {
  title: "Ikrame",
  description: "Software engineer with cloud, security, and networking roots.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b1020] text-slate-200 antialiased">
        <UniverseBackground />
        <NavBar />
        <FairyBackground />
        <ScrollProgress />
        <UniverseBackground />
        <MagicCursor />
        {/* Your single NavBar should be here if you have one */}
        {children}
      </body>
    </html>
  )};
