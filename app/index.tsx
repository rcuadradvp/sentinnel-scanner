/**
 * Index Route
 * Redirige a login por defecto. AuthGate maneja el resto.
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}