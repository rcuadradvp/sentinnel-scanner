/**
 * JWT Utilities
 *
 * Funciones para decodificar y validar tokens JWT.
 * Usa jwt-decode porque atob() no existe en React Native.
 */

import { jwtDecode } from 'jwt-decode';

/**
 * Payload típico de un JWT (ajusta según tu backend)
 */
export interface JWTPayload {
  sub?: string;
  exp: number;
  iat: number;
  userId?: string;
  email?: string;
  role?: string;
}

/**
 * Decodifica un JWT sin verificar firma
 * NOTA: Solo extrae datos, NO valida autenticidad (eso lo hace el backend)
 */
export const decodeToken = <T = JWTPayload>(token: string): T | null => {
  try {
    return jwtDecode<T>(token);
  } catch (error) {
    console.error('[JWT] Error decoding token:', error);
    return null;
  }
};

/**
 * Obtiene el timestamp de expiración del token (en milisegundos)
 */
export const getTokenExpiry = (token: string): number | null => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return null;
  
  // exp viene en segundos, convertimos a milisegundos
  return decoded.exp * 1000;
};

/**
 * Verifica si el token está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  return Date.now() >= expiry;
};

/**
 * Verifica si el token expirará pronto
 * @param token - JWT token
 * @param thresholdMs - Umbral en milisegundos (default: 5 minutos)
 */
export const isTokenExpiringSoon = (
  token: string,
  thresholdMs: number = 5 * 60 * 1000
): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  return Date.now() >= expiry - thresholdMs;
};

/**
 * Obtiene el tiempo restante del token en milisegundos
 */
export const getTokenTimeRemaining = (token: string): number => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  
  const remaining = expiry - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Formatea el tiempo restante en formato legible (para debugging)
 */
export const formatTimeRemaining = (token: string): string => {
  const remaining = getTokenTimeRemaining(token);
  
  if (remaining <= 0) return 'Expirado';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
};