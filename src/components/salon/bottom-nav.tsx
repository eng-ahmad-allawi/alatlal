import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarClock, Settings2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const items = [
    { to: "/appointments", label: "المواعيد", icon: CalendarClock },
    { to: "/settings", label: "الإعدادات", icon: Settings2 },
  ];

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="mx-auto max-w-2xl grid grid-cols-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 tap-scale",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "scale-110 transition-transform")} />
              <span className="text-xs font-bold">{label}</span>
              {active && <span className="h-1 w-6 rounded-full bg-primary" />}
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center justify-center gap-1 py-3 tap-scale text-muted-foreground"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs font-bold">خروج</span>
        </button>
      </div>
    </nav>
  );
}
