// app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Radar, SmartphoneNfc, User, HdmiPort } from 'lucide-react-native';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { usePathname } from 'expo-router';

export default function AppLayout() {
  const { canAccessTab } = usePermissions();
  const pathname = usePathname();

  // Ocultar tabs en pantallas internas
  const shouldHideTabs = 
    pathname.includes('/devices/assigned') || 
    pathname.includes('/devices/unassigned') ||
    (pathname.includes('/gateways/') && pathname !== '/gateways');

  return (
    <PermissionGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#333',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: shouldHideTabs
            ? { display: 'none' }
            : {
                backgroundColor: '#fff',
                borderTopColor: '#eee',
              },
        }}
      >

        {/* Devices Tab */}
        <Tabs.Screen
          name="devices"
          options={{
            href: canAccessTab('devices') ? '/(app)/(tabs)/devices' : null,
            title: 'V-tags',
            tabBarIcon: ({ color, size }) => (
              <Icon as={SmartphoneNfc} size={size as any} color={color} />
            ),
          }}
        />

        {/* Gateways Tab - Solo para MASTER_GATEWAYS */}
        <Tabs.Screen
          name="gateways"
          options={{
            href: canAccessTab('gateways') ? '/(app)/(tabs)/gateways' : null,
            title: 'V-gate',
            tabBarIcon: ({ color, size }) => (
              <Icon as={HdmiPort} size={size as any} color={color} />
            ),
          }}
        />

                {/* Scanner Tab - Siempre primero */}
        <Tabs.Screen
          name="scanner"
          options={{
            href: canAccessTab('scanner') ? '/(app)/(tabs)/scanner' : null,
            title: 'Buscar',
            tabBarIcon: ({ color, size }) => (
              <Icon as={Radar} size={size as any} color={color} />
            ),
          }}
        />

        {/* Profile Tab - Siempre visible */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Icon as={User} size={size as any} color={color} />
            ),
          }}
        />
      </Tabs>
    </PermissionGuard>
  );
}