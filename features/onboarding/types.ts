export type SectionDraft = {
  /** Stable key for list rendering — sections have no id until they are created. */
  id: string;
  name: string;
  /** Kept as strings so the inputs can be empty mid-edit. */
  startSeat: string;
  endSeat: string;
};

export type ShiftDraft = {
  /** Stable key — the name is editable, so it cannot identify the row. */
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  /** Kept as a string so the input can be empty mid-edit. */
  price: string;
};

/** A section with its resolved seat range, ready to display or submit. */
export type PlannedSection = {
  id: string;
  name: string;
  seatCount: number;
  startSeat: number;
  endSeat: number;
};

export type SetupPayload = {
  sections: { name: string; startSeat: number; endSeat: number }[];
  shifts: { name: string; startTime: string; endTime: string; price: number }[];
};
