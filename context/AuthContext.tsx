// context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import { AuthService, type LoginResult } from '@/services/auth';
import { BiometricService } from '@/services/biometric';
import {
  initializeTokens,
  clearTokens,
  getAccessToken,
  shouldRefreshToken,
  onTokenExpired,
} from '@/services/api';
import { isTokenExpired } from '@/utils/jwt';
import type { User, LoginCredentials } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: string | null;
  biometricDeclined: boolean;
  // Flag para saber si es un inicio fresco de la app (no después de logout)
  isAppFreshStart: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  enableBiometric: (username: string, password: string) => Promise<boolean>;
  enableBiometricFromProfile: (username: string, password: string) => Promise<boolean>;
  disableBiometric: (userInitiated?: boolean) => Promise<void>;
  declineBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [biometricDeclined, setBiometricDeclined] = useState(false);
  // Este flag indica si la app acaba de iniciar fresh (true) o si el usuario hizo logout (false)
  const [isAppFreshStart, setIsAppFreshStart] = useState(true);

  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      // NO limpiamos biometricDeclined en logout para recordar la preferencia
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    } finally {
      clearAuthState();
      // Marcar que NO es un inicio fresco - el usuario cerró sesión manualmente
      setIsAppFreshStart(false);
      setIsLoading(false);
    }
  }, [clearAuthState]);

  const initializeBiometric = useCallback(async () => {
    const available = await BiometricService.isAvailable();
    setBiometricAvailable(available);

    if (available) {
      const type = await BiometricService.getBiometricName();
      setBiometricType(type);
      
      const enabled = await BiometricService.isEnabled();
      const hasCredentials = await BiometricService.hasStoredCredentials();
      setBiometricEnabled(enabled && hasCredentials);
      
      // Cargar el estado "declined"
      const declined = await BiometricService.isDeclined();
      setBiometricDeclined(declined);
    }
  }, []);

  const enableBiometric = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const success = await BiometricService.enable(username, password);
      if (success) {
        setBiometricEnabled(true);
        setBiometricDeclined(false);
      }
      return success;
    },
    []
  );

  /**
   * Habilitar biometría desde el perfil (sin autenticación biométrica previa)
   * Las credenciales ya fueron validadas al hacer login
   */
  const enableBiometricFromProfile = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const success = await BiometricService.enableWithoutAuth(username, password);
      if (success) {
        setBiometricEnabled(true);
        setBiometricDeclined(false);
      }
      return success;
    },
    []
  );

  /**
   * Deshabilitar biometría
   * @param userInitiated - Si es true, no se volverá a preguntar al usuario
   */
  const disableBiometric = useCallback(async (userInitiated: boolean = true) => {
    await BiometricService.disable(userInitiated);
    setBiometricEnabled(false);
    if (userInitiated) {
      setBiometricDeclined(true);
    }
  }, []);

  /**
   * Usuario rechazó habilitar biometría en el prompt inicial
   */
  const declineBiometric = useCallback(async () => {
    await BiometricService.setDeclined(true);
    setBiometricDeclined(true);
  }, []);

  /**
   * Login con biometría - NO deshabilita biometría si el usuario cancela
   * Solo deshabilita si las credenciales almacenadas son inválidas
   */
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) {
      return true;
    }

    setError(null);

    try {
      const credentials = await BiometricService.getCredentials();

      // Si el usuario canceló la autenticación biométrica, simplemente retornar false
      // NO deshabilitar biometría, NO mostrar error
      if (!credentials) {
        console.log('[Auth] Biometric cancelled or no credentials');
        return false;
      }

      setIsLoading(true);

      const result = await AuthService.login({
        username: credentials.username,
        password: credentials.password,
      });

      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return true;
      } else {
        // Las credenciales almacenadas ya no son válidas (usuario cambió contraseña)
        // Deshabilitar biometría pero NO marcar como declined
        setError('Credenciales inválidas. Por favor ingresa tu contraseña.');
        await BiometricService.disable(false);
        setBiometricEnabled(false);
        return false;
      }
    } catch (err) {
      console.error('[Auth] Biometric login error:', err);
      setError('Error de conexión');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await AuthService.login(credentials);

        if (result.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);

          // Solo mostrar el prompt si:
          // 1. Biometría está disponible
          // 2. No está habilitada
          // 3. El usuario NO ha rechazado/deshabilitado previamente
          if (biometricAvailable && !biometricEnabled && !biometricDeclined) {
            setTimeout(() => {
              Alert.alert(
                `Habilitar ${biometricType}`,
                `¿Deseas usar ${biometricType} para iniciar sesión más rápido?`,
                [
                  { 
                    text: 'No, gracias', 
                    style: 'cancel',
                    onPress: () => declineBiometric()
                  },
                  {
                    text: 'Sí, habilitar',
                    onPress: () => enableBiometric(credentials.username, credentials.password),
                  },
                ]
              );
            }, 500);
          }

          return true;
        } else {
          setError(result.error || 'Error al iniciar sesión');
          return false;
        }
      } catch (err) {
        setError('Error de conexión');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [biometricAvailable, biometricEnabled, biometricDeclined, biometricType, enableBiometric, declineBiometric]
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const hasTokens = await initializeTokens();
      if (!hasTokens) {
        clearAuthState();
        return false;
      }

      const storedUser = await AuthService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch {
      clearAuthState();
      return false;
    }
  }, [clearAuthState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      await initializeBiometric();

      const hasSession = await AuthService.hasActiveSession();
      if (!hasSession) {
        // Es un inicio fresco de la app sin sesión activa
        setIsAppFreshStart(true);
        setIsLoading(false);
        return;
      }

      const hasTokens = await initializeTokens();
      if (!hasTokens) {
        setIsAppFreshStart(true);
        await AuthService.logout();
        setIsLoading(false);
        return;
      }

      const token = getAccessToken();
      if (token && !isTokenExpired(token)) {
        const storedUser = await AuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          setIsAppFreshStart(false);
        }
      } else {
        // Token expirado - es como un inicio fresco
        setIsAppFreshStart(true);
      }
    } catch (err) {
      console.error('[AuthContext] Error initializing:', err);
      setIsAppFreshStart(true);
    } finally {
      setIsLoading(false);
    }
  }, [initializeBiometric]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isAuthenticated && shouldRefreshToken()) {
          refreshSession();
        }
      }
      appState.current = nextAppState;
    },
    [isAuthenticated, refreshSession]
  );

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  useEffect(() => {
    const unsubscribe = onTokenExpired(() => {
      // Token expirado - limpiar estado pero mantener como fresh start para poder usar biometría
      clearAuthState();
      setIsAppFreshStart(true);
    });
    return () => {
      unsubscribe();
    };
  }, [clearAuthState]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    biometricAvailable,
    biometricEnabled,
    biometricType,
    biometricDeclined,
    isAppFreshStart,
    login,
    loginWithBiometric,
    logout,
    refreshSession,
    clearError,
    enableBiometric,
    enableBiometricFromProfile,
    disableBiometric,
    declineBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}