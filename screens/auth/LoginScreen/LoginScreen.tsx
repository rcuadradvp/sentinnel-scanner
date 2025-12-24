// screens/auth/LoginScreen/LoginScreen.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Divider } from '@/components/ui/divider';
import { LoginForm } from '@/components/auth/LoginForm';
import { BiometricButton } from '@/components/auth/BiometricButton';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { PermissionModal } from '@/components/shared/PermissionModal';

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
      <Box className="flex-1 justify-center px-6 bg-white">
        <VStack className="gap-8">
          <Heading size="3xl" className="text-center">
            Iniciar Sesión
          </Heading>

          <AuthErrorAlert error={error} />

          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            onInputChange={handleInputChange}
          />

          {biometricEnabled && (
            <VStack className="gap-6">
              <HStack className="items-center gap-4">
                <Divider className="flex-1" />
                <Text className="text-typography-500">O Ingresar con</Text>
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