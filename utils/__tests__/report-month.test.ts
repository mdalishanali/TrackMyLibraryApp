import {
  currentReportMonth,
  formatMonthLabel,
  isSameReportMonth,
  shiftReportMonth,
  toMonthParam,
} from '../report-month';

describe('report-month', () => {
  it('derives the current month from a clock', () => {
    expect(currentReportMonth(new Date(2026, 8, 1))).toEqual({ year: 2026, month: 9 });
  });

  it('formats the API parameter with zero padding', () => {
    expect(toMonthParam({ year: 2026, month: 9 })).toBe('2026-09');
    expect(toMonthParam({ year: 2026, month: 12 })).toBe('2026-12');
  });

  it('formats a human label', () => {
    expect(formatMonthLabel({ year: 2026, month: 9 })).toBe('September 2026');
  });

  it('shifts forward across a year boundary', () => {
    expect(shiftReportMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('shifts backward across a year boundary', () => {
    expect(shiftReportMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftReportMonth({ year: 2026, month: 3 }, -15)).toEqual({ year: 2024, month: 12 });
  });

  it('compares months by value', () => {
    expect(isSameReportMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(true);
    expect(isSameReportMonth({ year: 2026, month: 9 }, { year: 2025, month: 9 })).toBe(false);
  });
});
