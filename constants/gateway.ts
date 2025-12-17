// constants/gateway.ts

// Prefijos MAC válidos para V-gates
export const VALID_GATEWAY_MAC_PREFIXES = [
  'A4:C1:38',
  'AC:23:3F',
  'D8:A0:1D',
  'C8:47:8C',
  'E4:95:6E',
] as const;

// También en formato sin dos puntos para comparación
export const VALID_GATEWAY_MAC_PREFIXES_RAW = [
  'A4C138',
  'AC233F',
  'D8A01D',
  'C8478C',
  'E4956E',
] as const;