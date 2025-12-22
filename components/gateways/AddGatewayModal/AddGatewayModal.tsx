// components/gateways/AddGatewayModal/AddGatewayModal.tsx
import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, Modal as RNModal, Image } from 'react-native';
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

type Step = 'scanner' | 'manual' | 'form' | 'locationInstruction';
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
  const [pendingAlert, setPendingAlert] = useState<{ 
    type: AlertType; 
    message?: string; 
    gatewayName?: string 
  }>({ type: null });

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
    // Si hay un alert visible, solo cerrar el alert
    if (pendingAlert.type !== null) {
      setPendingAlert({ type: null });
      setShowMainModal(true);
      return;
    }
    
    // Si no hay alert, cerrar todo el modal
    onClose();
    setTimeout(() => {
      resetForm();
      setShowMainModal(true);
    }, 300);
  }, [resetForm, onClose, pendingAlert.type]);

  const showAlert = useCallback((type: AlertType, data?: { 
    message?: string; 
    gatewayName?: string 
  }) => {
    setShowMainModal(false);
    setPendingAlert({ type, ...data });
  }, []);

  const handleQRScan = useCallback((data: string) => {
    const extractedMAC = extractMACFromQR(data);

    if (!extractedMAC) {
      showAlert('invalidQR', {
        message: 'El código QR escaneado no contiene una dirección MAC válida.',
      });
      return;
    }

    const validation = validateMAC(extractedMAC);
    if (!validation.valid) {
      showAlert('invalidMAC', {
        message: validation.error || 'La MAC extraída del QR no es válida.',
      });
      return;
    }

    setScannedMAC(validation.formatted!);
    setStep('form');
  }, [extractMACFromQR, validateMAC, showAlert]);

  const handleManualSubmit = useCallback(() => {
    const validation = validateMAC(manualMAC);
    if (!validation.valid) {
      showAlert('invalidMAC', {
        message: validation.error || 'La MAC ingresada no es válida.',
      });
      return;
    }

    setScannedMAC(validation.formatted!);
    setStep('form');
  }, [manualMAC, validateMAC, showAlert]);

  const handleFormSubmit = useCallback(() => {
    if (!name.trim()) {
      return;
    }
    // Cambiar al paso de instrucción de ubicación
    setStep('locationInstruction');
  }, [name]);

  const handleLocationConfirm = useCallback(async () => {
    if (!scannedMAC || !name.trim()) {
      return;
    }

    const result = await addGateway({
      name,
      mac: scannedMAC,
      description: description || undefined,
      companyId,
    });

    if (result) {
      showAlert('success', { gatewayName: result.name });
      onSuccess?.(result);
    } else if (error) {
      showAlert('locationError', { message: error });
    }
  }, [scannedMAC, name, description, companyId, addGateway, error, showAlert, onSuccess]);

  const handleCancel = useCallback(() => {
    if (step === 'manual') {
      setStep('scanner');
      setManualMAC('');
    } else if (step === 'form') {
      setStep('scanner');
      setScannedMAC(null);
      setName('');
      setDescription('');
    } else if (step === 'locationInstruction') {
      setStep('form');
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
    // Primero cerrar el modal padre
    onClose();
    // Después resetear todo (esto se ejecutará después de que el modal se cierre)
    setTimeout(() => {
      resetForm();
      setShowMainModal(true);
    }, 300);
  }, [resetForm, onClose]);

  const handleLocationErrorClose = useCallback(() => {
    setPendingAlert({ type: null });
    setShowMainModal(true);
    setStep('form');
  }, []);

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
              {step === 'locationInstruction' && 'Configurar ubicación'}
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
                  Ingresa la dirección MAC del V-gate en formato: AA:BB:CC:DD:EE:FF
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

            {/* Location Instruction Step - NUEVA PANTALLA */}
            {step === 'locationInstruction' && (
              <VStack className="gap-6 p-6 items-center">
                {/* Imagen de instrucciones */}
                <View className="w-full aspect-square max-w-[300px] rounded-xl overflow-hidden">
                  <Image
                    source={require('@/assets/configGateways.png')}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>

                {/* Texto de instrucciones */}
                <VStack className="gap-3 items-center">
                  <Heading size="lg" className="text-center text-typography-900">
                    Posicionamiento requerido
                  </Heading>
                  <Text className="text-center text-typography-600 text-base leading-relaxed">
                    Procura estar abajo del v-gate para configurar la ubicación precisa de este
                  </Text>
                </VStack>

                {/* Botón Aceptar */}
                <Button
                  variant="solid"
                  action="primary"
                  className="w-full"
                  onPress={handleLocationConfirm}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation && <ButtonSpinner className="mr-2" />}
                  <ButtonText>
                    {isGettingLocation ? 'Obteniendo ubicación...' : 'Aceptar'}
                  </ButtonText>
                </Button>
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
            
            <Button variant="solid" action="primary" onPress={handleInvalidQRClose}>
              <ButtonText>Entendido</ButtonText>
            </Button>
          </View>
        </View>
      </RNModal>

      {/* Alert: MAC Inválida */}
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
              <Heading size="lg" className="text-typography-900">MAC inválida</Heading>
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

      {/* Alert: Error de ubicación */}
      <RNModal
        visible={pendingAlert.type === 'locationError'}
        transparent
        animationType="fade"
        onRequestClose={handleLocationErrorClose}
      >
        <View style={styles.alertContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleLocationErrorClose}>
            <View style={styles.backdrop} />
          </Pressable>
          
          <View style={styles.alertContent} className="bg-background-0 rounded-xl p-6 w-[90%] max-w-md">
            <HStack className="items-center gap-3 mb-4">
              <Icon as={MapPin} size="xl" className="text-error-500" />
              <Heading size="lg" className="text-typography-900">Error de ubicación</Heading>
            </HStack>
            
            <Text className="text-typography-700 text-base mb-6">
              {pendingAlert.message}
            </Text>
            
            <Button variant="solid" action="primary" onPress={handleLocationErrorClose}>
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
              El V-gate "{pendingAlert.gatewayName}" se ha registrado correctamente.
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