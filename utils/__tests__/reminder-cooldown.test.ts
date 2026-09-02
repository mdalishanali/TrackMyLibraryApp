import { getHoursSinceReminder, REMINDER_COOLDOWN_HOURS } from '../reminder-cooldown';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

describe('getHoursSinceReminder', () => {
  it('returns null when never reminded', () => {
    expect(getHoursSinceReminder(null)).toBeNull();
  });

  it('returns null for an unparseable timestamp', () => {
    expect(getHoursSinceReminder('not-a-date')).toBeNull();
  });

  it('returns whole hours for a reminder inside the cooldown window', () => {
    expect(getHoursSinceReminder(hoursAgo(2.5))).toBe(2);
  });

  it('returns 0 for a reminder sent minutes ago', () => {
    expect(getHoursSinceReminder(hoursAgo(0.1))).toBe(0);
  });

  it('returns null once the cooldown has passed', () => {
    expect(getHoursSinceReminder(hoursAgo(REMINDER_COOLDOWN_HOURS))).toBeNull();
    expect(getHoursSinceReminder(hoursAgo(REMINDER_COOLDOWN_HOURS + 5))).toBeNull();
  });

  it('returns null for a future timestamp instead of a negative count', () => {
    expect(getHoursSinceReminder(hoursAgo(-3))).toBeNull();
  });
});
