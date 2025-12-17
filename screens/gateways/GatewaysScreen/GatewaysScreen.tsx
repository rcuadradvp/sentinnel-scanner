// screens/gateways/GatewaysScreen/GatewaysScreen.tsx
import { FlatList, RefreshControl, ActivityIndicator, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { HdmiPort, Wifi, WifiOff, MapPin, ArrowLeft, RefreshCw, Plus } from 'lucide-react-native';
import { useGateways } from '@/hooks/useGateways';
import { AddGatewayModal } from '@/components/gateways/AddGatewayModal';
import type { Gateway } from '@/types';

function GatewayCard({ gateway }: { gateway: Gateway }) {
  const isOnline = gateway.status === 'ONLINE';

  return (
    <Box className="rounded-xl p-4 mb-3 bg-white border border-outline-100">
      <VStack className="gap-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3">
            <View className={`rounded-full p-2 ${isOnline ? 'bg-success-50' : 'bg-gray-100'}`}>
              <Icon 
                as={HdmiPort} 
                size="sm" 
                className={isOnline ? 'text-success-500' : 'text-gray-400'} 
              />
            </View>
            <VStack>
              <Text className="font-semibold text-lg text-typography-900">
                {gateway.name}
              </Text>
              {gateway.description && (
                <Text className="text-sm text-typography-500">
                  {gateway.description}
                </Text>
              )}
            </VStack>
          </HStack>

          <HStack className="items-center gap-1">
            <Icon 
              as={isOnline ? Wifi : WifiOff} 
              size="xs" 
              className={isOnline ? 'text-success-500' : 'text-gray-400'} 
            />
            <Text className={`text-xs font-medium ${isOnline ? 'text-success-500' : 'text-gray-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </HStack>
        </HStack>

        <VStack className="gap-2 pl-11">
          <HStack className="items-center gap-2">
            <Text className="text-xs text-typography-400 w-12">MAC:</Text>
            <Text className="text-sm text-typography-600 font-mono">
              {gateway.mac}
            </Text>
          </HStack>

          {gateway.zone && (
            <HStack className="items-center gap-2">
              <Icon as={MapPin} size="xs" className="text-typography-400" />
              <Text className="text-sm text-typography-600">
                {gateway.zone}
              </Text>
            </HStack>
          )}

          <HStack className="items-center gap-2">
            <Text className="text-xs text-typography-400">Dispositivos:</Text>
            <Text className="text-sm text-typography-600">
              {gateway.devices_associated.length}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Box>
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
            Sin gateways
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            Esta empresa no tiene gateways registrados
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
      <Text className="text-gray-500 mt-4">Cargando gateways...</Text>
    </View>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <VStack className="items-center gap-4">
        <Text className="text-error-500 text-center">{error}</Text>
        <Pressable
          className="bg-primary-500 active:bg-primary-600 rounded-lg px-6 py-3 flex-row items-center gap-2"
          onPress={onRetry}
        >
          <Icon as={RefreshCw} size="sm" className="text-white" />
          <Text className="text-white font-semibold">Reintentar</Text>
        </Pressable>
      </VStack>
    </View>
  );
}

export function GatewaysScreen() {
  const { companyId, companyName } = useLocalSearchParams<{ 
    companyId: string; 
    companyName: string;
  }>();
  
  const { gateways, isLoading, error, refetch } = useGateways(companyId);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleAddSuccess = () => {
    refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={['top']}>
      <VStack className="flex-1">
        {/* Header */}
        <HStack className="items-center justify-between px-4 py-3 bg-white border-b border-outline-100">
          <HStack className="items-center gap-3 flex-1">
            <Pressable 
              onPress={handleBack}
              className="p-2 -ml-2 active:bg-background-100 rounded-full"
            >
              <Icon as={ArrowLeft} size="md" className="text-typography-900" />
            </Pressable>
            <VStack className="flex-1">
              <Heading size="lg">{companyName || 'Gateways'}</Heading>
              <Text className="text-sm text-typography-500">
                {gateways.length} gateway{gateways.length !== 1 ? 's' : ''}
              </Text>
            </VStack>
          </HStack>

          {/* Botón Agregar */}
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-primary-500 active:bg-primary-600 p-2 rounded-full"
          >
            <Icon as={Plus} size="md" className="text-white" />
          </Pressable>
        </HStack>

        {/* Content */}
        {isLoading && gateways.length === 0 ? (
          <LoadingState />
        ) : error && gateways.length === 0 ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <FlatList
            data={gateways}
            keyExtractor={(item) => item.uuid}
            renderItem={({ item }) => <GatewayCard gateway={item} />}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </VStack>

      {/* Modal Agregar Gateway */}
      <AddGatewayModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companyId={companyId}
        companyName={companyName || ''}
        onSuccess={handleAddSuccess}
      />
    </SafeAreaView>
  );
}