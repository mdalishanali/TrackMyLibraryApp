import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

const getEncryptionKey = () => {
  return process.env.EXPO_PUBLIC_ENCRYPTION_KEY || "default-secure-key";
};

export const storage = new MMKV({
  id: "app-secure-storage",
  encryptionKey: getEncryptionKey()
});

export const mmkStorage: StateStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    storage.delete(name);
  }
};

export default mmkStorage;
