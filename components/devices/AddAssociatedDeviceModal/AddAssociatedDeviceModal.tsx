// components/devices/AddAssociatedDeviceModal/AddAssociatedDeviceModal.tsx
import { useState, useCallback, useMemo } from 'react';
import { View, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { 
  SquareX, 
  Search,
  Tag,
  Plus,
  Check,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useAssociateDevice } from '@/hooks/useAssociateDevice';
import { VALID_DEVICE_MAC_PREFIXES_RAW } from '@/constants/device';
import type { GatewayDevice } from '@/types';

interface AddAssociatedDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatewayUuid: string;
  gatewayName: string;
  unassociatedDevices: GatewayDevice[];
  onSuccess?: () => void;
}

type Step = 'select' | 'create';

export function AddAssociatedDeviceModal({
  isOpen,
  onClose,
  gatewayUuid,
  gatewayName,
  unassociatedDevices,
  onSuccess,
}: AddAssociatedDeviceModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<GatewayDevice | null>(null);

  // Form state para crear nuevo
  const [newName, setNewName] = useState('');
  const [newMac, setNewMac] = useState('');
  const [macError, setMacError] = useState<string | null>(null);

  const {
    isLoading,
    isCreating,
    error,
    associateDevice,
    createAndAssociateDevice,
    clearError,
  } = useAssociateDevice();

  // Filtrar dispositivos por búsqueda
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return unassociatedDevices;
    
    const query = searchQuery.toLowerCase();
    return unassociatedDevices.filter(device => 
      device.name.toLowerCase().includes(query) ||
      device.mac.toLowerCase().includes(query)
    );
  }, [unassociatedDevices, searchQuery]);

  const resetForm = useCallback(() => {
    setStep('select');
    setSearchQuery('');
    setSelectedDevice(null);
    setNewName('');
    setNewMac('');
    setMacError(null);
    clearError();
  }, [clearError]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(resetForm, 300);
  }, [onClose, resetForm]);

  // Formatear MAC mientras se escribe
  const formatMacInput = (text: string) => {
    // Remover todo excepto hex
    const cleaned = text.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    
    // Formatear con colons cada 2 caracteres
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    
    return formatted.substring(0, 17); // Máximo XX:XX:XX:XX:XX:XX
  };

  const handleMacChange = (text: string) => {
    const formatted = formatMacInput(text);
    setNewMac(formatted);
    setMacError(null);
  };

  const validateMac = (mac: string): boolean => {
    const cleaned = mac.replace(/[:\-\s]/g, '').toUpperCase();
    
    if (cleaned.length !== 12) {
      setMacError('La MAC debe tener 12 caracteres');
      return false;
    }

    if (!/^[0-9A-F]{12}$/.test(cleaned)) {
      setMacError('La MAC contiene caracteres inválidos');
      return false;
    }

    // Verificar prefijo válido para V-tags
    const hasValidPrefix = VALID_DEVICE_MAC_PREFIXES_RAW.some(prefix => 
      cleaned.startsWith(prefix)
    );

    if (!hasValidPrefix) {
      setMacError('MAC no corresponde a un V-tag válido');
      return false;
    }

    return true;
  };

  // Asociar dispositivo existente
  const handleAssociate = async () => {
    if (!selectedDevice?.uuid) return;

    const success = await associateDevice(gatewayUuid, selectedDevice.uuid);
    
    if (success) {
      onSuccess?.();
      handleClose();
    }
  };

  // Crear y asociar nuevo dispositivo
  const handleCreateAndAssociate = async () => {
    if (!newName.trim()) return;
    if (!validateMac(newMac)) return;

    const success = await createAndAssociateDevice(gatewayUuid, {
      name: newName.trim(),
      mac: newMac.replace(/[:\-\s]/g, '').toUpperCase(),
      priority: 4,
    });

    if (success) {
      onSuccess?.();
      handleClose();
    }
  };

  const renderSelectStep = () => (
    <>
      <ModalBody className="px-4 py-0">
        {/* Buscador */}
        <HStack className="items-center gap-2 bg-background-50 rounded-lg px-3 py-2 mb-4">
          <Icon as={Search} size="sm" className="text-typography-400" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o MAC..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-typography-900"
          />
        </HStack>

        {/* Lista de dispositivos no asociados */}
        {filteredDevices.length > 0 ? (
          <FlatList
            data={filteredDevices}
            keyExtractor={(item) => item.uuid || item.mac}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedDevice(
                  selectedDevice?.uuid === item.uuid ? null : item
                )}
              >
                <Box className={`rounded-lg p-3 mb-2 border ${
                  selectedDevice?.uuid === item.uuid 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-outline-100 bg-white'
                }`}>
                  <HStack className="items-center gap-3">
                    <View className={`rounded-full p-2 ${
                      selectedDevice?.uuid === item.uuid 
                        ? 'bg-primary-100' 
                        : 'bg-gray-100'
                    }`}>
                      {selectedDevice?.uuid === item.uuid ? (
                        <Icon as={Check} size="sm" className="text-primary-600" />
                      ) : (
                        <Icon as={Tag} size="sm" className="text-gray-400" />
                      )}
                    </View>
                    <VStack className="flex-1">
                      <Text className="font-medium text-typography-900">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-typography-500 font-mono">
                        {item.mac.match(/.{1,2}/g)?.join(':') || item.mac}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Pressable>
            )}
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <VStack className="items-center py-8">
            <Icon as={Tag} size="xl" className="text-gray-300 mb-2" />
            <Text className="text-typography-500 text-center">
              {searchQuery 
                ? 'No se encontraron dispositivos' 
                : 'No hay dispositivos disponibles para asignar'
              }
            </Text>
          </VStack>
        )}

        {/* Opción para crear nuevo */}
        <Pressable onPress={() => setStep('create')}>
          <HStack className="items-center justify-between p-3 bg-background-50 rounded-lg mt-4">
            <HStack className="items-center gap-2">
              <Icon as={Plus} size="sm" className="text-primary-600" />
              <Text className="text-primary-600 font-medium">
                Crear nuevo V-tag
              </Text>
            </HStack>
            <Icon as={ChevronRight} size="sm" className="text-primary-600" />
          </HStack>
        </Pressable>

        {/* Error */}
        {error && (
          <HStack className="items-center gap-2 bg-error-50 p-3 rounded-lg mt-4">
            <Icon as={AlertCircle} size="sm" className="text-error-600" />
            <Text className="text-sm text-error-700 flex-1">{error}</Text>
          </HStack>
        )}
      </ModalBody>

      <ModalFooter className="border-t border-outline-100">
        <HStack className="gap-3 w-full">
          <Button
            variant="outline"
            onPress={handleClose}
            className="flex-1"
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button
            onPress={handleAssociate}
            disabled={!selectedDevice || isLoading}
            className={`flex-1 ${selectedDevice ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            {isLoading ? (
              <ButtonSpinner color="white" />
            ) : (
              <ButtonText>Asignar</ButtonText>
            )}
          </Button>
        </HStack>
      </ModalFooter>
    </>
  );

  const renderCreateStep = () => (
    <>
      <ModalBody className="px-4">
        <VStack className="gap-4">
          {/* Nombre */}
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-typography-700">
              Nombre del V-tag *
            </Text>
            <Input variant="outline" size="md">
              <InputField
                value={newName}
                onChangeText={setNewName}
                placeholder="Ej: Pallet A1"
              />
            </Input>
          </VStack>

          {/* MAC */}
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-typography-700">
              Dirección MAC *
            </Text>
            <Input 
              variant="outline" 
              size="md"
              isInvalid={!!macError}
            >
              <InputField
                value={newMac}
                onChangeText={handleMacChange}
                placeholder="C3:00:00:XX:XX:XX"
                autoCapitalize="characters"
                maxLength={17}
              />
            </Input>
            {macError && (
              <Text className="text-xs text-error-600">{macError}</Text>
            )}
            <Text className="text-xs text-typography-400">
              Formato: XX:XX:XX:XX:XX:XX (12 caracteres hexadecimales)
            </Text>
          </VStack>

          {/* Error */}
          {error && (
            <HStack className="items-center gap-2 bg-error-50 p-3 rounded-lg">
              <Icon as={AlertCircle} size="sm" className="text-error-600" />
              <Text className="text-sm text-error-700 flex-1">{error}</Text>
            </HStack>
          )}
        </VStack>
      </ModalBody>

      <ModalFooter className="border-t border-outline-100">
        <HStack className="gap-3 w-full">
          <Button
            variant="outline"
            onPress={() => {
              setStep('select');
              setNewName('');
              setNewMac('');
              setMacError(null);
              clearError();
            }}
            className="flex-1"
          >
            <ButtonText>Volver</ButtonText>
          </Button>
          <Button
            onPress={handleCreateAndAssociate}
            disabled={!newName.trim() || !newMac || isCreating}
            className={`flex-1 ${newName.trim() && newMac ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            {isCreating ? (
              <ButtonSpinner color="white" />
            ) : (
              <ButtonText>Crear y Asignar</ButtonText>
            )}
          </Button>
        </HStack>
      </ModalFooter>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalBackdrop />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center"
      >
        <ModalContent className="max-h-[85%] w-[90%] mx-auto">
          <ModalHeader className="border-b border-outline-100">
            <VStack>
              <Heading size="md">
                {step === 'select' ? 'Asignar V-tag' : 'Crear nuevo V-tag'}
              </Heading>
              <Text className="text-sm text-typography-500">
                {gatewayName}
              </Text>
            </VStack>
            <ModalCloseButton onPress={handleClose}>
              <Icon as={SquareX} size="md" className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>

          {step === 'select' ? renderSelectStep() : renderCreateStep()}
        </ModalContent>
      </KeyboardAvoidingView>
    </Modal>
  );
}
