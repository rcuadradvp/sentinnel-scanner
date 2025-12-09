/**
 * Minew Beacon Parser
 * 
 * Parsea los datos de manufacturer data de beacons Minew.
 * Referencia: Minew BLE Protocol Documentation
 */

import { Buffer } from 'buffer';
import { MINEW_MANUFACTURER_ID, MinewFrameType } from '@/constants/ble';
import type { MinewBeacon } from '@/types';

/**
 * Convierte base64 a hex string
 */
export function b64ToHex(b64: string | null | undefined): string {
  if (!b64) return '';
  try {
    const bytes = Buffer.from(b64, 'base64');
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

/**
 * Convierte hex string a bytes array
 */
export function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * Verifica si es un beacon Minew por el manufacturer ID
 */
export function isMinewBeacon(manufacturerDataHex: string): boolean {
  if (!manufacturerDataHex || manufacturerDataHex.length < 4) {
    return false;
  }

  // Manufacturer ID está en los primeros 2 bytes (little-endian)
  const bytes = hexToBytes(manufacturerDataHex);
  if (bytes.length < 2) return false;

  const manufacturerId = bytes[0] | (bytes[1] << 8);
  return manufacturerId === MINEW_MANUFACTURER_ID;
}

/**
 * Parsea datos de un beacon Minew
 */
export function parseMinewBeacon(
  mac: string,
  rssi: number,
  manufacturerDataHex: string
): MinewBeacon | null {
  if (!isMinewBeacon(manufacturerDataHex)) {
    return null;
  }

  const bytes = hexToBytes(manufacturerDataHex);
  
  // Estructura básica Minew:
  // [0-1] Manufacturer ID (0xE1FF)
  // [2] Frame Type
  // [3] Product Model
  // [4+] Data según frame type

  if (bytes.length < 4) {
    return null;
  }

  const frameType = bytes[2];
  const productModel = bytes[3];

  const beacon: MinewBeacon = {
    mac,
    rssi,
    frameType,
    productModel,
    batteryLevel: null,
    temperature: null,
    humidity: null,
    accelerometer: null,
    uuid: null,
    major: null,
    minor: null,
    rawData: manufacturerDataHex,
    timestamp: Date.now(),
  };

  // Parsear según tipo de frame
  try {
    switch (frameType) {
      case MinewFrameType.DEVICE_INFO:
        parseDeviceInfoFrame(bytes, beacon);
        break;
      case MinewFrameType.TEMPERATURE_HUMIDITY:
        parseTemperatureHumidityFrame(bytes, beacon);
        break;
      case MinewFrameType.ACCELERATION:
        parseAccelerationFrame(bytes, beacon);
        break;
      case MinewFrameType.IBEACON:
        parseiBeaconFrame(bytes, beacon);
        break;
      case MinewFrameType.BATTERY:
        parseBatteryFrame(bytes, beacon);
        break;
      default:
        // Frame type desconocido, retornar datos básicos
        break;
    }
  } catch (error) {
    console.warn('[MinewParser] Error parsing frame:', error);
  }

  return beacon;
}

/**
 * Parsea frame de información del dispositivo (0xA0)
 */
function parseDeviceInfoFrame(bytes: number[], beacon: MinewBeacon): void {
  // [4] Battery level (%)
  if (bytes.length > 4) {
    beacon.batteryLevel = bytes[4];
  }
}

/**
 * Parsea frame de temperatura y humedad (0xA1)
 */
function parseTemperatureHumidityFrame(bytes: number[], beacon: MinewBeacon): void {
  // Formato puede variar según modelo
  // Típicamente:
  // [4-5] Temperatura (signed, dividir por 256 o 10)
  // [6-7] Humedad (unsigned, dividir por 10)
  // [8] Battery

  if (bytes.length >= 6) {
    // Temperatura como signed int16
    const tempRaw = (bytes[4] << 8) | bytes[5];
    // Convertir de signed
    const tempSigned = tempRaw > 32767 ? tempRaw - 65536 : tempRaw;
    beacon.temperature = tempSigned / 256;
  }

  if (bytes.length >= 8) {
    const humidityRaw = (bytes[6] << 8) | bytes[7];
    beacon.humidity = humidityRaw / 10;
  }

  if (bytes.length >= 9) {
    beacon.batteryLevel = bytes[8];
  }
}

/**
 * Parsea frame de aceleración (0xA2)
 */
function parseAccelerationFrame(bytes: number[], beacon: MinewBeacon): void {
  // [4-5] X axis
  // [6-7] Y axis
  // [8-9] Z axis
  // [10] Battery

  if (bytes.length >= 10) {
    const parseAxis = (high: number, low: number): number => {
      const raw = (high << 8) | low;
      return raw > 32767 ? raw - 65536 : raw;
    };

    beacon.accelerometer = {
      x: parseAxis(bytes[4], bytes[5]),
      y: parseAxis(bytes[6], bytes[7]),
      z: parseAxis(bytes[8], bytes[9]),
    };
  }

  if (bytes.length >= 11) {
    beacon.batteryLevel = bytes[10];
  }
}

/**
 * Parsea frame iBeacon (0xA7)
 */
function parseiBeaconFrame(bytes: number[], beacon: MinewBeacon): void {
  // iBeacon format:
  // [4-19] UUID (16 bytes)
  // [20-21] Major
  // [22-23] Minor

  if (bytes.length >= 24) {
    // UUID
    const uuidBytes = bytes.slice(4, 20);
    beacon.uuid = uuidBytes
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
      .toUpperCase();

    // Major y Minor
    beacon.major = (bytes[20] << 8) | bytes[21];
    beacon.minor = (bytes[22] << 8) | bytes[23];
  }
}

/**
 * Parsea frame de batería (0xA8)
 */
function parseBatteryFrame(bytes: number[], beacon: MinewBeacon): void {
  if (bytes.length > 4) {
    beacon.batteryLevel = bytes[4];
  }
}

/**
 * Formatea el tipo de frame como string legible
 */
export function getFrameTypeName(frameType: number): string {
  switch (frameType) {
    case MinewFrameType.DEVICE_INFO:
      return 'Device Info';
    case MinewFrameType.TEMPERATURE_HUMIDITY:
      return 'Temp/Humidity';
    case MinewFrameType.ACCELERATION:
      return 'Acceleration';
    case MinewFrameType.IBEACON:
      return 'iBeacon';
    case MinewFrameType.BATTERY:
      return 'Battery';
    default:
      return `Unknown (0x${frameType.toString(16)})`;
  }
}