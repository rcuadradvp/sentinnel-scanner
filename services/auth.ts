/**
 * Auth Service
 *
 * Maneja todas las operaciones de autenticación.
 * Usa el cliente API configurado y el storage service.
 */

import api, { setTokens, clearTokens } from '@/services/api';
import { AppStorage } from '@/services/storage';
import { AsyncStorageKeys } from '@/constants/storage';
import { Endpoints } from '@/constants/api';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  RegisterData,
  ResetPasswordData,
  ChangePasswordData,
  ApiResponse,
} from '@/types';

/**
 * Extrae datos de usuario de la respuesta de login
 */
const extractUserFromResponse = (data: LoginResponse): User => ({
  userId: data.userId,
  name: data.name,
  email: data.email,
  role: data.role,
  companyId: data.companyId,
  companyName: data.companyName,
  companyActive: data.companyActive,
  paths: data.paths,
  customRole: data.customRole,
});

/**
 * Resultado del login
 */
export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Resultado genérico para operaciones
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

export const AuthService = {
  /**
   * Inicia sesión con credenciales
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>(
        Endpoints.AUTH.LOGIN,
        credentials
      );

      const data = response.data.data;

      // Verificar que la empresa esté activa
      if (!data.companyActive) {
        return {
          success: false,
          error: 'La empresa no se encuentra activa',
        };
      }

      // Guardar tokens
      await setTokens(data.token, data.refreshToken);

      // Extraer y guardar datos de usuario
      const user = extractUserFromResponse(data);
      await AppStorage.set(AsyncStorageKeys.USER_DATA, user);
      await AppStorage.set(AsyncStorageKeys.SESSION_ACTIVE, 'true');

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Usuario o contraseña incorrectos';

      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    await clearTokens();
    await AppStorage.clearAll();
  },

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      await api.post(Endpoints.AUTH.REGISTER, data);

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al registrar usuario';

      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Activa una cuenta con código de validación
   */
  async activateAccount(
    email: string,
    validateCode: string
  ): Promise<AuthResult> {
    try {
      await api.get(Endpoints.AUTH.ACTIVATE, {
        params: { email, validateCode },
      });

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al activar cuenta';

      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Solicita recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      await api.post(Endpoints.AUTH.FORGOT_PASSWORD, { email });

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al enviar correo de recuperación';

      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Resetea la contraseña con token de recuperación
   */
  async resetPassword(data: ResetPasswordData): Promise<AuthResult> {
    try {
      await api.post(Endpoints.AUTH.RESET_PASSWORD, {
        token: data.token,
        newPassword: data.newPassword,
        confirmedNewPassword: data.confirmedNewPassword,
      });

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al resetear contraseña';

      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Cambia la contraseña (usuario autenticado)
   */
  async changePassword(data: ChangePasswordData): Promise<AuthResult> {
    try {
      await api.post(Endpoints.AUTH.CHANGE_PASSWORD, data);

      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al cambiar contraseña';

      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Obtiene los datos del usuario guardados localmente
   */
  async getStoredUser(): Promise<User | null> {
    return AppStorage.getJSON<User>(AsyncStorageKeys.USER_DATA);
  },

  /**
   * Verifica si hay una sesión activa guardada
   */
  async hasActiveSession(): Promise<boolean> {
    const session = await AppStorage.get(AsyncStorageKeys.SESSION_ACTIVE);
    return session === 'true';
  },
};