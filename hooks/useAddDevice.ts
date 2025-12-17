// hooks/useAddDevice.ts
// SIMPLIFICADO: Solo valida formato Minew, el backend verifica duplicados

import { useState, useCallback } from 'react';
import { DeviceService } from '@/services/device';
import { validateMinewMAC } from '@/utils/mac';
import type { CreateDevicePayload, UnassignedDevice, DevicePriority } from '@/types';

interface AddDeviceFormData {
  name: string;
  mac: string;
  priority: DevicePriority;
}

export const useAddDevice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo valida formato Minew, NO verifica existencia
  const validateMAC = useCallback(async (mac: string): Promise<{
    valid: boolean;
    error?: string;
    formatted?: string;
  }> => {
    // Solo validar formato Minew
    const validation = validateMinewMAC(mac);
    return validation;
  }, []);

  const addDevice = useCallback(async (formData: AddDeviceFormData): Promise<UnassignedDevice | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateDevicePayload = {
        name: formData.name.trim(),
        mac: formData.mac.replace(/[:\-\s]/g, '').toUpperCase(),
        priority: formData.priority,
        status: 'ACTIVE',
      };

      const device = await DeviceService.createDevice(payload);
      
      // Sync authorized devices para que aparezca en scanner
      try {
        await DeviceService.syncAuthorizedDevices();
      } catch (syncError) {
        console.warn('[useAddDevice] Could not sync after create');
      }

      return device;
    } catch (err: any) {
      // El backend retorna el mensaje de error (ej: "ya existe")
      const message = err.response?.data?.message || 'Error al agregar dispositivo';
      setError(message);
      console.error('[useAddDevice] Error:', err.response?.data || err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    addDevice,
    validateMAC,
    isLoading,
    error,
    clearError,
  };
};