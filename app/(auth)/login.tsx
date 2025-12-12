import { useState, useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/context';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { FormControl } from '@/components/ui/form-control';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Divider } from '@/components/ui/divider';

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
    shouldPromptBiometric,
    clearBiometricPrompt,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const biometricAttempted = useRef(false);

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

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box className="flex-1 justify-center px-6 bg-white">
      <VStack className="gap-8">
        <Heading size="3xl" className="text-center">
          Iniciar Sesión
        </Heading>

        {error && (
          <Box className="bg-error-100 p-3 rounded-lg">
            <Text className="text-error-600 text-center">{error}</Text>
          </Box>
        )}

        {biometricEnabled && (
          <VStack className="gap-6">
            <Button
              className="bg-primary-500 active:bg-primary-600"
              onPress={handleManualBiometric}
              isDisabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ButtonText>
                  Ingresar con {biometricType}
                </ButtonText>
              )}
            </Button>

            <HStack className="items-center gap-4">
              <Divider className="flex-1" />
              <Text className="text-typography-500">o usa tu contraseña</Text>
              <Divider className="flex-1" />
            </HStack>
          </VStack>
        )}

        <FormControl>
          <VStack className="gap-6">
            <VStack className="gap-2">
              <Text className="text-sm font-medium text-typography-700">
                Usuario
              </Text>
              <Input>
                <InputField
                  type="text"
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
              </Input>
            </VStack>

            <VStack className="gap-2">
              <Text className="text-sm font-medium text-typography-700">
                Contraseña
              </Text>
              <Input>
                <InputField
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(text) => {
                    clearError();
                    setPassword(text);
                  }}
                  editable={!isLoading}
                />
                <InputSlot className="pr-3" onPress={togglePasswordVisibility}>
                  <InputIcon 
                    as={showPassword ? Eye : EyeOff}
                    className="text-typography-500"
                  />
                </InputSlot>
              </Input>
            </VStack>

            <Button
              className={isLoading ? 'bg-gray-400' : 'bg-primary-500 active:bg-primary-600'}
              onPress={handleLogin}
              isDisabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ButtonText>Ingresar</ButtonText>
              )}
            </Button>
          </VStack>
        </FormControl>
      </VStack>
    </Box>
  );
}