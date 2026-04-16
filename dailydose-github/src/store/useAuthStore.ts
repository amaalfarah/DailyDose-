// store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'primary' | 'caregiver';
}

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  status: 'pending' | 'accepted';
  inviteToken: string;
  invitedAt: string;
}

interface AuthStore {
  user: User | null;
  hasAcceptedTerms: boolean;
  hasStartedTrial: boolean;
  activeAccount: 'mine' | 'shared';
  sharedPatientName: string;
  pendingInviteToken: string | null;
  caregivers: Caregiver[];

  login: (user: User) => void;
  logout: () => void;
  acceptTerms: () => void;
  startTrial: () => void;
  switchAccount: (type: 'mine' | 'shared') => void;
  addCaregiver: (cg: Caregiver) => void;
  acceptInvite: (token: string, user: User) => void;
  setPendingInviteToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      hasAcceptedTerms: false,
      hasStartedTrial: false,
      activeAccount: 'mine',
      sharedPatientName: "Luis Santos",
      pendingInviteToken: null,
      caregivers: [],

      login: (user) => set({ user }),

      logout: () =>
        set({ user: null, hasAcceptedTerms: false, hasStartedTrial: false }),

      acceptTerms: () => set({ hasAcceptedTerms: true }),

      startTrial: () => set({ hasStartedTrial: true }),

      switchAccount: (type) => set({ activeAccount: type }),

      addCaregiver: (cg) =>
        set((s) => ({ caregivers: [...s.caregivers, cg] })),

      acceptInvite: (token, user) => {
        const cg = get().caregivers.find((c) => c.inviteToken === token);
        if (cg) {
          set((s) => ({
            user,
            caregivers: s.caregivers.map((c) =>
              c.inviteToken === token ? { ...c, status: 'accepted' } : c
            ),
            pendingInviteToken: null,
          }));
        }
      },

      setPendingInviteToken: (token) => set({ pendingInviteToken: token }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
