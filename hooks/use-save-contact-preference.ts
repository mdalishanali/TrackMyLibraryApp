import { useCallback, useEffect, useState } from 'react';
import * as Contacts from 'expo-contacts';
import { useMMKVBoolean } from 'react-native-mmkv';

import { storage } from '@/lib/storage';

/**
 * use-save-contact-preference.ts
 *
 * Remembers whether new students should also be saved to the phonebook.
 *
 * WHY THE DEFAULT IS PERMISSION-GATED:
 *   Ticking the box by default when contacts access has never been granted would
 *   promise something the app cannot deliver — the save would fail silently and the
 *   owner would believe the number was in their phone. So the box starts on only when
 *   access is ALREADY granted; otherwise the owner opts in explicitly, which is also
 *   the moment it makes sense to ask for permission.
 *
 * Once the owner touches the checkbox their choice is stored and the gate no longer
 * applies — an explicit decision outranks the default either way.
 */

const PREFERENCE_KEY = 'save-new-student-to-contacts';

/**
 * Decide whether the checkbox is ticked.
 *
 * Extracted as a pure function so the rule is testable without a React renderer —
 * this is the whole behaviour worth guarding.
 *
 * @param storedChoice       - The owner's saved choice, or undefined if never set.
 * @param isPermissionGranted- Contacts access state; null while still resolving.
 */
export const resolveIsEnabled = (
    storedChoice: boolean | undefined,
    isPermissionGranted: boolean | null
): boolean => {
    // An explicit decision outranks the default in both directions.
    if (storedChoice !== undefined) return storedChoice;

    // Default on only when access already exists — otherwise the box would promise a
    // save the app cannot perform. While resolving, stay off: a box that flips itself
    // on after a beat reads as a glitch.
    return isPermissionGranted === true;
};

export const useSaveContactPreference = () => {
    const [storedChoice, setStoredChoice] = useMMKVBoolean(PREFERENCE_KEY, storage);
    const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);

    // Read-only status check — never triggers the permission prompt, so opening the
    // form cannot surface a system dialog the owner did not ask for.
    useEffect(() => {
        let isActive = true;

        Contacts.getPermissionsAsync()
            .then(({ status }) => {
                if (isActive) setIsPermissionGranted(status === 'granted');
            })
            .catch(() => {
                if (isActive) setIsPermissionGranted(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    const isEnabled = resolveIsEnabled(storedChoice, isPermissionGranted);

    const toggle = useCallback(() => {
        setStoredChoice(!isEnabled);
    }, [isEnabled, setStoredChoice]);

    return {
        isEnabled,
        toggle,
        /** False when access was never granted — the UI explains the extra prompt. */
        isPermissionGranted: isPermissionGranted === true,
    };
};
