// types/gateway.ts

export interface Company {
  uuid: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface CompaniesResponse {
  status: number;
  message: string;
  data: Company[];
  first: boolean;
  last: boolean;
  currentPageNumber: number;
  itemsInPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  sort: Array<{
    direction: string;
    property: string;
    ignoreCase: boolean;
    nullHandling: string;
    ascending: boolean;
    descending: boolean;
  }>;
}

export interface GatewayDevice {
  uuid?: string;
  name: string;
  mac: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: string | null;
  description: string | null;
  updatedAt: number;
  createdAt: number;
}

export interface Gateway {
  uuid: string;
  company: Company;
  name: string;
  mac: string;
  type: string | null;
  status: 'ONLINE' | 'OFFLINE';
  zone: string | null;
  description: string | null;
  dbi_reference: Record<string, unknown>;
  devices_associated: GatewayDevice[];
  latitude: string | null;
  longitude: string | null;
  updatedAt: number;
  createdAt: number;
}

/**
 * ✅ NUEVO: Detalle del gateway con dispositivos asociados y no asociados
 */
export interface GatewayDetail {
  uuid: string;
  company: Company;
  name: string;
  mac: string;
  status: 'ONLINE' | 'OFFLINE';
  zone: string | null;
  description: string | null;
  devices_associated: GatewayDevice[];
  devices_unassociated: GatewayDevice[];
  latitude: string | null;
  longitude: string | null;
  updatedAt: number;
  createdAt: number;
}

export interface GatewaysResponse {
  status: number;
  data: Gateway[];
}

/**
 * ✅ NUEVO: Response del endpoint de detalle de gateway
 */
export interface GatewayDetailResponse {
  status: number;
  data: GatewayDetail;
}

/**
 * ✅ NUEVO: Payload para asociar dispositivo a gateway
 */
export interface AssociateDevicePayload {
  gateway: {
    uuid: string;
  };
  device: {
    uuid: string;
  };
}

/**
 * ✅ NUEVO: Resumen de gateway para la lista de carpetas
 */
export interface GatewaySummary {
  uuid: string;
  name: string;
  description: string | null;
  devicesCount: number;
}
