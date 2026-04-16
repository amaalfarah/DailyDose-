// store/useMedStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Medication {
  id: string;
  name: string;
  coverName?: string;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | '3x-daily' | 'as-needed';
  reminderTime: string;       // "08:00"
  reminderTimes?: string[];   // multiple times for twice/3x daily
  color: string;
  iconName: string;           // MaterialCommunityIcons name
  iconCategory: 'med' | 'neutral';
  isPRN: boolean;
  isActive: boolean;
  dosesTakenToday: boolean[];
  totalDosesToday: number;
  createdAt: string;
}

interface MedStore {
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id' | 'createdAt'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  toggleDoseTaken: (medId: string, doseIndex: number) => void;
  markAllUntaken: () => void;
}

export const useMedStore = create<MedStore>()(
  persist(
    (set) => ({
      medications: [
        // Seed data matching the prototype
        {
          id: '1',
          name: 'Amoxicillin 250mg',
          dosage: '250mg',
          frequency: '3x-daily',
          reminderTime: '08:00',
          color: '#e3f7f0',
          iconName: 'pill',
          iconCategory: 'med',
          isPRN: false,
          isActive: true,
          dosesTakenToday: [true, true, false],
          totalDosesToday: 3,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Cetirizine 5mg',
          dosage: '5mg',
          frequency: 'daily',
          reminderTime: '12:00',
          color: '#eaf2fb',
          iconName: 'pill',
          iconCategory: 'med',
          isPRN: false,
          isActive: true,
          dosesTakenToday: [true],
          totalDosesToday: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Vitamin D3 400IU',
          dosage: '400IU',
          frequency: 'daily',
          reminderTime: '09:00',
          color: '#fef3e7',
          iconName: 'star',
          iconCategory: 'neutral',
          isPRN: false,
          isActive: true,
          dosesTakenToday: [false],
          totalDosesToday: 1,
          createdAt: new Date().toISOString(),
        },
      ],

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

      toggleDoseTaken: (medId, doseIndex) =>
        set((state) => ({
          medications: state.medications.map((m) => {
            if (m.id !== medId) return m;
            const taken = [...m.dosesTakenToday];
            taken[doseIndex] = !taken[doseIndex];
            return { ...m, dosesTakenToday: taken };
          }),
        })),

      markAllUntaken: () =>
        set((state) => ({
          medications: state.medications.map((m) => ({
            ...m,
            dosesTakenToday: new Array(m.totalDosesToday).fill(false),
          })),
        })),
    }),
    {
      name: 'medications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
