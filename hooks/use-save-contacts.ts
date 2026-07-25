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

const ROSTER_STALE_MS = 60_000;

/**
 * Ceiling on pages walked in one sync. At the server's 500-row page that is 50,000
 * students — far beyond any real library, and it exists only so a server bug that
 * always returns `hasMore` cannot spin forever.
 */
const MAX_ROSTER_PAGES = 100;

type DirectoryPage = {
    students: Student[];
    nextCursor: string | null;
    hasMore: boolean;
};

/**
 * Walk /students/directory page by page, handing each page to `onPage` as it arrives.
 *
 * Uses the dedicated directory endpoint rather than GET /students: the latter powers
 * the dashboard and joins `payments` on every call (~1200 extra docs for a
 * 200-student library) before computing dues and overdue days, none of which a contact
 * card uses. It is also status-agnostic, so inactive students arrive in the same walk.
 *
 * @param onPage - Receives each page. Return a promise to apply backpressure — the next
 *                 page is not requested until it settles, so a slow phonebook write
 *                 cannot make pages pile up in memory.
 * @returns Total rows seen.
 */
const walkDirectory = async (
    onPage: (students: Student[]) => Promise<void> | void
): Promise<number> => {
    let cursor: string | null = null;
    let seen = 0;

    for (let pageIndex = 0; pageIndex < MAX_ROSTER_PAGES; pageIndex += 1) {
        const { data } = await api.get('/students/directory', {
            params: cursor ? { cursor } : undefined,
        });

        const page = (data ?? {}) as DirectoryPage;
        const students = (page.students ?? []).filter((student) => Boolean(student.number));

        seen += students.length;
        await onPage(students);

        if (!page.hasMore || !page.nextCursor) return seen;
        cursor = page.nextCursor;
    }

    console.warn('[useSaveContacts] Stopped at the page ceiling; roster may be truncated');
    return seen;
};

/**
 * The full roster, assembled from every page.
 *
 * The modal needs a count and an "already saved" comparison up front, so the list is
 * materialised here. At ~320 bytes per student a 5000-student library is ~1.6MB of JS
 * objects — acceptable held once; what paging avoids is a single 6MB JSON parse and the
 * matching serialisation spike on the server.
 *
 * @param isEnabled - Gate the fetch so opening a screen doesn't pull the roster.
 */
export const useContactStudentsQuery = (isEnabled: boolean) =>
    useQuery({
        // NOT under ['students']: the student mutations invalidate that key by prefix,
        // which would refetch this entire paginated roster every time a student is
        // created or edited — the exact walk this query exists to do only on demand.
        queryKey: ['contact-roster'],
        enabled: isEnabled,
        staleTime: ROSTER_STALE_MS,
        queryFn: async (): Promise<Student[]> => {
            const roster: Student[] = [];
            await walkDirectory((students) => {
                roster.push(...students);
            });
            return roster;
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

    /**
     * Save a student in the BACKGROUND, after the caller has already closed.
     *
     * saveOne() cannot be used for this: it guards on `isSaving` and calls setState, so
     * once the form unmounts the guard reads a stale closure and the updates land on a
     * dead component. This path touches no component state at all — it only awaits the
     * native calls and reports through a toast, which is global.
     *
     * Fire it with `void`; the caller must not await it.
     */
    const saveInBackground = useCallback(
        async (student: Student): Promise<void> => {
            try {
                const isGranted = await requestContactsPermission();
                if (!isGranted) {
                    showToast(PERMISSION_DENIED_MESSAGE, 'error');
                    return;
                }

                const outcome = await saveStudentContact({ student, businessName });

                if (outcome === 'failed') {
                    showToast('Could not save contact', 'error');
                    return;
                }

                showToast(
                    outcome === 'updated' ? 'Contact updated' : 'Saved to contacts',
                    'success',
                    `${student.name} is now in your phonebook`
                );
            } catch (error) {
                console.error('[useSaveContacts] saveInBackground failed:', error);
                showToast('Could not save contact', 'error');
            }
        },
        [businessName]
    );

    /**
     * Keep an ALREADY-SAVED contact in step with an edited student. Never creates one,
     * and never prompts.
     *
     * A seat or shift change would otherwise leave a stale contact — the owner sees
     * "Seat 12" on a call for a student who moved to seat 4. Silent by design: this
     * rides along with an edit the owner already confirmed, so a toast about the
     * phonebook would be noise, and a student who was never saved is simply left alone.
     */
    const syncOne = useCallback(
        async (student: Student): Promise<void> => {
            try {
                // Read-only check — must not raise a prompt during an unrelated edit.
                const { status } = await Contacts.getPermissionsAsync();
                if (status !== 'granted') return;

                await saveStudentContact({ student, businessName, updateOnly: true });
            } catch (error) {
                console.error('[useSaveContacts] syncOne failed:', error);
            }
        },
        [businessName]
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

    return {
        isSaving,
        progress,
        result,
        saveOne,
        saveInBackground,
        syncOne,
        saveMany,
        clearResult,
    };
};
