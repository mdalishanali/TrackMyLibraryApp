import { resolveIsEnabled } from '@/hooks/use-save-contact-preference';

jest.mock('expo-contacts', () => ({ getPermissionsAsync: jest.fn() }));
jest.mock('react-native-mmkv', () => ({ useMMKVBoolean: jest.fn() }));
jest.mock('@/lib/storage', () => ({ storage: {} }));

/**
 * resolveIsEnabled is the whole rule behind the checkbox: never promise a save the app
 * cannot perform, and never override what the owner explicitly chose.
 */

const NEVER_CHOSEN = undefined;
const STILL_RESOLVING = null;

describe('resolveIsEnabled — no stored choice', () => {
    it('ticks the box when contacts access is already granted', () => {
        expect(resolveIsEnabled(NEVER_CHOSEN, true)).toBe(true);
    });

    it('leaves it unticked when access is not granted, so nothing is silently promised', () => {
        expect(resolveIsEnabled(NEVER_CHOSEN, false)).toBe(false);
    });

    it('leaves it unticked while the permission status is still resolving', () => {
        // A box that flips itself on a beat after the form opens reads as a glitch.
        expect(resolveIsEnabled(NEVER_CHOSEN, STILL_RESOLVING)).toBe(false);
    });
});

describe('resolveIsEnabled — an explicit choice outranks the default', () => {
    it('honours a stored OFF even when access is granted', () => {
        expect(resolveIsEnabled(false, true)).toBe(false);
    });

    it('honours a stored ON even when access has not been granted', () => {
        // Valid: the owner opted in, and the prompt comes at save time.
        expect(resolveIsEnabled(true, false)).toBe(true);
    });

    it('honours a stored choice while the status is still resolving', () => {
        expect(resolveIsEnabled(true, STILL_RESOLVING)).toBe(true);
        expect(resolveIsEnabled(false, STILL_RESOLVING)).toBe(false);
    });

    it('treats a stored false as a real choice, not as absent', () => {
        // The bug this guards: `storedChoice ?? default` is correct, `||` is not.
        expect(resolveIsEnabled(false, true)).toBe(false);
    });
});
