/**
 * Biometric Service
 *
 * Maneja autenticación biométrica con credenciales encriptadas.
 */

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
  /**
   * Verifica si el dispositivo tiene hardware biométrico
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene el tipo de biometría disponible
   */
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

  /**
   * Obtiene el nombre amigable del tipo de biometría
   */
  async getBiometricName(): Promise<string> {
    const type = await this.getBiometricType();
    
    switch (type) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'huella digital';
      case 'iris':
        return 'escaneo de iris';
      default:
        return 'biometría';
    }
  },

  /**
   * Solicita autenticación biométrica
   */
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

  /**
   * Verifica si el usuario tiene biometría habilitada
   */
  async isEnabled(): Promise<boolean> {
    const enabled = await AppStorage.get(AsyncStorageKeys.BIOMETRIC_ENABLED);
    return enabled === 'true';
  },

  /**
   * 🆕 Guarda las credenciales encriptadas y habilita biometría
   */
  async enable(username: string, password: string): Promise<boolean> {
    try {
      // Primero verificar biometría
      const authResult = await this.authenticate(
        'Verifica tu identidad para habilitar inicio rápido'
      );

      if (!authResult.success) {
        return false;
      }

      // Guardar credenciales encriptadas en SecureStore
      await SecureStorage.set(SecureStorageKeys.BIOMETRIC_USERNAME, username);
      await SecureStorage.set(SecureStorageKeys.BIOMETRIC_PASSWORD, password);
      
      // Marcar como habilitado
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_ENABLED, 'true');
      
      return true;
    } catch (error) {
      console.error('[Biometric] Error enabling:', error);
      return false;
    }
  },

  /**
   * 🆕 Deshabilita biometría y elimina credenciales
   */
  async disable(): Promise<boolean> {
    try {
      await SecureStorage.remove(SecureStorageKeys.BIOMETRIC_USERNAME);
      await SecureStorage.remove(SecureStorageKeys.BIOMETRIC_PASSWORD);
      await AppStorage.set(AsyncStorageKeys.BIOMETRIC_ENABLED, 'false');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene las credenciales después de verificar biometría
   */
  async getCredentials(): Promise<StoredCredentials | null> {
    try {
      // Primero verificar biometría
      const authResult = await this.authenticate();

      if (!authResult.success) {
        // Usuario canceló o falló - NO es error, solo retornar null
        console.log('[Biometric] Auth cancelled or failed:', authResult.error);
        return null;
      }

      // Obtener credenciales encriptadas
      const username = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
      const password = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_PASSWORD);

      if (!username || !password) {
        console.log('[Biometric] No credentials found');
        await this.disable();
        return null;
      }

      return { username, password };
    } catch (error) {
      console.error('[Biometric] Error getting credentials:', error);
      return null;
    }
  },

  /**
   * 🆕 Verifica si hay credenciales guardadas
   */
  async hasStoredCredentials(): Promise<boolean> {
    const username = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_USERNAME);
    const password = await SecureStorage.get(SecureStorageKeys.BIOMETRIC_PASSWORD);
    return !!(username && password);
  },
};