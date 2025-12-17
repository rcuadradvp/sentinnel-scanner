// hooks/useAddGateway.ts
import { useState, useCallback } from 'react';
import { GatewayService, type CreateGatewayPayload } from '@/services/gateway';
import { useLocation } from '@/hooks/useLocation';
import type { Gateway } from '@/types';

interface UseAddGatewayReturn {
  isLoading: boolean;
  error: string | null;
  locationError: string | null;
  isGettingLocation: boolean;
  addGateway: (data: AddGatewayData) => Promise<Gateway | null>;
  validateMAC: (mac: string) => { valid: boolean; formatted?: string; error?: string };
  extractMACFromQR: (qrData: string) => string | null;
  clearError: () => void;
}

interface AddGatewayData {
  name: string;
  mac: string;
  description?: string;
  companyId: string;
}

export function useAddGateway(): UseAddGatewayReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    requestLocation, 
    isLoading: isGettingLocation, 
    error: locationError 
  } = useLocation();

  const validateMAC = useCallback((mac: string) => {
    return GatewayService.validateGatewayMAC(mac);
  }, []);

  const extractMACFromQR = useCallback((qrData: string) => {
    return GatewayService.extractMACFromQR(qrData);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addGateway = useCallback(async (data: AddGatewayData): Promise<Gateway | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Validar MAC
      const validation = validateMAC(data.mac);
      if (!validation.valid) {
        setError(validation.error || 'MAC inválida');
        setIsLoading(false);
        return null;
      }

      // 2. Obtener ubicación
      const location = await requestLocation();
      if (!location) {
        setError('No se pudo obtener la ubicación. Es necesaria para registrar el V-gate.');
        setIsLoading(false);
        return null;
      }

      // 3. Crear payload
      const payload: CreateGatewayPayload = {
        name: data.name,
        mac: validation.formatted!,
        description: data.description || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        status: 'OFFLINE',
        companyId: data.companyId,
      };

      // 4. Enviar a API
      const result = await GatewayService.createGateway(payload);

      if (!result.success) {
        setError(result.error || 'Error al crear gateway');
        setIsLoading(false);
        return null;
      }

      setIsLoading(false);
      return result.data!;
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      setIsLoading(false);
      return null;
    }
  }, [validateMAC, requestLocation]);

  return {
    isLoading,
    error,
    locationError,
    isGettingLocation,
    addGateway,
    validateMAC,
    extractMACFromQR,
    clearError,
  };
}