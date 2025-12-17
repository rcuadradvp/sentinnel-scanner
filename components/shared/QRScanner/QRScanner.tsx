// components/shared/QRScanner/QRScanner.tsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Icon } from '@/components/ui/icon';
import { Camera, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.55;
const CAMERA_HEIGHT = 380;

export interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  instructionText?: string;
  tipText?: string;
}

export function QRScanner({ 
  onScan, 
  isScanning,
  instructionText = 'Apunta al código QR',
  tipText = '💡 Toca la pantalla si no enfoca bien',
}: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [showTapIndicator, setShowTapIndicator] = useState(false);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!isScanning) {
      setHasScanned(false);
    }
  }, [isScanning]);

  const handleTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setTapPosition({ x: locationX, y: locationY });
    setShowTapIndicator(true);
    
    setTimeout(() => {
      setShowTapIndicator(false);
    }, 800);
  };

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

  if (!permission.granted) {
    return (
      <View style={[styles.container, { height: CAMERA_HEIGHT, backgroundColor: '#f3f4f6' }]}>
        <VStack className="items-center gap-4 px-6">
          <View className="bg-primary-100 p-4 rounded-full">
            <Icon as={Camera} size="xl" className="text-primary-600" />
          </View>
          
          <VStack className="items-center gap-2">
            <Text className="text-center text-typography-900 font-semibold text-lg">
              Acceso a la cámara
            </Text>
            <Text className="text-center text-typography-600 text-sm">
              Se necesita acceso a la cámara para escanear códigos QR
            </Text>
          </VStack>

          <LoadingButton 
            onPress={requestPermission} 
            variant="primary"
            className="mt-2"
          >
            Permitir acceso
          </LoadingButton>

          {permission.canAskAgain === false && (
            <HStack className="items-start gap-2 bg-warning-50 p-3 rounded-lg mt-2">
              <Icon as={AlertCircle} size="sm" className="text-warning-600 mt-0.5" />
              <Text className="text-xs text-warning-700 flex-1">
                Activa los permisos manualmente en la configuración de tu dispositivo
              </Text>
            </HStack>
          )}
        </VStack>
      </View>
    );
  }

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
        
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            {instructionText}
          </Text>
          <Text style={styles.tapHint}>
            {tipText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  tapIndicator: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instruction: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    fontWeight: '500',
  },
  tapHint: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginTop: 6,
    fontWeight: '400',
  },
});