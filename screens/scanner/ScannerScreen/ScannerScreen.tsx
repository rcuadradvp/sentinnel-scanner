// screens/scanner/ScannerScreen/ScannerScreen.tsx
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, AppState, AppStateStatus } from 'react-native';
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
  const [mustOpenSettings, setMustOpenSettings] = useState(false);
  const waitingForSettingsReturn = useRef(false);
  const appState = useRef(AppState.currentState);

  const sortedBeacons = useMemo(() => {
    return [...beacons].sort((a, b) => {
      if (b.rssi !== a.rssi) {
        return b.rssi - a.rssi;
      }
      const nameA = a.name || a.mac;
      const nameB = b.name || b.mac;
      return nameA.localeCompare(nameB);
    });
  }, [beacons]);


  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        waitingForSettingsReturn.current
      ) {
        const perms = await BlePermissionsService.check();
        
        if (perms.allGranted) {
          setMustOpenSettings(false);
          setShowPermissionModal(false);
          waitingForSettingsReturn.current = false;
        } else {
        }
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    const perms = await BlePermissionsService.check();
    if (!perms.allGranted) {
    }
  };

  const handleToggleScan = useCallback(async () => {
    if (isScanning) {
      await stopScan();
      return;
    }

    const perms = await BlePermissionsService.check();
    
    if (!perms.allGranted) {      
      const shouldOpenSettings = !perms.canAskAgain;
      setMustOpenSettings(shouldOpenSettings);
      setShowPermissionModal(true);
      return;
    }

    const success = await startScan();
    
    if (!success) {
      const errorMessage = error?.toLowerCase() || '';
      if (errorMessage.includes('permiso') || errorMessage.includes('permission')) {
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

  const handlePermissionConfirm = async () => {
    if (mustOpenSettings) {
      waitingForSettingsReturn.current = true;
      await Linking.openSettings();
      return;
    }

    const perms = await BlePermissionsService.request();
    
    if (perms.allGranted) {
      setShowPermissionModal(false);
      setMustOpenSettings(false);
      await startScan();
    } else if (!perms.canAskAgain) {
      setMustOpenSettings(true);
    } else {
    }
  };

  const handlePermissionClose = () => {
    setShowPermissionModal(false);
    waitingForSettingsReturn.current = false;
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

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionClose}
        onConfirm={handlePermissionConfirm}
        type="bluetooth"
        showManualWarning={mustOpenSettings}
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