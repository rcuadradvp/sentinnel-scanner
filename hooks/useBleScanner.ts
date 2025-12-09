/**
 * useBleScanner Hook
 * 
 * Hook para usar el scanner BLE en componentes React.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { bleScanner } from '@/services/ble-scanner';
import { BlePermissionsService } from '@/services/ble-permissions';
import type { BleDevice, MinewBeacon, BleScannerStatus, BlePermissions } from '@/types';
import { BleScannerState } from '@/constants/ble';

interface UseBleScanner {
  // Estado
  status: BleScannerStatus;
  devices: BleDevice[];
  beacons: MinewBeacon[];
  permissions: BlePermissions | null;
  // Acciones
  startScan: (minewOnly?: boolean) => Promise<boolean>;
  stopScan: () => void;
  requestPermissions: () => Promise<boolean>;
  clearDevices: () => void;
}

export function useBleScanner(): UseBleScanner {
  const [status, setStatus] = useState<BleScannerStatus>({
    state: BleScannerState.IDLE,
    isScanning: false,
    error: null,
    devicesCount: 0,
    lastUpdate: null,
  });
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [beacons, setBeacons] = useState<MinewBeacon[]>([]);
  const [permissions, setPermissions] = useState<BlePermissions | null>(null);

  const appState = useRef(AppState.currentState);

  /**
   * Configura callbacks del scanner
   */
  useEffect(() => {
    bleScanner.setCallbacks({
      onDeviceFound: (device) => {
        setDevices((prev) => {
          const index = prev.findIndex((d) => d.id === device.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = device;
            return updated;
          }
          return [...prev, device];
        });
      },
      onBeaconFound: (beacon) => {
        setBeacons((prev) => {
          const index = prev.findIndex((b) => b.mac === beacon.mac);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = beacon;
            return updated;
          }
          return [...prev, beacon];
        });
      },
      onError: (error) => {
        console.error('[useBleScanner] Error:', error);
      },
      onStateChange: (newStatus) => {
        setStatus(newStatus);
      },
    });

    // Verificar permisos iniciales
    checkPermissions();

    // Cleanup
    return () => {
      bleScanner.setCallbacks({});
    };
  }, []);

  /**
   * Manejar cambios de estado de la app
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App va a background - podríamos detener escaneo
        // O mantenerlo según la necesidad
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App vuelve a foreground - verificar permisos
        checkPermissions();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  /**
   * Verifica permisos
   */
  const checkPermissions = async (): Promise<void> => {
    const perms = await BlePermissionsService.check();
    setPermissions(perms);
  };

  /**
   * Solicita permisos
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const perms = await BlePermissionsService.request();
    setPermissions(perms);
    return perms.allGranted;
  }, []);

  /**
   * Inicia escaneo
   */
  const startScan = useCallback(async (minewOnly: boolean = false): Promise<boolean> => {
    setDevices([]);
    setBeacons([]);
    return bleScanner.startScan({ minewOnly });
  }, []);

  /**
   * Detiene escaneo
   */
  const stopScan = useCallback((): void => {
    bleScanner.stopScan();
  }, []);

  /**
   * Limpia dispositivos
   */
  const clearDevices = useCallback((): void => {
    bleScanner.clearDevices();
    setDevices([]);
    setBeacons([]);
  }, []);

  return {
    status,
    devices,
    beacons,
    permissions,
    startScan,
    stopScan,
    requestPermissions,
    clearDevices,
  };
}