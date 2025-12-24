import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { queryClient } from '@/lib/query-client';
import { mmkStorage } from '@/lib/storage';

export type Company = {
  _id: string;
  businessName: string;
  businessAddress: string;
  contactNumber: string;
  trialStart: string;
  trialEnd: string;
  subscriptionStatus: 'Trialing' | 'Active' | 'Expired' | 'None';
  subscriptionEndDate?: string;
  revenueCatId?: string;
};

export type AuthUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  contactNumber?: string;
  company?: Company;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (payload: { user: AuthUser; token: string }) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: (value: boolean) => void;
};

const normalizeUser = (user: AuthUser) => {
  if (!user) return null;

  const id = user.id ?? (user as { _id?: string })._id;
  return { ...user, id };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setAuth: ({ user, token }) => set({ user: normalizeUser(user), token }),
      updateUser: (user) => set({ user: normalizeUser(user) }),
      logout: () => {
        queryClient.clear();
        set({ user: null, token: null });
      },
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to hydrate auth store', error);
        }
        state?.setHydrated(true);
      },
    }
  )
);
