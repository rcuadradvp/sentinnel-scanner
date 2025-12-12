/**
 * Profile Screen
 */

import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context';
import { useDevices } from '@/hooks';
import { BleScanner } from '@/services/ble-scanner';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function ProfileScreen() {
  const { 
    user, 
    logout, 
    biometricAvailable, 
    biometricEnabled, 
    biometricType,
    disableBiometric 
  } = useAuth();

  const { syncDevices, isLoading, error, lastSync } = useDevices();

  const handleToggleBiometric = async () => {
    if (biometricEnabled) {
      await disableBiometric();
    }
  };

  const handleSyncDevices = async () => {
    const success = await syncDevices();
    
    if (success) {
      const bleScanner = BleScanner.getInstance();
      await bleScanner.reloadAuthorizedDevices();
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <VStack className="flex-1 px-4 pt-4 bg-background-0">
        
        <Heading size="2xl" className="mb-6">
          Perfil
        </Heading>

        <Box className="bg-background-50 rounded-xl p-4 mb-4">
          <Heading size="lg" className="mb-1">
            {user?.name}
          </Heading>
          <Text className="text-typography-500">
            {user?.email}
          </Text>
          <Text size="sm" className="text-typography-400 mt-1">
            {user?.role}
          </Text>
        </Box>

        <Box className="bg-background-50 rounded-xl p-4 mb-4">
          <Text className="font-medium mb-2">
            Dispositivos Autorizados
          </Text>
          <Text size="sm" className="text-typography-500 mb-3">
            Última sincronización: {formatLastSync(lastSync)}
          </Text>
          
          <Button
            action="primary"
            onPress={handleSyncDevices}
            isDisabled={isLoading}
            className={isLoading ? 'bg-primary-300' : 'bg-primary-500 active:bg-primary-600'}
          >
            {isLoading && (
              <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
            )}
            <ButtonText>
              {isLoading ? 'Sincronizando...' : 'Sincronizar Dispositivos'}
            </ButtonText>
          </Button>

          {error && (
            <Text size="sm" className="text-error-500 mt-2">
              {error}
            </Text>
          )}
        </Box>

        {biometricAvailable && (
          <Box className="bg-background-50 rounded-xl p-4 mb-4">
            <HStack className="items-center justify-between">
              <VStack className="flex-1">
                <Text className="font-medium">
                  Iniciar con {biometricType}
                </Text>
                <Text size="sm" className="text-typography-500">
                  {biometricEnabled 
                    ? 'Activo - Puedes usar biometría para iniciar sesión'
                    : 'Inactivo - Inicia sesión con credenciales para activar'}
                </Text>
              </VStack>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                isDisabled={!biometricEnabled}
              />
            </HStack>
          </Box>
        )}

        <Button
          action="negative"
          onPress={logout}
          className="mt-auto mb-4 bg-error-500 active:bg-error-600"
        >
          <ButtonText>Cerrar Sesión</ButtonText>
        </Button>
        
      </VStack>
    </SafeAreaView>
  );
}