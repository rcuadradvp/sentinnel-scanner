// components/devices/DeviceForm/DeviceForm.tsx

import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { FormInput } from '@/components/shared/FormInput';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Icon } from '@/components/ui/icon';
import { CheckCircle } from 'lucide-react-native';
import { DEVICE_PRIORITIES, type DevicePriority } from '@/types';
import { formatMAC } from '@/utils/mac';

interface DeviceFormProps {
  mac: string;
  onSubmit: (data: { name: string; priority: DevicePriority }) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export function DeviceForm({ mac, onSubmit, onCancel, isLoading, error }: DeviceFormProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<DevicePriority>(3); // Media por defecto

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), priority });
  };

  const formattedMAC = formatMAC(mac);

  return (
    <ScrollView className="flex-1">
      <VStack className="gap-6 p-4">
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

        {/* Prioridad */}
        <VStack className="gap-2">
          <Text className="text-sm font-medium text-typography-700">
            Prioridad *
          </Text>
          <VStack className="gap-2">
            {DEVICE_PRIORITIES.map((p) => (
              <View
                key={p.value}
                className={`border rounded-lg p-4 ${
                  priority === p.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
                onTouchEnd={() => !isLoading && setPriority(p.value)}
              >
                <Text
                  className={`font-medium ${
                    priority === p.value ? 'text-primary-700' : 'text-typography-700'
                  }`}
                >
                  {p.label}
                </Text>
              </View>
            ))}
          </VStack>
        </VStack>

        {/* Botones */}
        <VStack className="gap-3 mt-4">
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
  );
}