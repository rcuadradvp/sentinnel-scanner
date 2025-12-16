// hooks/useUnassignedDevices.ts

import { useState, useCallback, useEffect } from 'react';
import { DeviceService } from '@/services/device';
import type { UnassignedDevice } from '@/types';

export const useUnassignedDevices = () => {
  const [devices, setDevices] = useState<UnassignedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDevices = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await DeviceService.fetchUnassignedDevices();
      setDevices(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al cargar dispositivos';
      setError(message);
      console.error('[useUnassignedDevices] Error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const refresh = useCallback(() => {
    fetchDevices(true);
  }, [fetchDevices]);

  return {
    devices,
    isLoading,
    error,
    isRefreshing,
    refresh,
  };
};