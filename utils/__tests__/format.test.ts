import { formatTime, formatTimeOfDay } from '../format';

describe('formatTimeOfDay', () => {
  it('formats an ISO datetime string', () => {
    const result = formatTimeOfDay('2026-02-28T14:05:00');
    expect(result).toBe('02:05 PM');
  });

  it('formats a Date instance', () => {
    const result = formatTimeOfDay(new Date(2026, 1, 28, 0, 30));
    expect(result).toBe('12:30 AM');
  });

  it('returns placeholder for null and undefined', () => {
    expect(formatTimeOfDay(null)).toBe('--:--');
    expect(formatTimeOfDay(undefined)).toBe('--:--');
  });

  it('returns placeholder for an unparseable string', () => {
    expect(formatTimeOfDay('not-a-date')).toBe('--:--');
  });
});

describe('formatTime', () => {
  it('formats an HH:MM string', () => {
    expect(formatTime('09:15')).toBe('09:15 AM');
    expect(formatTime('13:05')).toBe('01:05 PM');
  });

  it('returns placeholder for an ISO datetime (regression: billing history showed --:--)', () => {
    expect(formatTime('2026-02-28T14:05:00')).toBe('--:--');
  });
});
