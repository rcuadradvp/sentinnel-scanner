/**
 * Storage Service
 *
 * Abstrae el acceso a SecureStore y AsyncStorage.
 * - SecureStore: datos sensibles (tokens) - encriptado
 * - AsyncStorage: datos no sensibles (preferencias, user data)
 *
 * ¿Por qué este servicio?
 * 1. Centraliza la lógica de storage
 * 2. Maneja errores de forma consistente
 * 3. Facilita testing (se puede mockear)
 * 4. Si cambiamos de librería, solo modificamos aquí
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorageKeys, AsyncStorageKeys } from '@/constants/storage';
import type { SecureStorageKey, AsyncStorageKey } from '@/constants/storage';

/**
 * Servicio para datos SENSIBLES (tokens)
 */
export const SecureStorage = {
  async set(key: SecureStorageKey, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`[SecureStorage] Error saving ${key}:`, error);
      return false;
    }
  },

  async get(key: SecureStorageKey): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error reading ${key}:`, error);
      return null;
    }
  },

  async remove(key: SecureStorageKey): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
      return false;
    }
  },

  /**
   * Elimina solo tokens (para logout)
   * NO elimina credenciales biométricas
   */
  async clearTokens(): Promise<boolean> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SecureStorageKeys.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(SecureStorageKeys.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SecureStorageKeys.TOKEN_EXPIRY),
      ]);
      return true;
    } catch (error) {
      console.error('[SecureStorage] Error clearing tokens:', error);
      return false;
    }
  },

  /**
   * Elimina TODO (incluyendo credenciales biométricas)
   * Usar solo cuando el usuario deshabilita biometría o desinstala
   */
  async clearAll(): Promise<boolean> {
    try {
      const keys = Object.values(SecureStorageKeys);
      await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
      return true;
    } catch (error) {
      console.error('[SecureStorage] Error clearing all:', error);
      return false;
    }
  },
};

/**
 * Servicio para datos NO sensibles (preferencias, datos de usuario)
 * No usa encriptación, pero permite guardar objetos JSON
 */
export const AppStorage = {
  /**
   * Guarda un valor (acepta objetos, los serializa automáticamente)
   */
  async set<T>(key: AsyncStorageKey, value: T): Promise<boolean> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`[AppStorage] Error saving ${key}:`, error);
      return false;
    }
  },

  /**
   * Obtiene un valor como string
   */
  async get(key: AsyncStorageKey): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[AppStorage] Error reading ${key}:`, error);
      return null;
    }
  },

  /**
   * Obtiene un valor parseado (para objetos JSON)
   */
  async getJSON<T>(key: AsyncStorageKey): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[AppStorage] Error parsing ${key}:`, error);
      return null;
    }
  },

  /**
   * Elimina un valor
   */
  async remove(key: AsyncStorageKey): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[AppStorage] Error removing ${key}:`, error);
      return false;
    }
  },

  /**
   * Elimina todos los datos de la app (logout completo)
   */
  async clearAll(): Promise<boolean> {
    try {
      const keys = Object.values(AsyncStorageKeys);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('[AppStorage] Error clearing all:', error);
      return false;
    }
  },
};

/**
 * Limpia TODO el storage (SecureStore + AsyncStorage)
 * Usar en logout
 */
export const clearAllStorage = async (): Promise<boolean> => {
  const [secureResult, appResult] = await Promise.all([
    SecureStorage.clearAll(),
    AppStorage.clearAll(),
  ]);
  return secureResult && appResult;
};