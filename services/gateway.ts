// services/gateway.ts
import api from '@/services/api';
import { Endpoints } from '@/constants/api';
import { VALID_GATEWAY_MAC_PREFIXES_RAW } from '@/constants/gateway';
import type { Gateway, GatewaysResponse } from '@/types';

export interface GatewaysResult {
  success: boolean;
  data?: Gateway[];
  error?: string;
}

export interface CreateGatewayPayload {
  name: string;
  mac: string;
  description?: string;
  latitude: string;
  longitude: string;
  status: 'OFFLINE';
  companyId: string;
}

export interface CreateGatewayResult {
  success: boolean;
  data?: Gateway;
  error?: string;
}

export interface ValidateMACResult {
  valid: boolean;
  formatted?: string;
  error?: string;
}

export const GatewayService = {
  async fetchGatewaysByCompany(companyId: string): Promise<GatewaysResult> {
    try {
      const response = await api.get<GatewaysResponse>(
        Endpoints.GATEWAYS.BY_ID(companyId)
      );
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al obtener gateways';
      console.error('[GatewayService] Error fetching gateways:', error);
      
      return {
        success: false,
        error: message,
      };
    }
  },

  async fetchAllGateways(): Promise<GatewaysResult> {
    try {
      const response = await api.get<GatewaysResponse>(Endpoints.GATEWAYS.BASE);
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al obtener gateways';
      console.error('[GatewayService] Error fetching all gateways:', error);
      
      return {
        success: false,
        error: message,
      };
    }
  },

  async createGateway(payload: CreateGatewayPayload): Promise<CreateGatewayResult> {
    try {
      const response = await api.post<{ status: number; data: Gateway }>(
        Endpoints.GATEWAYS.BASE,
        payload
      );
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear gateway';
      console.error('[GatewayService] Error creating gateway:', error);
      
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Valida que la MAC sea de un V-gate válido
   */
  validateGatewayMAC(mac: string): ValidateMACResult {
    // Normalizar: quitar separadores y convertir a mayúsculas
    const normalized = mac.replace(/[:\-\s]/g, '').toUpperCase().trim();

    // Validar formato (12 caracteres hexadecimales)
    if (!/^[0-9A-F]{12}$/.test(normalized)) {
      return {
        valid: false,
        error: 'Formato de MAC inválido',
      };
    }

    // Obtener prefijo (primeros 6 caracteres)
    const prefix = normalized.substring(0, 6);

    // Verificar si es un prefijo válido
    const isValid = VALID_GATEWAY_MAC_PREFIXES_RAW.includes(prefix as any);

    if (!isValid) {
      return {
        valid: false,
        error: 'Este dispositivo no es un V-gate válido',
      };
    }

    return {
      valid: true,
      formatted: normalized,
    };
  },

  /**
   * Extrae MAC de un string QR (puede venir en varios formatos)
   */
  extractMACFromQR(qrData: string): string | null {
    // Intentar extraer MAC en formato XX:XX:XX:XX:XX:XX o XXXXXXXXXXXX
    const macRegex = /([0-9A-Fa-f]{2}[:\-]?){5}[0-9A-Fa-f]{2}/;
    const match = qrData.match(macRegex);
    
    if (match) {
      return match[0];
    }

    // Si el QR es solo la MAC sin formato
    const rawMacRegex = /^[0-9A-Fa-f]{12}$/;
    if (rawMacRegex.test(qrData.trim())) {
      return qrData.trim();
    }

    return null;
  },
};