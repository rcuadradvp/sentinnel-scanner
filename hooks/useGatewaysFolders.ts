// hooks/useGatewaysFolders.ts
import { useState, useCallback, useEffect } from 'react';
import { GatewayService } from '@/services/gateway';
import type { GatewaySummary } from '@/types';

interface UseGatewaysFoldersReturn {
  gateways: GatewaySummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGatewaysFolders(): UseGatewaysFoldersReturn {
  const [gateways, setGateways] = useState<GatewaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGateways = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const result = await GatewayService.fetchGatewaysSummary();

    if (result.success && result.data) {
      setGateways(result.data);
    } else {
      setError(result.error || 'Error desconocido');
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const refresh = useCallback(async () => {
    await fetchGateways(true);
  }, [fetchGateways]);

  return {
    gateways,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
