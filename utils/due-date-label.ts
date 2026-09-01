const MS_PER_DAY = 1000 * 60 * 60 * 24;

type ReminderBucket = '3day' | 'today' | 'overdue' | null;

/**
 * Human badge label for a due student, with day counts so an owner can
 * prioritize ("Overdue 14d" beats a generic "Overdue"). `now` is injectable
 * for tests.
 */
export const getDueBadgeLabel = (
  reminderType: ReminderBucket,
  latestPaymentEndDate: string | null,
  now = new Date()
): string | null => {
  if (!reminderType) return null;
  if (reminderType === 'today') return 'Due today';

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Compare calendar days, not raw hours — "due Sep 3" seen on Sep 1 is 2
  // days away no matter what time of day either falls on.
  const endDate = latestPaymentEndDate ? new Date(latestPaymentEndDate) : null;
  const isValidEnd = endDate !== null && !Number.isNaN(endDate.getTime());

  if (isValidEnd) endDate.setHours(0, 0, 0, 0);

  if (reminderType === 'overdue') {
    if (!isValidEnd) return 'Overdue';
    const days = Math.max(Math.round((todayStart.getTime() - endDate.getTime()) / MS_PER_DAY), 1);
    return `Overdue ${days}d`;
  }

  // '3day' bucket — expiry sits 2–3 days out
  if (!isValidEnd) return 'Due soon';
  const days = Math.max(Math.round((endDate.getTime() - todayStart.getTime()) / MS_PER_DAY), 1);
  return `Due in ${days}d`;
};
