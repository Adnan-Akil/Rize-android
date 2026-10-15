export interface FormattedTime {
  hours: string;
  minutes: string;
  period: "AM" | "PM";
  timeString: string;
}

export function formatDisplayTime(time24: string): FormattedTime {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h === 0) {
    h = 12;
  } else if (h > 12) {
    h -= 12;
  }

  const hours = h.toString().padStart(2, "0");
  const minutes = m.toString().padStart(2, "0");

  return {
    hours,
    minutes,
    period,
    timeString: `${hours}:${minutes} ${period}`,
  };
}

export function calculateNextOccurrence(
  time24: string,
  repeatDays: number[] = [],
  now: Date = new Date()
): Date {
  const [hStr, mStr] = time24.split(":");
  const targetHour = parseInt(hStr, 10);
  const targetMinute = parseInt(mStr, 10);

  // If no repeat days, it's a one-off: either today or tomorrow
  if (!repeatDays || repeatDays.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(targetHour, targetMinute, 0, 0);

    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
    // Already passed today -> tomorrow
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  // Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun (or 0=Sun in JS Date)
  // Normalize JavaScript getDay() (0=Sun, 1=Mon... 6=Sat) into 1..7 (1=Mon, 7=Sun)
  const currentJsDay = now.getDay();
  const currentIsoDay = currentJsDay === 0 ? 7 : currentJsDay;

  // Check today first if today is in repeatDays
  if (repeatDays.includes(currentIsoDay)) {
    const candidate = new Date(now);
    candidate.setHours(targetHour, targetMinute, 0, 0);
    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }

  // Search next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + offset);
    checkDate.setHours(targetHour, targetMinute, 0, 0);

    const checkJsDay = checkDate.getDay();
    const checkIsoDay = checkJsDay === 0 ? 7 : checkJsDay;

    if (repeatDays.includes(checkIsoDay)) {
      return checkDate;
    }
  }

  // Fallback
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(targetHour, targetMinute, 0, 0);
  return fallback;
}

export function formatRemainingDuration(target: Date, now: Date = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Now";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  if (totalMinutes < 1) return "< 1m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
