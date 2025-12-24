// components/shared/QRScanner/QRScanner.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  Pressable,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Camera, AlertTriangle, Settings } from 'lucide-react-native';
import { Button, ButtonText } from '@/components/ui/button';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.55;
const CAMERA_HEIGHT = 380;

export interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  tipText?: string;
}

export function QRScanner({ 
  onScan, 
  isScanning,
  tipText = 'Apunta al código QR',
}: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [showTapIndicator, setShowTapIndicator] = useState(false);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
  
  /**
   * ✅ NUEVO: Ref para trackear si estamos esperando que el usuario
   * vuelva de la configuración
   */
  const waitingForSettingsReturn = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isScanning) {
      setHasScanned(false);
    }
  }, [isScanning]);

  /**
   * ✅ NUEVO: Manejar cambios de estado de la app
   * para detectar cuando el usuario vuelve de configuración
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        waitingForSettingsReturn.current
      ) {
        console.log('[QRScanner] App returned from background, re-checking permissions...');
        // El hook useCameraPermissions se actualiza automáticamente
        // pero podemos forzar una re-verificación
        waitingForSettingsReturn.current = false;
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setTapPosition({ x: locationX, y: locationY });
    setShowTapIndicator(true);
    
    setTimeout(() => {
      setShowTapIndicator(false);
    }, 800);
  };

  /**
   * ✅ CORREGIDO: Manejar el botón según el estado de canAskAgain
   */
  const handlePermissionAction = async () => {
    if (permission && !permission.canAskAgain) {
      // No puede pedir permisos - abrir configuración
      console.log('[QRScanner] Opening settings (permission permanently denied)');
      waitingForSettingsReturn.current = true;
      await Linking.openSettings();
    } else {
      // Puede pedir permisos normalmente
      const result = await requestPermission();
      
      if (!result.granted && !result.canAskAgain) {
        console.log('[QRScanner] Permission permanently denied');
      }
    }
  };

  // Loading state
  if (!permission) {
    return (
      <View style={[styles.container, { height: CAMERA_HEIGHT }]}>
        <VStack className="items-center gap-3">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-typography-600">Cargando cámara...</Text>
        </VStack>
      </View>
    );
  }

  // Permission not granted state
  if (!permission.granted) {
    const mustOpenSettings = !permission.canAskAgain;

    return (
      <View style={[styles.container, { height: CAMERA_HEIGHT, backgroundColor: '#f3f4f6' }]}>
        <VStack className="items-center gap-4 px-6">
          {/* Icono - cambia según el estado */}
          <VStack className={`p-4 rounded-full ${mustOpenSettings ? 'bg-warning-100' : 'bg-primary-100'}`}>
            <Icon 
              as={mustOpenSettings ? Settings : Camera} 
              size="xl" 
              className={mustOpenSettings ? 'text-warning-600' : 'text-primary-600'} 
            />
          </VStack>
          
          {/* Título y descripción - cambian según el estado */}
          <VStack className="items-center gap-2">
            <Text className="text-center text-typography-900 font-semibold text-lg">
              {mustOpenSettings ? 'Permisos requeridos' : 'Acceso a la cámara'}
            </Text>
            <Text className="text-center text-typography-600 text-sm">
              {mustOpenSettings 
                ? 'Los permisos fueron denegados. Debes habilitarlos manualmente en la configuración del dispositivo.'
                : 'Se necesita acceso a la cámara para escanear códigos QR'
              }
            </Text>
          </VStack>

          {/* Botón - cambia según el estado */}
          <Button 
            onPress={handlePermissionAction} 
            className={`mt-2 ${mustOpenSettings ? 'bg-warning-500' : 'bg-primary-500'}`}
          >
            <ButtonText>
              {mustOpenSettings ? 'Abrir configuración' : 'Permitir acceso'}
            </ButtonText>
          </Button>

          {/* Warning adicional cuando debe ir a configuración */}
          {mustOpenSettings && (
            <HStack className="items-start gap-2 bg-warning-50 p-3 rounded-lg mt-2">
              <Icon as={AlertTriangle} size="sm" className="text-warning-600 mt-0.5" />
              <Text className="text-xs text-warning-700 flex-1">
                Busca "Cámara" en los permisos de la aplicación y actívalo
              </Text>
            </HStack>
          )}
        </VStack>
      </View>
    );
  }

  // Camera view when permission is granted
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (hasScanned || !isScanning) return;
    
    setHasScanned(true);
    onScan(data);
  };

  return (
    <Pressable 
      style={[styles.container, { height: CAMERA_HEIGHT }]}
      onPress={handleTap}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        autofocus="on"
      />
      
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.scanArea, { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE }]}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        {showTapIndicator && (
          <View 
            style={[
              styles.tapIndicator, 
              { 
                left: tapPosition.x - 30, 
                top: tapPosition.y - 30 
              }
            ]}
          />
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.tipText}>{tipText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  tapIndicator: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    opacity: 0.6,
  },
  textContainer: {
    position: 'absolute',
    bottom: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  tipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});