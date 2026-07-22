import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings2,
  Plus,
  X,
  CalendarPlus,
  Trash2,
  Clock,
  CalendarOff,
  Timer,
  ListOrdered,
} from "lucide-react";
import {
  DAY_NAMES,
  type Service,
  type Settings,
  fetchSettings,
  formatDateArabic,
  formatDateISO,
  parseISODate,
  upsertSettings,
} from "@/lib/salon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type DayForm = { enabled: boolean; start: string; end: string };

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const [days, setDays] = useState<DayForm[]>(() =>
    Array.from({ length: 7 }, () => ({ enabled: false, start: "09:00", end: "18:00" })),
  );
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [durations, setDurations] = useState<Record<Service, number>>({
    hair: 15,
    beard: 15,
    both: 30,
  });
  const [options, setOptions] = useState<number[]>([15, 30, 45, 60]);
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const d = Array.from({ length: 7 }, () => ({ enabled: false, start: "09:00", end: "18:00" }));
    for (const wh of data.working_hours) {
      d[wh.day] = { enabled: true, start: wh.start, end: wh.end };
    }
    setDays(d);
    setDaysOff([...data.special_days_off]);
    setDurations({ ...data.default_durations });
    setOptions([...data.duration_options]);
  }, [data]);

  const addDayOff = (date: Date) => {
    const iso = formatDateISO(date);
    if (daysOff.includes(iso)) return;
    setDaysOff((prev) => [...prev, iso].sort());
  };

  const removeDayOff = (iso: string) => {
    setDaysOff((prev) => prev.filter((d) => d !== iso));
    setConfirmRemove(null);
  };

  const addOption = () => {
    const n = Number(newOption);
    if (!Number.isFinite(n) || n <= 0 || n % 15 !== 0) {
      toast.error("أدخل عدداً موجباً من مضاعفات 15");
      return;
    }
    if (options.includes(n)) {
      toast.error("هذه المدة موجودة");
      return;
    }
    setOptions((prev) => [...prev, n].sort((a, b) => a - b));
    setNewOption("");
  };

  const removeOption = (n: number) => setOptions((prev) => prev.filter((o) => o !== n));

  const save = async () => {
    // validate times
    for (let i = 0; i < 7; i++) {
      if (days[i].enabled && days[i].start >= days[i].end) {
        toast.error(`ساعات ${DAY_NAMES[i]} غير صحيحة`);
        return;
      }
    }
    setSaving(true);
    const payload: Omit<Settings, "id"> & { id?: string } = {
      id: data?.id,
      working_hours: days
        .map((d, idx) => (d.enabled ? { day: idx, start: d.start, end: d.end } : null))
        .filter((x): x is { day: number; start: string; end: string } => !!x),
      special_days_off: daysOff,
      default_durations: durations,
      duration_options: options,
    };
    try {
      await upsertSettings(payload);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم حفظ الإعدادات");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذر الحفظ";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 space-y-5">
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-brown grid place-items-center text-brown-foreground shrink-0">
          <Settings2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-extrabold text-brown">الإعدادات</h1>
          <p className="text-xs text-muted-foreground font-medium">ساعات العمل والمدد</p>
        </div>
        <ThemeToggle />
      </header>

      {/* Working hours */}
      <section
        className="glass-card rounded-3xl p-4 space-y-3 slot-enter"
        style={{ animationDelay: "40ms" }}
      >
        <h2 className="flex items-center gap-2 text-base font-extrabold text-brown">
          <Clock className="h-4 w-4" />
          ساعات العمل
        </h2>
        <div className="space-y-2">
          {days.map((d, i) => (
            <div
              key={i}
              style={{ animationDelay: `${60 + i * 25}ms` }}
              className={cn(
                "slot-enter grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3 border transition-colors",
                d.enabled ? "bg-background border-border" : "bg-secondary/40 border-transparent",
              )}
            >
              <div className="min-w-0 flex items-center gap-3">
                <Switch
                  checked={d.enabled}
                  onCheckedChange={(v) =>
                    setDays((prev) => prev.map((x, idx) => (idx === i ? { ...x, enabled: v } : x)))
                  }
                />
                <span className="font-bold">{DAY_NAMES[i]}</span>
              </div>
              <div className={cn("flex items-center gap-2", !d.enabled && "opacity-40")}>
                <Input
                  type="time"
                  value={d.start}
                  disabled={!d.enabled}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((x, idx) => (idx === i ? { ...x, start: e.target.value } : x)),
                    )
                  }
                  className="h-10 w-[7.5rem] tabular-nums"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={d.end}
                  disabled={!d.enabled}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((x, idx) => (idx === i ? { ...x, end: e.target.value } : x)),
                    )
                  }
                  className="h-10 w-[7.5rem] tabular-nums"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Days off */}
      <section
        className="glass-card rounded-3xl p-4 space-y-3 slot-enter"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-brown">
            <CalendarOff className="h-4 w-4" />
            أيام العطل الاستثنائية
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground font-bold h-10">
                <CalendarPlus className="h-4 w-4 ms-1" /> إضافة
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="single"
                onSelect={(d) => d && addDayOff(d)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        {daysOff.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أيام عطل مضافة.</p>
        ) : (
          <ul className="space-y-2">
            {daysOff.map((iso) => (
              <li
                key={iso}
                className="flex items-center justify-between rounded-2xl bg-background p-3 border border-border"
              >
                <span className="font-bold">{formatDateArabic(parseISODate(iso))}</span>
                <button
                  onClick={() => setConfirmRemove(iso)}
                  className="h-9 w-9 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10 tap-scale"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Default durations */}
      <section
        className="glass-card rounded-3xl p-4 space-y-3 slot-enter"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="flex items-center gap-2 text-base font-extrabold text-brown">
          <Timer className="h-4 w-4" />
          المدة الافتراضية لكل خدمة
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {(["hair", "beard", "both"] as Service[]).map((s) => (
            <div key={s} className="rounded-2xl bg-background border border-border p-3 space-y-1">
              <Label className="text-xs text-muted-foreground">
                {s === "hair" ? "قص شعر" : s === "beard" ? "لحية" : "الاثنين"}
              </Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={durations[s]}
                onChange={(e) =>
                  setDurations((prev) => ({ ...prev, [s]: Number(e.target.value) || 0 }))
                }
                className="h-10 tabular-nums text-center font-bold"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Duration options */}
      <section
        className="glass-card rounded-3xl p-4 space-y-3 slot-enter"
        style={{ animationDelay: "180ms" }}
      >
        <h2 className="flex items-center gap-2 text-base font-extrabold text-brown">
          <ListOrdered className="h-4 w-4" />
          خيارات المدة المتاحة
        </h2>
        <div className="flex flex-wrap gap-2">
          {options.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-brown pl-2 pr-3 h-9 font-bold text-sm border border-primary/20"
            >
              {n} د
              <button
                onClick={() => removeOption(n)}
                className="h-6 w-6 grid place-items-center rounded-full bg-primary/20 hover:bg-destructive hover:text-destructive-foreground tap-scale"
                aria-label="حذف"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            min={15}
            step={15}
            placeholder="مدة جديدة (دقيقة)"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            className="h-11"
          />
          <Button onClick={addOption} className="h-11 bg-brown text-brown-foreground font-bold">
            <Plus className="h-4 w-4 ms-1" /> إضافة
          </Button>
        </div>
      </section>

      {/* Floating save bar: stays reachable without scrolling to the end of a long form */}
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 -mx-4 px-4 pt-4 pb-1 bg-gradient-to-t from-background via-background/95 to-transparent">
        <Button
          onClick={save}
          disabled={saving}
          className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold text-lg rounded-2xl shadow-lg shadow-primary/25 tap-scale"
        >
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={(v) => !v && setConfirmRemove(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف يوم العطلة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيصبح هذا اليوم متاحاً للحجز حسب ساعات العمل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && removeDayOff(confirmRemove)}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
