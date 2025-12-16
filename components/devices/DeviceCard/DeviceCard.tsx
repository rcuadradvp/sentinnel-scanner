// components/devices/DeviceCard/DeviceCard.tsx

import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { UnassignedDevice } from '@/types';

interface DeviceCardProps {
  device: UnassignedDevice;
}

function formatMacAddress(mac: string): string {
  // C300003889BB → C3:00:00:38:89:BB
  const clean = mac.replace(/[:\-\s]/g, '');
  return clean.match(/.{1,2}/g)?.join(':') || mac;
}

export function DeviceCard({ device }: DeviceCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
      <VStack className="gap-2">
        <Text className="font-semibold text-base text-typography-900">
          {device.name}
        </Text>
        <Text className="text-sm text-typography-500 font-mono">
          {formatMacAddress(device.mac)}
        </Text>
      </VStack>
    </View>
  );
}