import { useState, useEffect } from "react";
import { Alarm } from "../db/schema";
import { calculateNextOccurrence, formatRemainingDuration } from "../features/alarms/timeUtils";

export interface CountdownState {
  formattedCountdown: string;
  isImminent: boolean;
  nextOccurrence: Date | null;
}

export function useAlarmCountdown(nextAlarm: Alarm | null): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>(() => {
    if (!nextAlarm || !nextAlarm.isEnabled) {
      return { formattedCountdown: "No active alarms", isImminent: false, nextOccurrence: null };
    }
    const nextDate = calculateNextOccurrence(nextAlarm.time, nextAlarm.repeatDays);
    const duration = formatRemainingDuration(nextDate);
    const diffMs = nextDate.getTime() - Date.now();
    return {
      formattedCountdown: `In ${duration}`,
      isImminent: diffMs > 0 && diffMs <= 1000 * 60 * 15, // <= 15 minutes
      nextOccurrence: nextDate,
    };
  });

  useEffect(() => {
    if (!nextAlarm || !nextAlarm.isEnabled) {
      setCountdown({ formattedCountdown: "No active alarms", isImminent: false, nextOccurrence: null });
      return;
    }

    const update = () => {
      const now = new Date();
      const nextDate = calculateNextOccurrence(nextAlarm.time, nextAlarm.repeatDays, now);
      const duration = formatRemainingDuration(nextDate, now);
      const diffMs = nextDate.getTime() - now.getTime();

      setCountdown({
        formattedCountdown: `In ${duration}`,
        isImminent: diffMs > 0 && diffMs <= 1000 * 60 * 15,
        nextOccurrence: nextDate,
      });
    };

    update();
    const interval = setInterval(update, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [nextAlarm?.id, nextAlarm?.time, nextAlarm?.isEnabled, JSON.stringify(nextAlarm?.repeatDays)]);

  return countdown;
}
