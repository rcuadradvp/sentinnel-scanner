// components/profile/BiometricSettingsCard/BiometricSettingsCard.tsx
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { Fingerprint, CheckCircle, XCircle, Info } from 'lucide-react-native';

interface BiometricSettingsCardProps {
  biometricType: string;
  biometricEnabled: boolean;
  biometricDeclined: boolean;
  isLoading?: boolean;
  onToggle: (enable: boolean) => void;
}

export function BiometricSettingsCard({
  biometricType,
  biometricEnabled,
  biometricDeclined,
  isLoading = false,
  onToggle,
}: BiometricSettingsCardProps) {
  const getStatusMessage = () => {
    if (biometricEnabled) {
      return 'Activo - Puedes usar biometría para iniciar sesión';
    }
    if (biometricDeclined) {
      return 'Desactivado - Actívalo para usar inicio rápido';
    }
    return 'Inactivo - Activa para iniciar sesión más rápido';
  };

  const getStatusIcon = () => {
    if (biometricEnabled) {
      return CheckCircle;
    }
    if (biometricDeclined) {
      return XCircle;
    }
    return Info;
  };

  const getStatusColor = () => {
    if (biometricEnabled) {
      return 'text-success-500';
    }
    if (biometricDeclined) {
      return 'text-warning-500';
    }
    return 'text-typography-400';
  };

  const handleToggle = (value: boolean) => {
    if (!isLoading) {
      onToggle(value);
    }
  };

  return (
    <Box className="bg-background-50 rounded-xl p-5 mb-4">
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-3 flex-1">
          <Box className="bg-primary-100 rounded-full p-2">
            <Icon
              as={Fingerprint}
              size="md"
              className="text-primary-600"
            />
          </Box>
          <VStack className="flex-1">
            <Text className="font-semibold text-typography-900">
              Iniciar con {biometricType}
            </Text>
            <HStack className="items-center gap-2 mt-1">
              <Icon
                as={getStatusIcon()}
                size="xs"
                className={getStatusColor()}
              />
              <Text size="sm" className="text-typography-500 flex-1">
                {getStatusMessage()}
              </Text>
            </HStack>
          </VStack>
        </HStack>
        <Switch
          value={biometricEnabled}
          onValueChange={handleToggle}
          isDisabled={isLoading}
          trackColor={{
            false: '#E5E7EB',
            true: '#22C55E',
          }}
          thumbColor={biometricEnabled ? '#FFFFFF' : '#FFFFFF'}
        />
      </HStack>

      {biometricEnabled && (
        <Box className="bg-success-50 rounded-lg p-3 mt-4">
          <HStack className="items-start gap-2">
            <Icon
              as={CheckCircle}
              size="sm"
              className="text-success-600 mt-0.5"
            />
            <VStack className="flex-1">
              <Text size="sm" className="text-success-800 font-medium">
                Inicio rápido configurado
              </Text>
              <Text size="xs" className="text-success-700">
                La próxima vez podrás iniciar sesión usando {biometricType} sin necesidad de escribir tu contraseña.
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {!biometricEnabled && biometricDeclined && (
        <Box className="bg-warning-50 rounded-lg p-3 mt-4">
          <HStack className="items-start gap-2">
            <Icon
              as={Info}
              size="sm"
              className="text-warning-600 mt-0.5"
            />
            <VStack className="flex-1">
              <Text size="sm" className="text-warning-800 font-medium">
                Biometría desactivada
              </Text>
              <Text size="xs" className="text-warning-700">
                Activa el switch para configurar el inicio rápido. Se te pedirá confirmar tu contraseña.
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}
    </Box>
  );
}