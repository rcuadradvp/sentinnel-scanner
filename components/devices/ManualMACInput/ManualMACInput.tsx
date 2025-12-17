// components/devices/ManualMACInput/ManualMACInput.tsx

import { useState, useCallback, useRef } from 'react';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
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
  
  // ✅ Usar ref para evitar re-renders durante la escritura
  const inputRef = useRef<any>(null);

  // ✅ CRÍTICO: No llamar setError(null) en cada cambio de texto
  const handleMACChange = useCallback((text: string) => {
    const upperText = text.toUpperCase();
    const filtered = upperText.replace(/[^0-9A-F]/g, '');
    const limited = filtered.slice(0, 12);
    
    setMAC(limited);
    // ❌ NO hacer: setError(null); 
    // Solo limpiar error cuando sea necesario
  }, []);

  const handleSubmit = useCallback(() => {
    const validation = validateMinewMAC(mac);
    
    if (!validation.valid) {
      setError(validation.error || 'MAC inválida');
      return;
    }

    // Limpiar error solo si es válido
    setError(null);
    onSubmit(validation.formatted || mac);
  }, [mac, onSubmit]);

  const getFormattedPreview = useCallback(() => {
    if (mac.length < 2) return null;
    return mac.match(/.{1,2}/g)?.join(':') || mac;
  }, [mac]);

  const preview = getFormattedPreview();
  const isValidLength = mac.length === 12;

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

      {/* Input de MAC */}
      <VStack className="gap-2">
        <Text className="text-sm font-medium text-typography-700">
          Dirección MAC
        </Text>
        
        <Input
          variant="outline"
          size="md"
          isDisabled={isValidating}
          isInvalid={!!error}
          className="border-gray-300"
        >
          <InputField
            ref={inputRef}
            value={mac}
            onChangeText={handleMACChange}
            placeholder="C300003889BB"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            maxLength={12}
            keyboardType="default"
            className="font-mono tracking-wider uppercase text-base"
            editable={!isValidating}
          />
        </Input>
        
        {/* Contador de caracteres */}
        <Text className="text-xs text-typography-400 text-right">
          {mac.length}/12 caracteres
        </Text>
        
        {/* Error */}
        {error && (
          <Text className="text-error-600 text-sm">{error}</Text>
        )}
      </VStack>

      {/* Preview formateado */}
      {preview && !error && (
        <VStack className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <Text className="text-primary-700 text-sm font-mono text-center">
            {preview}
          </Text>
        </VStack>
      )}

      {/* Botones */}
      <VStack className="gap-3">
        <LoadingButton
          onPress={handleSubmit}
          isLoading={isValidating}
          isDisabled={!isValidLength}
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