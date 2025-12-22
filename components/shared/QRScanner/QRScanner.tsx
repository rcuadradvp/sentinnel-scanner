// components/shared/QRScanner/QRScanner.tsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Camera, AlertCircle } from 'lucide-react-native';
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

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    
    // Si el usuario deniega los permisos y no puede volver a pedir
    if (!result.granted && !result.canAskAgain) {
      console.log('[QRScanner] Permission permanently denied');
    }
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
          <VStack className="bg-primary-100 p-4 rounded-full">
            <Icon as={Camera} size="xl" className="text-primary-600" />
          </VStack>
          
          <VStack className="items-center gap-2">
            <Text className="text-center text-typography-900 font-semibold text-lg">
              Acceso a la cámara
            </Text>
            <Text className="text-center text-typography-600 text-sm">
              Se necesita acceso a la cámara para escanear códigos QR
            </Text>
          </VStack>

          <Button 
            onPress={handleRequestPermission} 
            className="bg-primary-500 mt-2"
          >
            <ButtonText>Permitir acceso</ButtonText>
          </Button>

          {!permission.canAskAgain && (
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