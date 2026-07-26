import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import {
  ADDED_SECTION_NAMES,
  DEFAULT_FIRST_SHIFT,
  DEFAULT_SECTION_NAME,
  DEFAULT_SHIFT_FEE,
  MAX_SECTIONS,
} from '../constants';
import type { SectionDraft, SetupPayload, ShiftDraft } from '../types';
import {
  getSectionsError,
  getShiftsError,
  getTotalSeats,
  planSections,
} from '../utils/planSeats';

let sectionKeySeed = 0;
const nextSectionKey = () => `section-${++sectionKeySeed}`;

let shiftKeySeed = 0;
const nextShiftKey = () => `shift-${++shiftKeySeed}`;

const createShift = (template: { name: string; startTime: string; endTime: string }): ShiftDraft => ({
  id: nextShiftKey(),
  ...template,
  price: '',
});

const createSection = (name = '', startSeat = '1'): SectionDraft => ({
  id: nextSectionKey(),
  name,
  startSeat,
  endSeat: '',
});

type WizardValue = {
  sections: SectionDraft[];
  shifts: ShiftDraft[];
  totalSeats: number;
  sectionsError: string | null;
  canAddSection: boolean;
  isSectionsValid: boolean;
  plannedSections: ReturnType<typeof planSections>;
  addSection: () => void;
  updateSection: (id: string, patch: Partial<Omit<SectionDraft, 'id'>>) => void;
  removeSection: (id: string) => void;
  addShift: (template: { name: string; startTime: string; endTime: string }) => void;
  updateShift: (id: string, patch: Partial<Omit<ShiftDraft, 'id'>>) => void;
  removeShift: (id: string) => void;
  shiftsError: string | null;
  isShiftsValid: boolean;
  buildPayload: () => SetupPayload;
};

const OnboardingWizardContext = createContext<WizardValue | null>(null);

/**
 * Holds draft state across the three wizard steps. Lives in a provider rather
 * than route params so a back-navigation never loses what was typed.
 */
export const OnboardingWizardProvider = ({ children }: PropsWithChildren) => {
  // Pre-seeded so a single-hall library only has to enter its last seat number.
  const [sections, setSections] = useState<SectionDraft[]>([createSection(DEFAULT_SECTION_NAME)]);

  // Every library runs at least one sitting, so start with one rather than an
  // empty screen the owner has to populate before continuing.
  const [shifts, setShifts] = useState<ShiftDraft[]>([
    { ...createShift(DEFAULT_FIRST_SHIFT), price: String(DEFAULT_SHIFT_FEE) },
  ]);

  const addSection = useCallback(() => {
    setSections((current) => {
      if (current.length >= MAX_SECTIONS) {
        return current;
      }

      // Pre-fill a name so adding a section never lands the owner in an error
      // state. Skip any the owner has already typed themselves.
      const taken = new Set(current.map(({ name }) => name.trim().toLowerCase()));
      const suggestedName =
        ADDED_SECTION_NAMES.find((name) => !taken.has(name.toLowerCase())) ?? '';

      // Each hall is numbered independently — separate rooms restart their seat
      // numbering at 1 rather than continuing on from the previous hall.
      return [...current, createSection(suggestedName)];
    });
  }, []);

  const updateSection = useCallback((id: string, patch: Partial<Omit<SectionDraft, 'id'>>) => {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...patch } : section))
    );
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((current) => current.filter((section) => section.id !== id));
  }, []);

  /**
   * A template only seeds the card — name, times and fee are all editable
   * afterwards. Names are de-duplicated on insert because the database keeps
   * shift names unique per company.
   */
  const addShift = useCallback(
    (template: { name: string; startTime: string; endTime: string }) => {
      setShifts((current) => {
        // A blank template name is intentional — the card prompts for one — so
        // it is never de-duplicated into " 2".
        if (!template.name.trim()) {
          return [...current, { ...template, id: nextShiftKey(), price: '' }];
        }

        const taken = new Set(current.map(({ name }) => name.trim().toLowerCase()));

        let name = template.name;
        let suffix = 2;

        while (taken.has(name.trim().toLowerCase())) {
          name = `${template.name} ${suffix}`;
          suffix++;
        }

        return [...current, { ...template, id: nextShiftKey(), name, price: '' }];
      });
    },
    []
  );

  const updateShift = useCallback((id: string, patch: Partial<Omit<ShiftDraft, 'id'>>) => {
    setShifts((current) => current.map((shift) => (shift.id === id ? { ...shift, ...patch } : shift)));
  }, []);

  const removeShift = useCallback((id: string) => {
    setShifts((current) => current.filter((shift) => shift.id !== id));
  }, []);

  const shiftsError = useMemo(() => getShiftsError(shifts), [shifts]);

  const totalSeats = useMemo(() => getTotalSeats(sections), [sections]);
  const sectionsError = useMemo(() => getSectionsError(sections), [sections]);
  const plannedSections = useMemo(() => planSections(sections), [sections]);

  /**
   * Skipping the shift step still yields one shift — fees are calculated
   * against a shift, so a library with none cannot take a payment.
   */
  const buildPayload = useCallback((): SetupPayload => {
    const shiftsToCreate =
      shifts.length > 0 ? shifts : [{ ...DEFAULT_FIRST_SHIFT, price: DEFAULT_SHIFT_FEE }];

    return {
      sections: planSections(sections).map(({ name, startSeat, endSeat }) => ({
        name: name.trim(),
        startSeat,
        endSeat,
      })),
      shifts: shiftsToCreate.map(({ name, startTime, endTime, price }) => ({
        name: name.trim(),
        startTime,
        endTime,
        price: Number.parseInt(String(price), 10) || 0,
      })),
    };
  }, [sections, shifts]);

  const value = useMemo(
    () => ({
      sections,
      shifts,
      totalSeats,
      sectionsError,
      canAddSection: sections.length < MAX_SECTIONS,
      isSectionsValid: sectionsError === null,
      plannedSections,
      addSection,
      updateSection,
      removeSection,
      addShift,
      updateShift,
      removeShift,
      shiftsError,
      isShiftsValid: shiftsError === null,
      buildPayload,
    }),
    [
      sections,
      shifts,
      totalSeats,
      sectionsError,
      plannedSections,
      addSection,
      updateSection,
      removeSection,
      addShift,
      updateShift,
      removeShift,
      shiftsError,
      buildPayload,
    ]
  );

  return <OnboardingWizardContext.Provider value={value}>{children}</OnboardingWizardContext.Provider>;
};

export const useOnboardingWizard = () => {
  const context = useContext(OnboardingWizardContext);

  if (!context) {
    throw new Error('useOnboardingWizard must be used inside OnboardingWizardProvider');
  }

  return context;
};
