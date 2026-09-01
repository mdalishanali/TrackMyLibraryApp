// Mirrors REMINDER_COOLDOWN_HOURS on the server — the send worker silently
// skips students reminded within this window, so the UI must warn about them.
export const REMINDER_COOLDOWN_HOURS = 20;

const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Whole hours since the last reminder, when the student is still inside the
 * server's cooldown window; null when never reminded or the cooldown passed.
 */
export const getHoursSinceReminder = (lastReminderSentAt: string | null): number | null => {
  if (!lastReminderSentAt) return null;

  const sentAtMs = new Date(lastReminderSentAt).getTime();
  if (Number.isNaN(sentAtMs)) return null;

  const hours = (Date.now() - sentAtMs) / MS_PER_HOUR;
  if (hours < 0 || hours >= REMINDER_COOLDOWN_HOURS) return null;

  return Math.floor(hours);
};
