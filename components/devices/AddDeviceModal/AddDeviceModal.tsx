// components/devices/AddDeviceModal/AddDeviceModal.tsx
import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, Modal as RNModal } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { SquareX, AlertCircle, CheckCircle2, CheckCircle, ChevronDown } from 'lucide-react-native';
import { QRScanner } from '@/components/shared/QRScanner';
import { useAddDevice } from '@/hooks/useAddDevice';
import { DEVICE_PRIORITIES, type DevicePriority, type UnassignedDevice } from '@/types';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (device: UnassignedDevice) => void;
}

type Step = 'scanner' | 'manual' | 'form';
type AlertType = 'invalidQR' | 'invalidMAC' | 'success' | null;

export function AddDeviceModal({
  isOpen,
  onClose,
  onSuccess,
}: AddDeviceModalProps) {
  const [step, setStep] = useState<Step>('scanner');
  const [scannedMAC, setScannedMAC] = useState<string | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [showMainModal, setShowMainModal] = useState(true);
  const [pendingAlert, setPendingAlert] = useState<{ 
    type: AlertType; 
    message?: string; 
    deviceName?: string 
  }>({ type: null });

  // Form state
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<DevicePriority>(3); // Media por defecto
  const [manualMAC, setManualMAC] = useState('');
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const {
    isLoading,
    error,
    addDevice,
    validateMAC,
    clearError,
  } = useAddDevice();

  // Extraer MAC del QR (usando la función del hook de gateways)
  const extractMACFromQR = useCallback((qrData: string): string | null => {
    // Intentar varios formatos de QR
    const patterns = [
      /mac[:\s]*([0-9A-Fa-f:]{12,17})/i,
      /([0-9A-Fa-f]{12})/,
      /([0-9A-Fa-f:]{17})/,
    ];

    for (const pattern of patterns) {
      const match = qrData.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }, []);

  const resetScanner = useCallback(() => {
    setScannerKey(prev => prev + 1);
  }, []);

  const resetForm = useCallback(() => {
    setStep('scanner');
    setScannedMAC(null);
    setName('');
    setPriority(3);
    setManualMAC('');
    clearError();
    resetScanner();
  }, [clearError, resetScanner]);

  const handleClose = useCallback(() => {
    if (pendingAlert.type !== null) {
      setPendingAlert({ type: null });
      setShowMainModal(true);
      return;
    }
    
    onClose();
    setTimeout(() => {
      resetForm();
      setShowMainModal(true);
    }, 300);
  }, [resetForm, onClose, pendingAlert.type]);

  const showAlert = useCallback((type: AlertType, data?: { 
    message?: string; 
    deviceName?: string 
  }) => {
    setShowMainModal(false);
    setPendingAlert({ type, ...data });
  }, []);

  const handleQRScan = useCallback(async (data: string) => {
    const extractedMAC = extractMACFromQR(data);

    if (!extractedMAC) {
      showAlert('invalidQR', {
        message: 'El código QR escaneado no contiene una dirección MAC válida.',
      });
      return;
    }

    const validation = await validateMAC(extractedMAC);
    if (!validation.valid) {
      showAlert('invalidMAC', {
        message: 'Este dispositivo no es un V-tag válido.',
      });
      return;
    }

    setScannedMAC(validation.formatted!);
    setStep('form');
  }, [extractMACFromQR, validateMAC, showAlert]);

  const handleManualSubmit = useCallback(async () => {
    const validation = await validateMAC(manualMAC);
    if (!validation.valid) {
      showAlert('invalidMAC', {
        message: 'Este dispositivo no es un V-tag válido.',
      });
      return;
    }

    setScannedMAC(validation.formatted!);
    setStep('form');
  }, [manualMAC, validateMAC, showAlert]);

  const handleFormSubmit = useCallback(async () => {
    if (!scannedMAC || !name.trim()) {
      return;
    }

    const result = await addDevice({
      name: name.trim(),
      mac: scannedMAC,
      priority,
    });

    if (result) {
      showAlert('success', { deviceName: result.name });
      onSuccess?.(result);
    }
  }, [scannedMAC, name, priority, addDevice, showAlert, onSuccess]);

  const handleCancel = useCallback(() => {
    if (step === 'manual') {
      setStep('scanner');
      setManualMAC('');
    } else if (step === 'form') {
      setStep('scanner');
      setScannedMAC(null);
      setName('');
      setPriority(3);
    } else {
      handleClose();
    }
  }, [step, handleClose]);

  const handleInvalidQRClose = useCallback(() => {
    setPendingAlert({ type: null });
    setShowMainModal(true);
    resetScanner();
  }, [resetScanner]);

  const handleInvalidMACClose = useCallback(() => {
    setPendingAlert({ type: null });
    setShowMainModal(true);
    setManualMAC('');
    setStep('manual');
  }, []);

  const handleSuccessClose = useCallback(() => {
    setPendingAlert({ type: null });
    onClose();
    setTimeout(() => {
      resetForm();
      setShowMainModal(true);
    }, 300);
  }, [resetForm, onClose]);

  const selectedPriority = DEVICE_PRIORITIES.find(p => p.value === priority);

  return (
    <>
      {/* ===== MODAL PRINCIPAL ===== */}
      <Modal isOpen={isOpen && showMainModal} onClose={handleClose} size="lg">
        <ModalBackdrop />
        
        <ModalContent className="max-h-[85%] w-[90%]">
          <ModalHeader className="border-b border-outline-100">
            <Heading size="md">
              {step === 'scanner' && 'Escanear V-tag'}
              {step === 'manual' && 'Ingresar MAC'}
              {step === 'form' && 'Nuevo Dispositivo'}
            </Heading>
            <ModalCloseButton onPress={handleClose}>
              <Icon as={SquareX} size="sm" />
            </ModalCloseButton>
          </ModalHeader>

          <ModalBody className="p-0">
            {/* Scanner Step */}
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
                  >
                    <Text className="text-primary-500 text-center font-medium">
                      O ingresar MAC manualmente
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Manual MAC Step */}
            {step === 'manual' && (
              <VStack className="gap-4 p-4">
                <Text className="text-typography-600 text-sm">
                  Ingresa la dirección MAC del V-tag en formato: AA:BB:CC:DD:EE:FF
                </Text>

                <Input variant="outline" size="md">
                  <InputField
                    placeholder="Ej: A1:B2:C3:D4:E5:F6"
                    value={manualMAC}
                    onChangeText={setManualMAC}
                    autoCapitalize="characters"
                  />
                </Input>

                <HStack className="gap-3 mt-2">
                  <Button
                    variant="outline"
                    action="secondary"
                    className="flex-1"
                    onPress={handleCancel}
                    disabled={isLoading}
                  >
                    <ButtonText>Volver</ButtonText>
                  </Button>
                  <Button
                    variant="solid"
                    action="primary"
                    className="flex-1"
                    onPress={handleManualSubmit}
                    disabled={!manualMAC.trim() || isLoading}
                  >
                    <ButtonText>Continuar</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Form Step */}
            {step === 'form' && (
              <VStack className="gap-4 p-4">
                {/* MAC (readonly) */}
                {scannedMAC && (
                  <VStack className="gap-2">
                    <Text className="text-typography-700 font-medium">MAC</Text>
                    <View className="bg-background-100 p-3 rounded-lg">
                      <Text className="text-typography-600 font-mono">{scannedMAC}</Text>
                    </View>
                  </VStack>
                )}

                {/* Nombre */}
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">Nombre *</Text>
                  <Input variant="outline" size="md">
                    <InputField
                      placeholder="Ej: Pallet A-01"
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                </VStack>

                {/* Prioridad */}
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">Prioridad</Text>
                  <Pressable
                    onPress={() => setShowPriorityModal(true)}
                    className="bg-background-100 p-3 rounded-lg flex-row items-center justify-between active:bg-background-200"
                  >
                    <Text className="text-typography-900">
                      {selectedPriority?.label || 'Seleccionar'}
                    </Text>
                    <Icon as={ChevronDown} size="sm" className="text-typography-500" />
                  </Pressable>
                </VStack>

                {/* Error */}
                {error && (
                  <HStack className="items-start gap-2 bg-error-50 p-3 rounded-lg">
                    <Icon as={AlertCircle} size="sm" className="text-error-600 mt-0.5" />
                    <Text className="text-error-700 text-sm flex-1">{error}</Text>
                  </HStack>
                )}

                {/* Buttons */}
                <HStack className="gap-3 mt-2">
                  <Button
                    variant="outline"
                    action="secondary"
                    className="flex-1"
                    onPress={handleCancel}
                    disabled={isLoading}
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                  <Button
                    variant="solid"
                    action="primary"
                    className="flex-1"
                    onPress={handleFormSubmit}
                    disabled={!name.trim() || isLoading}
                  >
                    <ButtonText>Guardar</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Prioridad */}
      <Modal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        size="sm"
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="sm">Seleccionar Prioridad</Heading>
          </ModalHeader>
          <ModalBody className="p-0">
            <VStack>
              {DEVICE_PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => {
                    setPriority(p.value);
                    setShowPriorityModal(false);
                  }}
                  className={`p-4 border-b border-gray-100 active:bg-gray-50 ${
                    priority === p.value ? 'bg-primary-50' : ''
                  }`}
                >
                  <HStack className="items-center justify-between">
                    <Text
                      className={`${
                        priority === p.value 
                          ? 'text-primary-700 font-medium' 
                          : 'text-typography-900'
                      }`}
                    >
                      {p.label}
                    </Text>
                    {priority === p.value && (
                      <Icon as={CheckCircle} size="sm" className="text-primary-600" />
                    )}
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ===== ALERTS ===== */}

      {/* Alert: QR Inválido */}
      <RNModal
        visible={pendingAlert.type === 'invalidQR'}
        transparent
        animationType="fade"
        onRequestClose={handleInvalidQRClose}
      >
        <View style={styles.alertContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleInvalidQRClose}>
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
            
            <Button variant="solid" action="primary" onPress={handleInvalidQRClose}>
              <ButtonText>Entendido</ButtonText>
            </Button>
          </View>
        </View>
      </RNModal>

      {/* Alert: V-tag no válido */}
      <RNModal
        visible={pendingAlert.type === 'invalidMAC'}
        transparent
        animationType="fade"
        onRequestClose={handleInvalidMACClose}
      >
        <View style={styles.alertContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleInvalidMACClose}>
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={AlertCircle} size="xl" className="text-error-500" />
              <Heading size="lg" className="text-typography-900">V-tag no válido</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              {pendingAlert.message}
            </Text>
            
            <Button variant="solid" action="primary" onPress={handleInvalidMACClose}>
              <ButtonText>Reintentar</ButtonText>
            </Button>
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
          <Pressable style={StyleSheet.absoluteFill} onPress={handleSuccessClose}>
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={CheckCircle2} size="xl" className="text-success-500" />
              <Heading size="lg" className="text-typography-900">¡Listo!</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              El V-tag "{pendingAlert.deviceName}" se ha registrado correctamente.
            </Text>
            
            <Button variant="solid" action="primary" onPress={handleSuccessClose}>
              <ButtonText>Aceptar</ButtonText>
            </Button>
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
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContent: {
    zIndex: 10,
  },
});