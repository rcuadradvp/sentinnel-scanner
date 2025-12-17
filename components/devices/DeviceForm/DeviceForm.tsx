// components/devices/DeviceForm/DeviceForm.tsx

import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { FormInput } from '@/components/shared/FormInput';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Icon } from '@/components/ui/icon';
import { CheckCircle, ChevronDown } from 'lucide-react-native';
import { DEVICE_PRIORITIES, type DevicePriority } from '@/types';
import { formatMAC } from '@/utils/mac';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@/components/ui/modal';
import { Heading } from '@/components/ui/heading';

interface DeviceFormProps {
  mac: string;
  onSubmit: (data: { name: string; priority: DevicePriority }) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export function DeviceForm({ mac, onSubmit, onCancel, isLoading, error }: DeviceFormProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<DevicePriority>(3);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), priority });
  };

  const formattedMAC = formatMAC(mac);
  
  const selectedPriority = DEVICE_PRIORITIES.find(p => p.value === priority);

  return (
    <>
      <ScrollView className="flex-1">
        <VStack className="gap-5 p-4">
          {/* MAC detectada */}
          <View className="bg-success-50 border border-success-200 rounded-xl p-4">
            <HStack className="items-center gap-3">
              <Icon as={CheckCircle} size="md" className="text-success-600" />
              <VStack className="flex-1">
                <Text className="text-sm text-success-700 font-medium">
                  Beacon Minew detectado
                </Text>
                <Text className="text-xs text-success-600 font-mono mt-1">
                  {formattedMAC}
                </Text>
              </VStack>
            </HStack>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-error-50 border border-error-200 rounded-xl p-4">
              <Text className="text-error-600 text-sm">{error}</Text>
            </View>
          )}

          {/* Nombre */}
          <FormInput
            label="Nombre del dispositivo"
            value={name}
            onChangeText={setName}
            placeholder="Ej: Pallet A-01"
            isDisabled={isLoading}
          />

          {/* Prioridad - Select */}
          <VStack className="gap-2">
            <Text className="text-sm font-medium text-typography-700">
              Prioridad *
            </Text>
            <Pressable
              onPress={() => !isLoading && setShowPriorityModal(true)}
              className="border border-gray-300 rounded-lg p-4 bg-white flex-row items-center justify-between active:bg-gray-50"
              disabled={isLoading}
            >
              <Text className="text-typography-900">
                {selectedPriority?.label || 'Seleccionar'}
              </Text>
              <Icon as={ChevronDown} size="sm" className="text-typography-500" />
            </Pressable>
          </VStack>

          {/* Botones */}
          <VStack className="gap-3 mt-2">
            <LoadingButton
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={!name.trim()}
              variant="primary"
            >
              Guardar Dispositivo
            </LoadingButton>

            <LoadingButton
              onPress={onCancel}
              isDisabled={isLoading}
              variant="secondary"
            >
              Cancelar
            </LoadingButton>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Modal de selección de prioridad */}
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
    </>
  );
}