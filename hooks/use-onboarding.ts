import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { SetupPayload } from '@/features/onboarding/types';

/**
 * The server accepts either shape:
 *   { totalSeats }         — legacy single-number setup
 *   { sections, shifts }   — setup wizard
 */
type LegacySetupPayload = { totalSeats: number; monthlyFee?: number };

type LibrarySetupPayload = SetupPayload | LegacySetupPayload;

const isWizardPayload = (payload: LibrarySetupPayload): payload is SetupPayload =>
  'sections' in payload;

export const useLibrarySetup = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (payload: LibrarySetupPayload) => {
      const { data } = await api.post('/onboarding/setup', payload);
      return data;
    },
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.seats }),
        queryClient.invalidateQueries({ queryKey: queryKeys.shifts }),
      ]);
      // Double safety - refetch active queries to ensure fresh state
      await queryClient.refetchQueries({ queryKey: queryKeys.seats });

      const isWizard = isWizardPayload(variables);

      posthog?.capture('library_setup_completed', {
        total_seats: isWizard
          ? variables.sections.reduce(
              (sum, section) => sum + (section.endSeat - section.startSeat + 1),
              0
            )
          : variables.totalSeats,
        section_count: isWizard ? variables.sections.length : 1,
        shift_count: isWizard ? variables.shifts.length : 0,
        used_wizard: isWizard,
      });
    },
  });
};
