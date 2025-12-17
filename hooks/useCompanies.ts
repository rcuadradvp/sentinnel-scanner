// hooks/useCompanies.ts
import { useState, useCallback, useEffect } from 'react';
import { CompanyService } from '@/services/company';
import type { Company } from '@/types';

interface UseCompaniesReturn {
  companies: Company[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCompanies(): UseCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await CompanyService.fetchCompanies();

    if (result.success && result.data) {
      setCompanies(result.data);
    } else {
      setError(result.error || 'Error desconocido');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    isLoading,
    error,
    refetch: fetchCompanies,
  };
}