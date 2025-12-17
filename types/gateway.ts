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

export interface GatewaysResponse {
  status: number;
  data: Gateway[];
}