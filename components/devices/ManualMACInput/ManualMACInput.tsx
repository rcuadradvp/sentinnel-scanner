// components/devices/ManualMACInput/ManualMACInput.tsx

import { useState } from 'react';
import { View } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { FormInput } from '@/components/shared/FormInput';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { formatMAC, validateMinewMAC } from '@/utils/mac';

interface ManualMACInputProps {
  onSubmit: (mac: string) => void;
  onCancel: () => void;
  isValidating: boolean;
}

export function ManualMACInput({ onSubmit, onCancel, isValidating }: ManualMACInputProps) {
  const [mac, setMAC] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleMACChange = (text: string) => {
    // Permitir solo hex y separadores
    const cleaned = text.replace(/[^0-9A-Fa-f:\-\s]/g, '');
    setMAC(cleaned);
    setError(null);
  };

  const handleSubmit = () => {
    const validation = validateMinewMAC(mac);
    
    if (!validation.valid) {
      setError(validation.error || 'MAC inválida');
      return;
    }

    onSubmit(validation.formatted || mac);
  };

  const preview = mac.length >= 12 ? formatMAC(mac) : null;

  return (
    <VStack className="gap-6 p-4">
      <VStack className="gap-2">
        <Text className="text-sm text-typography-500 text-center">
          Ingresa la dirección MAC del beacon Minew
        </Text>
        <Text className="text-xs text-typography-400 text-center">
          Debe comenzar con C30000...
        </Text>
      </VStack>

      <FormInput
        label="Dirección MAC"
        value={mac}
        onChangeText={handleMACChange}
        placeholder="C300003889BB"
        autoCapitalize="characters"
        error={error || undefined}
      />

      {preview && !error && (
        <View className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <Text className="text-primary-700 text-sm font-mono text-center">
            {preview}
          </Text>
        </View>
      )}

      <VStack className="gap-3">
        <LoadingButton
          onPress={handleSubmit}
          isLoading={isValidating}
          isDisabled={mac.length < 12}
          variant="primary"
        >
          Validar MAC
        </LoadingButton>

        <LoadingButton
          onPress={onCancel}
          isDisabled={isValidating}
          variant="secondary"
        >
          Volver al escáner
        </LoadingButton>
      </VStack>
    </VStack>
  );
}