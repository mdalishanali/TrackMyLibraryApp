import axios from 'axios';

import type { PaywallReason } from '@/providers/subscription-provider';

// The server returns HTTP 402 + { code: 'LIMIT_REACHED' } when a non-Pro company
// tries to exceed the free-tier active-student cap (see studentController.js).
const PAYMENT_REQUIRED_STATUS = 402;
const LIMIT_REACHED_CODE = 'LIMIT_REACHED';

/**
 * True when an error is the free-tier "10 active students" paywall response.
 * Matches on the status code first, with the server's `code` as a stronger signal.
 */
export const isStudentLimitError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  const code = (error.response?.data as { code?: string } | undefined)?.code;

  return status === PAYMENT_REQUIRED_STATUS || code === LIMIT_REACHED_CODE;
};

/**
 * Handles the free-tier student-limit error consistently across every
 * create-student entry point: opens the paywall with a contextual banner
 * explaining the limit. No toast — the full-screen paywall would hide it, so
 * the reason is shown inside the paywall itself (see custom-paywall.tsx).
 *
 * @returns true if the error was the limit paywall (and was handled), so callers
 *          can skip their generic error toast.
 */
export const handleStudentLimitError = (
  error: unknown,
  presentPaywall: (reason?: PaywallReason) => void
): boolean => {
  if (!isStudentLimitError(error)) return false;

  // Mark the error so nested handlers (e.g. StudentFormModal's own catch) skip
  // their generic "Save Failed" alert — the paywall already explains the block.
  if (error && typeof error === 'object') {
    (error as { handled?: boolean }).handled = true;
  }

  presentPaywall('student_limit');

  return true;
};
