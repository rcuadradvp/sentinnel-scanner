// screens/auth/LoginScreen/LoginScreen.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '@/context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Divider } from '@/components/ui/divider';
import { LoginForm } from '@/components/auth/LoginForm';
import { BiometricButton } from '@/components/auth/BiometricButton';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { PermissionModal } from '@/components/shared/PermissionModal';

const { height } = Dimensions.get('window');

export function LoginScreen() {
  const {
    login,
    loginWithBiometric,
    isLoading,
    error,
    clearError,
    biometricEnabled,
    biometricType,
    isAuthenticated,
    isAppFreshStart,
    pendingBiometricPrompt,
    confirmBiometricPrompt,
    dismissBiometricPrompt,
  } = useAuth();

  const biometricAutoPrompted = useRef(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [showBiometricSuccess, setShowBiometricSuccess] = useState(false);
  const showBiometricPrompt = pendingBiometricPrompt !== null;

  const handleEnableBiometric = useCallback(async () => {
    const success = await confirmBiometricPrompt();
    if (success) {
      setShowBiometricSuccess(true);
    }
  }, [confirmBiometricPrompt]);

  const handleDeclineBiometric = useCallback(async () => {
    await dismissBiometricPrompt();
  }, [dismissBiometricPrompt]);

  useEffect(() => {
    if (
      biometricEnabled &&
      isAppFreshStart &&
      !biometricAutoPrompted.current &&
      !isAuthenticated &&
      !isLoading
    ) {
      biometricAutoPrompted.current = true;
      handleBiometricLogin();
    }
  }, [biometricEnabled, isAppFreshStart, isAuthenticated, isLoading]);

  useEffect(() => {
    return () => {
      biometricAutoPrompted.current = false;
    };
  }, []);

  const handleLogin = async (credentials: { username: string; password: string }) => {
    await login(credentials);
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    clearError();
    
    try {
      const success = await loginWithBiometric();
      if (!success) {
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleInputChange = () => {
    clearError();
  };

  return (
    <>
      <Box className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" />
        
        {/* Contenedor con fondo azul con gradiente y bordes redondeados inferiores */}
        <Box style={{ height: height * 0.35 }}>
          <LinearGradient
            colors={['#0077AA', '#0099CC', '#0077AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              overflow: 'hidden',
            }}
          >
            {/* Logo centrado */}
            <Box className="flex-1 justify-center items-center">
              <Box 
                className="items-center justify-center bg-white/20"
              >
                <Image
                  source={require('@/assets/icon.svg')}
                  style={{ width: 700, height: 700 }}
                  contentFit="contain"
                />
              </Box>
            </Box>
          </LinearGradient>
        </Box>

        {/* Tarjeta blanca con el formulario */}
        <Box className="flex-1 px-6">
          <Box 
            className="bg-white w-full p-6"
            style={{
              marginTop: -30,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <VStack className="gap-8">
              {/* Título */}
              <Text className="text-3xl font-bold text-typography-600 text-center">
                Bienvenido
              </Text>

              {/* Alerta de error */}
              <AuthErrorAlert error={error} />

              {/* Formulario de login */}
              <LoginForm
                onSubmit={handleLogin}
                isLoading={isLoading}
                onInputChange={handleInputChange}
              />

              {/* Biometric Login (si está habilitado) */}
              {biometricEnabled && (
                <VStack className="gap-4">
                  <HStack className="items-center gap-4">
                    <Divider className="flex-1" />
                    <Text className="text-typography-500 text-sm">O ingresar con</Text>
                    <Divider className="flex-1" />
                  </HStack>
                  <BiometricButton
                    onPress={handleBiometricLogin}
                    isLoading={isLoading || isBiometricLoading}
                    biometricType={biometricType || 'Biometría'}
                  />
                </VStack>
              )}
            </VStack>
          </Box>
        </Box>
      </Box>

      {/* Modales */}
      <PermissionModal
        isOpen={showBiometricPrompt}
        onClose={handleDeclineBiometric}
        onConfirm={handleEnableBiometric}
        onCancel={handleDeclineBiometric}
        type="biometric-prompt"
        biometricType={biometricType || 'Biometría'}
      />
      <PermissionModal
        isOpen={showBiometricSuccess}
        onClose={() => setShowBiometricSuccess(false)}
        onConfirm={() => setShowBiometricSuccess(false)}
        type="biometric-success"
        biometricType={biometricType || 'Biometría'}
      />
    </>
  );
}