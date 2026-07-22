import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Appointment, SERVICE_LABEL } from "@/lib/salon";
import { Time12h } from "@/components/salon/time-12h";
import { Clock, Scissors, User, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment: Appointment | null;
  onCancel: (appt: Appointment) => void;
}

export function AppointmentModal({ open, onOpenChange, appointment, onCancel }: Props) {
  if (!appointment) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-brown">تفاصيل الموعد</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Row icon={<User className="h-5 w-5" />} label="العميل" value={appointment.client_name} />
          <Row
            icon={<Clock className="h-5 w-5" />}
            label="الوقت"
            value={
              <span className="inline-flex items-baseline gap-2 flex-wrap">
                <Time12h time={appointment.start_time} />
                <span className="text-muted-foreground">—</span>
                <Time12h time={appointment.end_time} />
                <span className="text-xs font-medium text-muted-foreground">
                  ({appointment.duration} د)
                </span>
              </span>
            }
          />
          <Row
            icon={<Scissors className="h-5 w-5" />}
            label="الخدمة"
            value={
              SERVICE_LABEL[appointment.service as keyof typeof SERVICE_LABEL] ??
              appointment.service
            }
          />
          {appointment.notes && (
            <Row
              icon={<FileText className="h-5 w-5" />}
              label="ملاحظات"
              value={appointment.notes}
            />
          )}
        </div>
        <div className="flex gap-2 pt-3">
          <Button variant="outline" className="flex-1 h-12" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button
            variant="destructive"
            className="flex-1 h-12 font-bold"
            onClick={() => onCancel(appointment)}
          >
            إلغاء الموعد
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
      <div className="text-brown mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="font-bold text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}
