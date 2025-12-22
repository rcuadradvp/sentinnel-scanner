// components/profile/EnableBiometricModal/EnableBiometricModal.tsx
import { useState } from 'react';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { EyeIcon, EyeOffIcon, Fingerprint, AlertCircle } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';

interface EnableBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<boolean>;
  biometricType: string;
  username: string;
}

export function EnableBiometricModal({
  isOpen,
  onClose,
  onConfirm,
  biometricType,
  username,
}: EnableBiometricModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await onConfirm(password);
      
      if (success) {
        handleClose();
      } else {
        setError('Contraseña incorrecta o error al verificar');
      }
    } catch (err) {
      setError('Error al habilitar biometría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader className="border-b border-outline-200 pb-4">
          <VStack className="items-center gap-2 w-full">
            <Icon
              as={Fingerprint}
              size="xl"
              className="text-primary-500"
            />
            <Heading size="lg" className="text-center">
              Habilitar {biometricType}
            </Heading>
          </VStack>
        </ModalHeader>

        <ModalBody className="py-4">
          <VStack className="gap-4">
            <Text className="text-typography-600 text-center">
              Para habilitar el inicio de sesión con {biometricType}, confirma tu contraseña actual.
            </Text>

            <VStack className="gap-2">
              <Text className="text-typography-500 text-sm">
                Usuario: <Text className="font-semibold text-typography-900">{username}</Text>
              </Text>
            </VStack>

            <VStack className="gap-1">
              <Text className="text-typography-700 font-medium">Contraseña</Text>
              <Input
                variant="outline"
                size="md"
                isInvalid={!!error}
              >
                <InputField
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <InputSlot className="pr-3">
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <InputIcon
                      as={showPassword ? EyeOffIcon : EyeIcon}
                      className="text-typography-500"
                    />
                  </Pressable>
                </InputSlot>
              </Input>
            </VStack>

            {error && (
              <HStack className="items-center gap-2 bg-error-50 p-3 rounded-lg">
                <Icon as={AlertCircle} size="sm" className="text-error-500" />
                <Text className="text-error-700 text-sm flex-1">{error}</Text>
              </HStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter className="border-t border-outline-200 pt-4">
          <HStack className="gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              className="flex-1 bg-primary-500"
              onPress={handleConfirm}
              isDisabled={isLoading || !password.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ButtonText>Habilitar</ButtonText>
              )}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}