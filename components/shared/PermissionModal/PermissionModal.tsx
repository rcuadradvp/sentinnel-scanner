// components/shared/PermissionModal/PermissionModal.tsx
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Bluetooth, MapPin, AlertCircle } from 'lucide-react-native';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'bluetooth' | 'location' | 'camera';
  title?: string;
  description?: string;
  showManualWarning?: boolean;
}

const PERMISSION_CONFIG = {
  bluetooth: {
    icon: Bluetooth,
    title: 'Permisos necesarios',
    description: 'Para escanear beacons necesitas conceder permisos de Bluetooth y ubicación.',
    confirmText: 'Abrir configuración',
  },
  location: {
    icon: MapPin,
    title: 'Permiso de ubicación',
    description: 'Se necesita acceso a la ubicación para localizar dispositivos cercanos.',
    confirmText: 'Permitir acceso',
  },
  camera: {
    icon: MapPin, // Puedes cambiar por Camera si lo importas
    title: 'Acceso a la cámara',
    description: 'Se necesita acceso a la cámara para escanear códigos QR.',
    confirmText: 'Permitir acceso',
  },
};

export function PermissionModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  description,
  showManualWarning = false,
}: PermissionModalProps) {
  const config = PERMISSION_CONFIG[type];
  const IconComponent = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader className="border-b border-outline-200 pb-4">
          <VStack className="items-center gap-3 w-full">
            <VStack className="bg-primary-100 p-4 rounded-full">
              <Icon as={IconComponent} size="xl" className="text-primary-600" />
            </VStack>
            <Heading size="lg" className="text-center">
              {title || config.title}
            </Heading>
          </VStack>
        </ModalHeader>

        <ModalBody className="py-6">
          <VStack className="gap-4">
            <Text className="text-typography-600 text-center">
              {description || config.description}
            </Text>

            {showManualWarning && (
              <HStack className="items-start gap-2 bg-warning-50 p-3 rounded-lg">
                <Icon as={AlertCircle} size="sm" className="text-warning-600 mt-0.5" />
                <Text className="text-xs text-warning-700 flex-1">
                  Activa los permisos manualmente en la configuración de tu dispositivo
                </Text>
              </HStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter className="border-t border-outline-200 pt-4">
          <HStack className="gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onPress={onClose}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              className="flex-1 bg-primary-500"
              onPress={onConfirm}
            >
              <ButtonText>{config.confirmText}</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}