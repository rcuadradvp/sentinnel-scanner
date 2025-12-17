// screens/devices/DevicesUnassignedScreen/DevicesUnassignedScreen.tsx

import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { DeviceList } from '@/components/devices/DeviceList';
import { AddDeviceModal } from '@/components/devices/AddDeviceModal';
import { useUnassignedDevices } from '@/hooks';

export function DevicesUnassignedScreen() {
  const { devices, isLoading, error, isRefreshing, refresh } = useUnassignedDevices();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSuccess = () => {
    refresh();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View className="flex-1 bg-background-0">
        {/* Header */}
        <HStack className="items-center px-4 py-3 border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 active:opacity-50"
          >
            <Icon as={ChevronLeft} size="lg" className="text-typography-900" />
          </Pressable>
          
          <Heading size="xl" className="flex-1">
            Sin Asignar
          </Heading>

          <Pressable
            onPress={() => {
              setIsModalOpen(true);
            }}
            className="bg-primary-500 px-4 py-2 rounded-lg active:opacity-80 flex-row items-center gap-2"
          >
            <Icon as={Plus} size="sm" className="text-white" />
            <Text className="text-white font-medium text-sm">
              Agregar
            </Text>
          </Pressable>
        </HStack>

        {/* Lista */}
        <DeviceList
          devices={devices}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          onRefresh={refresh}
        />

        {/* Modal */}
        <AddDeviceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onSuccess={handleAddSuccess}
        />
      </View>
    </SafeAreaView>
  );
}