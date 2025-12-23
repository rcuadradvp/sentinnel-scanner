// screens/scanner/ScannerScreen/ScannerScreen.tsx
import { useCallback, useMemo, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { useMinewScanner } from '@/hooks/useMinewScanner';
import { BlePermissionsService } from '@/services/ble-permissions';
import { ScannerHeader } from '@/components/scanner/ScannerHeader';
import { BeaconList } from '@/components/scanner/BeaconList';
import { PermissionModal } from '@/components/shared/PermissionModal';

export function ScannerScreen() {
  const {
    isScanning,
    beacons,
    error,
    startScan,
    stopScan,
    clearDevices,
  } = useMinewScanner();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  /**
   * ✅ CORREGIDO: Ahora usamos este estado para indicar si el usuario
   * debe ir a configuración manualmente (porque ya no puede pedir permisos)
   */
  const [mustOpenSettings, setMustOpenSettings] = useState(false);

  const sortedBeacons = useMemo(() => {
    return [...beacons].sort((a, b) => {
      // Primero por RSSI (señal más fuerte primero)
      if (b.rssi !== a.rssi) {
        return b.rssi - a.rssi;
      }
      // Luego por nombre
      const nameA = a.name || a.mac;
      const nameB = b.name || b.mac;
      return nameA.localeCompare(nameB);
    });
  }, [beacons]);

  // Verificar permisos al montar el componente
  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    const perms = await BlePermissionsService.check();
    if (!perms.allGranted) {
      console.log('[ScannerScreen] Permissions not granted on mount');
    }
  };

  const handleToggleScan = useCallback(async () => {
    if (isScanning) {
      await stopScan();
      return;
    }

    // Verificar permisos ANTES de intentar escanear
    const perms = await BlePermissionsService.check();
    
    if (!perms.allGranted) {
      console.log('[ScannerScreen] Permissions not granted, showing modal');
      // ✅ Resetear el estado - aún no sabemos si debe ir a settings
      setMustOpenSettings(false);
      setShowPermissionModal(true);
      return;
    }

    const success = await startScan();
    
    // Si falla después de tener permisos, podría ser un problema de Bluetooth
    if (!success) {
      const errorMessage = error?.toLowerCase() || '';
      if (errorMessage.includes('permiso') || errorMessage.includes('permission')) {
        console.log('[ScannerScreen] Scan failed due to permissions');
        setMustOpenSettings(true);
        setShowPermissionModal(true);
      }
    }
  }, [isScanning, startScan, stopScan, error]);

  const handleRefresh = useCallback(() => {
    clearDevices();
    if (!isScanning) {
      handleToggleScan();
    }
  }, [isScanning, clearDevices, handleToggleScan]);

  /**
   * ✅ CORREGIDO: Manejo correcto del botón de confirmar en el modal
   */
  const handlePermissionConfirm = async () => {
    if (mustOpenSettings) {
      // Ya sabemos que debe ir a configuración
      console.log('[ScannerScreen] Opening settings (user already denied permanently)');
      await Linking.openSettings();
      setShowPermissionModal(false);
      return;
    }

    // Intentar solicitar permisos
    console.log('[ScannerScreen] Requesting permissions');
    const perms = await BlePermissionsService.request();
    
    if (perms.allGranted) {
      // ✅ Permisos concedidos - cerrar modal e iniciar escaneo
      setShowPermissionModal(false);
      setMustOpenSettings(false);
      await startScan();
    } else if (!perms.canAskAgain) {
      // ✅ NUEVO: El usuario denegó permanentemente (never_ask_again)
      // Ahora debe ir a configuración manualmente
      console.log('[ScannerScreen] Permissions denied permanently, must open settings');
      setMustOpenSettings(true);
      // No cerramos el modal - actualizamos para mostrar el warning
    } else {
      // Usuario denegó pero puede volver a preguntar
      console.log('[ScannerScreen] Permissions denied, can ask again');
      // Mantenemos el modal abierto para que pueda intentar de nuevo
    }
  };

  const handlePermissionClose = () => {
    setShowPermissionModal(false);
    setMustOpenSettings(false);
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-background-50" edges={['top']}>
        <ScannerHeader
          isScanning={isScanning}
          beaconCount={beacons.length}
          error={error}
          onToggleScan={handleToggleScan}
        />
        
        <BeaconList
          beacons={sortedBeacons}
          isScanning={isScanning}
          onRefresh={handleRefresh}
        />
      </SafeAreaView>

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionClose}
        onConfirm={handlePermissionConfirm}
        type="bluetooth"
        /**
         * ✅ CORREGIDO: Mostrar warning de configuración manual
         * cuando mustOpenSettings es true
         */
        showManualWarning={mustOpenSettings}
        /**
         * ✅ NUEVO: Cambiar el texto del botón según el estado
         */
        title={mustOpenSettings ? 'Permisos requeridos' : undefined}
        description={
          mustOpenSettings 
            ? 'Los permisos fueron denegados. Debes habilitarlos manualmente en la configuración del dispositivo.'
            : undefined
        }
      />
    </>
  );
}