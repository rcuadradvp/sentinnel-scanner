// screens/gateways/CompaniesScreen/CompaniesScreen.tsx
import { FlatList, Pressable, RefreshControl, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Building2, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useCompanies } from '@/hooks/useCompanies';
import type { Company } from '@/types';

function CompanyCard({ company }: { company: Company }) {
  const handlePress = () => {
    router.push({
      pathname: '/(app)/(tabs)/gateways/[companyId]',
      params: { 
        companyId: company.uuid,
        companyName: company.name,
      },
    } as any);
  };

  return (
    <Pressable onPress={handlePress}>
      <Box className="rounded-xl p-4 mb-3 bg-white border border-outline-100 active:bg-background-50">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            <View className="bg-primary-50 rounded-full p-2">
              <Icon as={Building2} size="sm" className="text-primary-500" />
            </View>
            <Text className="font-semibold text-lg text-typography-900">
              {company.name}
            </Text>
          </HStack>
          <Icon as={ChevronRight} size="md" className="text-typography-400" />
        </HStack>
      </Box>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <VStack className="items-center gap-4">
        <View className="bg-gray-100 rounded-full p-6">
          <Icon as={Building2} size="xl" className="text-gray-400" />
        </View>
        <VStack className="items-center gap-2">
          <Text className="text-gray-600 text-lg font-medium text-center">
            Sin empresas disponibles
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            No hay empresas registradas en el sistema
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
      <Text className="text-gray-500 mt-4">Cargando empresas...</Text>
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

export function CompaniesScreen() {
  const { companies, isLoading, error, refetch } = useCompanies();

  if (isLoading && companies.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error && companies.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={['top']}>
        <VStack className="flex-1 px-4 pt-4">
          <Heading size="2xl" className="mb-6">V-gate</Heading>
          <ErrorState error={error} onRetry={refetch} />
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={['top']}>
      <VStack className="flex-1 px-4 pt-4">
        <Heading size="2xl" className="mb-6">V-gate</Heading>

        <FlatList
          data={companies}
          keyExtractor={(item) => item.uuid}
          renderItem={({ item }) => <CompanyCard company={item} />}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      </VStack>
    </SafeAreaView>
  );
}