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
  const [permissionDenied, setPermissionDenied] = useState(false);

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

  // ✅ Verificar permisos al montar el componente
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
    } else {
      // ✅ Verificar permisos ANTES de intentar escanear
      const perms = await BlePermissionsService.check();
      
      if (!perms.allGranted) {
        console.log('[ScannerScreen] Permissions not granted, showing modal');
        setPermissionDenied(false);
        setShowPermissionModal(true);
        return;
      }

      const success = await startScan();
      
      // ✅ Si falla después de tener permisos, mostrar modal
      if (!success) {
        const errorMessage = error?.toLowerCase() || '';
        if (errorMessage.includes('permiso') || errorMessage.includes('permission')) {
          console.log('[ScannerScreen] Scan failed due to permissions');
          setPermissionDenied(true);
          setShowPermissionModal(true);
        }
      }
    }
  }, [isScanning, startScan, stopScan, error]);

  const handleRefresh = useCallback(() => {
    clearDevices();
    if (!isScanning) {
      handleToggleScan();
    }
  }, [isScanning, clearDevices, handleToggleScan]);

  const handlePermissionConfirm = async () => {
    if (permissionDenied) {
      // Abrir configuración del sistema
      console.log('[ScannerScreen] Opening settings');
      await Linking.openSettings();
      setShowPermissionModal(false);
    } else {
      // Intentar solicitar permisos de nuevo
      console.log('[ScannerScreen] Requesting permissions');
      const perms = await BlePermissionsService.request();
      
      if (perms.allGranted) {
        setShowPermissionModal(false);
        // Intentar escanear automáticamente
        await startScan();
      } else {
        // Si no se concedieron, marcar como denegado permanentemente
        setPermissionDenied(true);
      }
    }
  };

  const handlePermissionClose = () => {
    setShowPermissionModal(false);
    setPermissionDenied(false);
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
        showManualWarning={permissionDenied}
      />
    </>
  );
}