export type ReportMonth = {
  year: number;
  /** 1–12 */
  month: number;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const currentReportMonth = (now = new Date()): ReportMonth => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
});

/** The `YYYY-MM` form the reports API expects. */
export const toMonthParam = ({ year, month }: ReportMonth): string =>
  `${year}-${String(month).padStart(2, '0')}`;

export const formatMonthLabel = ({ year, month }: ReportMonth): string =>
  `${MONTH_NAMES[month - 1]} ${year}`;

/** Move by whole months, carrying across year boundaries in either direction. */
export const shiftReportMonth = ({ year, month }: ReportMonth, delta: number): ReportMonth => {
  const zeroBased = year * 12 + (month - 1) + delta;

  return {
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12 + 12) % 12 + 1,
  };
};

export const isSameReportMonth = (a: ReportMonth, b: ReportMonth): boolean =>
  a.year === b.year && a.month === b.month;
