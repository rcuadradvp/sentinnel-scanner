// hooks/useAssociateDevice.ts
import { useState, useCallback } from 'react';
import { GatewayService } from '@/services/gateway';
import { DeviceService } from '@/services/device';
import type { UnassignedDevice } from '@/types';

interface UseAssociateDeviceReturn {
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  associateDevice: (gatewayUuid: string, deviceUuid: string) => Promise<boolean>;
  createAndAssociateDevice: (
    gatewayUuid: string, 
    deviceData: CreateDeviceData
  ) => Promise<boolean>;
  clearError: () => void;
}

interface CreateDeviceData {
  name: string;
  mac: string;
  priority?: number;
}

export function useAssociateDevice(): UseAssociateDeviceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Asociar un dispositivo existente a un gateway
   */
  const associateDevice = useCallback(async (
    gatewayUuid: string, 
    deviceUuid: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await GatewayService.associateDevice(gatewayUuid, deviceUuid);

    if (!result.success) {
      setError(result.error || 'Error al asociar dispositivo');
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  }, []);

  /**
   * Crear un nuevo dispositivo y asociarlo al gateway
   */
  const createAndAssociateDevice = useCallback(async (
    gatewayUuid: string,
    deviceData: CreateDeviceData
  ): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      // 1. Crear el dispositivo
      const payload = {
        name: deviceData.name,
        mac: deviceData.mac.replace(/[:\-\s]/g, '').toUpperCase(),
        priority: String(deviceData.priority || 4),
        status: 'ACTIVE' as const,
      };

      const device = await DeviceService.createDevice(payload);

      if (!device || !device.uuid) {
        setError('Error al crear el dispositivo');
        setIsCreating(false);
        return false;
      }

      // 2. Asociar al gateway
      const associateResult = await GatewayService.associateDevice(
        gatewayUuid, 
        device.uuid
      );

      if (!associateResult.success) {
        setError(associateResult.error || 'Dispositivo creado pero no se pudo asociar');
        setIsCreating(false);
        return false;
      }

      setIsCreating(false);
      return true;
    } catch (err: any) {
      console.error('[useAssociateDevice] Error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error inesperado';
      
      // Detectar MAC duplicada
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('ya existe')) {
        setError('Ya existe un dispositivo con esta MAC');
      } else {
        setError(errorMessage);
      }
      
      setIsCreating(false);
      return false;
    }
  }, []);

  return {
    isLoading,
    isCreating,
    error,
    associateDevice,
    createAndAssociateDevice,
    clearError,
  };
}
