// hooks/useGateways.ts
import { useState, useCallback, useEffect } from 'react';
import { GatewayService } from '@/services/gateway';
import type { Gateway } from '@/types';

interface UseGatewaysReturn {
  gateways: Gateway[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGateways(companyId: string): UseGatewaysReturn {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGateways = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await GatewayService.fetchGatewaysByCompany(companyId);

    if (result.success && result.data) {
      setGateways(result.data);
    } else {
      setError(result.error || 'Error desconocido');
    }

    setIsLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  return {
    gateways,
    isLoading,
    error,
    refetch: fetchGateways,
  };
}