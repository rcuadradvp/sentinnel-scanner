import { NativeModules } from 'react-native';

const { MinewParser } = NativeModules;

export interface MinewBeaconNative {
  frameType: number;
  productModel: number;
  rssi: number;
  rawData: string;
  timestamp: number;
  
  // Datos opcionales según el frame type
  temperature?: number;
  humidity?: number;
  battery?: number;
  
  accelerometer?: {
    x: number;
    y: number;
    z: number;
  };
  
  // iBeacon
  uuid?: string;
  major?: number;
  minor?: number;
  measuredPower?: number;
  
  // Otros sensores
  lightLevel?: number;
  doorStatus?: number; // 0=cerrado, 1=abierto
  name?: string;
  macAddress?: string;
}

/**
 * Parsea beacon usando el SDK oficial de Minew
 */
export async function parseMinewNative(
  manufacturerDataHex: string,
  rssi: number
): Promise<MinewBeaconNative | null> {
  if (!MinewParser) {
    console.warn('[MinewParser] Native module not available');
    return null;
  }

  try {
    const result = await MinewParser.parseBeacon(manufacturerDataHex, rssi);
    return result;
  } catch (error) {
    console.error('[MinewParser] Error:', error);
    return null;
  }
}

/**
 * Verifica si el native module está disponible
 */
export function isMinewParserAvailable(): boolean {
  return MinewParser !== undefined;
}