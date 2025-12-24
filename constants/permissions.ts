// constants/permissions.ts

export const AppPaths = {
  // Monitoring
  MONITORING: 'MONITORING',
  
  // Devices
  DEVICES_ASSIGNED: 'DEVICES_ASSIGNED',
  DEVICES_UNASSIGNED: 'DEVICES_UNASSIGNED',
  
  // Gateway
  GATEWAY: 'GATEWAY',
  GATEWAYS_BY_ZONE: 'GATEWAYS_BY_ZONE',
  MASTER_GATEWAYS: 'MASTER_GATEWAYS',
  
  // Alerts
  ALERTS: 'ALERTS',
  HISTORY_ALERTS: 'HISTORY_ALERTS',
  
  // Admin
  USERS: 'USERS',
  ROLES: 'ROLES',
} as const;

export type AppPath = typeof AppPaths[keyof typeof AppPaths];

interface TabPermission {
  requiredPaths: AppPath[];
  anyOf?: boolean;
  label: string;
  icon: string;
}

export const TabPermissions: Record<string, TabPermission> = {
  scanner: {
    requiredPaths: [],
    label: 'Scanner',
    icon: 'Bluetooth',
  },
  devices: {
    requiredPaths: [AppPaths.DEVICES_ASSIGNED, AppPaths.DEVICES_UNASSIGNED],
    anyOf: true,
    label: 'V-tags',
    icon: 'smartphone-nfc',
  },
  gateways: {
    requiredPaths: [AppPaths.MASTER_GATEWAYS],
    label: 'V-gate',
    icon: 'hdmi-port',
  },
  profile: {
    requiredPaths: [],
    label: 'Perfil',
    icon: 'User',
  },
} as const;

export type TabKey = keyof typeof TabPermissions;