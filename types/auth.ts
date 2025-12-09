/**
 * Authentication Types
 *
 * Define todas las interfaces relacionadas con autenticación.
 * Basado en la estructura de respuesta de tu backend.
 */

/**
 * Usuario autenticado
 */
export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  companyActive: boolean;
  paths: string[];
  customRole?: string;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Respuesta del endpoint /token
 */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  companyActive: boolean;
  paths: string[];
  customRole?: string;
}

/**
 * Respuesta del endpoint /refresh-token
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Datos de registro
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Datos para resetear contraseña
 */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmedNewPassword: string;
}

/**
 * Datos para cambiar contraseña (usuario logueado)
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmedNewPassword: string;
}

/**
 * Estado del contexto de autenticación
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Acciones disponibles en el contexto
 */
export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Contexto completo (estado + acciones)
 */
export type AuthContextType = AuthState & AuthActions;