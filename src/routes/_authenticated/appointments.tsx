import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MoonStar, Scissors } from "lucide-react";
import {
  type Appointment,
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  fetchSettings,
  formatDateISO,
  formatTime12,
  generateSlots,
  getWorkingHoursForDate,
} from "@/lib/salon";
import { DayNav } from "@/components/salon/day-nav";
import { SlotGrid } from "@/components/salon/slot-grid";
import { BookingModal } from "@/components/salon/booking-modal";
import { AppointmentModal } from "@/components/salon/appointment-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsPage,
});

type Filter = "all" | "booked" | "free";

function AppointmentsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [date, setDate] = useState<Date>(today);
  const iso = formatDateISO(date);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<Filter>("all");
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const apptsQ = useQuery({
    queryKey: ["appointments", iso],
    queryFn: () => fetchAppointments(iso),
    enabled: !!settingsQ.data,
  });

  const wh = settingsQ.data ? getWorkingHoursForDate(settingsQ.data, date) : null;
  const slots = wh ? generateSlots(wh) : [];

  // swipe between days
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 60) return;
    const d = new Date(date);
    // RTL: swipe right (positive delta) = previous day
    d.setDate(d.getDate() + (delta > 0 ? -1 : 1));
    setDate(d);
  };

  const undoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleSlotClick = (slot: string, appt: Appointment | undefined) => {
    if (appt) setDetailAppt(appt);
    else setBookingSlot(slot);
  };

  const cancelAppointment = async (appt: Appointment) => {
    setDetailAppt(null);
    // optimistic remove
    const prev = apptsQ.data ?? [];
    qc.setQueryData<Appointment[]>(["appointments", iso], (old) =>
      (old ?? []).filter((a) => a.id !== appt.id),
    );
    try {
      await deleteAppointment(appt.id);
    } catch (e) {
      qc.setQueryData(["appointments", iso], prev);
      const msg = e instanceof Error ? e.message : "تعذر إلغاء الموعد";
      toast.error(msg);
      return;
    }

    toast("تم إلغاء الموعد", {
      description: `${appt.client_name} · ${formatTime12(appt.start_time)}`,
      action: {
        label: "تراجع",
        onClick: async () => {
          clearTimeout(undoTimers.current[appt.id]);
          try {
            const restored = await createAppointment({
              date: appt.date,
              start_time: appt.start_time,
              end_time: appt.end_time,
              duration: appt.duration,
              service: appt.service,
              client_name: appt.client_name,
              notes: appt.notes,
            });
            qc.setQueryData<Appointment[]>(["appointments", iso], (old) =>
              [...(old ?? []), restored].sort((a, b) => a.start_time.localeCompare(b.start_time)),
            );
            toast.success("تم استعادة الموعد");
          } catch {
            toast.error("تعذر التراجع");
          }
        },
      },
      duration: 5000,
    });
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "booked", label: "المحجوز" },
    { key: "free", label: "الفارغ" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 space-y-4">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-primary grid place-items-center text-primary-foreground shrink-0">
          <Scissors className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-extrabold text-brown truncate">المواعيد</h1>
          <p className="text-xs text-muted-foreground font-medium">صالون الأطلال</p>
        </div>
        <ThemeToggle />
      </header>

      <DayNav date={date} onChange={setDate} />

      {/* Segmented filter */}
      <div className="relative grid grid-cols-3 rounded-2xl bg-secondary p-1">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "relative z-10 h-11 rounded-xl text-sm font-bold tap-scale transition-colors",
                active ? "bg-card text-brown shadow" : "text-muted-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {settingsQ.isLoading || apptsQ.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-2xl" />
            ))}
          </div>
        ) : !wh ? (
          <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-3 slot-enter">
            <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center text-brown">
              <MoonStar className="h-7 w-7" />
            </div>
            <p className="text-lg font-extrabold text-foreground">صالون مغلق في هذا اليوم</p>
            <p className="text-sm text-muted-foreground">اختر يوماً آخر لعرض المواعيد.</p>
          </div>
        ) : (
          <SlotGrid
            slots={slots}
            appointments={apptsQ.data ?? []}
            mode="admin"
            filter={filter}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {settingsQ.data && wh && (
        <BookingModal
          open={bookingSlot !== null}
          onOpenChange={(v) => !v && setBookingSlot(null)}
          date={iso}
          slot={bookingSlot}
          settings={settingsQ.data}
          dayEndTime={wh.end}
          existing={apptsQ.data ?? []}
          onCreated={(appt) => {
            qc.setQueryData<Appointment[]>(["appointments", iso], (old) =>
              [...(old ?? []), appt].sort((a, b) => a.start_time.localeCompare(b.start_time)),
            );
          }}
        />
      )}

      <AppointmentModal
        open={!!detailAppt}
        onOpenChange={(v) => !v && setDetailAppt(null)}
        appointment={detailAppt}
        onCancel={cancelAppointment}
      />
    </div>
  );
}
