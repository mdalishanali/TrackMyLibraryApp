import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkStorage } from '@/lib/storage';
import { ColorSchemeName, useColorScheme as useSystemColorScheme } from 'react-native';

export type AppearanceMode = 'light' | 'dark' | 'system';

type AppearanceStore = {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
};

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => mmkStorage),
    }
  )
);

/**
 * Hook to get the effective color scheme based on user preference
 */
export function useColorScheme(): ColorSchemeName {
  const systemScheme = useSystemColorScheme();
  const { mode } = useAppearanceStore();

  if (mode === 'system') {
    return systemScheme;
  }

  return mode;
}
