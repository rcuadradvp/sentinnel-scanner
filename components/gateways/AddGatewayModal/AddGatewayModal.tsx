// components/gateways/AddGatewayModal/AddGatewayModal.tsx
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
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { 
  SquareX, 
  AlertCircle, 
  CheckCircle2, 
  MapPin,
  Loader2,
} from 'lucide-react-native';
import { QRScanner } from '@/components/shared/QRScanner';
import { useAddGateway } from '@/hooks/useAddGateway';
import type { Gateway } from '@/types';

interface AddGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onSuccess?: (gateway: Gateway) => void;
}

type Step = 'scanner' | 'manual' | 'form';
type AlertType = 'invalidQR' | 'invalidMAC' | 'success' | 'locationError' | null;

export function AddGatewayModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess,
}: AddGatewayModalProps) {
  const [step, setStep] = useState<Step>('scanner');
  const [scannedMAC, setScannedMAC] = useState<string | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [showMainModal, setShowMainModal] = useState(true);
  const [pendingAlert, setPendingAlert] = useState<{ type: AlertType; message?: string; gatewayName?: string }>({ type: null });

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manualMAC, setManualMAC] = useState('');

  const {
    isLoading,
    error,
    isGettingLocation,
    addGateway,
    validateMAC,
    extractMACFromQR,
    clearError,
  } = useAddGateway();

  const resetScanner = useCallback(() => {
    setScannerKey(prev => prev + 1);
  }, []);

  const resetForm = useCallback(() => {
    setStep('scanner');
    setScannedMAC(null);
    setName('');
    setDescription('');
    setManualMAC('');
    clearError();
    resetScanner();
  }, [clearError, resetScanner]);

  const handleClose = useCallback(() => {
    resetForm();
    setShowMainModal(true);
    setPendingAlert({ type: null });
    onClose();
  }, [resetForm, onClose]);

  const showAlert = useCallback((type: AlertType, data?: { message?: string; gatewayName?: string }) => {
    setShowMainModal(false);
    setTimeout(() => {
      setPendingAlert({
        type,
        message: data?.message,
        gatewayName: data?.gatewayName,
      });
    }, 350);
  }, []);

  // ===== HANDLERS =====

  const handleQRScan = useCallback((qrData: string) => {
    const mac = extractMACFromQR(qrData);
    
    if (!mac) {
      showAlert('invalidQR', { message: 'No se pudo extraer la dirección MAC del código QR' });
      return;
    }

    const validation = validateMAC(mac);
    
    if (!validation.valid) {
      showAlert('invalidMAC', { message: validation.error });
      return;
    }

    setScannedMAC(validation.formatted!);
    setStep('form');
  }, [extractMACFromQR, validateMAC, showAlert]);

  const handleManualSubmit = useCallback(() => {
    const validation = validateMAC(manualMAC);
    
    if (!validation.valid) {
      showAlert('invalidMAC', { message: validation.error });
      return;
    }

    setScannedMAC(validation.formatted!);
    setStep('form');
  }, [manualMAC, validateMAC, showAlert]);

  const handleFormSubmit = useCallback(async () => {
    if (!scannedMAC || !name.trim()) return;

    const gateway = await addGateway({
      name: name.trim(),
      mac: scannedMAC,
      description: description.trim() || undefined,
      companyId,
    });

    if (gateway) {
      showAlert('success', { gatewayName: gateway.name });
    }
  }, [scannedMAC, name, description, companyId, addGateway, showAlert]);

  const handleCancel = useCallback(() => {
    setScannedMAC(null);
    setStep('scanner');
    setName('');
    setDescription('');
    clearError();
    resetScanner();
  }, [clearError, resetScanner]);

  // ===== ALERT HANDLERS =====

  const handleInvalidQRClose = useCallback(() => {
    setPendingAlert({ type: null });
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
    setStep('manual');
    setPendingAlert({ type: null });
    setTimeout(() => {
      setShowMainModal(true);
    }, 300);
  }, []);

  const handleSuccessAddAnother = useCallback(() => {
    setPendingAlert({ type: null });
    resetForm();
    setTimeout(() => {
      setShowMainModal(true);
    }, 300);
  }, [resetForm]);

  const handleSuccessClose = useCallback(() => {
    setPendingAlert({ type: null });
    setTimeout(() => {
      onClose();
      onSuccess?.(null as any);
    }, 300);
  }, [onClose, onSuccess]);

  return (
    <>
      {/* ===== MODAL PRINCIPAL ===== */}
      <Modal isOpen={isOpen && showMainModal} onClose={handleClose} size="lg">
        <ModalBackdrop />
        
        <ModalContent className="max-h-[85%] w-[90%]">
          <ModalHeader className="border-b border-outline-100">
            <Heading size="md">
              {step === 'scanner' && 'Escanear V-gate'}
              {step === 'manual' && 'Ingresar MAC'}
              {step === 'form' && 'Nuevo V-gate'}
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
                  instructionText="Apunta al código QR del V-gate"
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
              <VStack className="p-4 gap-4">
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">Dirección MAC</Text>
                  <Input variant="outline" size="md">
                    <InputField
                      placeholder="Ej: AC233FC1D00C"
                      value={manualMAC}
                      onChangeText={setManualMAC}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </Input>
                  <Text className="text-typography-500 text-xs">
                    Ingresa la MAC del V-gate (12 caracteres)
                  </Text>
                </VStack>

                <HStack className="gap-3 mt-2">
                  <Button
                    variant="outline"
                    action="secondary"
                    className="flex-1"
                    onPress={handleCancel}
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                  <Button
                    variant="solid"
                    action="primary"
                    className="flex-1"
                    onPress={handleManualSubmit}
                    disabled={manualMAC.length < 12}
                  >
                    <ButtonText>Continuar</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Form Step */}
            {step === 'form' && scannedMAC && (
              <VStack className="p-4 gap-4">
                {/* MAC (readonly) */}
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">MAC</Text>
                  <View className="bg-background-100 p-3 rounded-lg">
                    <Text className="text-typography-600 font-mono">{scannedMAC}</Text>
                  </View>
                </VStack>

                {/* Empresa (readonly) */}
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">Empresa</Text>
                  <View className="bg-background-100 p-3 rounded-lg">
                    <Text className="text-typography-600">{companyName}</Text>
                  </View>
                </VStack>

                {/* Nombre */}
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">Nombre *</Text>
                  <Input variant="outline" size="md">
                    <InputField
                      placeholder="Ej: Gateway Entrada"
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                </VStack>

                {/* Descripción */}
                <VStack className="gap-2">
                  <Text className="text-typography-700 font-medium">Descripción (opcional)</Text>
                  <Input variant="outline" size="md">
                    <InputField
                      placeholder="Ej: Ubicado en la entrada principal"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </Input>
                </VStack>

                {/* Ubicación indicator */}
                <HStack className="items-center gap-2 bg-info-50 p-3 rounded-lg">
                  <Icon as={MapPin} size="sm" className="text-info-600" />
                  <Text className="text-info-700 text-sm flex-1">
                    La ubicación se obtendrá automáticamente al guardar
                  </Text>
                </HStack>

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
                    {(isLoading || isGettingLocation) && <ButtonSpinner className="mr-2" />}
                    <ButtonText>
                      {isGettingLocation ? 'Obteniendo ubicación...' : 'Guardar'}
                    </ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}
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
            
            <Button variant="solid" action="primary" onPress={handleInvalidQRClose} className="w-full">
              <ButtonText>Intentar de nuevo</ButtonText>
            </Button>
          </View>
        </View>
      </RNModal>

      {/* Alert: MAC Inválida */}
      <RNModal
        visible={pendingAlert.type === 'invalidMAC'}
        transparent
        animationType="fade"
        onRequestClose={handleInvalidMACRetry}
      >
        <View style={styles.alertContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleInvalidMACRetry}>
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={AlertCircle} size="xl" className="text-warning-500" />
              <Heading size="lg" className="text-typography-900">V-gate no válido</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              {pendingAlert.message}
            </Text>
            
            <VStack className="gap-3">
              <Button variant="solid" action="primary" onPress={handleInvalidMACRetry} className="w-full">
                <ButtonText>Escanear otro</ButtonText>
              </Button>
              <Button variant="outline" action="secondary" onPress={handleInvalidMACManual} className="w-full">
                <ButtonText>Ingresar MAC manual</ButtonText>
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
          <Pressable style={StyleSheet.absoluteFill} onPress={handleSuccessClose}>
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={CheckCircle2} size="xl" className="text-success-500" />
              <Heading size="lg" className="text-typography-900">¡V-gate agregado!</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              El V-gate "{pendingAlert.gatewayName}" fue registrado exitosamente.
            </Text>
            
            <VStack className="gap-3">
              <Button variant="solid" action="primary" onPress={handleSuccessAddAnother} className="w-full">
                <ButtonText>Agregar otro</ButtonText>
              </Button>
              <Button variant="outline" action="secondary" onPress={handleSuccessClose} className="w-full">
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});