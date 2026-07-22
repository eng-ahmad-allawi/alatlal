import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/salon/bottom-nav";
import { InnerPageTransition } from "@/components/page-transition";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24" dir="rtl">
      <InnerPageTransition>
        <Outlet />
      </InnerPageTransition>
      <BottomNav />
    </div>
  );
}
