/**
 * student-fields.ts
 *
 * Readers for the student fields whose shape differs by endpoint.
 *
 * WHY THIS EXISTS:
 *   The API returns the same information under different keys depending on which
 *   handler served it — the list endpoints project `floorNumber` and `shiftNames`
 *   while detail responses return `floor` and populated `allocations`. Every consumer
 *   was re-implementing the same fallback chain, so adding an endpoint meant hunting
 *   down each copy.
 *
 * These return raw values, not display strings: callers format differently (the
 * summary card writes "Section 3", a phone contact writes "3"), and folding that in
 * would make the helpers untestable and the callers less clear.
 *
 * Each reader takes a STRUCTURAL parameter rather than the shared `Student` type,
 * because callers include components with their own narrower local Student shapes.
 */

/** The floor keys a student may arrive with. */
type FloorFields = {
    floor?: number | string | null;
    floorNumber?: number | string | null;
};

/** The shift keys a student may arrive with. */
type ShiftFields = {
    shiftNames?: string[] | null;
    allocations?: unknown[] | null;
    shift?: string | null;
};

/** The seat keys a student may arrive with. */
type SeatFields = {
    seatNumber?: number | null;
    seat?: unknown;
};

/**
 * Floor/section, tolerating both shapes:
 *   - `floorNumber` — list and directory endpoints
 *   - `floor`       — detail responses
 *
 * @returns The raw value, or '' when the student has no seat.
 */
export const getFloorValue = (student: FloorFields): string => {
    const floor = student.floor ?? student.floorNumber;
    return floor === undefined || floor === null ? '' : String(floor);
};

/**
 * Shift name(s), tolerating all three shapes:
 *   - `shiftNames: string[]` — /students/directory
 *   - `allocations: Shift[]` — populated detail responses
 *   - `shift: string`        — legacy denormalised field
 *
 * @returns Comma-joined names, or '' when nothing is allocated.
 */
export const getShiftValue = (student: ShiftFields): string => {
    const directoryNames = student.shiftNames ?? [];
    if (directoryNames.length > 0) return directoryNames.filter(Boolean).join(', ');

    const allocationNames = (student.allocations ?? [])
        .map((item) => (typeof item === 'object' && item !== null ? (item as { name?: string }).name : null))
        .filter((name): name is string => Boolean(name));

    if (allocationNames.length > 0) return allocationNames.join(', ');
    return student.shift ?? '';
};

/**
 * Seat number, tolerating a flat `seatNumber` or a populated `seat` object.
 *
 * @returns The seat number as a string, or '' when unallocated.
 */
export const getSeatValue = (student: SeatFields): string => {
    if (student.seatNumber) return String(student.seatNumber);

    const seat = student.seat;
    if (seat && typeof seat === 'object' && 'seatNumber' in seat) {
        const seatNumber = (seat as { seatNumber?: number }).seatNumber;
        return seatNumber ? String(seatNumber) : '';
    }

    return '';
};
