/**
 * API Client
 *
 * Cliente Axios configurado con interceptores para:
 * - Agregar token automáticamente a cada request
 * - Manejar errores 401 (token expirado)
 * - Refresh automático de tokens
 * - Cola de peticiones mientras se renueva el token
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { BASE_URL, ApiTimeouts, DefaultHeaders, Endpoints } from '@/constants/api';
import { SecureStorageKeys } from '@/constants/storage';
import { SecureStorage } from '@/services/storage';
import { isTokenExpiringSoon } from '@/utils/jwt';
import type { ApiResponse, RefreshTokenResponse } from '@/types';

/**
 * Rutas públicas que NO requieren token ni refresh
 */
const PUBLIC_ENDPOINTS = [
  Endpoints.AUTH.LOGIN,
  Endpoints.AUTH.REGISTER,
  Endpoints.AUTH.FORGOT_PASSWORD,
  Endpoints.AUTH.RESET_PASSWORD,
  Endpoints.AUTH.ACTIVATE,
];

/**
 * Verifica si una URL es pública
 */
const isPublicEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

/**
 * Estado del token en memoria
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

/**
 * Control de refresh
 */
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Procesa la cola de peticiones pendientes
 */
const processQueue = (error: Error | null, token: string | null = null): void => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
};

/**
 * Instancia de Axios
 */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: ApiTimeouts.DEFAULT,
  headers: DefaultHeaders,
});

/**
 * Interceptor de REQUEST
 * Agrega el token a cada petición (excepto rutas públicas)
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // No agregar token a rutas públicas
    if (isPublicEndpoint(config.url)) {
      return config;
    }

    // Si no tenemos token en memoria, intentar cargar de storage
    if (!accessToken) {
      accessToken = await SecureStorage.get(SecureStorageKeys.ACCESS_TOKEN);
    }

    // Agregar token si existe
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor de RESPONSE
 * Maneja errores 401 y refresh de token (excepto rutas públicas)
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No manejar 401 en rutas públicas (ej: login con credenciales incorrectas)
    if (isPublicEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    // Si no es 401 o ya reintentamos, rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya estamos refrescando, encolar esta petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    // Marcar para no reintentar infinitamente
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Obtener refresh token
      if (!refreshToken) {
        refreshToken = await SecureStorage.get(SecureStorageKeys.REFRESH_TOKEN);
      }

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Llamar al endpoint de refresh (usar axios directo, no la instancia)
      const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
        `${BASE_URL}${Endpoints.AUTH.REFRESH}`,
        {},
        {
          headers: {
            'Refresh-Token': refreshToken,
          },
        }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      // Actualizar en memoria
      accessToken = newAccessToken;
      refreshToken = newRefreshToken;

      // Guardar en storage
      await Promise.all([
        SecureStorage.set(SecureStorageKeys.ACCESS_TOKEN, newAccessToken),
        SecureStorage.set(SecureStorageKeys.REFRESH_TOKEN, newRefreshToken),
      ]);

      // Procesar cola de peticiones pendientes
      processQueue(null, newAccessToken);

      // Reintentar petición original
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falló, limpiar todo
      processQueue(refreshError as Error);
      await clearTokens();

      // Emitir evento para que AuthContext haga logout
      tokenEventEmitter.emit('onTokenExpired');

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Event Emitter simple para comunicar con AuthContext
 */
type TokenEventCallback = () => void;
const tokenEventEmitter = {
  listeners: new Set<TokenEventCallback>(),

  emit(event: 'onTokenExpired') {
    if (event === 'onTokenExpired') {
      this.listeners.forEach((callback) => callback());
    }
  },

  subscribe(callback: TokenEventCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
};

/**
 * Funciones públicas para gestionar tokens
 */

export const initializeTokens = async (): Promise<boolean> => {
  const [storedAccess, storedRefresh] = await Promise.all([
    SecureStorage.get(SecureStorageKeys.ACCESS_TOKEN),
    SecureStorage.get(SecureStorageKeys.REFRESH_TOKEN),
  ]);

  accessToken = storedAccess;
  refreshToken = storedRefresh;

  return !!(accessToken && refreshToken);
};

export const setTokens = async (
  newAccessToken: string,
  newRefreshToken: string
): Promise<void> => {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;

  await Promise.all([
    SecureStorage.set(SecureStorageKeys.ACCESS_TOKEN, newAccessToken),
    SecureStorage.set(SecureStorageKeys.REFRESH_TOKEN, newRefreshToken),
  ]);
};

export const clearTokens = async (): Promise<void> => {
  accessToken = null;
  refreshToken = null;

  await Promise.all([
    SecureStorage.remove(SecureStorageKeys.ACCESS_TOKEN),
    SecureStorage.remove(SecureStorageKeys.REFRESH_TOKEN),
    SecureStorage.remove(SecureStorageKeys.TOKEN_EXPIRY),
  ]);
};

export const getAccessToken = (): string | null => accessToken;

export const shouldRefreshToken = (): boolean => {
  if (!accessToken) return false;
  return isTokenExpiringSoon(accessToken, 5 * 60 * 1000);
};

export const onTokenExpired = (callback: TokenEventCallback) => {
  return tokenEventEmitter.subscribe(callback);
};

export default api;