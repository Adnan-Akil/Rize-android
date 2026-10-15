import * as Haptics from "expo-haptics";

export class AlarmSoundService {
  private isRinging: boolean = false;
  private vibrateInterval: any = null;

  startAlarm(shouldVibrate: boolean = true): void {
    if (this.isRinging) return;
    this.isRinging = true;

    if (shouldVibrate) {
      const pulseVibration = () => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) {}
      };

      pulseVibration();
      this.vibrateInterval = setInterval(pulseVibration, 1200);
    }
  }

  stopAlarm(): void {
    this.isRinging = false;
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
  }

  getIsRinging(): boolean {
    return this.isRinging;
  }
}

export const alarmSoundService = new AlarmSoundService();
