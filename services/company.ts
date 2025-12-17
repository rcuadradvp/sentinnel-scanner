// services/company.ts
import api from '@/services/api';
import { Endpoints } from '@/constants/api';
import type { Company, CompaniesResponse } from '@/types';

export interface CompaniesResult {
  success: boolean;
  data?: Company[];
  error?: string;
}

export const CompanyService = {
  async fetchCompanies(): Promise<CompaniesResult> {
    try {
      const response = await api.get<CompaniesResponse>(Endpoints.COMPANIES.BASE);
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al obtener empresas';
      console.error('[CompanyService] Error fetching companies:', error);
      
      return {
        success: false,
        error: message,
      };
    }
  },

  async fetchCompanyById(uuid: string): Promise<{ success: boolean; data?: Company; error?: string }> {
    try {
      const response = await api.get<{ status: number; data: Company }>(
        Endpoints.COMPANIES.BY_ID(uuid)
      );
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al obtener empresa';
      console.error('[CompanyService] Error fetching company:', error);
      
      return {
        success: false,
        error: message,
      };
    }
  },
};