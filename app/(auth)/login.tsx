/**
 * Login Screen
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context';

export default function LoginScreen() {
  const {
    login,
    loginWithBiometric,
    isLoading,
    error,
    clearError,
    biometricEnabled,
    biometricType,
    isAuthenticated,
    // 🆕 Nuevos valores
    shouldPromptBiometric,
    clearBiometricPrompt,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const biometricAttempted = useRef(false);

  // 🆕 Biometría automática SOLO si:
  // - biometría habilitada
  // - no se ha intentado aún
  // - no está autenticado
  // - shouldPromptBiometric es true (app recién abierta)
  useEffect(() => {
    if (
      biometricEnabled &&
      !biometricAttempted.current &&
      !isAuthenticated &&
      shouldPromptBiometric
    ) {
      biometricAttempted.current = true;
      handleBiometricLogin();
    }
  }, [biometricEnabled, isAuthenticated, shouldPromptBiometric]);

  useEffect(() => {
    return () => {
      biometricAttempted.current = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    
    // 🆕 Limpiar prompt antes de intentar login
    clearBiometricPrompt();
    
    await login({ username: username.trim(), password });
  };

  const handleBiometricLogin = async () => {
    const success = await loginWithBiometric();
    
    if (!success) {
      console.log('[Login] Biometric failed, user can enter password');
    }
  };

  const handleManualBiometric = () => {
    handleBiometricLogin();
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-8">
        Iniciar Sesión
      </Text>

      {error && (
        <View className="bg-red-100 p-3 rounded-lg mb-4">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      )}

      {/* Botón de biometría - siempre visible si está habilitada */}
      {biometricEnabled && (
        <>
          <Pressable
            className="bg-primary-500 active:bg-primary-600 rounded-lg py-4 mb-6"
            onPress={handleManualBiometric}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Ingresar con {biometricType}
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500">o usa tu contraseña</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>
        </>
      )}

      <View className="mb-4">
        <Text className="text-sm font-medium mb-2 text-gray-700">Usuario</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="correo@ejemplo.com"
          value={username}
          onChangeText={(text) => {
            clearError();
            setUsername(text);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium mb-2 text-gray-700">Contraseña</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            clearError();
            setPassword(text);
          }}
          secureTextEntry
          editable={!isLoading}
        />
      </View>

      <Pressable
        className={`rounded-lg py-4 ${
          isLoading ? 'bg-gray-400' : 'bg-primary-500 active:bg-primary-600'
        }`}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Ingresar
          </Text>
        )}
      </Pressable>
    </View>
  );
}