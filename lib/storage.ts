import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const getEncryptionKey = () => process.env.EXPO_PUBLIC_ENCRYPTION_KEY || undefined;

export const storage = new MMKV({
  id: 'library-auth-storage',
  encryptionKey: getEncryptionKey(),
});

export const mmkStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      storage.set(name, value);
    } catch (error) {
      console.warn('MMKV setItem failed', error);
    }
  },
  getItem: (name) => {
    try {
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.warn('MMKV getItem failed', error);
      return null;
    }
  },
  removeItem: (name) => {
    try {
      storage.delete(name);
    } catch (error) {
      console.warn('MMKV removeItem failed', error);
    }
  },
};

export default mmkStorage;
