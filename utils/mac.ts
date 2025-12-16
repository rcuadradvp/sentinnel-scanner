// utils/mac.ts

const MINEW_PREFIXES = ['C30000'] as const;

/**
 * Valida si una MAC es de Minew
 */
export function isMinewMAC(mac: string): boolean {
  const cleaned = cleanMAC(mac);
  return MINEW_PREFIXES.some(prefix => cleaned.startsWith(prefix));
}

/**
 * Limpia una MAC de cualquier formato
 * C3:00:00:38:89:BB → C300003889BB
 */
export function cleanMAC(mac: string): string {
  return mac.replace(/[:\-\s]/g, '').toUpperCase().trim();
}

/**
 * Formatea una MAC con dos puntos
 * C300003889BB → C3:00:00:38:89:BB
 */
export function formatMAC(mac: string): string {
  const cleaned = cleanMAC(mac);
  
  if (cleaned.length !== 12) {
    return mac; // Retorna original si no es válida
  }
  
  return cleaned.match(/.{1,2}/g)?.join(':') || mac;
}

/**
 * Valida formato de MAC (12 caracteres hex)
 */
export function isValidMACFormat(mac: string): boolean {
  const cleaned = cleanMAC(mac);
  return /^[0-9A-F]{12}$/.test(cleaned);
}

/**
 * Valida MAC completa (formato + Minew)
 */
export function validateMinewMAC(mac: string): { 
  valid: boolean; 
  error?: string;
  formatted?: string;
} {
  const cleaned = cleanMAC(mac);
  
  if (!isValidMACFormat(cleaned)) {
    return {
      valid: false,
      error: 'MAC debe tener 12 caracteres hexadecimales'
    };
  }
  
  if (!isMinewMAC(cleaned)) {
    return {
      valid: false,
      error: 'Solo se aceptan beacons Minew (C30000...)'
    };
  }
  
  return {
    valid: true,
    formatted: formatMAC(cleaned)
  };
}

/**
 * Extrae MAC de diferentes formatos de QR
 */
export function extractMACFromQR(qrData: string): string | null {
  // Formato 1: Solo MAC
  if (/^[0-9A-F:]{12,17}$/i.test(qrData)) {
    return cleanMAC(qrData);
  }
  
  // Formato 2: MINEW:C300003889BB
  const prefixMatch = qrData.match(/MINEW:([0-9A-F:]{12,17})/i);
  if (prefixMatch) {
    return cleanMAC(prefixMatch[1]);
  }
  
  // Formato 3: JSON
  try {
    const json = JSON.parse(qrData);
    if (json.mac) {
      return cleanMAC(json.mac);
    }
  } catch {}
  
  // Formato 4: URL
  const urlMatch = qrData.match(/\/([0-9A-F:]{12,17})\??/i);
  if (urlMatch) {
    return cleanMAC(urlMatch[1]);
  }
  
  return null;
}