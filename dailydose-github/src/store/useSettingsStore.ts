// store/useSettingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'es' | 'fr' | 'ar';

interface SettingsStore {
  language: AppLanguage;
  privacyMode: boolean;
  hideNamesInNotifications: boolean;
  doseReminders: boolean;
  missedDoseAlerts: boolean;
  refillReminders: boolean;
  caregiverUpdates: boolean;
  trialStartDate: string | null;
  isSubscribed: boolean;
  trialExpired: boolean;

  setLanguage: (lang: AppLanguage) => void;
  setPrivacyMode: (on: boolean) => void;
  toggleSetting: (key: 'doseReminders' | 'missedDoseAlerts' | 'refillReminders' | 'caregiverUpdates') => void;
  startTrial: () => void;
  subscribe: () => void;
  checkTrialExpiry: () => void;
}

const TRIAL_DAYS = 30;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      privacyMode: false,
      hideNamesInNotifications: false,
      doseReminders: true,
      missedDoseAlerts: true,
      refillReminders: false,
      caregiverUpdates: false,
      trialStartDate: null,
      isSubscribed: false,
      trialExpired: false,

      setLanguage: (lang) => set({ language: lang }),

      setPrivacyMode: (on) => set({ privacyMode: on, hideNamesInNotifications: on }),

      toggleSetting: (key) => set((s) => ({ [key]: !s[key] })),

      startTrial: () =>
        set({ trialStartDate: new Date().toISOString(), trialExpired: false }),

      subscribe: () =>
        set({ isSubscribed: true, trialExpired: false }),

      checkTrialExpiry: () => {
        const { trialStartDate, isSubscribed } = get();
        if (isSubscribed || !trialStartDate) return;
        const start = new Date(trialStartDate);
        const now = new Date();
        const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diff > TRIAL_DAYS) set({ trialExpired: true });
      },
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
