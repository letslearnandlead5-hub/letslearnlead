import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@lll_device_id';

/** Generate a simple UUID v4 without external deps */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Returns a stable UUID for this device installation.
 * Generated once and persisted in AsyncStorage. Survives app restarts.
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // Fallback — not persisted but unique per session
    return generateUUID();
  }
};

/**
 * Returns a human-readable device description string.
 * Used for SDL device info display in the admin panel.
 */
export const getDeviceInfo = (): string => {
  return `Mobile App / ${Platform.OS} ${Platform.Version}`;
};
