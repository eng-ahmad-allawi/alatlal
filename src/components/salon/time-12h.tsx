import { cn } from "@/lib/utils";

interface Props {
  /** Time in 24h "HH:mm" format, e.g. "09:00" or "21:30". */
  time: string;
  /** Extra classes for the time digits (the big "09:00" part). */
  timeClassName?: string;
  /** Extra classes for the period label (the small "صباحا"/"مساء" part). */
  periodClassName?: string;
  /** Override the row gap between time and period. */
  gap?: string;
}

/**
 * Display a time string in 12-hour format with an Arabic AM/PM label.
 *
 *   09:00  صباحا      (in RTL the time sits on the right, period on the left)
 *   18:30  مساء
 *
 * The component keeps the original span classes from the previous 24h
 * implementation (text-lg font-extrabold tabular-nums) so it drops in
 * everywhere a `HH:mm` string used to be rendered.
 */
export function Time12h({ time, timeClassName, periodClassName, gap = "gap-1" }: Props) {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    // Fall back to the raw string if the input doesn't look like HH:mm.
    return <span className={timeClassName}>{time}</span>;
  }

  const isPm = h >= 12;
  const periodLabel = isPm ? "مساء" : "صباحا";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const hh = String(h12).padStart(2, "0");
  const mm = String(m).padStart(2, "0");

  return (
    <span className={cn("inline-flex items-baseline", gap)}>
      <span className={cn("text-lg font-extrabold tabular-nums", timeClassName)}>
        {hh}:{mm}
      </span>
      <span
        className={cn(
          "text-[10px] sm:text-xs font-semibold leading-none opacity-80",
          periodClassName,
        )}
      >
        {periodLabel}
      </span>
    </span>
  );
}
