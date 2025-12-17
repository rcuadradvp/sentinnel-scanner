// hooks/useLocation.ts
import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export interface LocationCoords {
  latitude: string;
  longitude: string;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  requestLocation: () => Promise<LocationCoords | null>;
  checkPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error('[useLocation] Error checking permission:', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setHasPermission(true);
        return true;
      }

      setHasPermission(false);

      if (!canAskAgain) {
        Alert.alert(
          'Permiso de ubicación requerido',
          'Para registrar un V-gate necesitamos acceso a tu ubicación. Por favor, habilítalo en la configuración.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configuración', onPress: () => Linking.openSettings() },
          ]
        );
      }

      return false;
    } catch (err) {
      console.error('[useLocation] Error requesting permission:', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<LocationCoords | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar/solicitar permiso
      let permission = await checkPermission();
      
      if (!permission) {
        permission = await requestPermission();
        if (!permission) {
          setError('Se requiere permiso de ubicación');
          setIsLoading(false);
          return null;
        }
      }

      // Obtener ubicación
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoords = {
        latitude: result.coords.latitude.toString(),
        longitude: result.coords.longitude.toString(),
      };

      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (err: any) {
      console.error('[useLocation] Error getting location:', err);
      setError('No se pudo obtener la ubicación');
      setIsLoading(false);
      return null;
    }
  }, [checkPermission, requestPermission]);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    requestLocation,
    checkPermission,
  };
}