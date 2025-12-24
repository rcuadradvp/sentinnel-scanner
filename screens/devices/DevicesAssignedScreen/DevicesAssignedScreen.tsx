// screens/devices/DevicesAssignedScreen/DevicesAssignedScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import { View, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { 
  ChevronLeft, 
  Folder, 
  ChevronRight,
  HdmiPort,
} from 'lucide-react-native';
import api from '@/services/api';
import type { Gateway } from '@/types';

/**
 * Tipo para el resumen del gateway (solo lo necesario para la lista)
 */
interface GatewayFolder {
  uuid: string;
  name: string;
  description: string | null;
  devicesCount: number;
}

interface GatewayFolderCardProps {
  gateway: GatewayFolder;
  onPress: () => void;
}

function GatewayFolderCard({ gateway, onPress }: GatewayFolderCardProps) {
  const hasDevices = gateway.devicesCount > 0;

  return (
    <Pressable onPress={onPress}>
      <View className="rounded-xl p-4 mb-3 bg-white border border-outline-100">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            {/* Icono de carpeta */}
            <View>
              <Icon 
                as={Folder} 
                size="md" 
                className={'text-info-500'} 
              />
            </View>

            {/* Nombre y descripción */}
            <VStack className="flex-1">
              <HStack className="items-center gap-2 flex-1">
                <Text className="font-semibold text-base text-typography-900">
                  {gateway.name}
                </Text>
                {gateway.description ? (
                  <>
                    <Text className="text-typography-400">-</Text>
                    <Text className="text-sm text-typography-500" numberOfLines={1}>
                      {gateway.description}
                    </Text>
                  </>
                ) : null}
              </HStack>
            </VStack>
          </HStack>

          {/* Contador y flecha */}
          <HStack className="items-center gap-2 ml-2">
            <Text className="text-sm text-typography-500 font-medium">
              {gateway.devicesCount}
            </Text>
            <Icon 
              as={ChevronRight} 
              size="sm" 
              className="text-typography-400" 
            />
          </HStack>
        </HStack>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <VStack className="items-center gap-4">
        <View className="bg-gray-100 rounded-full p-6">
          <Icon as={HdmiPort} size="xl" className="text-gray-400" />
        </View>
        <VStack className="items-center gap-2">
          <Text className="text-gray-600 text-lg font-medium text-center">
            Sin V-gates
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            No hay V-gates registrados para mostrar dispositivos asignados
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
      <Text className="text-gray-500 mt-4">Cargando V-gates...</Text>
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

export function DevicesAssignedScreen() {
  const [gateways, setGateways] = useState<GatewayFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGateways = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // GET /gateways - obtiene todos los gateways
      const response = await api.get('/gateways');
            
      // La API puede retornar directamente un array o envuelto en { data: [] }
      let gatewaysData: Gateway[] = [];
      
      if (Array.isArray(response.data)) {
        // Respuesta directa: [{ uuid, name, ... }]
        gatewaysData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Respuesta envuelta: { status: 200, data: [{ uuid, name, ... }] }
        gatewaysData = response.data.data;
      } else {
        console.warn('[DevicesAssignedScreen] Unexpected response structure:', typeof response.data);
      }
      
      // Transformar a formato de carpetas
      const folders: GatewayFolder[] = gatewaysData.map((gateway: Gateway) => ({
        uuid: gateway.uuid,
        name: gateway.name,
        description: gateway.description,
        devicesCount: gateway.devices_associated?.length || 0,
      }));

      setGateways(folders);
    } catch (err: any) {
      console.error('[DevicesAssignedScreen] Error fetching gateways:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar V-gates');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const refresh = useCallback(() => {
    fetchGateways(true);
  }, [fetchGateways]);

  const handleGatewayPress = (gateway: GatewayFolder) => {
    router.push({
      pathname: '/(app)/(tabs)/devices/gateway-devices' as any,
      params: {
        gatewayUuid: gateway.uuid,
        gatewayName: gateway.name,
        gatewayDescription: gateway.description || '',
      },
    });
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
          
          <VStack className="flex-1">
            <Heading size="xl">
              V-tags Asignados
            </Heading>
          </VStack>
        </HStack>

        {/* Content */}
        {isLoading && !isRefreshing ? (
          <LoadingState />
        ) : error && gateways.length === 0 ? (
          <ErrorState error={error} />
        ) : (
          <FlatList
            data={gateways}
            keyExtractor={(item) => item.uuid}
            renderItem={({ item }) => (
              <GatewayFolderCard 
                gateway={item} 
                onPress={() => handleGatewayPress(item)}
              />
            )}
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
      </View>
    </SafeAreaView>
  );
}