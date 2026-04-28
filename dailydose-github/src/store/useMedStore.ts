// store/useMedStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DoseHistoryEntry {
  medId: string;
  medName: string;
  time: string;
  taken: boolean;
}

export interface Medication {
  id: string;
  name: string;
  coverName?: string;
  privacyMode?: boolean;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | '3x-daily' | 'as-needed';
  reminderTime: string;       // "08:00"
  reminderTimes?: string[];   // multiple times for twice/3x daily
  color: string;
  iconName: string;           // MaterialCommunityIcons name
  iconCategory: 'med' | 'neutral';
  daysOfWeek: string[];        // ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] subset
  isPRN: boolean;
  isActive: boolean;
  dosesTakenToday: boolean[];
  totalDosesToday: number;
  createdAt: string;
}

interface MedStore {
  medications: Medication[];
  doseHistory: Record<string, DoseHistoryEntry[]>;
  addMedication: (med: Omit<Medication, 'id' | 'createdAt'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  reorderMedication: (fromIndex: number, toIndex: number) => void;
  toggleDoseTaken: (medId: string, doseIndex: number) => void;
  markAllUntaken: () => void;
  clearAll: () => void;
}

export const useMedStore = create<MedStore>()(
  persist(
    (set) => ({
      medications: [],
      doseHistory: {},

      addMedication: (med) =>
        set((state) => ({
          medications: [
            ...state.medications,
            {
              ...med,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateMedication: (id, updates) =>
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
        })),

      reorderMedication: (fromIndex, toIndex) =>
        set((state) => {
          const list = [...state.medications];
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { medications: list };
        }),

      toggleDoseTaken: (medId, doseIndex) =>
        set((state) => {
          const updatedMeds = state.medications.map((m) => {
            if (m.id !== medId) return m;
            const taken = [...m.dosesTakenToday];
            taken[doseIndex] = !taken[doseIndex];
            return { ...m, dosesTakenToday: taken };
          });
          const now = new Date();
          const todayKey = now.toISOString().split('T')[0];
          const todayDayKey = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
          const todayEntries: DoseHistoryEntry[] = updatedMeds
            .filter((m) => (m.daysOfWeek ?? []).includes(todayDayKey))
            .flatMap((m) =>
              m.dosesTakenToday.map((taken, i) => ({
                medId: m.id,
                medName: m.name,
                time: m.reminderTimes?.[i] ?? m.reminderTime,
                taken,
              }))
            );
          return {
            medications: updatedMeds,
            doseHistory: { ...state.doseHistory, [todayKey]: todayEntries },
          };
        }),

      markAllUntaken: () =>
        set((state) => ({
          medications: state.medications.map((m) => ({
            ...m,
            dosesTakenToday: new Array(m.totalDosesToday).fill(false),
          })),
        })),

      clearAll: () => set({ medications: [] }),
    }),
    {
      name: 'medications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
