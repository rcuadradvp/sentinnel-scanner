// screens/scanner/ScannerScreen/ScannerScreen.tsx
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { useMinewScanner } from '@/hooks/useMinewScanner';
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

  const handleToggleScan = useCallback(async () => {
    if (isScanning) {
      await stopScan();
    } else {
      const success = await startScan();
      
      // Si falla, mostrar modal de permisos
      if (!success && error?.includes('permiso')) {
        setPermissionDenied(true);
        setShowPermissionModal(true);
      }
    }
  }, [isScanning, startScan, stopScan, error]);

  const handleRefresh = useCallback(() => {
    clearDevices();
    if (!isScanning) {
      startScan();
    }
  }, [isScanning, startScan, clearDevices]);

  const handlePermissionConfirm = async () => {
    if (permissionDenied) {
      // Abrir configuración del sistema
      await Linking.openSettings();
    } else {
      // Intentar iniciar escaneo de nuevo
      await startScan();
    }
    setShowPermissionModal(false);
  };

  const handlePermissionClose = () => {
    setShowPermissionModal(false);
    setPermissionDenied(false);
  };

  return (
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

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionClose}
        onConfirm={handlePermissionConfirm}
        type="bluetooth"
        showManualWarning={permissionDenied}
      />
    </SafeAreaView>
  );
}