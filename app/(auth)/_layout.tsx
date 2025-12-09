/**
 * Auth Layout
 *
 * Layout para rutas públicas (login, register, etc.)
 * Sin navegación inferior, diseño simple.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}