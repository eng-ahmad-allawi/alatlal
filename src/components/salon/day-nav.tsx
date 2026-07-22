import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateArabic } from "@/lib/salon";
import { cn } from "@/lib/utils";

interface Props {
  date: Date;
  onChange: (d: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DayNav({ date, onChange, minDate, maxDate }: Props) {
  const shift = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    if (minDate && d < minDate) return;
    if (maxDate && d > maxDate) return;
    onChange(d);
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-card p-2 shadow-sm border border-border">
      {/* In RTL, chevron-right visually points to "previous" (older). */}
      <button
        onClick={() => shift(-1)}
        aria-label="اليوم السابق"
        className="h-11 w-11 grid place-items-center rounded-xl bg-secondary text-secondary-foreground tap-scale"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex-1 min-w-0 flex items-center justify-center gap-2 h-11 rounded-xl bg-background text-foreground font-bold tap-scale px-3">
            <CalendarDays className="h-5 w-5 text-brown shrink-0" />
            <span className="truncate">{formatDateArabic(date)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onChange(d)}
            disabled={(d) =>
              (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false)
            }
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <button
        onClick={() => shift(1)}
        aria-label="اليوم التالي"
        className="h-11 w-11 grid place-items-center rounded-xl bg-secondary text-secondary-foreground tap-scale"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
