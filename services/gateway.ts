// services/gateway.ts
import api from '@/services/api';
import { Endpoints } from '@/constants/api';
import { VALID_GATEWAY_MAC_PREFIXES_RAW } from '@/constants/gateway';
import type { 
  Gateway, 
  GatewaysResponse, 
  GatewayDetail, 
  GatewayDetailResponse,
  AssociateDevicePayload,
  GatewaySummary,
} from '@/types';

export interface GatewaysResult {
  success: boolean;
  data?: Gateway[];
  error?: string;
}

export interface GatewayDetailResult {
  success: boolean;
  data?: GatewayDetail;
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

export interface AssociateDeviceResult {
  success: boolean;
  error?: string;
}

export const GatewayService = {
  /**
   * ✅ NUEVO: Obtener todos los gateways del usuario
   */
  async fetchAllGateways(): Promise<GatewaysResult> {
    try {
      const response = await api.get<Gateway[]>(Endpoints.GATEWAYS.BASE);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('[GatewayService] Error fetching all gateways:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener gateways',
      };
    }
  },

  /**
   * ✅ NUEVO: Obtener resumen de gateways para la pantalla de carpetas
   */
  async fetchGatewaysSummary(): Promise<{ success: boolean; data?: GatewaySummary[]; error?: string }> {
    try {
      const response = await api.get<Gateway[]>(Endpoints.GATEWAYS.BASE);
      
      const summaries: GatewaySummary[] = response.data.map((gateway) => ({
        uuid: gateway.uuid,
        name: gateway.name,
        description: gateway.description,
        devicesCount: gateway.devices_associated?.length || 0,
      }));

      return {
        success: true,
        data: summaries,
      };
    } catch (error: any) {
      console.error('[GatewayService] Error fetching gateways summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener gateways',
      };
    }
  },

  /**
   * ✅ NUEVO: Obtener detalle de un gateway con dispositivos asociados y no asociados
   */
  async fetchGatewayDetail(gatewayUuid: string): Promise<GatewayDetailResult> {
    try {
      const response = await api.get<GatewayDetailResponse>(
        `/gateways/search/${gatewayUuid}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[GatewayService] Error fetching gateway detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener detalle del gateway',
      };
    }
  },

  /**
   * ✅ NUEVO: Asociar un dispositivo a un gateway
   */
  async associateDevice(gatewayUuid: string, deviceUuid: string): Promise<AssociateDeviceResult> {
    try {
      const payload: AssociateDevicePayload = {
        gateway: { uuid: gatewayUuid },
        device: { uuid: deviceUuid },
      };

      await api.post('/gatewaydevices', payload);
      
      return { success: true };
    } catch (error: any) {
      console.error('[GatewayService] Error associating device:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al asociar dispositivo',
      };
    }
  },

  /**
   * ✅ NUEVO: Desasociar un dispositivo de un gateway
   */
  async disassociateDevice(gatewayUuid: string, deviceUuid: string): Promise<AssociateDeviceResult> {
    try {
      await api.delete(`/gatewaydevices/${gatewayUuid}/${deviceUuid}`);
      return { success: true };
    } catch (error: any) {
      console.error('[GatewayService] Error disassociating device:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al desasociar dispositivo',
      };
    }
  },

  /**
   * Obtener gateways por compañía
   */
  async fetchGatewaysByCompany(companyId: string): Promise<GatewaysResult> {
    try {
      const response = await api.get<GatewaysResponse>(
        `${Endpoints.GATEWAYS.BASE}/company/${companyId}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[GatewayService] Error fetching gateways:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener gateways',
      };
    }
  },

  /**
   * Crear un nuevo gateway
   */
  async createGateway(payload: CreateGatewayPayload): Promise<CreateGatewayResult> {
    try {
      const apiPayload = {
        name: payload.name,
        mac: payload.mac,
        description: payload.description || null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        status: payload.status,
        company: {
          uuid: payload.companyId,
        },
      };

      const response = await api.post<{ data: Gateway }>(
        Endpoints.GATEWAYS.BASE,
        apiPayload
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('[GatewayService] Error creating gateway:', error);
      
      const errorMessage = error.response?.data?.message || 'Error al crear gateway';
      
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('ya existe')) {
        return {
          success: false,
          error: 'Ya existe un gateway con esta MAC',
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Validar MAC de gateway
   */
  validateGatewayMAC(mac: string): ValidateMACResult {
    if (!mac) {
      return { valid: false, error: 'MAC requerida' };
    }

    const cleaned = mac.replace(/[:\-\s]/g, '').toUpperCase();

    if (cleaned.length !== 12) {
      return { valid: false, error: 'MAC debe tener 12 caracteres' };
    }

    if (!/^[0-9A-F]{12}$/.test(cleaned)) {
      return { valid: false, error: 'MAC contiene caracteres inválidos' };
    }

    const hasValidPrefix = VALID_GATEWAY_MAC_PREFIXES_RAW.some(prefix => 
      cleaned.startsWith(prefix)
    );

    if (!hasValidPrefix) {
      return { 
        valid: false, 
        error: 'MAC no corresponde a un V-gate válido' 
      };
    }

    return { 
      valid: true, 
      formatted: cleaned 
    };
  },

  /**
   * Extraer MAC de QR
   */
  extractMACFromQR(qrData: string): string | null {
    if (!qrData) return null;
    
    const cleaned = qrData.replace(/[:\-\s]/g, '').toUpperCase().trim();
    
    if (/^[0-9A-F]{12}$/.test(cleaned)) {
      return cleaned;
    }

    const macMatch = cleaned.match(/([0-9A-F]{12})/);
    if (macMatch) {
      return macMatch[1];
    }

    return null;
  },
};
