import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { queryClient } from '@/lib/query-client';
import { zustandMMKVStorage } from '@/lib/storage';

export type AuthUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  contactNumber?: string;
  businessName?: string;
  businessAddress?: string;
  company?: unknown;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (payload: { user: AuthUser; token: string }) => void;
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
      logout: () => {
        queryClient.clear();
        set({ user: null, token: null });
      },
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
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
