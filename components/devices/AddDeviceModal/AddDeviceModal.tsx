// components/devices/AddDeviceModal/AddDeviceModal.tsx
// GLUESTACK UI V3 - CORREGIDO

import { useState, useEffect, useCallback } from 'react';
import { Alert, View, Pressable } from 'react-native';
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
import { CloseIcon } from '@/components/ui/icon';
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

  // ✅ QUITAMOS useCameraPermissions de aquí - vive solo en QRScanner

  // Reset state cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('scanner');
        setScannedMAC(null);
        clearError();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, clearError]);

  const handleClose = useCallback(() => {
    console.log('[AddDeviceModal] Cerrando modal...');
    onClose();
  }, [onClose]);

  const handleQRScan = useCallback(async (qrData: string) => {
    console.log('[AddDeviceModal] QR escaneado:', qrData);
    const mac = extractMACFromQR(qrData);
    
    if (!mac) {
      Alert.alert(
        'QR inválido',
        'No se pudo extraer la MAC del código QR',
        [{ text: 'Intentar de nuevo' }]
      );
      return;
    }

    const validation = await validateMAC(mac);
    
    if (!validation.valid) {
      Alert.alert(
        'Beacon no válido',
        validation.error || 'Este beacon no es compatible',
        [
          { text: 'Intentar de nuevo' },
          { text: 'Ingresar manualmente', onPress: () => setStep('manual') },
        ]
      );
      return;
    }

    setScannedMAC(validation.formatted || mac);
    setStep('form');
  }, [validateMAC]);

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
      Alert.alert(
        '✓ Dispositivo agregado',
        `${device.name} se ha agregado correctamente`,
        [
          {
            text: 'Agregar otro',
            onPress: () => {
              setScannedMAC(null);
              setStep('scanner');
              clearError();
            },
          },
          {
            text: 'Cerrar',
            onPress: () => {
              handleClose();
              onSuccess?.();
            },
            style: 'cancel',
          },
        ]
      );
    }
  }, [scannedMAC, addDevice, clearError, handleClose, onSuccess]);

  const handleCancel = useCallback(() => {
    setScannedMAC(null);
    setStep('scanner');
    clearError();
  }, [clearError]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      <ModalBackdrop />
      
      <ModalContent className="max-h-[85%] w-[90%]">
        <ModalHeader className="border-b border-outline-100">
          <Heading size="md">
            {step === 'scanner' && 'Escanear Beacon'}
            {step === 'manual' && 'Ingresar MAC'}
            {step === 'form' && 'Nuevo Dispositivo'}
          </Heading>
          <ModalCloseButton onPress={handleClose}>
            <Icon as={CloseIcon} size="sm" />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody className="p-0">
          {step === 'scanner' && (
            <View className="p-4">
              <QRScanner
                onScan={handleQRScan}
                isScanning={!isLoading}
              />
              
              {/* Opción manual */}
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
  );
}