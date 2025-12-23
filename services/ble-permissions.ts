// services/ble-permissions.ts
import { Platform, PermissionsAndroid } from 'react-native';

export interface BlePermissions {
  bluetooth: boolean;
  bluetoothScan: boolean;
  bluetoothConnect: boolean;
  location: boolean;
  allGranted: boolean;
  /** 
   * ✅ NUEVO: Indica si algún permiso fue denegado permanentemente
   * En Android, después de 2 rechazos, el sistema ya no muestra el diálogo
   */
  canAskAgain: boolean;
}

export const BlePermissionsService = {
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
   * También verifica si se puede volver a preguntar
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

      // ✅ Si todos están concedidos, canAskAgain es irrelevante (true)
      // Si no están concedidos, necesitamos verificar con request para saber si canAskAgain
      return {
        bluetooth: true,
        bluetoothScan,
        bluetoothConnect,
        location,
        allGranted,
        canAskAgain: allGranted ? true : true, // Se determinará en request()
      };
    } else {
      // Android 11 y anteriores - solo necesita ubicación
      const location = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return {
        bluetooth: true,
        bluetoothScan: true,
        bluetoothConnect: true,
        location,
        allGranted: location,
        canAskAgain: location ? true : true,
      };
    }
  },

  /**
   * Android: Solicitar permisos
   * ✅ CORREGIDO: Ahora detecta 'never_ask_again' para saber si debe ir a configuración
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

        // ✅ NUEVO: Detectar si algún permiso fue denegado permanentemente
        const hasNeverAskAgain = 
          bluetoothScanResult === 'never_ask_again' ||
          bluetoothConnectResult === 'never_ask_again' ||
          locationResult === 'never_ask_again';

        // canAskAgain es false si algún permiso tiene 'never_ask_again'
        const canAskAgain = !hasNeverAskAgain;

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