// hooks/useNotifications.ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useMedStore, Medication } from '../store/useMedStore';
import { useSettingsStore } from '../store/useSettingsStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  // For development convenience, assume permissions are granted
  // In production, this should request permissions properly
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  // Skip permission request in development to avoid repeated prompts
  if (__DEV__) return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function getDisplayName(med: Medication, privacyMode: boolean): string {
  if (privacyMode) {
    return med.coverName || 'your medication';
  }
  return med.coverName || med.name;
}

export async function scheduleDoseReminder(
  med: Medication,
  privacyMode: boolean
): Promise<string[]> {
  const displayName = getDisplayName(med, privacyMode);
  const identifiers: string[] = [];

  // Cancel existing for this med
  await cancelMedReminders(med.id);

  if (!med.isActive || med.isPRN) return [];

  const times: string[] = med.reminderTimes?.length
    ? med.reminderTimes
    : [med.reminderTime];

  const startDate = new Date(med.startDate);
  const endDate = med.endDate ? new Date(med.endDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If start date is in the future, schedule from start date
  // If end date is in the past, don't schedule
  if (endDate && endDate < today) return [];
  const scheduleStart = startDate > today ? startDate : today;

  // Schedule up to 1 year ahead or until end date
  const maxDate = endDate ? endDate : new Date(scheduleStart.getTime() + 365 * 24 * 60 * 60 * 1000);

  for (let d = new Date(scheduleStart); d <= maxDate; d.setDate(d.getDate() + 1)) {
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    if (!med.daysOfWeek.includes(dayName)) continue;

    for (const time of times) {
      const [h, m] = time.split(':').map(Number);
      const triggerDate = new Date(d);
      triggerDate.setHours(h, m, 0, 0);

      // Only schedule if in the future
      if (triggerDate > new Date()) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'DailyDose+ Reminder 💊',
            body: `Time to take ${displayName}`,
            data: { medId: med.id, medName: med.name },
            sound: true,
          },
          trigger: triggerDate,
        });
        identifiers.push(id);
      }
    }
  }

  return identifiers;
}

export async function cancelMedReminders(medId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.medId === medId
  );
  for (const n of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function scheduleAllReminders(
  medications: Medication[],
  privacyMode: boolean
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const med of medications) {
    if (med.isActive && !med.isPRN) {
      await scheduleDoseReminder(med, privacyMode);
    }
  }
}

export function useNotifications() {
  const { medications } = useMedStore();
  const { privacyMode, doseReminders } = useSettingsStore();

  useEffect(() => {
    if (!doseReminders) {
      Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }
    requestNotificationPermission().then((granted) => {
      if (granted) {
        scheduleAllReminders(medications, privacyMode);
      }
    });
  }, [medications, privacyMode, doseReminders]);

  // Set up Android notification channel
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('dose-reminders', {
        name: 'Dose Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1fa97a',
      });
    }
  }, []);
}
