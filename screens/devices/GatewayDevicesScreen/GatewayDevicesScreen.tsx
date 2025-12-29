// screens/devices/GatewayDevicesScreen/GatewayDevicesScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import { View, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { 
  ChevronLeft, 
  Plus,
  SmartphoneNfc,
} from 'lucide-react-native';
import api from '@/services/api';
import { AddAssociatedDeviceModal } from '@/components/devices/AddAssociatedDeviceModal'; // ✅ AGREGADO

/**
 * Tipo para dispositivo del gateway
 */
interface GatewayDevice {
  uuid?: string;
  name: string;
  mac: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: string | null;
  description: string | null;
  updatedAt: number;
  createdAt: number;
}

/**
 * Tipo para el detalle del gateway
 */
interface GatewayDetail {
  uuid: string;
  name: string;
  mac: string;
  status: 'ONLINE' | 'OFFLINE';
  description: string | null;
  devices_associated: GatewayDevice[];
  devices_unassociated: GatewayDevice[];
}

interface DeviceCardProps {
  device: GatewayDevice;
}

function DeviceCard({ device }: DeviceCardProps) {
  const isActive = device.status === 'ACTIVE';

  // Formatear MAC con colons
  const formatMac = (mac: string) => {
    const clean = mac.replace(/[:\-\s]/g, '').toUpperCase();
    return clean.match(/.{1,2}/g)?.join(':') || mac;
  };

  return (
    <View className="rounded-xl p-4 mb-3 bg-white border border-outline-100">
      <HStack className="items-center gap-3">
        {/* Info */}
        <VStack className="flex-1 gap-1">
          <HStack className="items-center justify-between">
            <Text className="font-semibold text-base text-typography-900">
              {device.name}
            </Text>
          </HStack>

          <Text className="text-sm text-typography-500 font-mono">
            {formatMac(device.mac)}
          </Text>

          {device.description ? (
            <Text className="text-xs text-typography-400" numberOfLines={1}>
              {device.description}
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <VStack className="items-center gap-4">
        <View className="bg-gray-100 rounded-full p-6">
          <Icon as={SmartphoneNfc} size="xl" className="text-gray-400" />
        </View>
        <VStack className="items-center gap-2">
          <Text className="text-gray-600 text-lg font-medium text-center">
            Sin V-tags asignados
          </Text>
        </VStack>
      </VStack>
    </View>
  );
}

function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#333" />
      <Text className="text-gray-500 mt-4">Cargando dispositivos...</Text>
    </View>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-error-500 text-center">{error}</Text>
    </View>
  );
}

export function GatewayDevicesScreen() {
  const { gatewayUuid, gatewayName, gatewayDescription } = useLocalSearchParams<{
    gatewayUuid: string;
    gatewayName: string;
    gatewayDescription: string;
  }>();

  const [gateway, setGateway] = useState<GatewayDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ AGREGADO

  const fetchGatewayDetail = useCallback(async (isRefresh = false) => {
    if (!gatewayUuid) {
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // GET /gateways/search/{uuid}
      const response = await api.get<{ status: number; data: GatewayDetail }>(
        `/gateways/search/${gatewayUuid}`
      );
      
      setGateway(response.data.data);
    } catch (err: any) {
      console.error('[GatewayDevicesScreen] Error fetching gateway detail:', err);
      setError(err.response?.data?.message || 'Error al cargar detalles');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [gatewayUuid]);

  useEffect(() => {
    fetchGatewayDetail();
  }, [fetchGatewayDetail]);

  const refresh = useCallback(() => {
    fetchGatewayDetail(true);
  }, [fetchGatewayDetail]);

  // ✅ AGREGADO
  const handleAddSuccess = () => {
    refresh();
  };

  const devices = gateway?.devices_associated || [];
  const isOnline = gateway?.status === 'ONLINE';

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
          
          <VStack className="flex-1">
            <HStack className="items-center gap-2">
              <Heading size="lg" numberOfLines={1}>
                {gatewayName}
              </Heading>
            </HStack>
          </VStack>

          {/* ✅ BOTÓN ACTUALIZADO */}
          <Pressable
            onPress={() => setIsModalOpen(true)}
            className="bg-primary-500 px-4 py-2 rounded-lg active:opacity-80 flex-row items-center gap-2"
            disabled={isLoading}
          >
            <Icon as={Plus} size="sm" className="text-white" />
            <Text className="text-white font-medium text-sm">
              Agregar
            </Text>
          </Pressable>
        </HStack>

        {/* Content */}
        {isLoading && !isRefreshing ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.uuid || item.mac}
            renderItem={({ item }) => <DeviceCard device={item} />}
            contentContainerStyle={{ 
              padding: 16,
              flexGrow: 1 
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
              />
            }
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* ✅ MODAL AGREGADO */}
        <AddAssociatedDeviceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          gatewayUuid={gatewayUuid}
          gatewayName={gatewayName}
          onSuccess={handleAddSuccess}
        />
      </View>
    </SafeAreaView>
  );
}