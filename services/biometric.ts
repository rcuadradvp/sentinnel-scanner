// services/biometric.ts
import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorage, AppStorage } from '@/services/storage';
import { SecureStorageKeys, AsyncStorageKeys } from '@/constants/storage';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export interface StoredCredentials {
  username: string;
  password: string;
}

export const BiometricService = {
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  async getBiometricType(): Promise<BiometricType> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'facial';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }
      
      return 'none';
    } catch {
      return 'none';
    }
  },

  async getBiometricName(): Promise<string> {
    const type = await this.getBiometricType();
    
    switch (type) {
      case 'facial':
        return 'Biometría';
      case 'fingerprint':
        return 'Biometría';
      case 'iris':
        return 'Biometría';
      default:
        return 'Biometría';
    }
  },

  async authenticate(promptMessage?: string): Promise<BiometricResult> {
    try {
      const biometricName = await this.getBiometricName();
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Inicia sesión con ${biometricName}`,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        return { success: true };
      }

      switch (result.error) {
        case 'user_cancel':
          return { success: false, error: 'cancelled' };
        case 'user_fallback':
          return { success: false, error: 'fallback' };
        case 'lockout':
          return { success: false, error: 'Demasiados intentos. Intenta más tarde.' };
        default:
          return { success: false, error: 'Error de autenticación' };
      }
    } catch (error) {
      console.error('[Biometric] Error:', error);
      return { success: false, error: 'Error al verificar biometría' };
    }
  },

  async isEnabled(): Promise<boolean> {
    const enabled = await AppStorage.get(AsyncStorageKeys.BIOMETRIC_ENABLED);
    return enabled === 'true';
  },

  async isDeclined(): Promise<boolean> {
    const declined = await AppStorage.get(AsyncStorageKeys.BIOMETRIC_DECLINED);
    return declined === 'true';
  },

  async setDeclined(declined: boolean): Promise<boolean> {
    try {
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_DECLINED, declined ? 'true' : 'false');
      return true;
    } catch (error) {
      console.error('[Biometric] Error setting declined:', error);
      return false;
    }
  },

  async enable(username: string, password: string): Promise<boolean> {
    try {
      const authResult = await this.authenticate(
        'Verifica tu identidad para habilitar inicio rápido'
      );

      if (!authResult.success) {
        return false;
      }

      await SecureStorage.set(SecureStorageKeys.BIOMETRIC_USERNAME, username);
      await SecureStorage.set(SecureStorageKeys.BIOMETRIC_PASSWORD, password);
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_ENABLED, 'true');
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_DECLINED, 'false');
    
      console.log('[Biometric] Enabled successfully');
      return true;
    } catch (error) {
      console.error('[Biometric] Error enabling:', error);
      return false;
    }
  },

  async replaceCredentials(username: string, password: string): Promise<boolean> {
    try {
      const previousUsername = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
      
      if (previousUsername && previousUsername !== username) {
        console.log(`[Biometric] Replacing credentials from ${previousUsername} to ${username}`);
      }

      await SecureStorage.set(SecureStorageKeys.BIOMETRIC_USERNAME, username);
      await SecureStorage.set(SecureStorageKeys.BIOMETRIC_PASSWORD, password);
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_ENABLED, 'true');
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_DECLINED, 'false');
    
      console.log('[Biometric] Credentials replaced successfully');
      return true;
    } catch (error) {
      console.error('[Biometric] Error replacing credentials:', error);
      return false;
    }
  },

  async disable(userInitiated: boolean = false): Promise<boolean> {
    try {
      await SecureStorage.remove(SecureStorageKeys.BIOMETRIC_USERNAME);
      await SecureStorage.remove(SecureStorageKeys.BIOMETRIC_PASSWORD);
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_ENABLED, 'false');
      
      if (userInitiated) {
        await AppStorage.set(AsyncStorageKeys.BIOMETRIC_DECLINED, 'true');
      }
      
      console.log(`[Biometric] Disabled (userInitiated: ${userInitiated})`);
      return true;
    } catch {
      return false;
    }
  },

  async getCredentials(): Promise<StoredCredentials | null> {
    try {
      const authResult = await this.authenticate();

      if (!authResult.success) {
        return null;
      }

      const username = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
      const password = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_PASSWORD);

      if (!username || !password) {
        await this.disable(false);
        return null;
      }

      return { username, password };
    } catch (error) {
      console.error('[Biometric] Error getting credentials:', error);
      return null;
    }
  },

  async hasStoredCredentials(): Promise<boolean> {
    const username = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
    const password = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_PASSWORD);
    return !!(username && password);
  },

  async validateStoredUser(currentUsername: string): Promise<boolean> {
    try {
      const storedUsername = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
      return storedUsername === currentUsername;
    } catch {
      return false;
    }
  },

  async getStoredUsername(): Promise<string | null> {
    try {
      return await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
    } catch {
      return null;
    }
  },
};