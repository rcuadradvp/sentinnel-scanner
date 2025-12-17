// components/devices/AddDeviceModal/AddDeviceModal.tsx
// ✅ SOLUCIÓN REAL - Cierra el modal principal antes de mostrar alert

import { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Modal as RNModal, StyleSheet } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@/components/ui/modal';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { SquareX , AlertCircle, CheckCircle } from 'lucide-react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { QRScanner } from '@/components/devices/QRScanner';
import { DeviceForm } from '@/components/devices/DeviceForm';
import { ManualMACInput } from '@/components/devices/ManualMACInput';
import { useAddDevice } from '@/hooks';
import { extractMACFromQR } from '@/utils/mac';
import type { DevicePriority } from '@/types';

type Step = 'scanner' | 'manual' | 'form';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddDeviceModal({ isOpen, onClose, onSuccess }: AddDeviceModalProps) {
  const [step, setStep] = useState<Step>('scanner');
  const [scannedMAC, setScannedMAC] = useState<string | null>(null);
  const { addDevice, validateMAC, isLoading, error, clearError } = useAddDevice();
  
  // ⭐ CLAVE: Estados para controlar visibilidad de modales
  const [showMainModal, setShowMainModal] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<{
    type: 'invalidQR' | 'invalidMAC' | 'success' | null;
    message?: string;
    deviceName?: string;
  }>({ type: null });
  
  // KEY para resetear el scanner
  const [scannerKey, setScannerKey] = useState(0);

  // Sincronizar showMainModal con isOpen
  useEffect(() => {
    if (isOpen && !pendingAlert.type) {
      setShowMainModal(true);
    } else if (!isOpen) {
      setShowMainModal(false);
      const timer = setTimeout(() => {
        setStep('scanner');
        setScannedMAC(null);
        clearError();
        setScannerKey(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, pendingAlert.type, clearError]);

  const handleClose = useCallback(() => {
    setShowMainModal(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  const resetScanner = useCallback(() => {
    setScannerKey(prev => prev + 1);
  }, []);

  // ⭐ Muestra alert DESPUÉS de cerrar el modal principal
  const showAlert = useCallback((type: 'invalidQR' | 'invalidMAC' | 'success', data?: any) => {
    // 1. Cerrar modal principal
    setShowMainModal(false);
    
    // 2. Esperar animación de cierre
    setTimeout(() => {
      // 3. Mostrar alert
      setPendingAlert({
        type,
        message: data?.message,
        deviceName: data?.deviceName,
      });
    }, 350);
  }, []);

  const handleQRScan = useCallback(async (qrData: string) => {
    console.log('[AddDeviceModal] QR escaneado:', qrData);
    const mac = extractMACFromQR(qrData);
    
    if (!mac) {
      showAlert('invalidQR', { 
        message: 'No se pudo extraer la dirección MAC del código QR' 
      });
      return;
    }

    const validation = await validateMAC(mac);
    
    if (!validation.valid) {
      showAlert('invalidMAC', { 
        message: validation.error || 'Este v-tag no es compatible' 
      });
      return;
    }

    setScannedMAC(validation.formatted || mac);
    setStep('form');
  }, [validateMAC, showAlert]);

  const handleManualSubmit = useCallback(async (mac: string) => {
    const validation = await validateMAC(mac);
    
    if (!validation.valid) {
      return;
    }

    setScannedMAC(validation.formatted || mac);
    setStep('form');
  }, [validateMAC]);

  const handleFormSubmit = useCallback(async (data: { name: string; priority: DevicePriority }) => {
    if (!scannedMAC) return;

    const device = await addDevice({
      name: data.name,
      mac: scannedMAC,
      priority: data.priority,
    });

    if (device) {
      showAlert('success', { deviceName: device.name });
    }
  }, [scannedMAC, addDevice, showAlert]);

  const handleCancel = useCallback(() => {
    setScannedMAC(null);
    setStep('scanner');
    clearError();
    resetScanner();
  }, [clearError, resetScanner]);

  // ===== HANDLERS DE ALERTS =====
  
  const handleInvalidQRClose = useCallback(() => {
    setPendingAlert({ type: null });
    // Reabrir modal y resetear scanner
    setTimeout(() => {
      setShowMainModal(true);
      resetScanner();
    }, 300);
  }, [resetScanner]);

  const handleInvalidMACRetry = useCallback(() => {
    setPendingAlert({ type: null });
    setTimeout(() => {
      setShowMainModal(true);
      resetScanner();
    }, 300);
  }, [resetScanner]);

  const handleInvalidMACManual = useCallback(() => {
    // ⭐ IMPORTANTE: Cambiar step ANTES de cerrar el alert
    setStep('manual');
    setPendingAlert({ type: null });
    setTimeout(() => {
      setShowMainModal(true);
    }, 300);
  }, []);

  const handleSuccessAddAnother = useCallback(() => {
    setPendingAlert({ type: null });
    setScannedMAC(null);
    setStep('scanner');
    clearError();
    setTimeout(() => {
      setShowMainModal(true);
      resetScanner();
    }, 300);
  }, [clearError, resetScanner]);

  const handleSuccessClose = useCallback(() => {
    setPendingAlert({ type: null });
    setTimeout(() => {
      onClose();
      onSuccess?.();
    }, 300);
  }, [onClose, onSuccess]);

  return (
    <>
      {/* ===== MODAL PRINCIPAL ===== */}
      <Modal
        isOpen={showMainModal}
        onClose={handleClose}
        size="lg"
      >
        <ModalBackdrop />
        
        <ModalContent className="max-h-[85%] w-[90%]">
          <ModalHeader className="border-b border-outline-100">
            <Heading size="md">
              {step === 'scanner' && 'Escanear v-tag'}
              {step === 'manual' && 'Ingresar MAC'}
              {step === 'form' && 'Nuevo Dispositivo'}
            </Heading>
            <ModalCloseButton onPress={handleClose}>
              <Icon as={SquareX} size="sm" />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody className="p-0">
            {step === 'scanner' && (
              <View className="p-4">
                <QRScanner
                  key={scannerKey}
                  onScan={handleQRScan}
                  isScanning={!isLoading}
                />
                
                <View className="mt-4">
                  <Pressable
                    onPress={() => setStep('manual')}
                    className="active:opacity-50 py-3"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text className="text-primary-500 text-center font-medium">
                      O ingresar MAC manualmente
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {step === 'manual' && (
              <ManualMACInput
                onSubmit={handleManualSubmit}
                onCancel={handleCancel}
                isValidating={isLoading}
              />
            )}

            {step === 'form' && scannedMAC && (
              <DeviceForm
                mac={scannedMAC}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
                error={error}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ===== ALERTS (solo visibles cuando modal principal está cerrado) ===== */}
      
      {/* Alert: QR Inválido */}
      <RNModal
        visible={pendingAlert.type === 'invalidQR'}
        transparent
        animationType="fade"
        onRequestClose={handleInvalidQRClose}
      >
        <View style={styles.alertContainer}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={handleInvalidQRClose}
          >
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={AlertCircle} size="xl" className="text-error-500" />
              <Heading size="lg" className="text-typography-900">QR inválido</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              {pendingAlert.message}
            </Text>
            
            <Button 
              variant="solid" 
              action="primary"
              onPress={handleInvalidQRClose}
              className="w-full"
            >
              <ButtonText>Intentar de nuevo</ButtonText>
            </Button>
          </View>
        </View>
      </RNModal>

      {/* Alert: v-tag no válido */}
      <RNModal
        visible={pendingAlert.type === 'invalidMAC'}
        transparent
        animationType="fade"
        onRequestClose={handleInvalidMACRetry}
      >
        <View style={styles.alertContainer}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={handleInvalidMACRetry}
          >
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={AlertCircle} size="xl" className="text-error-500" />
              <Heading size="lg" className="text-typography-900">v-tag no válido</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              {pendingAlert.message}
            </Text>
            
            <VStack className="gap-3">
              <Button 
                variant="solid" 
                action="primary"
                onPress={handleInvalidMACRetry}
                className="w-full"
              >
                <ButtonText>Intentar de nuevo</ButtonText>
              </Button>
              <Button 
                variant="outline" 
                action="secondary"
                onPress={handleInvalidMACManual}
                className="w-full"
              >
                <ButtonText>Ingresar manualmente</ButtonText>
              </Button>
            </VStack>
          </View>
        </View>
      </RNModal>

      {/* Alert: Éxito */}
      <RNModal
        visible={pendingAlert.type === 'success'}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.alertContainer}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={handleSuccessClose}
          >
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={CheckCircle} size="xl" className="text-success-500" />
              <Heading size="lg" className="text-typography-900">Dispositivo agregado</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              <Text className="font-semibold">{pendingAlert.deviceName}</Text> se ha agregado correctamente
            </Text>
            
            <VStack className="gap-3">
              <Button 
                variant="solid" 
                action="primary"
                onPress={handleSuccessAddAnother}
                className="w-full"
              >
                <ButtonText>Agregar otro</ButtonText>
              </Button>
              <Button 
                variant="outline" 
                action="secondary"
                onPress={handleSuccessClose}
                className="w-full"
              >
                <ButtonText>Cerrar</ButtonText>
              </Button>
            </VStack>
          </View>
        </View>
      </RNModal>
    </>
  );
}

const styles = StyleSheet.create({
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
});