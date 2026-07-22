import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/salon";
import { findAppointmentForSlot, toMinutes } from "@/lib/salon";
import { Scissors } from "lucide-react";
import { Time12h } from "@/components/salon/time-12h";

interface Props {
  slots: string[];
  appointments: Appointment[];
  mode: "public" | "admin";
  filter?: "all" | "booked" | "free";
  onSlotClick?: (slot: string, appt: Appointment | undefined) => void;
}

export function SlotGrid({ slots, appointments, mode, filter = "all", onSlotClick }: Props) {
  const items = slots.map((slot) => {
    const appt = findAppointmentForSlot(slot, appointments);
    return { slot, appt };
  });

  let visible = items;
  if (mode === "public") {
    // only free
    visible = items.filter((i) => !i.appt);
  } else if (filter === "booked") {
    visible = items.filter((i) => !!i.appt);
  } else if (filter === "free") {
    visible = items.filter((i) => !i.appt);
  }

  if (visible.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center text-brown">
          <Scissors className="h-7 w-7" />
        </div>
        <p className="text-muted-foreground font-medium">
          {mode === "public"
            ? "لا توجد أوقات متاحة في هذا اليوم"
            : filter === "booked"
              ? "لا توجد حجوزات في هذا اليوم"
              : "لا توجد أوقات فارغة"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {visible.map(({ slot, appt }, i) => {
        const isBooked = !!appt;
        // Determine if this slot is the "head" of an appointment (its start_time)
        const isHead = appt && toMinutes(appt.start_time) === toMinutes(slot);
        return (
          <button
            key={slot}
            style={{ animationDelay: `${Math.min(i, 20) * 25}ms` }}
            onClick={() => onSlotClick?.(slot, appt)}
            disabled={mode === "public"}
            className={cn(
              "slot-enter min-h-[68px] rounded-2xl px-3 py-2 text-start flex flex-col justify-center gap-0.5 border tap-scale",
              isBooked
                ? "bg-booked text-booked-foreground border-booked/50"
                : "bg-card text-card-foreground border-border hover:border-primary hover:bg-primary/5",
              mode === "public" && "cursor-default",
            )}
          >
            <Time12h time={slot} timeClassName={cn(isBooked && "text-booked-foreground")} />
            {isBooked && isHead && (
              <span className="text-xs font-semibold truncate opacity-90">{appt!.client_name}</span>
            )}
            {isBooked && !isHead && (
              <span className="text-[11px] font-medium opacity-70">محجوز</span>
            )}
            {!isBooked && (
              <span className="text-[11px] font-medium text-muted-foreground">متاح</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
