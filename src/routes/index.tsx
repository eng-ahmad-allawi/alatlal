import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Scissors, LogIn, MoonStar } from "lucide-react";
import type { Appointment } from "@/lib/salon";
import {
  fetchPublicBookedSlots,
  fetchSettings,
  formatDateISO,
  generateSlots,
  getWorkingHoursForDate,
} from "@/lib/salon";
import { DayNav } from "@/components/salon/day-nav";
import { SlotGrid } from "@/components/salon/slot-grid";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Landing,
});

function Landing() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  const [date, setDate] = useState<Date>(today);
  const iso = formatDateISO(date);

  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const bookedQ = useQuery({
    queryKey: ["public-booked-slots", iso],
    queryFn: () => fetchPublicBookedSlots(iso),
    enabled: !!settingsQ.data,
  });

  const wh = settingsQ.data ? getWorkingHoursForDate(settingsQ.data, date) : null;
  const slots = wh ? generateSlots(wh) : [];

  // These are display-only placeholders — the server never sends client
  // names or notes to this public page, only start/end times of booked
  // ranges. SlotGrid's "public" mode already omits booked slots entirely,
  // so these placeholder fields are never rendered.
  const bookedForGrid: Appointment[] = (bookedQ.data ?? []).map((r, idx) => ({
    id: `public-${idx}`,
    date: iso,
    start_time: r.start_time,
    end_time: r.end_time,
    duration: 0,
    service: "hair",
    client_name: "",
    notes: null,
    created_at: "",
  }));

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary grid place-items-center text-primary-foreground shrink-0">
            <Scissors className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-brown leading-tight">
              صالون الأطلال
            </h1>
            <p className="text-xs text-muted-foreground font-medium">الأوقات المتاحة اليوم</p>
          </div>
          <ThemeToggle />
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-brown text-brown-foreground px-4 h-10 font-bold text-sm tap-scale"
          >
            <LogIn className="h-4 w-4" />
            تسجيل الدخول
          </Link>
          <Link
            to="/auth"
            aria-label="تسجيل الدخول"
            className="sm:hidden inline-grid h-10 w-10 place-items-center rounded-xl bg-brown text-brown-foreground tap-scale"
          >
            <LogIn className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4 space-y-4">
        <DayNav date={date} onChange={setDate} minDate={today} maxDate={maxDate} />

        {settingsQ.isLoading || bookedQ.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-2xl" />
            ))}
          </div>
        ) : !wh ? (
          <ClosedCard />
        ) : (
          <SlotGrid slots={slots} appointments={bookedForGrid} mode="public" />
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          تُعرض الأوقات الفارغة فقط. للحجز، تواصل مباشرة مع الصالون.
        </p>
      </main>
    </div>
  );
}

function ClosedCard() {
  return (
    <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-3 slot-enter">
      <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center text-brown">
        <MoonStar className="h-7 w-7" />
      </div>
      <p className="text-lg font-extrabold text-foreground">صالون مغلق في هذا اليوم</p>
      <p className="text-sm text-muted-foreground">جرّب يوماً آخر عبر الأسهم أو التقويم أعلاه.</p>
    </div>
  );
}
