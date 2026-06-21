import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@lll_auth_token',
  USER_DATA: '@lll_user_data',
} as const;

export const Storage = {
  // Token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
  },

  // User
  getUser: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEYS.USER_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser: async (user: object): Promise<void> => {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
  },

  removeUser: async (): Promise<void> => {
    await AsyncStorage.removeItem(KEYS.USER_DATA);
  },

  // Clear all app data
  clearAll: async (): Promise<void> => {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.AUTH_TOKEN),
      AsyncStorage.removeItem(KEYS.USER_DATA),
    ]);
  },
};
