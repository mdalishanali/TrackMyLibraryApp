import { Student } from '@/types/api';
import { buildContactName, buildStudentContact, toDisplayPhone, toPhoneKey } from '@/utils/contactBuilder';

/**
 * expo-contacts is a native module; only its Fields/ContactTypes enums are needed to
 * build a payload, so they're stubbed with the real string values the library uses.
 */
jest.mock('expo-contacts', () => ({
    Fields: {
        ContactType: 'contactType',
        Name: 'name',
        FirstName: 'firstName',
        LastName: 'lastName',
        Company: 'company',
        JobTitle: 'jobTitle',
        Department: 'department',
        Note: 'note',
        PhoneNumbers: 'phoneNumbers',
        Addresses: 'addresses',
        UrlAddresses: 'urlAddresses',
        InstantMessageAddresses: 'instantMessageAddresses',
        Image: 'image',
    },
    ContactTypes: { Person: 'person', Company: 'company' },
}));

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
    _id: 's1',
    name: 'Rahul Sharma',
    number: '9876543210',
    ...overrides,
} as Student);

const BUSINESS = 'City Study Library';

const build = (student: Student) =>
    buildStudentContact({ student, businessName: BUSINESS }) as unknown as Record<string, any>;

describe('toDisplayPhone', () => {
    it.each([
        ['9876543210', '+919876543210'],
        ['09876543210', '+919876543210'],
        ['+91 98765-43210', '+919876543210'],
        ['98765 43210', '+919876543210'],
    ])('normalizes %s to %s', (input, expected) => {
        expect(toDisplayPhone(input)).toBe(expected);
    });

    it('returns empty string for missing input', () => {
        expect(toDisplayPhone(undefined)).toBe('');
        expect(toDisplayPhone('')).toBe('');
    });
});

describe('toPhoneKey — duplicate detection', () => {
    it('maps every realistic format of one number to the SAME key', () => {
        const keys = ['9876543210', '09876543210', '+919876543210', '919876543210', '+91 98765-43210']
            .map(toPhoneKey);

        expect(new Set(keys).size).toBe(1);
        expect(keys[0]).toBe('9876543210');
    });

    it('gives different students different keys', () => {
        expect(toPhoneKey('9876543210')).not.toBe(toPhoneKey('9876543211'));
    });
});

describe('buildContactName', () => {
    it('appends the seat so a ringing phone identifies where they sit', () => {
        expect(buildContactName(makeStudent({ seatNumber: 12 }))).toBe('Rahul Sharma (Seat 12)');
    });

    it('omits the seat when unallocated', () => {
        expect(buildContactName(makeStudent())).toBe('Rahul Sharma');
    });

    it('falls back to a placeholder rather than an empty contact name', () => {
        expect(buildContactName(makeStudent({ name: '   ' }))).toBe('Student');
    });

    it('preserves Devanagari names', () => {
        expect(buildContactName(makeStudent({ name: 'Rahul शर्मा', seatNumber: 6 })))
            .toBe('Rahul शर्मा (Seat 6)');
    });
});

describe('buildStudentContact — job title', () => {
    it('carries seat, section and shift on the line phones show under the name', () => {
        const contact = build(makeStudent({
            seatNumber: 12,
            floor: '1st Floor',
            allocations: [{ name: 'Morning' }] as any,
        }));

        expect(contact.jobTitle).toBe('Seat 12 · 1st Floor · Morning');
    });

    it('falls back to "Student" when nothing is allocated', () => {
        expect(build(makeStudent()).jobTitle).toBe('Student');
    });

    it('reads floorNumber, which is what the directory endpoint projects', () => {
        const contact = build(makeStudent({ seatNumber: 3, floorNumber: 'Main Hall' } as any));
        expect(contact.jobTitle).toBe('Seat 3 · Main Hall');
    });
});

describe('buildStudentContact — shift shapes', () => {
    it('reads shiftNames from the directory endpoint', () => {
        const contact = build(makeStudent({ shiftNames: ['First', 'Second'] } as any));
        expect(contact.jobTitle).toContain('First, Second');
    });

    it('reads populated allocations from detail responses', () => {
        const contact = build(makeStudent({ allocations: [{ name: 'Evening' }] as any }));
        expect(contact.jobTitle).toContain('Evening');
    });

    it('falls back to the legacy denormalised shift string', () => {
        const contact = build(makeStudent({ shift: 'Night' }));
        expect(contact.jobTitle).toContain('Night');
    });

    it('prefers shiftNames over the legacy field when both exist', () => {
        const contact = build(makeStudent({ shiftNames: ['First'], shift: 'Stale' } as any));
        expect(contact.jobTitle).toContain('First');
        expect(contact.jobTitle).not.toContain('Stale');
    });
});

describe('buildStudentContact — detail entries', () => {
    const findEntry = (contact: Record<string, any>, label: string) =>
        (contact.instantMessageAddresses ?? []).find((e: any) => e.service === label);

    it('writes label/value pairs, not URLs', () => {
        const contact = build(makeStudent({ status: 'Active' }));

        // urlAddresses would be rewritten by iOS into "file:///Active"
        expect(contact.urlAddresses).toBeUndefined();
        expect(findEntry(contact, 'Status').username).toBe('Active');
    });

    it('omits empty fields instead of writing blank rows', () => {
        const contact = build(makeStudent({ fatherName: '', preparationFor: undefined }));

        expect(findEntry(contact, 'Father')).toBeUndefined();
        expect(findEntry(contact, 'Preparing for')).toBeUndefined();
    });

    it('strips trailing whitespace so notes do not render as escape sequences', () => {
        const contact = build(makeStudent({ notes: 'Front row\n' }));
        expect(findEntry(contact, 'Notes').username).toBe('Front row');
    });

    it('drops a whitespace-only value entirely', () => {
        const contact = build(makeStudent({ notes: '   \n  ' }));
        expect(findEntry(contact, 'Notes')).toBeUndefined();
    });

    it('formats fees as currency and the joining date as DD-Mon-YYYY', () => {
        const contact = build(makeStudent({ fees: 1000, joiningDate: '2026-07-20' }));

        expect(findEntry(contact, 'Fees').username).toContain('1,000');
        expect(findEntry(contact, 'Joined').username).toBe('20-Jul-2026');
    });

    it('renders the timing window in 12-hour form', () => {
        const contact = build(makeStudent({ time: [{ start: '07:00', end: '12:00' }] }));
        expect(findEntry(contact, 'Timing').username).toBe('07:00 AM - 12:00 PM');
    });
});

describe('buildStudentContact — privacy and platform constraints', () => {
    const fullStudent = makeStudent({
        aadhaarNumber: '1234-5678-9012',
        profilePicture: 'https://cdn.example.com/avatar.jpg',
        address: 'Ganga Nagar, Patna',
        fatherName: 'Ramesh Sharma',
        notes: 'Front row',
        fees: 1000,
        status: 'Active',
    });

    it('NEVER writes aadhaarNumber — contacts sync to Google/iCloud', () => {
        expect(JSON.stringify(build(fullStudent))).not.toContain('1234');
    });

    it('NEVER writes note — iOS fails the whole save without Apple\'s entitlement', () => {
        expect(build(fullStudent).note).toBeUndefined();
    });

    it('NEVER writes image — the field needs a local uri, not a remote URL', () => {
        expect(build(fullStudent).image).toBeUndefined();
    });

    it('still writes the phone number and address', () => {
        const contact = build(fullStudent);

        expect(contact.phoneNumbers).toEqual([
            { label: 'mobile', number: '+919876543210', isPrimary: true },
        ]);
        expect(contact.addresses).toEqual([{ label: 'home', street: 'Ganga Nagar, Patna' }]);
    });

    it('omits phoneNumbers rather than writing an empty entry', () => {
        expect(build(makeStudent({ number: '' })).phoneNumbers).toBeUndefined();
    });
});
