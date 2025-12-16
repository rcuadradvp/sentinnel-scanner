// components/devices/DeviceList/DeviceList.tsx

import { FlatList, RefreshControl, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { EmptyDevicesState } from '@/components/devices/EmptyDevicesState';
import type { UnassignedDevice } from '@/types';

interface DeviceListProps {
  devices: UnassignedDevice[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function DeviceList({
  devices,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
}: DeviceListProps) {
  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-error-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={devices}
      keyExtractor={(item) => item.uuid}
      renderItem={({ item }) => <DeviceCard device={item} />}
      contentContainerStyle={{ 
        padding: 16,
        flexGrow: 1 
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      }
      ListEmptyComponent={<EmptyDevicesState />}
    />
  );
}