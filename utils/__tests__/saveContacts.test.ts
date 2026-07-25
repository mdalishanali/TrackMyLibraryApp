import * as Contacts from 'expo-contacts';

import { Student } from '@/types/api';
import { countRosterMatches, saveStudentContact, saveStudentContactsBulk } from '@/utils/saveContacts';

jest.mock('expo-contacts', () => ({
    Fields: {
        ContactType: 'contactType',
        Name: 'name',
        FirstName: 'firstName',
        LastName: 'lastName',
        Company: 'company',
        JobTitle: 'jobTitle',
        Department: 'department',
        PhoneNumbers: 'phoneNumbers',
        Addresses: 'addresses',
        UrlAddresses: 'urlAddresses',
        InstantMessageAddresses: 'instantMessageAddresses',
    },
    ContactTypes: { Person: 'person' },
    getContactsAsync: jest.fn(),
    getContactByIdAsync: jest.fn(),
    addContactAsync: jest.fn(),
    updateContactAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
}));

const mocked = Contacts as jest.Mocked<typeof Contacts>;

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
    _id: 's1',
    name: 'Rahul Sharma',
    number: '9876543210',
    ...overrides,
} as Student);

/** Seed the phonebook the code will read when building its duplicate index. */
const givenPhonebook = (contacts: { id: string; number: string }[]) => {
    mocked.getContactsAsync.mockResolvedValue({
        data: contacts.map((c) => ({ id: c.id, phoneNumbers: [{ number: c.number }] })),
    } as any);
};

beforeEach(() => {
    givenPhonebook([]);
    mocked.addContactAsync.mockResolvedValue('new-id');
    mocked.updateContactAsync.mockResolvedValue('existing-id' as any);
    mocked.getContactByIdAsync.mockResolvedValue({ id: 'existing-id', name: 'Old Name' } as any);

    // The failure-path tests deliberately trigger the service's own error logging;
    // silencing it keeps a passing run clean so real problems stay visible.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('saveStudentContact — create vs update', () => {
    it('creates when the number is not in the phonebook', async () => {
        const outcome = await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(outcome).toBe('created');
        expect(mocked.addContactAsync).toHaveBeenCalledTimes(1);
        expect(mocked.updateContactAsync).not.toHaveBeenCalled();
    });

    it('updates instead of creating a second entry when the number already exists', async () => {
        givenPhonebook([{ id: 'existing-id', number: '+919876543210' }]);

        const outcome = await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(outcome).toBe('updated');
        expect(mocked.addContactAsync).not.toHaveBeenCalled();
        expect(mocked.updateContactAsync).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['bare 10-digit', '9876543210'],
        ['leading zero', '09876543210'],
        ['E.164', '+919876543210'],
        ['formatted', '+91 98765-43210'],
    ])('matches an existing contact stored as %s', async (_label, stored) => {
        givenPhonebook([{ id: 'existing-id', number: stored }]);

        const outcome = await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(outcome).toBe('updated');
    });

    it('re-fetches with the write set before updating, or iOS raises a native crash', async () => {
        givenPhonebook([{ id: 'existing-id', number: '9876543210' }]);

        await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(mocked.getContactByIdAsync).toHaveBeenCalledWith(
            'existing-id',
            expect.arrayContaining(['name', 'phoneNumbers', 'instantMessageAddresses'])
        );
    });

    it('never re-fetches the entitlement-gated note field', async () => {
        givenPhonebook([{ id: 'existing-id', number: '9876543210' }]);

        await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        const [, fields] = mocked.getContactByIdAsync.mock.calls[0];
        expect(fields).not.toContain('note');
    });

    it('clears the file:///-mangled url entries an earlier version wrote', async () => {
        givenPhonebook([{ id: 'existing-id', number: '9876543210' }]);
        mocked.getContactByIdAsync.mockResolvedValue({
            id: 'existing-id',
            urlAddresses: [{ label: 'Library', url: 'file:///Old%20Library' }],
        } as any);

        await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(mocked.updateContactAsync).toHaveBeenCalledWith(
            expect.objectContaining({ urlAddresses: [] })
        );
    });
});

describe('saveStudentContact — updateOnly (the edit flow)', () => {
    it('refreshes a contact that already exists', async () => {
        givenPhonebook([{ id: 'existing-id', number: '9876543210' }]);

        const outcome = await saveStudentContact({
            student: makeStudent(),
            businessName: 'Lib',
            updateOnly: true,
        });

        expect(outcome).toBe('updated');
        expect(mocked.updateContactAsync).toHaveBeenCalledTimes(1);
    });

    it('skips a student who was never saved — editing is not consent to add them', async () => {
        givenPhonebook([]);

        const outcome = await saveStudentContact({
            student: makeStudent(),
            businessName: 'Lib',
            updateOnly: true,
        });

        expect(outcome).toBe('skipped');
        expect(mocked.addContactAsync).not.toHaveBeenCalled();
        expect(mocked.updateContactAsync).not.toHaveBeenCalled();
    });

    it('still creates when updateOnly is not set', async () => {
        givenPhonebook([]);

        const outcome = await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(outcome).toBe('created');
    });
});

describe('saveStudentContact — failure paths', () => {
    it('fails without calling the native layer when the number is unusable', async () => {
        const outcome = await saveStudentContact({
            student: makeStudent({ number: 'not-a-number' }),
            businessName: 'Lib',
        });

        expect(outcome).toBe('failed');
        expect(mocked.addContactAsync).not.toHaveBeenCalled();
    });

    it('reports failure instead of throwing when the native write rejects', async () => {
        mocked.addContactAsync.mockRejectedValue(new Error('Unauthorized Keys'));

        await expect(
            saveStudentContact({ student: makeStudent(), businessName: 'Lib' })
        ).resolves.toBe('failed');
    });

    it('reports failure when the contact vanished between index and update', async () => {
        givenPhonebook([{ id: 'gone', number: '9876543210' }]);
        mocked.getContactByIdAsync.mockResolvedValue(undefined);

        const outcome = await saveStudentContact({ student: makeStudent(), businessName: 'Lib' });

        expect(outcome).toBe('failed');
        expect(mocked.updateContactAsync).not.toHaveBeenCalled();
    });
});

describe('saveStudentContactsBulk', () => {
    const roster = [
        makeStudent({ _id: 'a', name: 'Aryan', number: '9000000001' }),
        makeStudent({ _id: 'b', name: 'Bhavna', number: '9000000002' }),
        makeStudent({ _id: 'c', name: 'Chetan', number: '9000000003' }),
    ];

    it('reads the phonebook ONCE, not once per student', async () => {
        await saveStudentContactsBulk({ students: roster, businessName: 'Lib' });

        expect(mocked.getContactsAsync).toHaveBeenCalledTimes(1);
    });

    it('tallies created and updated separately', async () => {
        givenPhonebook([{ id: 'existing-id', number: '9000000002' }]);

        const result = await saveStudentContactsBulk({ students: roster, businessName: 'Lib' });

        expect(result).toMatchObject({ created: 2, updated: 1, failed: 0, total: 3 });
    });

    it('keeps going after one student fails, and names the casualty', async () => {
        mocked.addContactAsync
            .mockResolvedValueOnce('id-a')
            .mockRejectedValueOnce(new Error('native failure'))
            .mockResolvedValueOnce('id-c');

        const result = await saveStudentContactsBulk({ students: roster, businessName: 'Lib' });

        expect(result).toMatchObject({ created: 2, failed: 1 });
        expect(result.failedNames).toEqual(['Bhavna']);
    });

    it('reports progress after every student so the UI can show a bar', async () => {
        const onProgress = jest.fn();

        await saveStudentContactsBulk({ students: roster, businessName: 'Lib', onProgress });

        expect(onProgress).toHaveBeenCalledTimes(3);
        expect(onProgress).toHaveBeenLastCalledWith(3, 3);
    });

    it('keeps every tally a real number, never NaN', async () => {
        givenPhonebook([{ id: 'existing-id', number: '9000000002' }]);

        const result = await saveStudentContactsBulk({ students: roster, businessName: 'Lib' });

        [result.created, result.updated, result.failed, result.total].forEach((count) => {
            expect(Number.isFinite(count)).toBe(true);
        });
        expect(result.created + result.updated + result.failed).toBe(result.total);
    });

    it('returns an empty tally for an empty roster without touching contacts', async () => {
        const result = await saveStudentContactsBulk({ students: [], businessName: 'Lib' });

        expect(result).toMatchObject({ created: 0, updated: 0, failed: 0, total: 0 });
        expect(mocked.getContactsAsync).not.toHaveBeenCalled();
    });

    it('does not create a duplicate for two students sharing one number', async () => {
        const twins = [
            makeStudent({ _id: 'a', name: 'Aryan', number: '9000000001' }),
            makeStudent({ _id: 'b', name: 'Aryan Again', number: '9000000001' }),
        ];

        const result = await saveStudentContactsBulk({ students: twins, businessName: 'Lib' });

        expect(result).toMatchObject({ created: 1, updated: 1 });
    });
});

describe('countRosterMatches', () => {
    it('splits the roster into already-saved and new', async () => {
        givenPhonebook([{ id: 'x', number: '9000000002' }]);

        const match = await countRosterMatches([
            makeStudent({ _id: 'a', number: '9000000001' }),
            makeStudent({ _id: 'b', number: '9000000002' }),
        ]);

        expect(match).toEqual({ alreadySaved: 1, newContacts: 1 });
    });

    it('counts nothing as saved against an empty phonebook', async () => {
        const match = await countRosterMatches([makeStudent()]);
        expect(match).toEqual({ alreadySaved: 0, newContacts: 1 });
    });

    it('treats a student with no usable number as new, never as saved', async () => {
        givenPhonebook([{ id: 'x', number: '9000000002' }]);

        const match = await countRosterMatches([makeStudent({ number: '' })]);

        expect(match).toEqual({ alreadySaved: 0, newContacts: 1 });
    });
});
