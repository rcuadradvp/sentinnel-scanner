// components/shared/PermissionModal/PermissionModal.tsx
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Bluetooth,
  MapPin,
  Camera,
  AlertCircle,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from 'lucide-react-native';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  type: 'bluetooth' | 'location' | 'camera' | 'biometric-prompt' | 'biometric-success' | 'biometric-disable';
  title?: string;
  description?: string;
  biometricType?: string;
  showManualWarning?: boolean;
}

const PERMISSION_CONFIG = {
  bluetooth: {
    icon: Bluetooth,
    iconBgColor: 'bg-primary-100',
    iconColor: 'text-primary-600',
    title: 'Permisos necesarios',
    description: 'Para escanear beacons necesitas conceder permisos de Bluetooth y ubicación.',
    confirmText: 'Permitir acceso',
    cancelText: 'Cancelar',
    showCancel: true,
    confirmBgColor: 'bg-primary-500',
    confirmTextManual: 'Abrir configuración',
  },
  location: {
    icon: MapPin,
    iconBgColor: 'bg-primary-100',
    iconColor: 'text-primary-600',
    title: 'Permiso de ubicación',
    description: 'Se necesita acceso a la ubicación para localizar dispositivos cercanos.',
    confirmText: 'Permitir acceso',
    cancelText: 'Cancelar',
    showCancel: true,
    confirmBgColor: 'bg-primary-500',
    confirmTextManual: 'Abrir configuración',
  },
  camera: {
    icon: Camera,
    iconBgColor: 'bg-primary-100',
    iconColor: 'text-primary-600',
    title: 'Acceso a la cámara',
    description: 'Se necesita acceso a la cámara para escanear códigos QR.',
    confirmText: 'Permitir acceso',
    cancelText: 'Cancelar',
    showCancel: true,
    confirmBgColor: 'bg-primary-500',
    confirmTextManual: 'Abrir configuración',
  },
  'biometric-prompt': {
    icon: Fingerprint,
    iconBgColor: 'bg-primary-100',
    iconColor: 'text-primary-600',
    title: 'Habilitar {biometricType}',
    description: '¿Deseas usar {biometricType} para iniciar sesión más rápido?',
    confirmText: 'Sí, habilitar',
    cancelText: 'No, gracias',
    showCancel: true,
    confirmBgColor: 'bg-primary-500',
    confirmTextManual: 'Sí, habilitar',
  },
  'biometric-success': {
    icon: CheckCircle2,
    iconBgColor: 'bg-success-100',
    iconColor: 'text-success-600',
    title: '¡Listo!',
    description: '{biometricType} habilitado. La próxima vez podrás iniciar sesión más rápido.',
    confirmText: 'Continuar',
    cancelText: '',
    showCancel: false,
    confirmBgColor: 'bg-success-500',
    confirmTextManual: 'Continuar',
  },
  'biometric-disable': {
    icon: AlertTriangle,
    iconBgColor: 'bg-warning-100',
    iconColor: 'text-warning-600',
    title: 'Desactivar biometría',
    description: '¿Estás seguro? Tendrás que configurarla nuevamente.',
    confirmText: 'Desactivar',
    cancelText: 'Cancelar',
    showCancel: true,
    confirmBgColor: 'bg-error-500',
    confirmTextManual: 'Desactivar',
  },
};

export function PermissionModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  type,
  title,
  description,
  biometricType = 'Biometría',
  showManualWarning = false,
}: PermissionModalProps) {
  const config = PERMISSION_CONFIG[type];
  const IconComponent = config.icon;
  const finalTitle = (title || config.title).replace('{biometricType}', biometricType);
  const finalDescription = (description || config.description).replace('{biometricType}', biometricType);
  const confirmBgColor = config.confirmBgColor || 'bg-primary-500';
  const confirmText = showManualWarning
    ? (config.confirmTextManual || 'Ir a ajustes')
    : config.confirmText;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    if (!showManualWarning) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader className="border-b border-outline-200 pb-4">
          <VStack className="items-center gap-3 w-full">
            <VStack className={`p-4`}>
              <Icon as={IconComponent} size="xl" className={config.iconColor} />
            </VStack>
            <Heading size="lg" className="text-center">
              {finalTitle}
            </Heading>
          </VStack>
        </ModalHeader>

        <ModalBody className="py-6">
          <VStack className="gap-4">
            <Text className="text-typography-600 text-center">
              {finalDescription}
            </Text>
            {showManualWarning && (
              <HStack className="items-start gap-2 bg-warning-50 p-3 rounded-lg">
                <Icon as={AlertCircle} size="sm" className="text-warning-600 mt-0.5" />
                <Text className="text-xs text-warning-700 flex-1">
                  Los permisos fueron denegados permanentemente. Debes activarlos manualmente en la configuración de tu dispositivo.
                </Text>
              </HStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter className="border-t border-outline-200 pt-4">
          {config.showCancel && !showManualWarning ? (
            <HStack className="gap-3 w-full">
              <Button
                variant="outline"
                className="flex-[0.8]"
                onPress={handleCancel}
              >
                <ButtonText>{config.cancelText}</ButtonText>
              </Button>
              <Button
                className={`flex-[1.2] ${confirmBgColor}`}
                onPress={handleConfirm}
              >
                <ButtonText>{confirmText}</ButtonText>
              </Button>
            </HStack>
          ) : (
            <Button
              className={`w-full ${confirmBgColor}`}
              onPress={handleConfirm}
            >
              <ButtonText>{confirmText}</ButtonText>
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}