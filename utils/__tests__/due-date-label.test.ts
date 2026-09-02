import { getDueBadgeLabel } from '../due-date-label';

// Fixed clock: 2026-09-01 10:00 local time.
const NOW = new Date(2026, 8, 1, 10, 0, 0);

const daysFromNow = (days: number, hour = 12) => new Date(2026, 8, 1 + days, hour).toISOString();

describe('getDueBadgeLabel', () => {
  it('returns null when the student is not in any bucket', () => {
    expect(getDueBadgeLabel(null, daysFromNow(-2), NOW)).toBeNull();
  });

  it('labels the today bucket without day math', () => {
    expect(getDueBadgeLabel('today', daysFromNow(0), NOW)).toBe('Due today');
  });

  it('counts days for an overdue student', () => {
    expect(getDueBadgeLabel('overdue', daysFromNow(-1), NOW)).toBe('Overdue 1d');
    expect(getDueBadgeLabel('overdue', daysFromNow(-14), NOW)).toBe('Overdue 14d');
  });

  it('never shows less than one day overdue', () => {
    // Expired late yesterday evening — still a full "1d" to the owner.
    expect(getDueBadgeLabel('overdue', daysFromNow(-1, 23), NOW)).toBe('Overdue 1d');
  });

  it('falls back to a generic label when the overdue student has no end date', () => {
    expect(getDueBadgeLabel('overdue', null, NOW)).toBe('Overdue');
  });

  it('counts days for the 3-day bucket', () => {
    expect(getDueBadgeLabel('3day', daysFromNow(2), NOW)).toBe('Due in 2d');
    expect(getDueBadgeLabel('3day', daysFromNow(3), NOW)).toBe('Due in 3d');
  });

  it('falls back safely for an unparseable end date', () => {
    expect(getDueBadgeLabel('3day', 'not-a-date', NOW)).toBe('Due soon');
    expect(getDueBadgeLabel('overdue', 'not-a-date', NOW)).toBe('Overdue');
  });
});
