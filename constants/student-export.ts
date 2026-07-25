/**
 * student-export.ts
 *
 * Column and audience choices offered by the export options sheet.
 *
 * The keys here MUST match `STUDENT_CSV_COLUMNS[].key` on the server — that array
 * is the source of truth for what a column means, and this file only decides how
 * the choices are labelled and grouped for the picker. An unknown key is dropped
 * server-side rather than producing an empty column, so a mismatch degrades to a
 * missing column instead of a broken file.
 */

export type StudentAudience = 'all' | 'active' | 'inactive';

export type ColumnPreset = 'standard' | 'all' | 'custom';

export interface AudienceOption {
    value: StudentAudience;
    label: string;
    description: string;
}

export const AUDIENCE_OPTIONS: AudienceOption[] = [
    { value: 'all', label: 'All students', description: 'Active and inactive' },
    { value: 'active', label: 'Active only', description: 'Currently studying' },
    { value: 'inactive', label: 'Inactive only', description: 'Left the library' },
];

export interface ExportColumn {
    key: string;
    label: string;
}

/** Every column the server can emit, in the order it emits them. */
export const EXPORT_COLUMNS: ExportColumn[] = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'fatherName', label: 'Father Name' },
    { key: 'number', label: 'Phone Number' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'preparationFor', label: 'Preparation For' },
    { key: 'seatNumber', label: 'Seat Number' },
    { key: 'floor', label: 'Floor' },
    { key: 'shift', label: 'Shift' },
    { key: 'fees', label: 'Monthly Fees' },
    { key: 'joiningDate', label: 'Joining Date' },
    { key: 'status', label: 'Status' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'lastPaymentDate', label: 'Last Payment Date' },
    { key: 'nextDueDate', label: 'Next Due Date' },
    { key: 'dueAmount', label: 'Due Amount' },
];

/**
 * The everyday export: who they are, where they sit, and what they owe.
 * Mirrors STANDARD_COLUMN_KEYS on the server.
 */
export const STANDARD_COLUMN_KEYS = [
    'name',
    'number',
    'seatNumber',
    'shift',
    'fees',
    'joiningDate',
    'paymentStatus',
    'dueAmount',
];

export const ALL_COLUMN_KEYS = EXPORT_COLUMNS.map((column) => column.key);

/** A custom selection with nothing ticked would produce a file with no data. */
export const MIN_SELECTED_COLUMNS = 1;
