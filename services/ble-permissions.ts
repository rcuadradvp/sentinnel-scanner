// services/ble-permissions.ts
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ✅ NUEVO: Key para persistir el estado de "never_ask_again"
 */
const BLE_PERMISSIONS_DENIED_KEY = '@ble_permissions_denied_permanently';

export interface BlePermissions {
  bluetooth: boolean;
  bluetoothScan: boolean;
  bluetoothConnect: boolean;
  location: boolean;
  allGranted: boolean;
  /** 
   * ✅ Indica si algún permiso fue denegado permanentemente
   * En Android, después de 2 rechazos, el sistema ya no muestra el diálogo
   */
  canAskAgain: boolean;
}

export const BlePermissionsService = {
  /**
   * ✅ NUEVO: Guardar estado de denegación permanente
   */
  async setDeniedPermanently(denied: boolean): Promise<void> {
    try {
      if (denied) {
        await AsyncStorage.setItem(BLE_PERMISSIONS_DENIED_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(BLE_PERMISSIONS_DENIED_KEY);
      }
    } catch (error) {
      console.error('[BlePermissions] Error saving denied state:', error);
    }
  },

  /**
   * ✅ NUEVO: Verificar si fue denegado permanentemente (para check())
   */
  async wasDeniedPermanently(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BLE_PERMISSIONS_DENIED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('[BlePermissions] Error reading denied state:', error);
      return false;
    }
  },

  /**
   * ✅ NUEVO: Resetear el estado cuando los permisos son concedidos
   * (útil si el usuario los habilita manualmente en configuración)
   */
  async clearDeniedState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BLE_PERMISSIONS_DENIED_KEY);
    } catch (error) {
      console.error('[BlePermissions] Error clearing denied state:', error);
    }
  },

  /**
   * Verifica todos los permisos necesarios
   */
  async check(): Promise<BlePermissions> {
    if (Platform.OS === 'ios') {
      return this.checkiOS();
    }
    return this.checkAndroid();
  },

  /**
   * Solicita todos los permisos necesarios
   * NO muestra alerts nativos - retorna el estado de permisos
   */
  async request(): Promise<BlePermissions> {
    if (Platform.OS === 'ios') {
      return this.requestiOS();
    }
    return this.requestAndroid();
  },

  /**
   * iOS: Verificar permisos
   */
  async checkiOS(): Promise<BlePermissions> {
    // En iOS, los permisos se manejan automáticamente por el sistema
    return {
      bluetooth: true,
      bluetoothScan: true,
      bluetoothConnect: true,
      location: true,
      allGranted: true,
      canAskAgain: true,
    };
  },

  /**
   * iOS: Solicitar permisos
   */
  async requestiOS(): Promise<BlePermissions> {
    return {
      bluetooth: true,
      bluetoothScan: true,
      bluetoothConnect: true,
      location: true,
      allGranted: true,
      canAskAgain: true,
    };
  },

  /**
   * Android: Verificar permisos
   * ✅ CORREGIDO: Ahora también verifica el estado persistido de canAskAgain
   */
  async checkAndroid(): Promise<BlePermissions> {
    const apiLevel = Platform.Version as number;

    if (apiLevel >= 31) {
      // Android 12+
      const bluetoothScan = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      const bluetoothConnect = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      const location = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      const allGranted = bluetoothScan && bluetoothConnect && location;

      // ✅ CORREGIDO: Si todos están concedidos, limpiar el estado de denegación
      if (allGranted) {
        await this.clearDeniedState();
        return {
          bluetooth: true,
          bluetoothScan,
          bluetoothConnect,
          location,
          allGranted,
          canAskAgain: true, // Irrelevante si ya están concedidos
        };
      }

      // ✅ NUEVO: Si no están concedidos, verificar si fue denegado permanentemente
      const wasDenied = await this.wasDeniedPermanently();
      
      return {
        bluetooth: true,
        bluetoothScan,
        bluetoothConnect,
        location,
        allGranted,
        canAskAgain: !wasDenied,
      };
    } else {
      // Android 11 y anteriores - solo necesita ubicación
      const location = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (location) {
        await this.clearDeniedState();
        return {
          bluetooth: true,
          bluetoothScan: true,
          bluetoothConnect: true,
          location,
          allGranted: location,
          canAskAgain: true,
        };
      }

      const wasDenied = await this.wasDeniedPermanently();

      return {
        bluetooth: true,
        bluetoothScan: true,
        bluetoothConnect: true,
        location,
        allGranted: location,
        canAskAgain: !wasDenied,
      };
    }
  },

  /**
   * Android: Solicitar permisos
   * ✅ CORREGIDO: Ahora persiste el estado 'never_ask_again'
   */
  async requestAndroid(): Promise<BlePermissions> {
    const apiLevel = Platform.Version as number;

    try {
      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const bluetoothScanResult = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN];
        const bluetoothConnectResult = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT];
        const locationResult = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        const bluetoothScan = bluetoothScanResult === 'granted';
        const bluetoothConnect = bluetoothConnectResult === 'granted';
        const location = locationResult === 'granted';
        const allGranted = bluetoothScan && bluetoothConnect && location;

        // Detectar si algún permiso fue denegado permanentemente
        const hasNeverAskAgain = 
          bluetoothScanResult === 'never_ask_again' ||
          bluetoothConnectResult === 'never_ask_again' ||
          locationResult === 'never_ask_again';

        // canAskAgain es false si algún permiso tiene 'never_ask_again'
        const canAskAgain = !hasNeverAskAgain;

        // ✅ NUEVO: Persistir el estado de denegación permanente
        if (hasNeverAskAgain) {
          await this.setDeniedPermanently(true);
        } else if (allGranted) {
          // Si todos están concedidos, limpiar el estado
          await this.clearDeniedState();
        }

        console.log('[BlePermissions] Request results:', {
          bluetoothScan: bluetoothScanResult,
          bluetoothConnect: bluetoothConnectResult,
          location: locationResult,
          canAskAgain,
        });

        return {
          bluetooth: true,
          bluetoothScan,
          bluetoothConnect,
          location,
          allGranted,
          canAskAgain,
        };
      } else {
        // Android 11 y anteriores
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        const location = result === 'granted';
        const canAskAgain = result !== 'never_ask_again';

        // ✅ NUEVO: Persistir el estado de denegación permanente
        if (result === 'never_ask_again') {
          await this.setDeniedPermanently(true);
        } else if (location) {
          await this.clearDeniedState();
        }

        console.log('[BlePermissions] Location result:', result, 'canAskAgain:', canAskAgain);

        return {
          bluetooth: true,
          bluetoothScan: true,
          bluetoothConnect: true,
          location,
          allGranted: location,
          canAskAgain,
        };
      }
    } catch (error) {
      console.error('[BlePermissions] Error requesting permissions:', error);
      return {
        bluetooth: false,
        bluetoothScan: false,
        bluetoothConnect: false,
        location: false,
        allGranted: false,
        canAskAgain: false,
      };
    }
  },
};