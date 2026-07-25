import * as Contacts from 'expo-contacts';

import { Student } from '@/types/api';
import { buildStudentContact, toPhoneKey } from '@/utils/contactBuilder';

/**
 * saveContacts.ts
 *
 * Writes students into the device phonebook — one at a time or in bulk.
 *
 * DESIGN NOTES:
 *   - Permission is requested ONCE for the whole phonebook, so a bulk run needs no
 *     per-student prompt.
 *   - Duplicates are resolved by phone number (last 10 digits), not by name: a
 *     renamed or re-seated student must UPDATE its existing contact rather than
 *     create a second one. Re-running bulk save is therefore idempotent.
 *   - A single student's failure never aborts a bulk run; failures are counted and
 *     reported so the owner knows exactly what happened.
 */

export type SaveOutcome = 'created' | 'updated' | 'failed' | 'skipped';

export type BulkSaveResult = {
    created: number;
    updated: number;
    failed: number;
    total: number;
    /** Names of students whose contact could not be written, for a retry prompt. */
    failedNames: string[];
};

/** How many students already exist in the phonebook, shown before any write. */
export type RosterMatch = {
    alreadySaved: number;
    newContacts: number;
};

/** Phone-number → existing contact id, built once per bulk run. */
type ContactIndex = Map<string, string>;

/**
 * Ask for phonebook write access.
 * @returns true when granted — callers must fall back gracefully when false.
 */
export const requestContactsPermission = async (): Promise<boolean> => {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
};

/**
 * Every field we write. Two iOS rules force this list to be exact:
 *   1. Assigning a property that was NOT fetched raises CNPropertyNotFetchedException
 *      — a native crash a JS try/catch cannot intercept. So an update must re-fetch
 *      with this set; the cheap phone-only index is not enough.
 *   2. `Note` must NEVER appear here. iOS gates it behind the
 *      com.apple.developer.contacts.notes entitlement and rejects the whole fetch
 *      with CNErrorDomain 102 "Unauthorized Keys" — failing every save.
 */
const WRITABLE_FIELDS = [
    Contacts.Fields.Name,
    Contacts.Fields.FirstName,
    Contacts.Fields.LastName,
    Contacts.Fields.Company,
    Contacts.Fields.JobTitle,
    Contacts.Fields.Department,
    Contacts.Fields.PhoneNumbers,
    Contacts.Fields.Addresses,
    Contacts.Fields.InstantMessageAddresses,
    // Kept only so a re-save can CLEAR the file:///-mangled url entries written by
    // an earlier version. Nothing writes urlAddresses any more.
    Contacts.Fields.UrlAddresses,
];

/**
 * Index every phonebook entry by phone number so duplicate checks are O(1).
 * One read of the whole phonebook beats one lookup per student — a 200-student
 * bulk run would otherwise make 200 separate queries.
 */
const buildContactIndex = async (): Promise<ContactIndex> => {
    const index: ContactIndex = new Map();

    const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
    });

    data.forEach((contact) => {
        (contact.phoneNumbers ?? []).forEach((entry) => {
            const key = toPhoneKey(entry.number);
            if (key && contact.id && !index.has(key)) {
                index.set(key, contact.id);
            }
        });
    });

    return index;
};

/**
 * Overwrite an existing contact with the student's details.
 *
 * The re-fetch is mandatory, not defensive: iOS backs CNMutableContact by the
 * fetched property set, and assigning an unfetched property raises a NATIVE
 * exception that a JS try/catch cannot intercept — it terminates the app.
 */
const updateExistingContact = async (
    contactId: string,
    contact: Contacts.Contact
): Promise<SaveOutcome> => {
    const existing = await Contacts.getContactByIdAsync(contactId, WRITABLE_FIELDS);
    if (!existing) return 'failed';

    await Contacts.updateContactAsync({
        ...existing,
        ...contact,
        // Drop the "file:///My%20Text" url entries an earlier version wrote. Without
        // this the spread above would preserve them, since nothing overwrites the key.
        urlAddresses: [],
        id: contactId,
    });

    return 'updated';
};

/**
 * Create or update one student's contact.
 *
 * @param args.student       - Student to save
 * @param args.businessName  - Library name for the contact's company field
 * @param args.existingIndex - Optional pre-built index (bulk path); built on demand otherwise
 * @param args.updateOnly    - Refresh an existing contact but never create one. Used by
 *        the edit flow: a student whose seat changed should have their contact corrected,
 *        but editing a student is not consent to add them to the phonebook.
 */
export const saveStudentContact = async ({
    student,
    businessName,
    existingIndex,
    updateOnly = false,
}: {
    student: Student;
    businessName: string;
    existingIndex?: ContactIndex;
    updateOnly?: boolean;
}): Promise<SaveOutcome> => {
    const phoneKey = toPhoneKey(student.number);
    if (!phoneKey) return 'failed';

    const index = existingIndex ?? (await buildContactIndex());
    const existingId = index.get(phoneKey);

    if (!existingId && updateOnly) return 'skipped';

    const contact = buildStudentContact({ student, businessName });

    try {
        if (existingId) {
            return await updateExistingContact(existingId, contact);
        }

        const newId = await Contacts.addContactAsync(contact);
        if (newId) index.set(phoneKey, newId);
        return 'created';
    } catch (error) {
        console.error('[saveContacts] Failed for student:', student._id, error);
        return 'failed';
    }
};

/**
 * Save many students, reporting progress as it goes.
 *
 * Sequential by design: phonebook writes are IO-bound native calls, and firing
 * hundreds concurrently makes iOS drop writes silently.
 *
 * @param args.students     - Students to save (already filtered by the caller)
 * @param args.businessName - Library name for the contact's company field
 * @param args.onProgress   - Called after each student with (done, total)
 */
export const saveStudentContactsBulk = async ({
    students,
    businessName,
    onProgress,
}: {
    students: Student[];
    businessName: string;
    onProgress?: (done: number, total: number) => void;
}): Promise<BulkSaveResult> => {
    const total = students.length;
    const result: BulkSaveResult = {
        created: 0,
        updated: 0,
        failed: 0,
        total,
        failedNames: [],
    };

    if (total === 0) return result;

    const index = await buildContactIndex();

    for (let i = 0; i < total; i += 1) {
        const student = students[i];
        const outcome = await saveStudentContact({ student, businessName, existingIndex: index });

        // 'skipped' is unreachable here — bulk never passes updateOnly — but tallying by
        // key would silently produce NaN if that ever changed.
        if (outcome === 'created') result.created += 1;
        else if (outcome === 'updated') result.updated += 1;
        else if (outcome === 'failed') {
            result.failed += 1;
            result.failedNames.push(student.name || 'Unnamed student');
        }

        onProgress?.(i + 1, total);
    }

    return result;
};

/**
 * Count how many of these students are already in the phonebook.
 *
 * Shown before the owner commits, so "200 students" doesn't imply 200 new entries
 * when most are already saved. Read-only — needs permission but writes nothing.
 */
export const countRosterMatches = async (students: Student[]): Promise<RosterMatch> => {
    const index = await buildContactIndex();

    const alreadySaved = students.filter((student) => {
        const key = toPhoneKey(student.number);
        return Boolean(key) && index.has(key);
    }).length;

    return { alreadySaved, newContacts: students.length - alreadySaved };
};
