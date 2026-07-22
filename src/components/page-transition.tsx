import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

// Routes that share a persistent shell (the bottom nav in the admin
// dashboard) are grouped under one key so switching between them doesn't
// remount — and re-animate — the shell itself.
function getOuterTransitionKey(pathname: string): string {
  if (pathname.startsWith("/appointments") || pathname.startsWith("/settings")) {
    return "dashboard";
  }
  return pathname;
}

/**
 * Use at the app root. Animates transitions between top-level surfaces
 * (public landing → login → dashboard) without disturbing the dashboard's
 * own persistent bottom navigation once inside it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div key={getOuterTransitionKey(pathname)} className="page-transition">
      {children}
    </div>
  );
}

/**
 * Use inside a persistent layout (e.g. the dashboard shell) to animate only
 * the routed content area when switching between its own sub-pages, while
 * leaving sibling elements like a bottom nav completely static.
 */
export function InnerPageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
