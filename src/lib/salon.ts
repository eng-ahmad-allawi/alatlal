import { supabase } from "@/integrations/supabase/client";

export type Service = "hair" | "beard" | "both";

export interface WorkingHour {
  day: number; // 0-6, 0=Sun
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface Settings {
  id: string;
  working_hours: WorkingHour[];
  special_days_off: string[]; // "YYYY-MM-DD"
  default_durations: Record<Service, number>;
  duration_options: number[];
}

export interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  service: Service;
  client_name: string;
  notes: string | null;
  created_at: string;
}

export const SERVICE_LABEL: Record<Service, string> = {
  hair: "قص شعر",
  beard: "حلاقة لحية",
  both: "قص شعر ولحية",
};

export const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// --- time helpers ---
export const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMinutes = (m: number): string => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};
export const formatTime = (t: string): string => {
  // 12-hour "hh:mm" without the period label. Used in places that need a
  // plain string (e.g. toast descriptions) — UI components should render
  // <Time12h /> for the full "hh:mm صباحا/مساء" look.
  const [hRaw, mRaw] = t.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return t;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const formatTime12 = (t: string): string => {
  // Plain-text 12-hour time with Arabic AM/PM marker, e.g. "09:00 صباحا".
  // For React rendering prefer the <Time12h /> component.
  const [hRaw, mRaw] = t.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return t;
  const isPm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${isPm ? "مساء" : "صباحا"}`;
};
export const formatDateISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const formatDateArabic = (d: Date): string => {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

export function getWorkingHoursForDate(settings: Settings, date: Date): WorkingHour | null {
  const iso = formatDateISO(date);
  if (settings.special_days_off.includes(iso)) return null;
  const wh = settings.working_hours.find((w) => w.day === date.getDay());
  return wh ?? null;
}

export function generateSlots(wh: WorkingHour): string[] {
  const slots: string[] = [];
  const start = toMinutes(wh.start);
  const end = toMinutes(wh.end);
  // start times up to end - 15
  for (let m = start; m <= end - 15; m += 15) {
    slots.push(fromMinutes(m));
  }
  return slots;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export function findAppointmentForSlot(
  slot: string,
  appts: Appointment[],
): Appointment | undefined {
  const sm = toMinutes(slot);
  return appts.find((a) => {
    const start = toMinutes(a.start_time);
    const end = toMinutes(a.end_time);
    return sm >= start && sm < end;
  });
}

// --- supabase data ---
export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Settings not found");
  return data as unknown as Settings;
}

export async function fetchAppointments(date: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("date", date)
    .order("start_time");
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

// Public landing page must NEVER receive client names or notes over the
// network, not just hide them in the UI. This calls a security-definer
// Postgres function that returns only start/end times for booked ranges.
// See the "booked_slot_times" function created by the Supabase fix script.
export interface BookedRange {
  start_time: string;
  end_time: string;
}

export async function fetchPublicBookedSlots(date: string): Promise<BookedRange[]> {
  const { data, error } = await supabase.rpc("booked_slot_times", { p_date: date });
  if (error) throw error;
  return (data ?? []) as BookedRange[];
}

export async function createAppointment(input: Omit<Appointment, "id" | "created_at">) {
  const { data, error } = await supabase.from("appointments").insert(input).select().single();
  if (error) throw error;
  return data as Appointment;
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertSettings(s: Omit<Settings, "id"> & { id?: string }) {
  const { error } = await supabase
    .from("settings")
    .upsert(s as never)
    .select();
  if (error) throw error;
}
