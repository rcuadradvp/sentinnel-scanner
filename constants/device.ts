// constants/device.ts

/**
 * Prefijos MAC válidos para V-tags (dispositivos/beacons Minew)
 * Formato sin separadores para comparación directa
 */
export const VALID_DEVICE_MAC_PREFIXES_RAW = [
  'C30000', // Minew beacons principales
  'AC233F', // Minew gateways (también pueden ser devices)
] as const;

/**
 * Prefijos MAC válidos para V-tags con formato de colons
 */
export const VALID_DEVICE_MAC_PREFIXES = [
  'C3:00:00',
  'AC:23:3F',
] as const;

/**
 * Prioridades de dispositivos
 */
export const DEVICE_PRIORITIES = [
  { label: 'Crítica', value: 1, color: 'error' },
  { label: 'Alta', value: 2, color: 'warning' },
  { label: 'Media', value: 3, color: 'info' },
  { label: 'Moderada', value: 4, color: 'primary' },
  { label: 'Baja', value: 5, color: 'success' },
] as const;

export type DevicePriority = 1 | 2 | 3 | 4 | 5;
