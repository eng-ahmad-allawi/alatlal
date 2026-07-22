import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Appointment,
  type Service,
  type Settings,
  SERVICE_LABEL,
  fromMinutes,
  overlaps,
  toMinutes,
  createAppointment,
} from "@/lib/salon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Time12h } from "@/components/salon/time-12h";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: string;
  slot: string | null;
  settings: Settings;
  dayEndTime: string;
  existing: Appointment[];
  onCreated: (a: Appointment) => void;
}

export function BookingModal({
  open,
  onOpenChange,
  date,
  slot,
  settings,
  dayEndTime,
  existing,
  onCreated,
}: Props) {
  const [service, setService] = useState<Service>("hair");
  const [duration, setDuration] = useState<number>(settings.default_durations.hair);
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setService("hair");
      setDuration(settings.default_durations.hair);
      setClientName("");
      setNotes("");
      setNameError("");
    }
  }, [open, settings]);

  const onServiceChange = (s: Service) => {
    setService(s);
    setDuration(settings.default_durations[s]);
  };

  const submit = async () => {
    if (!slot) return;
    if (!clientName.trim()) {
      setNameError("يرجى إدخال اسم العميل");
      return;
    }
    const startM = toMinutes(slot);
    const endM = startM + duration;
    if (endM > toMinutes(dayEndTime)) {
      toast.error("المدة تتجاوز ساعات العمل لهذا اليوم");
      return;
    }
    const endStr = fromMinutes(endM);
    const conflict = existing.some((a) => overlaps(a.start_time, a.end_time, slot, endStr));
    if (conflict) {
      toast.error("هذا الوقت غير متاح");
      return;
    }
    setSubmitting(true);
    try {
      const appt = await createAppointment({
        date,
        start_time: slot,
        end_time: endStr,
        duration,
        service,
        client_name: clientName.trim(),
        notes: notes.trim() || null,
      });
      onCreated(appt);
      toast.success("تم حجز الموعد");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "تعذر حجز الموعد";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-brown">حجز موعد جديد</DialogTitle>
          <p className="text-sm text-muted-foreground">
            الوقت:{" "}
            {slot ? (
              <span className="font-bold text-foreground">
                <Time12h time={slot} gap="gap-1.5" />
              </span>
            ) : null}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">اسم العميل</Label>
            <Input
              id="client"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="مثال: علاء"
              className="h-12"
            />
            {nameError && <p className="text-xs text-destructive font-medium">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label>الخدمة</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["hair", "beard", "both"] as Service[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onServiceChange(s)}
                  className={cn(
                    "h-11 rounded-xl text-sm font-bold tap-scale border",
                    service === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-card-foreground border-border",
                  )}
                >
                  {SERVICE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>المدة (دقيقة)</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.duration_options.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} دقيقة
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button
            className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "جاري الحفظ..." : "حفظ الموعد"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
