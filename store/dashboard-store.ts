import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkStorage } from '@/lib/storage';

export type DashboardLayoutMode = 'classic' | 'modern';

type DashboardStore = {
  layoutMode: DashboardLayoutMode;
  setLayoutMode: (mode: DashboardLayoutMode) => void;
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      layoutMode: 'modern',
      setLayoutMode: (mode) => set({ layoutMode: mode }),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => mmkStorage),
    }
  )
);
