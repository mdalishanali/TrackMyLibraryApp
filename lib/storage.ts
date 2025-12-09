import { MMKV } from 'react-native-mmkv';

/**
 * Centralized MMKV instance to persist auth and other lightweight app data.
 */
export const mmkv = new MMKV({
  id: 'library-storage',
  encryptionKey: undefined,
});

/**
 * Adapter to let Zustand persist data into MMKV.
 */
export const zustandMMKVStorage = {
  setItem: (key: string, value: string) => {
    mmkv.set(key, value);
  },
  getItem: (key: string) => {
    const value = mmkv.getString(key);
    return value ?? null;
  },
  removeItem: (key: string) => {
    mmkv.delete(key);
  },
};
