/**
 * App Layout
 *
 * Layout para rutas privadas (requiere autenticación).
 */

import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}