// components/devices/EmptyDevicesState/EmptyDevicesState.tsx

import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { PackageOpen } from 'lucide-react-native';

interface EmptyDevicesStateProps {
  message?: string;
}

export function EmptyDevicesState({ 
  message = 'No hay dispositivos sin asignar' 
}: EmptyDevicesStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <VStack className="items-center gap-4">
        <View className="bg-gray-100 rounded-full p-6">
          <Icon 
            as={PackageOpen} 
            size="xl" 
            className="text-gray-400"
          />
        </View>
        
        <VStack className="items-center gap-2">
          <Text className="text-gray-600 text-lg font-medium text-center">
            {message}
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            Todos los dispositivos están asignados
          </Text>
        </VStack>
      </VStack>
    </View>
  );
}