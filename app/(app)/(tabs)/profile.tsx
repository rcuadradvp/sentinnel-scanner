/**
 * Profile Screen
 */

import { View, Text, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context';

export default function ProfileScreen() {
  const { 
    user, 
    logout, 
    biometricAvailable, 
    biometricEnabled, 
    biometricType,
    disableBiometric 
  } = useAuth();

  const handleToggleBiometric = async () => {
    if (biometricEnabled) {
      await disableBiometric();
    }
    // Para habilitar, el usuario debe cerrar sesión y volver a iniciar
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <Text className="text-2xl font-bold mb-6">Perfil</Text>

        {/* Info del usuario */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-1">{user?.name}</Text>
          <Text className="text-gray-500">{user?.email}</Text>
          <Text className="text-rrgray-400 text-sm mt-1">{user?.role}</Text>
        </View>

        {/* Configuración de biometría */}
        {biometricAvailable && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">Iniciar con {biometricType}</Text>
                <Text className="text-gray-500 text-sm">
                  {biometricEnabled 
                    ? 'Activo - Puedes usar biometría para iniciar sesión'
                    : 'Inactivo - Inicia sesión con credenciales para activar'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                disabled={!biometricEnabled}
              />
            </View>
          </View>
        )}

        {/* Cerrar sesión */}
        <Pressable
          className="bg-red-500 active:bg-red-600 rounded-xl py-4 mt-auto mb-4"
          onPress={logout}
        >
          <Text className="text-white font-semibold text-center">
            Cerrar Sesión
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}