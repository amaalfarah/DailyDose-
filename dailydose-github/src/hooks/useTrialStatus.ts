// hooks/useTrialStatus.ts
import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

const TRIAL_DAYS = 30;

export function useTrialStatus() {
  const { trialStartDate, isSubscribed, checkTrialExpiry } = useSettingsStore();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    checkTrialExpiry();

    if (!trialStartDate) {
      setDaysRemaining(null);
      return;
    }

    const start = new Date(trialStartDate);
    const now = new Date();
    const elapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const remaining = Math.max(0, TRIAL_DAYS - Math.floor(elapsed));
    setDaysRemaining(remaining);
  }, [trialStartDate]);

  return {
    isOnTrial: !!trialStartDate && !isSubscribed,
    isSubscribed,
    daysRemaining,
    trialExpired: daysRemaining === 0 && !isSubscribed,
    trialStartDate,
  };
}
