/**
 * API Configuration
 *
 * Centraliza toda la configuración relacionada con la API.
 * Cambiar de ambiente (dev/staging/prod) solo requiere modificar este archivo.
 */

/**
 * Ambientes disponibles
 */
const Environments = {
  DEVELOPMENT: 'http://localhost:3000',
  STAGING: 'http://200.63.96.137:8080',
  PRODUCTION: 'https://apisentinel.vtraxx.cl',
} as const;

/**
 * Ambiente activo
 * TODO: En producción, usar variables de entorno (expo-constants)
 */
export const BASE_URL = Environments.PRODUCTION;

/**
 * Configuración de timeouts (en milisegundos)
 */
export const ApiTimeouts = {
  DEFAULT: 30000,      // 30 segundos
  UPLOAD: 60000,       // 60 segundos para subir archivos
  LONG_REQUEST: 45000, // 45 segundos para reportes pesados
} as const;

/**
 * Headers por defecto
 */
export const DefaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

/**
 * Endpoints de la API
 * Organizados por dominio/módulo
 */
export const Endpoints = {
  AUTH: {
    LOGIN: '/token',
    REFRESH: '/refresh-token',
    REGISTER: '/account/register',
    ACTIVATE: '/account/activate',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  USERS: {
    BASE: '/users',
    BY_ID: (uuid: string) => `/users/search/${uuid}`,
    BY_COMPANY: (uuid: string) => `/users/company/${uuid}`,
    UPDATE: (uuid: string) => `/users/${uuid}`,
    CUSTOM_ROLE: (uuid: string) => `/users/${uuid}/custom-role`,
    DELETE: (uuid: string) => `/users/${uuid}`,
  },

  COMPANIES: {
    BASE: '/companies',
    BY_ID: (uuid: string) => `/companies/${uuid}`,
  },

  DEVICES: {
    BASE: '/devices',
    BY_ID: (uuid: string) => `/devices/${uuid}`,
  },

  GATEWAYS: {
    BASE: '/gateways',
    BY_ID: (uuid: string) => `/gateways/${uuid}`,
  },

  VERSION: '/version',
} as const;