/**
 * useMinewScanner Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform, Linking, Alert } from 'react-native';
import { 
  minewScanner, 
  MinewBeacon, 
  BluetoothState, 
} from '@/services/minew-scanner';
import { BlePermissionsService } from '@/services/ble-permissions';
import type { BlePermissions } from '@/types';

interface UseMinewScanner {
  isScanning: boolean;
  isInitialized: boolean;
  bluetoothState: BluetoothState | null;
  beacons: MinewBeacon[];
  error: string | null;
  startScan: () => Promise<boolean>;
  stopScan: () => Promise<void>;
  clearDevices: () => void;
}

export function useMinewScanner(): UseMinewScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState | null>(null);
  const [beacons, setBeacons] = useState<MinewBeacon[]>([]);
  const [error, setError] = useState<string | null>(null);

  const appState = useRef(AppState.currentState);
  const beaconsMapRef = useRef<Map<string, MinewBeacon>>(new Map());

  /**
   * Inicializa el SDK
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setError('Minew SDK solo disponible en Android');
      return false;
    }

    if (!minewScanner.isModuleAvailable()) {
      setError('Módulo nativo no disponible');
      return false;
    }

    try {
      setError(null);
      const success = await minewScanner.initialize();
      setIsInitialized(success);

      if (success) {
        const btState = await minewScanner.getBluetoothState();
        setBluetoothState(btState);
      } else {
        const initError = minewScanner.getInitError();
        setError(initError || 'No se pudo inicializar el SDK');
      }

      return success;
    } catch (err: any) {
      const message = err?.message || 'Error al inicializar';
      setError(message);
      return false;
    }
  }, []);

  /**
   * Solicita permisos y muestra popup del sistema
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const perms = await BlePermissionsService.request();
    
    if (!perms.allGranted) {
      // Si los permisos fueron denegados permanentemente, abrir configuración
      const currentPerms = await BlePermissionsService.check();
      if (!currentPerms.allGranted) {
        Alert.alert(
          'Permisos necesarios',
          'Para escanear beacons necesitas conceder permisos de Bluetooth y ubicación.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Abrir configuración', 
              onPress: () => Linking.openSettings() 
            },
          ]
        );
        return false;
      }
    }
    
    return perms.allGranted;
  }, []);

  /**
   * Inicia el escaneo - solicita permisos automáticamente si es necesario
   */
  const startScan = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      // Verificar y solicitar permisos
      const currentPerms = await BlePermissionsService.check();
      if (!currentPerms.allGranted) {
        const granted = await requestPermissions();
        if (!granted) {
          return false;
        }
      }

      // Inicializar si no está inicializado
      if (!isInitialized) {
        const initialized = await initialize();
        if (!initialized) {
          return false;
        }
      }

      // Verificar Bluetooth
      const btState = await minewScanner.getBluetoothState();
      setBluetoothState(btState);

      if (!btState?.isOn) {
        setError('Bluetooth está apagado. Por favor, enciéndelo.');
        Alert.alert(
          'Bluetooth apagado',
          'Necesitas encender el Bluetooth para escanear beacons.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Limpiar beacons anteriores
      beaconsMapRef.current.clear();
      setBeacons([]);

      const success = await minewScanner.startScan();
      if (success) {
        setIsScanning(true);
      } else {
        const initError = minewScanner.getInitError();
        setError(initError || 'No se pudo iniciar el escaneo');
      }

      return success;
    } catch (err: any) {
      const message = err?.message || 'Error al iniciar escaneo';
      setError(message);
      return false;
    }
  }, [isInitialized, initialize, requestPermissions]);

  /**
   * Detiene el escaneo
   */
  const stopScan = useCallback(async (): Promise<void> => {
    await minewScanner.stopScan();
    setIsScanning(false);
  }, []);

  /**
   * Limpia dispositivos
   */
  const clearDevices = useCallback((): void => {
    beaconsMapRef.current.clear();
    setBeacons([]);
    minewScanner.clearCache();
  }, []);

  /**
   * Configura callbacks del scanner
   */
  useEffect(() => {
    minewScanner.setCallbacks({
      onBeaconFound: (beacon) => {
        beaconsMapRef.current.set(beacon.mac, beacon);
        setBeacons(Array.from(beaconsMapRef.current.values()));
      },
      onScanStateChanged: (state) => {
        setIsScanning(state.isScanning);
      },
      onBluetoothStateChanged: (state) => {
        setBluetoothState(state);
        if (!state.isOn && isScanning) {
          setIsScanning(false);
          setError('Bluetooth se ha apagado');
        }
      },
      onError: (errorMsg) => {
        setError(errorMsg);
      },
    });

    return () => {
      minewScanner.setCallbacks({});
    };
  }, [isScanning]);

  /**
   * Manejar cambios de estado de la app
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App vuelve a foreground - verificar estado del bluetooth
        const btState = await minewScanner.getBluetoothState();
        setBluetoothState(btState);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return {
    isScanning,
    isInitialized,
    bluetoothState,
    beacons,
    error,
    startScan,
    stopScan,
    clearDevices,
  };
}