import { getFloorValue, getSeatValue, getShiftValue } from '@/utils/student-fields';

/**
 * These readers exist to absorb API shape drift, so the tests are organised by the
 * endpoint each shape comes from — that is what breaks when a handler changes.
 */

describe('getFloorValue', () => {
    it('reads `floorNumber` from the list and directory endpoints', () => {
        expect(getFloorValue({ floorNumber: '1st Floor' })).toBe('1st Floor');
    });

    it('reads `floor` from detail responses', () => {
        expect(getFloorValue({ floor: 'Main Hall' })).toBe('Main Hall');
    });

    it('prefers `floor` when both are present', () => {
        expect(getFloorValue({ floor: 'Detail', floorNumber: 'List' })).toBe('Detail');
    });

    it('stringifies a numeric floor', () => {
        expect(getFloorValue({ floor: 3 })).toBe('3');
    });

    it('returns empty string, never "undefined", when the student has no seat', () => {
        expect(getFloorValue({})).toBe('');
        expect(getFloorValue({ floor: null })).toBe('');
    });

    it('preserves floor 0 rather than treating it as absent', () => {
        expect(getFloorValue({ floor: 0 })).toBe('0');
    });
});

describe('getShiftValue', () => {
    it('reads `shiftNames` from the directory endpoint', () => {
        expect(getShiftValue({ shiftNames: ['First', 'Second'] })).toBe('First, Second');
    });

    it('reads populated `allocations` from detail responses', () => {
        expect(getShiftValue({ allocations: [{ name: 'Morning' }, { name: 'Evening' }] }))
            .toBe('Morning, Evening');
    });

    it('falls back to the legacy denormalised `shift` string', () => {
        expect(getShiftValue({ shift: 'Night' })).toBe('Night');
    });

    it('prefers shiftNames over allocations over the legacy field', () => {
        expect(getShiftValue({
            shiftNames: ['Directory'],
            allocations: [{ name: 'Detail' }],
            shift: 'Legacy',
        })).toBe('Directory');
    });

    it('skips unpopulated allocation ids rather than rendering objects', () => {
        expect(getShiftValue({ allocations: ['64f0a1b2c3d4e5f6a7b8c9d0'], shift: 'Fallback' }))
            .toBe('Fallback');
    });

    it('drops blank entries inside shiftNames', () => {
        expect(getShiftValue({ shiftNames: ['First', '', 'Third'] })).toBe('First, Third');
    });

    it('falls through when shiftNames is present but entirely empty', () => {
        expect(getShiftValue({ shiftNames: [], shift: 'Legacy' })).toBe('Legacy');
    });

    it('returns empty string when nothing is allocated', () => {
        expect(getShiftValue({})).toBe('');
    });
});

describe('getSeatValue', () => {
    it('reads a flat seatNumber', () => {
        expect(getSeatValue({ seatNumber: 12 })).toBe('12');
    });

    it('reads seatNumber from a populated seat object', () => {
        expect(getSeatValue({ seat: { seatNumber: 7 } })).toBe('7');
    });

    it('returns empty string for an unpopulated seat id', () => {
        expect(getSeatValue({ seat: '64f0a1b2c3d4e5f6a7b8c9d0' })).toBe('');
    });

    it('returns empty string when unallocated', () => {
        expect(getSeatValue({})).toBe('');
        expect(getSeatValue({ seatNumber: null })).toBe('');
    });

    it('treats seat 0 as unallocated, matching how the API marks free seats', () => {
        expect(getSeatValue({ seatNumber: 0 })).toBe('');
    });
});
