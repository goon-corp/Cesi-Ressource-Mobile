import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';

export const useSecureStore = () => {
  const get = useCallback(
    async (key: string): Promise<string | null> => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    [],
  );

  const set = useCallback(
    async (key: string, value: string): Promise<boolean> => {
      try {
        await SecureStore.setItemAsync(key, value);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const remove = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        await SecureStore.deleteItemAsync(key);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  return { get, set, remove };
};
