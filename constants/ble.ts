/**
 * BLE Constants
 */

// Minew manufacturer ID (little-endian: 0xE1FF)
export const MINEW_MANUFACTURER_ID = 0xffe1;

// Tipos de frame Minew
export const MinewFrameType = {
  INFO: 0xa1,
  IBEACON: 0xa7,
  TEMPERATURE_HUMIDITY: 0xa1,
  ACCELERATION: 0xa2,
  BATTERY: 0xa8,
  DEVICE_INFO: 0xa0,
} as const;

// Configuración de escaneo
export const BLE_SCAN_CONFIG = {
  // Duración del escaneo (null = indefinido)
  SCAN_DURATION_MS: null,
  // Permitir duplicados (necesario para RSSI actualizado)
  ALLOW_DUPLICATES: true,
  // Intervalo mínimo entre reportes del mismo dispositivo (ms)
  MIN_REPORT_INTERVAL_MS: 1000,
} as const;

// Estados del scanner
export const BleScannerState = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  STOPPED: 'stopped',
  ERROR: 'error',
} as const;

export type BleScannerStateType = (typeof BleScannerState)[keyof typeof BleScannerState];