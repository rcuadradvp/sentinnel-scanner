/**
 * Auth Context
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { AuthService } from '@/services/auth';
import { BiometricService } from '@/services/biometric';
import {
  initializeTokens,
  onTokenExpired,
  getAccessToken,
  shouldRefreshToken,
} from '@/services/api';
import { isTokenExpired } from '@/utils/jwt';
import type { User, LoginCredentials } from '@/types';

interface AuthContextType {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Acciones
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  // Biometría
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: string;
  enableBiometric: (username: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  // 🆕 Control de biometría automática
  shouldPromptBiometric: boolean;
  clearBiometricPrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de biometría
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  // 🆕 Control para biometría automática
  // true = app recién abierta, mostrar biometría
  // false = usuario cerró sesión o ya intentó, no mostrar automático
  const [shouldPromptBiometric, setShouldPromptBiometric] = useState(true);

  const isInitialized = useRef(false);
  const appState = useRef(AppState.currentState);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * 🆕 Limpia el prompt de biometría (después de logout o intento)
   */
  const clearBiometricPrompt = useCallback(() => {
    setShouldPromptBiometric(false);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    clearAuthState();
    // 🆕 Después de logout, NO mostrar biometría automática
    setShouldPromptBiometric(false);
  }, [clearAuthState]);

  /**
   * Inicializa la biometría
   */
  const initializeBiometric = useCallback(async () => {
    const available = await BiometricService.isAvailable();
    setBiometricAvailable(available);

    if (available) {
      const type = await BiometricService.getBiometricName();
      setBiometricType(type);

      const enabled = await BiometricService.isEnabled();
      const hasCredentials = await BiometricService.hasStoredCredentials();
      
      setBiometricEnabled(enabled && hasCredentials);
    }
  }, []);

  /**
   * Habilitar biometría con credenciales
   */
  const enableBiometric = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const success = await BiometricService.enable(username, password);
      if (success) {
        setBiometricEnabled(true);
      }
      return success;
    },
    []
  );

  /**
   * Deshabilitar biometría
   */
  const disableBiometric = useCallback(async () => {
    await BiometricService.disable();
    setBiometricEnabled(false);
  }, []);

  /**
   * Login con biometría
   */
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) {
      return true;
    }

    setError(null);
    // 🆕 Marcar que ya se intentó
    setShouldPromptBiometric(false);

    try {
      const credentials = await BiometricService.getCredentials();

      if (!credentials) {
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
        setError('Credenciales inválidas. Por favor ingresa tu contraseña.');
        await BiometricService.disable();
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

  /**
   * Login con credenciales
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      // 🆕 Deshabilitar prompt automático cuando intenta login manual
      setShouldPromptBiometric(false);

      try {
        const result = await AuthService.login(credentials);

        if (result.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);

          if (biometricAvailable && !biometricEnabled) {
            setTimeout(() => {
              Alert.alert(
                `Habilitar ${biometricType}`,
                `¿Deseas usar ${biometricType} para iniciar sesión más rápido?`,
                [
                  { text: 'No, gracias', style: 'cancel' },
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
    [biometricAvailable, biometricEnabled, biometricType, enableBiometric]
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const hasTokens = await initializeTokens();
      if (!hasTokens) {
        await logout();
        return false;
      }

      const storedUser = await AuthService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch {
      await logout();
      return false;
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Inicializar autenticación
   */
  const initializeAuth = useCallback(async () => {
    try {
      await initializeBiometric();

      const hasSession = await AuthService.hasActiveSession();
      if (!hasSession) {
        // 🆕 App abierta sin sesión, permitir prompt biométrico
        setShouldPromptBiometric(true);
        setIsLoading(false);
        return;
      }

      const hasTokens = await initializeTokens();
      if (!hasTokens) {
        // 🆕 Sesión inválida, permitir prompt biométrico
        setShouldPromptBiometric(true);
        await AuthService.logout();
        setIsLoading(false);
        return;
      }

      const token = getAccessToken();
      if (token && !isTokenExpired(token)) {
        const storedUser = await AuthService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          // 🆕 Ya autenticado, no necesita prompt
          setShouldPromptBiometric(false);
        }
      } else {
        // 🆕 Token expirado, permitir prompt biométrico
        setShouldPromptBiometric(true);
      }
    } catch (err) {
      console.error('[AuthContext] Error initializing:', err);
      setShouldPromptBiometric(true);
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
    const unsubscribe = onTokenExpired(() => {
      console.log('[AuthContext] Token expired, logging out');
      // 🆕 Token expiró, permitir prompt biométrico al volver a login
      setShouldPromptBiometric(true);
      clearAuthState();
    });
    return () => { unsubscribe(); };
  }, [clearAuthState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove(); };
  }, [handleAppStateChange]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      refreshSession,
      clearError,
      biometricAvailable,
      biometricEnabled,
      biometricType,
      enableBiometric,
      disableBiometric,
      loginWithBiometric,
      // 🆕
      shouldPromptBiometric,
      clearBiometricPrompt,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      refreshSession,
      clearError,
      biometricAvailable,
      biometricEnabled,
      biometricType,
      enableBiometric,
      disableBiometric,
      loginWithBiometric,
      shouldPromptBiometric,
      clearBiometricPrompt,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}