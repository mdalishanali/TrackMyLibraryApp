/**
 * Setup wizard limits and presets. Seat/section limits mirror the server's
 * constants/onboarding.js — keep both in sync.
 */

export const MAX_SECTIONS = 5;

export const MAX_TOTAL_SEATS = 500;

export const DEFAULT_SECTION_NAME = 'Main Hall';

/**
 * Names for sections added after "Main Hall". Deliberately plain-language
 * rather than "Section A/B" — owners describe their building as halls and
 * rooms, not lettered sections. Editable; many will type "AC Room",
 * "Ladies Hall" or "First Floor" instead.
 */
export const ADDED_SECTION_NAMES = ['Second Hall', 'Third Hall', 'Fourth Hall', 'Fifth Hall'];

/** Quick-fill chips. Values reflect typical study-hall sizes; the field stays typeable. */
export const SEAT_COUNT_PRESETS = [10, 20, 30, 50, 100];

/**
 * Mirrors PRESETS in app/shifts.tsx so a library configured during onboarding
 * looks identical to one configured later from the Shifts screen.
 */
export const SHIFT_PRESETS = [
  { name: 'Morning', startTime: '06:00', endTime: '12:00' },
  { name: 'Afternoon', startTime: '12:00', endTime: '18:00' },
  { name: 'Evening', startTime: '14:00', endTime: '22:00' },
  { name: 'Night', startTime: '20:00', endTime: '06:00' },
  { name: 'Full Day', startTime: '06:00', endTime: '22:00' },
  { name: '24 Hours', startTime: '00:00', endTime: '23:59' },
] as const;

/**
 * The shift step opens with this already added — every library runs at least
 * one sitting, so an empty screen would just be a step to clear.
 *
 * Also used as the fallback when an owner removes every shift: a library with
 * no shift cannot take a payment, and re-using this keeps the review screen
 * consistent with what the step showed.
 */
export const DEFAULT_FIRST_SHIFT = {
  name: 'Full Day',
  startTime: '06:00',
  endTime: '22:00',
};

/**
 * Pre-filled monthly fee. A shift priced at zero cannot bill anyone, so the
 * wizard suggests a typical figure rather than leaving the library unusable
 * for an owner who skips the step. Editable on the card.
 */
export const DEFAULT_SHIFT_FEE = 500;

/**
 * Seeds a card when the owner wants timings of their own. Left unnamed so the
 * placeholder prompts them rather than shipping a literal "New Shift".
 */
export const CUSTOM_SHIFT_TEMPLATE = {
  name: '',
  startTime: '09:00',
  endTime: '18:00',
};


export const WIZARD_STEPS = ['sections', 'shifts', 'review'] as const;

export const TOTAL_STEPS = WIZARD_STEPS.length;
