// hooks/useAddDevice.ts

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

  const validateMAC = useCallback(async (mac: string): Promise<{
    valid: boolean;
    error?: string;
    formatted?: string;
  }> => {
    // Validar formato Minew
    const validation = validateMinewMAC(mac);
    if (!validation.valid) {
      return validation;
    }

    // Verificar si ya existe
    try {
      const exists = await DeviceService.checkMACExists(mac);
      if (exists) {
        return {
          valid: false,
          error: 'Este dispositivo ya está registrado'
        };
      }
    } catch (err) {
      console.warn('[useAddDevice] Could not check MAC existence');
    }

    return validation;
  }, []);

  const addDevice = useCallback(async (formData: AddDeviceFormData): Promise<UnassignedDevice | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validar MAC una vez más antes de enviar
      const validation = await validateMAC(formData.mac);
      if (!validation.valid) {
        setError(validation.error || 'MAC inválida');
        setIsLoading(false);
        return null;
      }

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
      const message = err.response?.data?.message || 'Error al agregar dispositivo';
      setError(message);
      console.error('[useAddDevice] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [validateMAC]);

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