/**
 * BLE Scanner Service
 * 
 * Servicio para escanear dispositivos BLE y detectar beacons Minew.
 */

import { BleManager, Device, ScanMode, ScanCallbackType, State } from 'react-native-ble-plx';
import { BlePermissionsService } from './ble-permissions';
import { b64ToHex, parseMinewBeacon, isMinewBeacon } from './minew-parser';
import { BleScannerState, BLE_SCAN_CONFIG } from '@/constants/ble';
import type {
  BleDevice,
  MinewBeacon,
  BleScannerStatus,
  OnDeviceFoundCallback,
  OnBeaconFoundCallback,
  OnErrorCallback,
} from '@/types';

class BleScanner {
  private manager: BleManager | null = null;
  private isScanning: boolean = false;
  private state: BleScannerStatus['state'] = BleScannerState.IDLE;
  private error: string | null = null;
  private devices: Map<string, BleDevice> = new Map();
  private beacons: Map<string, MinewBeacon> = new Map();
  private lastUpdate: number | null = null;

  // Callbacks
  private onDeviceFound: OnDeviceFoundCallback | null = null;
  private onBeaconFound: OnBeaconFoundCallback | null = null;
  private onError: OnErrorCallback | null = null;
  private onStateChange: ((status: BleScannerStatus) => void) | null = null;

  // Throttling
  private lastReportTime: Map<string, number> = new Map();

  /**
   * Obtiene o crea el BleManager (lazy initialization)
   */
  private getManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
      this.setupStateListener();
    }
    return this.manager;
  }

  /**
   * Configura listener para cambios de estado del Bluetooth
   */
  private setupStateListener(): void {
    if (!this.manager) return;

    this.manager.onStateChange((state) => {
      console.log('[BleScanner] Bluetooth state:', state);

      if (state === State.PoweredOff) {
        this.handleError('Bluetooth está apagado. Por favor, enciéndelo.');
        this.stopScan();
      } else if (state === State.Unauthorized) {
        this.handleError('No hay permisos para usar Bluetooth.');
      } else if (state === State.PoweredOn && this.state === BleScannerState.ERROR) {
        this.error = null;
        this.updateState(BleScannerState.IDLE);
      }
    }, true);
  }

  /**
   * Actualiza el estado y notifica
   */
  private updateState(newState: BleScannerStatus['state']): void {
    this.state = newState;
    this.lastUpdate = Date.now();
    this.notifyStateChange();
  }

  /**
   * Notifica cambio de estado
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getStatus());
    }
  }

  /**
   * Maneja errores
   */
  private handleError(message: string): void {
    console.error('[BleScanner] Error:', message);
    this.error = message;
    this.updateState(BleScannerState.ERROR);

    if (this.onError) {
      this.onError(message);
    }
  }

  /**
   * Obtiene el estado actual
   */
  getStatus(): BleScannerStatus {
    return {
      state: this.state,
      isScanning: this.isScanning,
      error: this.error,
      devicesCount: this.devices.size,
      lastUpdate: this.lastUpdate,
    };
  }

  /**
   * Obtiene todos los dispositivos detectados
   */
  getDevices(): BleDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Obtiene todos los beacons Minew detectados
   */
  getBeacons(): MinewBeacon[] {
    return Array.from(this.beacons.values());
  }

  /**
   * Configura callbacks
   */
  setCallbacks(callbacks: {
    onDeviceFound?: OnDeviceFoundCallback;
    onBeaconFound?: OnBeaconFoundCallback;
    onError?: OnErrorCallback;
    onStateChange?: (status: BleScannerStatus) => void;
  }): void {
    this.onDeviceFound = callbacks.onDeviceFound || null;
    this.onBeaconFound = callbacks.onBeaconFound || null;
    this.onError = callbacks.onError || null;
    this.onStateChange = callbacks.onStateChange || null;
  }

  /**
   * Inicia el escaneo BLE
   */
  async startScan(options?: { minewOnly?: boolean }): Promise<boolean> {
    if (this.isScanning) {
      console.log('[BleScanner] Already scanning');
      return true;
    }

    const manager = this.getManager();

    // Verificar permisos
    const permissions = await BlePermissionsService.request();
    if (!permissions.allGranted) {
      this.handleError('Permisos no concedidos');
      return false;
    }

    // Verificar estado del Bluetooth
    const btState = await manager.state();
    if (btState !== State.PoweredOn) {
      this.handleError('Bluetooth no está disponible');
      return false;
    }

    // Limpiar datos anteriores
    this.devices.clear();
    this.beacons.clear();
    this.lastReportTime.clear();
    this.error = null;

    const minewOnly = options?.minewOnly ?? false;

    try {
      this.isScanning = true;
      this.updateState(BleScannerState.SCANNING);

      console.log('[BleScanner] Starting scan...');

      manager.startDeviceScan(
        null,
        {
          allowDuplicates: BLE_SCAN_CONFIG.ALLOW_DUPLICATES,
          scanMode: ScanMode.LowLatency,
          callbackType: ScanCallbackType.AllMatches,
        },
        (error, device) => {
          if (error) {
            console.error('[BleScanner] Scan error:', error.message);
            this.handleError(`Error de escaneo: ${error.message}`);
            this.stopScan();
            return;
          }

          if (device) {
            this.processDevice(device, minewOnly);
          }
        }
      );

      console.log('[BleScanner] Scan started successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.handleError(`Error al iniciar escaneo: ${message}`);
      this.isScanning = false;
      return false;
    }
  }

  /**
   * Procesa un dispositivo detectado
   */
  private processDevice(device: Device, minewOnly: boolean): void {
    const mac = device.id;
    const now = Date.now();

    // Throttling
    const lastReport = this.lastReportTime.get(mac) || 0;
    if (now - lastReport < BLE_SCAN_CONFIG.MIN_REPORT_INTERVAL_MS) {
      return;
    }
    this.lastReportTime.set(mac, now);

    // Convertir manufacturer data
    const manufacturerDataHex = b64ToHex(device.manufacturerData);

    // Si solo queremos Minew, filtrar
    if (minewOnly && !isMinewBeacon(manufacturerDataHex)) {
      return;
    }

    // Crear objeto BleDevice
    const bleDevice: BleDevice = {
      id: mac,
      name: device.name || device.localName || null,
      rssi: device.rssi ?? -100,
      manufacturerData: manufacturerDataHex || null,
      txPowerLevel: device.txPowerLevel ?? null,
      isConnectable: device.isConnectable ?? null,
      lastSeen: now,
    };

    // Guardar dispositivo
    this.devices.set(mac, bleDevice);

    // Notificar dispositivo encontrado
    if (this.onDeviceFound) {
      this.onDeviceFound(bleDevice);
    }

    // Intentar parsear como Minew
    if (manufacturerDataHex) {
      const beacon = parseMinewBeacon(mac, bleDevice.rssi, manufacturerDataHex);

      if (beacon) {
        this.beacons.set(mac, beacon);

        console.log(
          `[BleScanner] Minew beacon: ${mac}, RSSI: ${beacon.rssi}, ` +
            `Temp: ${beacon.temperature ?? 'N/A'}°C, Battery: ${beacon.batteryLevel ?? 'N/A'}%`
        );

        if (this.onBeaconFound) {
          this.onBeaconFound(beacon);
        }
      }
    }

    this.lastUpdate = now;
  }

  /**
   * Detiene el escaneo
   */
  stopScan(): void {
    if (!this.isScanning) {
      return;
    }

    try {
      this.manager?.stopDeviceScan();
    } catch (error) {
      console.warn('[BleScanner] Error stopping scan:', error);
    }

    this.isScanning = false;
    this.updateState(BleScannerState.STOPPED);
    console.log('[BleScanner] Scan stopped');
  }

  /**
   * Destruye el manager
   */
  destroy(): void {
    this.stopScan();
    this.manager?.destroy();
    this.manager = null;
  }

  /**
   * Limpia los dispositivos y beacons
   */
  clearDevices(): void {
    this.devices.clear();
    this.beacons.clear();
    this.lastReportTime.clear();
    this.notifyStateChange();
  }
}

// Singleton - pero NO se inicializa BleManager hasta que se use
export const bleScanner = new BleScanner();

export { BleScanner };