// store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMedStore } from './useMedStore';

export interface User {
  id: string;
  name: string;
  email: string;
  dob: string;
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
  pendingName: string;
  pendingEmail: string;
  pendingDob: string;
  hasAcceptedTerms: boolean;
  hasStartedTrial: boolean;
  activeAccount: 'mine' | 'shared';
  sharedAccountOwnerName: string;
  savedCaregiverCode: string;
  pendingInviteToken: string | null;
  caregivers: Caregiver[];

  login: (user: User) => void;
  logout: () => void;
  setPendingUser: (name: string, email: string, dob?: string) => void;
  updateUser: (updates: Partial<Pick<User, 'name' | 'email' | 'dob'>>) => void;
  acceptTerms: () => void;
  startTrial: () => void;
  switchAccount: (type: 'mine' | 'shared') => void;
  setSharedAccountOwnerName: (name: string) => void;
  setSavedCaregiverCode: (code: string) => void;
  addCaregiver: (cg: Caregiver) => void;
  acceptInvite: (token: string, user: User) => void;
  setPendingInviteToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      pendingName: '',
      pendingEmail: '',
      pendingDob: '',
      hasAcceptedTerms: false,
      hasStartedTrial: false,
      activeAccount: 'mine',
      sharedAccountOwnerName: '',
      savedCaregiverCode: '',
      pendingInviteToken: null,
      caregivers: [],

      login: (user) => set({ user, activeAccount: 'mine' }),

      logout: () => {
        useMedStore.getState().clearAll();
        set({
          user: null,
          hasAcceptedTerms: false,
          hasStartedTrial: false,
          activeAccount: 'mine',
          sharedAccountOwnerName: '',
          savedCaregiverCode: '',
          pendingInviteToken: null,
        });
      },

      setPendingUser: (name, email, dob = '') => set({ pendingName: name, pendingEmail: email, pendingDob: dob }),

      updateUser: (updates) => set((s) => s.user ? { user: { ...s.user, ...updates } } : {}),

      acceptTerms: () => set({ hasAcceptedTerms: true }),

      startTrial: () => set({ hasStartedTrial: true }),

      switchAccount: (type) => set({ activeAccount: type }),

      setSharedAccountOwnerName: (name) => set({ sharedAccountOwnerName: name }),

      setSavedCaregiverCode: (code) => set({ savedCaregiverCode: code }),

      addCaregiver: (cg) =>
        set((s) => ({ caregivers: [...s.caregivers, cg] })),

      acceptInvite: (token, user) => {
        const cg = get().caregivers.find((c) => c.inviteToken === token);
        if (cg) {
          set((s) => ({
            user,
            activeAccount: 'mine',
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
