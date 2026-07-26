import { MAX_TOTAL_SEATS } from '../constants';
import type { PlannedSection, SectionDraft, ShiftDraft } from '../types';

const parseSeat = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Seat numbers are entered directly by the owner so a hall physically signed
 * 101-130 can be recorded as-is. Count is derived from the range.
 */
export const planSections = (sections: SectionDraft[]): PlannedSection[] =>
  sections.map(({ id, name, startSeat, endSeat }) => {
    const start = parseSeat(startSeat);
    const end = parseSeat(endSeat);
    const isValidRange = start > 0 && end >= start;

    return {
      id,
      name,
      startSeat: start,
      endSeat: end,
      seatCount: isValidRange ? end - start + 1 : 0,
    };
  });

export const getTotalSeats = (sections: SectionDraft[]): number =>
  planSections(sections).reduce((total, { seatCount }) => total + seatCount, 0);

const hasDuplicateNames = (sections: SectionDraft[]): boolean => {
  const names = sections.map(({ name }) => name.trim().toLowerCase()).filter(Boolean);
  return new Set(names).size !== names.length;
};

/**
 * Returns a user-facing reason the wizard cannot advance, or null when valid.
 * Message text is shown inline, so it must read as guidance rather than an error.
 */
export const getSectionsError = (sections: SectionDraft[]): string | null => {
  if (sections.length === 0) {
    return 'Add at least one section';
  }

  if (sections.some(({ name }) => !name.trim())) {
    return 'Give every section a name';
  }

  if (hasDuplicateNames(sections)) {
    return 'Two sections have the same name';
  }

  const planned = planSections(sections);

  const incomplete = planned.find(
    (section, index) => !sections[index].startSeat || !sections[index].endSeat
  );
  if (incomplete) {
    return 'Enter a start and end seat for every section';
  }

  const invalidRange = planned.find(({ startSeat, endSeat }) => startSeat < 1 || endSeat < startSeat);
  if (invalidRange) {
    return `"${invalidRange.name}" — end seat must be the same or higher than start`;
  }

  const totalSeats = planned.reduce((total, { seatCount }) => total + seatCount, 0);
  if (totalSeats > MAX_TOTAL_SEATS) {
    return `Total seats cannot be more than ${MAX_TOTAL_SEATS}`;
  }

  return null;
};

/**
 * Shifts are optional — an owner can skip the step entirely — but any shift
 * they do add must be complete and uniquely named, since the database keeps
 * shift names unique per company.
 */
export const getShiftsError = (shifts: ShiftDraft[]): string | null => {
  if (shifts.length === 0) {
    return null;
  }

  if (shifts.some(({ name }) => !name.trim())) {
    return 'Give every shift a name';
  }

  const names = shifts.map(({ name }) => name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    return 'Two shifts have the same name';
  }

  return null;
};
