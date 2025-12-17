// components/devices/ManualMACInput/ManualMACInput.tsx
// ✅ VERSIÓN MEJORADA - Con instrucciones más claras sobre caracteres hexadecimales

import { useState } from 'react';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { validateMinewMAC } from '@/utils/mac';

interface ManualMACInputProps {
  onSubmit: (mac: string) => void;
  onCancel: () => void;
  isValidating: boolean;
}

export function ManualMACInput({ onSubmit, onCancel, isValidating }: ManualMACInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    // Limpiar y procesar SOLO al presionar el botón
    const cleaned = inputValue
      .replace(/[\s\-:]/g, '')
      .toUpperCase()
      .replace(/[^0-9A-F]/g, '')
      .slice(0, 12);

    // Validar
    const validation = validateMinewMAC(cleaned);
    
    if (!validation.valid) {
      setError(validation.error || 'MAC inválida');
      return;
    }

    // Enviar la MAC validada
    onSubmit(validation.formatted || cleaned);
  };

  return (
    <VStack className="gap-6 p-4">
      {/* Instrucciones */}
      <VStack className="gap-2">
        <Text className="text-sm text-typography-500 text-center">
          Ingresa la dirección MAC del v-tag
        </Text>
      </VStack>

      {/* Input con maxLength nativo */}
      <VStack className="gap-2">
        <Text className="text-sm font-medium text-typography-700">
          Dirección MAC
        </Text>
        
        <Input
          variant="outline"
          size="md"
          isDisabled={isValidating}
          isInvalid={!!error}
        >
          <InputField
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="C300003889BB"
            maxLength={12}
            autoCorrect={false}
            autoComplete="off"
            editable={!isValidating}
          />
        </Input>
        
        {/* Contador */}
        <Text className="text-xs text-typography-400 text-right">
          {inputValue.length}/12 caracteres
        </Text>
        
        {/* Error */}
        {error && (
          <Text className="text-error-600 text-sm">{error}</Text>
        )}
      </VStack>

      {/* Botones */}
      <VStack className="gap-3">
        <LoadingButton
          onPress={handleSubmit}
          isLoading={isValidating}
          isDisabled={!inputValue.trim()}
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