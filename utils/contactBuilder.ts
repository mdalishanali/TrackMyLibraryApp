import * as Contacts from 'expo-contacts';

import { Student } from '@/types/api';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { getFloorValue, getSeatValue, getShiftValue } from '@/utils/student-fields';

/**
 * contactBuilder.ts
 *
 * Maps a Student record to an expo-contacts contact payload.
 *
 * WHY THIS EXISTS:
 *   Students' numbers are not in the owner's phonebook, so an incoming call shows
 *   only a raw number and WhatsApp's share sheet cannot find the student at all.
 *   Saving a rich contact fixes both — the owner sees who is calling and from which
 *   seat, and the student becomes reachable from any share sheet.
 *
 * PRIVACY:
 *   aadhaarNumber is DELIBERATELY excluded. Phone contacts sync to Google/iCloud,
 *   so writing Aadhaar here would push sensitive government ID off-device and
 *   outside the app's control. It stays visible in-app only.
 */

const INDIA_COUNTRY_CODE = '91';
const INDIA_LOCAL_LENGTH = 10;
const NOTE_SIGNATURE = 'TrackMyLibrary';

/** Digits-only, then prefix +91 for bare 10-digit Indian mobiles. */
export const toDisplayPhone = (raw?: string): string => {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (!digits) return '';

    const local = digits.length === INDIA_LOCAL_LENGTH + 1 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

    if (local.length === INDIA_LOCAL_LENGTH) return `+${INDIA_COUNTRY_CODE}${local}`;
    return local.startsWith('+') ? local : `+${local}`;
};

/**
 * Comparison key for duplicate detection — the last 10 digits.
 * Matches "+919876543210", "919876543210" and "09876543210" to the same student,
 * which is how the same number realistically appears across a phonebook.
 */
export const toPhoneKey = (raw?: string): string => {
    const digits = String(raw ?? '').replace(/\D/g, '');
    return digits.slice(-INDIA_LOCAL_LENGTH);
};

// Seat / floor / shift readers live in utils/student-fields.ts — the same fallback
// chains are needed by the student summary UI, and the two copies had already drifted.

/** Daily timing window(s), e.g. "07:00 AM - 12:00 PM". */
const getTimingLabel = (student: Student): string => {
    const slots = (student.time ?? []).filter((slot) => slot?.start && slot?.end);
    return slots.map((slot) => `${formatTime(slot.start)} - ${formatTime(slot.end)}`).join(', ');
};

/**
 * Contact display name. Seat is appended so a ringing phone answers
 * "who is this AND where do they sit" in one glance.
 */
export const buildContactName = (student: Student): string => {
    const name = (student.name ?? '').trim() || 'Student';
    const seat = getSeatValue(student);
    return seat ? `${name} (Seat ${seat})` : name;
};

/**
 * Job title — the line iOS and Android both render directly under the contact name,
 * so it carries the two things worth knowing at a glance: seat and shift.
 */
const buildJobTitle = (student: Student): string => {
    const seat = getSeatValue(student);
    const floor = getFloorValue(student);
    const shift = getShiftValue(student);

    const parts = [
        seat ? `Seat ${seat}` : '',
        floor,
        shift,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' · ') : 'Student';
};

/**
 * Remaining details as label/value pairs.
 *
 * WHY instantMessageAddresses:
 *   - `note` is gated behind Apple's com.apple.developer.contacts.notes entitlement;
 *     merely requesting the field fails the whole save with CNErrorDomain 102.
 *   - `urlAddresses` is a URL field: iOS rewrites plain text into "file:///My%20Text",
 *     which is unreadable.
 *   This field is the only unrestricted one whose `service`/`username` are BOTH plain
 *   strings, so a label and its value survive verbatim on the contact card.
 *
 * Trailing whitespace is stripped because free-text notes often end in a newline,
 * which iOS would otherwise render as an escape sequence.
 */
const buildDetailEntries = (
    student: Student
): { service: string; username: string }[] => {
    const entries: { label: string; value: string | number | undefined }[] = [
        { label: 'Timing', value: getTimingLabel(student) },
        { label: 'Father', value: student.fatherName },
        { label: 'Preparing for', value: student.preparationFor },
        { label: 'Joined', value: student.joiningDate ? formatDate(student.joiningDate) : '' },
        { label: 'Fees', value: student.fees ? formatCurrency(student.fees) : '' },
        { label: 'Status', value: student.status },
        { label: 'Notes', value: student.notes },
    ];

    return entries
        .map((entry) => ({ label: entry.label, value: String(entry.value ?? '').trim() }))
        .filter((entry) => entry.value.length > 0)
        .map((entry) => ({ service: entry.label, username: entry.value }));
};

/**
 * Build the expo-contacts payload for a student.
 *
 * @param args.student      - Student record (may be partially populated)
 * @param args.businessName - Library name, used as the contact's company
 * @returns A contact ready for addContactAsync / updateContactAsync
 */
export const buildStudentContact = ({
    student,
    businessName,
}: {
    student: Student;
    businessName: string;
}): Contacts.Contact => {
    const phone = toDisplayPhone(student.number);

    const details = buildDetailEntries(student);

    const contact = {
        [Contacts.Fields.ContactType]: Contacts.ContactTypes.Person,
        [Contacts.Fields.Name]: buildContactName(student),
        [Contacts.Fields.FirstName]: buildContactName(student),
        [Contacts.Fields.Company]: businessName || undefined,
        [Contacts.Fields.JobTitle]: buildJobTitle(student),
        [Contacts.Fields.Department]: NOTE_SIGNATURE,
        [Contacts.Fields.PhoneNumbers]: phone
            ? [{ label: 'mobile', number: phone, isPrimary: true }]
            : undefined,
        [Contacts.Fields.Addresses]: student.address
            ? [{ label: 'home', street: student.address }]
            : undefined,
        [Contacts.Fields.InstantMessageAddresses]: details.length > 0 ? details : undefined,
        // Note is DELIBERATELY absent — iOS requires Apple's contacts.notes
        // entitlement for it, and requesting the field fails the entire save.
        // UrlAddresses is avoided too: it mangles plain text into "file:///a%20b".
        // profilePicture is absent: expo-contacts' Image field needs a LOCAL uri,
        // and downloading every avatar would stall a 200-student bulk run.
    };

    return contact as unknown as Contacts.Contact;
};
