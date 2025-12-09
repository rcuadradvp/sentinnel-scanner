/**
 * BLE Types
 */

import type { BleScannerStateType } from '@/constants/ble';

/**
 * Dispositivo BLE detectado
 */
export interface BleDevice {
  id: string; // MAC address o UUID
  name: string | null;
  rssi: number;
  manufacturerData: string | null; // Hex string
  txPowerLevel: number | null;
  isConnectable: boolean | null;
  lastSeen: number; // Timestamp
}

/**
 * Beacon Minew parseado
 */
export interface MinewBeacon {
  mac: string;
  rssi: number;
  frameType: number;
  productModel: number;
  batteryLevel: number | null;
  temperature: number | null;
  humidity: number | null;
  accelerometer: {
    x: number;
    y: number;
    z: number;
  } | null;
  // iBeacon data
  uuid: string | null;
  major: number | null;
  minor: number | null;
  // Raw data
  rawData: string;
  timestamp: number;
}

/**
 * Estado del scanner
 */
export interface BleScannerStatus {
  state: BleScannerStateType;
  isScanning: boolean;
  error: string | null;
  devicesCount: number;
  lastUpdate: number | null;
}

/**
 * Permisos BLE
 */
export interface BlePermissions {
  bluetooth: boolean;
  bluetoothScan: boolean;
  bluetoothConnect: boolean;
  location: boolean;
  allGranted: boolean;
}

/**
 * Resultado de escaneo para enviar al servidor
 */
export interface BleReading {
  mac: string;
  rssi: number;
  raw: string;
  lat: number | null;
  lon: number | null;
  timestamp: number;
  parsed: MinewBeacon | null;
}

/**
 * Callback para dispositivos detectados
 */
export type OnDeviceFoundCallback = (device: BleDevice) => void;
export type OnBeaconFoundCallback = (beacon: MinewBeacon) => void;
export type OnErrorCallback = (error: string) => void;