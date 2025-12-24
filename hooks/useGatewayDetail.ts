// hooks/useGatewayDetail.ts
import { useState, useCallback, useEffect } from 'react';
import { GatewayService } from '@/services/gateway';
import type { GatewayDetail } from '@/types';

interface UseGatewayDetailReturn {
  gateway: GatewayDetail | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGatewayDetail(gatewayUuid: string): UseGatewayDetailReturn {
  const [gateway, setGateway] = useState<GatewayDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (!gatewayUuid) {
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const result = await GatewayService.fetchGatewayDetail(gatewayUuid);

    if (result.success && result.data) {
      setGateway(result.data);
    } else {
      setError(result.error || 'Error desconocido');
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [gatewayUuid]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const refresh = useCallback(async () => {
    await fetchDetail(true);
  }, [fetchDetail]);

  return {
    gateway,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
