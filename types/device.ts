export interface Device {
  uuid: string;
  companyId: string | null;
  company: {
    uuid: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    isActive: boolean;
    updatedAt: number;
    createdAt: number;
  };
  name: string;
  mac: string;
  status: 'ACTIVE' | 'INACTIVE';
  priority: number;
  type: string | null;
  description: string | null;
  updatedAt: number;
  createdAt: number;
}

export interface AuthorizedDevicesMap {
  [mac: string]: string;
}

export interface DevicesResponse {
  status: number;
  message: string;
  data: Device[];
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

export interface UnassignedDevice {
  uuid: string;
  name: string;
  mac: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: string | null;
  description: string | null;
  updatedAt: number;
  createdAt: number;
  companyId: string;
  companyName: string;
}

export interface UnassignedDevicesResponse {
  status: number;
  message: string;
  data: {
    totalUnassociatedDevices: number;
    devices: UnassignedDevice[];
  };
}

export type DevicePriority = 1 | 2 | 3 | 4 | 5;

export interface CreateDevicePayload {
  name: string;
  mac: string;
  priority: DevicePriority;
  status: 'ACTIVE';
}

export interface CreateDeviceResponse {
  status: number;
  message: string;
  data: UnassignedDevice;
}

export const DEVICE_PRIORITIES = [
  { label: 'Crítica', value: 1 },
  { label: 'Alta', value: 2 },
  { label: 'Media', value: 3 },
  { label: 'Moderada', value: 4 },
  { label: 'Baja', value: 5 },
] as const;