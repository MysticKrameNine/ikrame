// Small inline icon set (stroke icons, 24px grid) so the page has no icon-library dependency.
import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: P & { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Mail = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);
export const Github = (p: P) => (
  <Svg {...p}><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></Svg>
);
export const Linkedin = (p: P) => (
  <Svg {...p}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></Svg>
);
export const ArrowLeft = (p: P) => <Svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;
export const ArrowRight = (p: P) => <Svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>;
export const ArrowUpRight = (p: P) => <Svg {...p}><path d="M7 17 17 7M7 7h10v10" /></Svg>;
export const Play = (p: P) => <Svg {...p}><path d="M7 4v16l13-8z" fill="currentColor" /></Svg>;
export const Pause = (p: P) => <Svg {...p}><path d="M8 5v14M16 5v14" /></Svg>;
export const Plus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Minus = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const X = (p: P) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const Globe = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Svg>
);
export const Gamepad = (p: P) => (
  <Svg {...p}><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13h.01" /></Svg>
);
export const Compass = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></Svg>
);
export const Flower = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5C10 6 10.5 3 12 3s2 3 0 6.5M14.5 12c3.5-2 6.5-1.5 6.5 0s-3 2-6.5 0M12 14.5c2 3.5 1.5 6.5 0 6.5s-2-3 0-6.5M9.5 12C6 14 3 13.5 3 12s3-2 6.5 0" /></Svg>
);
export const Shield = (p: P) => <Svg {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></Svg>;
export const Phone = (p: P) => <Svg {...p}><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></Svg>;
export const Clipboard = (p: P) => (
  <Svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></Svg>
);
export const Wrench = (p: P) => (
  <Svg {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></Svg>
);
export const Sparkle = (p: P) => (
  <Svg {...p}><path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7z" /></Svg>
);
export const Heart = (p: P) => (
  <Svg {...p}><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z" /></Svg>
);
