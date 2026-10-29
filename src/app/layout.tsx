import "./globals.css";
import type { Metadata, Viewport } from "next";
import NavBar from "./components/NavBar";
import CosmosBackground from "./components/CosmosBackground";
import MagicCursor from "./components/MagicCursor";
import SmoothScroll from "./components/SmoothScroll";
import GameMode from "./components/GameMode";
import Preloader from "./components/Preloader";
import Interactions from "./components/Interactions";

export const metadata: Metadata = {
  title: "Ikrame B. · Infrastructure, security & software",
  description:
    "Senior Infrastructure Engineer with cloud, security and networking roots. Spin the globe through my career, or play the game.",

  // NOTE: the site is still hidden from search engines. Set index/follow to true
  // (and update src/app/robots.txt) when you want Google to list it.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Permanent+Marker&family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body>
        <Preloader />
        <CosmosBackground />
        <SmoothScroll />
        <NavBar />
        {children}
        <GameMode />
        <MagicCursor />
        <Interactions />
      </body>
    </html>
  );
}
