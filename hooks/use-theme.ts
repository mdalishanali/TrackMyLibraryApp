import { useColorScheme } from './use-color-scheme';
import { themeFor } from '@/constants/design';

export function useTheme() {
  const scheme = useColorScheme();
  return themeFor(scheme);
}
