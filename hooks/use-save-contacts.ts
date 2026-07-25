import { useCallback, useEffect, useRef, useState } from 'react';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { showToast } from '@/lib/toast';
import { Student } from '@/types/api';
import {
    BulkSaveResult,
    countRosterMatches,
    RosterMatch,
    requestContactsPermission,
    saveStudentContact,
    saveStudentContactsBulk,
} from '@/utils/saveContacts';

/**
 * use-save-contacts.ts
 *
 * UI-facing wrapper around the contact-save service: resolves the library name,
 * owns permission prompting, progress state and user feedback.
 *
 * Every path here is non-throwing — saving contacts is a convenience, so a denied
 * permission or a native failure must surface a message, never break the screen.
 */

export type BulkProgress = { done: number; total: number };

const PERMISSION_DENIED_MESSAGE = 'Contacts permission is needed to save students';

/** Matches the server's own cache window for this endpoint. */
const ROSTER_STALE_MS = 60_000;

/**
 * Fetch every student worth saving — active AND inactive.
 *
 * Uses the dedicated /students/directory endpoint rather than GET /students: the
 * latter powers the dashboard and joins `payments` on every call (~1200 extra docs
 * for a 200-student library) before computing dues and overdue days, none of which a
 * contact card uses. The directory endpoint is status-agnostic, so this is ONE call
 * instead of the two-and-merge the dashboard endpoint's Active-only filter required.
 *
 * @param isEnabled - Gate the fetch so opening a screen doesn't pull the roster.
 */
export const useContactStudentsQuery = (isEnabled: boolean) =>
    useQuery({
        queryKey: ['students', 'contact-roster'],
        enabled: isEnabled,
        staleTime: ROSTER_STALE_MS,
        queryFn: async (): Promise<Student[]> => {
            const { data } = await api.get('/students/directory');
            const students = (data?.students ?? []) as Student[];
            return students.filter((student) => Boolean(student.number));
        },
    });

/**
 * How many of these students are already in the phonebook.
 *
 * Runs ONLY when access is already granted — reading the phonebook to show a
 * preview must never be the thing that triggers the permission prompt. Returns
 * null when unknown, and callers simply omit the hint.
 */
export const useRosterMatch = (students: Student[], isEnabled: boolean) => {
    const [match, setMatch] = useState<RosterMatch | null>(null);

    // Depend on a stable signature, not the array itself: callers pass a `data = []`
    // default that is a fresh reference every render, which would re-run this forever.
    const rosterKey = students.map((student) => student._id).join(',');
    const rosterRef = useRef(students);
    rosterRef.current = students;

    useEffect(() => {
        if (!isEnabled || rosterKey.length === 0) {
            setMatch(null);
            return;
        }

        let isActive = true;

        const check = async () => {
            try {
                const { status } = await Contacts.getPermissionsAsync();
                if (status !== 'granted') return;

                const result = await countRosterMatches(rosterRef.current);
                if (isActive) setMatch(result);
            } catch (error) {
                console.error('[useRosterMatch] Count failed:', error);
            }
        };

        check();
        return () => {
            isActive = false;
        };
    }, [isEnabled, rosterKey]);

    return match;
};

export const useSaveContacts = () => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [progress, setProgress] = useState<BulkProgress | null>(null);
    const [result, setResult] = useState<BulkSaveResult | null>(null);

    const businessName =
        typeof user?.company === 'object'
            ? ((user.company as { businessName?: string })?.businessName ?? '')
            : '';

    /** Save one student. Returns true when the contact was written. */
    const saveOne = useCallback(
        async (student: Student): Promise<boolean> => {
            if (isSaving) return false;

            try {
                setIsSaving(true);

                const isGranted = await requestContactsPermission();
                if (!isGranted) {
                    showToast(PERMISSION_DENIED_MESSAGE, 'error');
                    return false;
                }

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const outcome = await saveStudentContact({ student, businessName });

                if (outcome === 'failed') {
                    showToast('Could not save contact', 'error');
                    return false;
                }

                showToast(
                    outcome === 'updated' ? 'Contact updated' : 'Saved to contacts',
                    'success',
                    `${student.name} is now in your phonebook`
                );
                return true;
            } catch (error) {
                console.error('[useSaveContacts] saveOne failed:', error);
                showToast('Could not save contact', 'error');
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [businessName, isSaving]
    );

    /** Save many students, tracking progress. Returns the tally, or null on failure. */
    const saveMany = useCallback(
        async (students: Student[]): Promise<BulkSaveResult | null> => {
            if (isSaving) return null;

            if (students.length === 0) {
                showToast('No students to save', 'info');
                return null;
            }

            try {
                setIsSaving(true);
                setResult(null);
                setProgress({ done: 0, total: students.length });

                const isGranted = await requestContactsPermission();
                if (!isGranted) {
                    showToast(PERMISSION_DENIED_MESSAGE, 'error');
                    setProgress(null);
                    return null;
                }

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                const bulkResult = await saveStudentContactsBulk({
                    students,
                    businessName,
                    onProgress: (done, total) => setProgress({ done, total }),
                });

                setResult(bulkResult);
                return bulkResult;
            } catch (error) {
                console.error('[useSaveContacts] saveMany failed:', error);
                showToast('Could not save contacts', 'error');
                return null;
            } finally {
                setIsSaving(false);
                setProgress(null);
            }
        },
        [businessName, isSaving]
    );

    const clearResult = useCallback(() => setResult(null), []);

    return { isSaving, progress, result, saveOne, saveMany, clearResult };
};
