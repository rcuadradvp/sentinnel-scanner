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
import { AppState, type AppStateStatus } from 'react-native';
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
  // Nuevos callbacks para modales
  setBiometricPromptCallback: (callback: ((credentials: LoginCredentials) => void) | null) => void;
  setBiometricSuccessCallback: (callback: (() => void) | null) => void;
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
  const [isAppFreshStart, setIsAppFreshStart] = useState(true);

  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  // Refs para callbacks (para evitar ciclos de dependencias)
  const biometricPromptCallbackRef = useRef<((credentials: LoginCredentials) => void) | null>(null);
  const biometricSuccessCallbackRef = useRef<(() => void) | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    } finally {
      clearAuthState();
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

  const enableBiometricFromProfile = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const success = await BiometricService.replaceCredentials(username, password);
      if (success) {
        setBiometricEnabled(true);
        setBiometricDeclined(false);
      }
      return success;
    },
    []
  );

  const disableBiometric = useCallback(async (userInitiated: boolean = true) => {
    await BiometricService.disable(userInitiated);
    setBiometricEnabled(false);
    if (userInitiated) {
      setBiometricDeclined(true);
    }
  }, []);

  const declineBiometric = useCallback(async () => {
    await BiometricService.setDeclined(true);
    setBiometricDeclined(true);
  }, []);

  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) {
      return true;
    }

    setError(null);

    try {
      const credentials = await BiometricService.getCredentials();

      if (!credentials) {
        console.log('[Auth] Biometric cancelled by user');
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
        
        if (credentials.username !== result.user.email) {
          console.warn('[Auth] Stored username does not match logged in user');
          await BiometricService.disable(false);
          setBiometricEnabled(false);
        }
        
        return true;
      } else {
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

          const storedUsername = await BiometricService.getStoredUsername();
          
          if (storedUsername && storedUsername !== credentials.username) {
            console.log('[Auth] Different user detected, clearing biometric state');
            await BiometricService.disable(false);
            setBiometricEnabled(false);
            setBiometricDeclined(false);
          }

          const shouldAskBiometric = 
            biometricAvailable && 
            !biometricEnabled && 
            !biometricDeclined && 
            (!storedUsername || storedUsername !== credentials.username);

          if (shouldAskBiometric) {
            // ✅ Llamar callback en lugar de Alert.alert
            setTimeout(() => {
              if (biometricPromptCallbackRef.current) {
                biometricPromptCallbackRef.current(credentials);
              }
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
    [biometricAvailable, biometricEnabled, biometricDeclined]
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
      clearAuthState();
      setIsAppFreshStart(true);
    });
    return () => {
      unsubscribe();
    };
  }, [clearAuthState]);

  // Funciones para setear callbacks desde componentes
  const setBiometricPromptCallback = useCallback((callback: ((credentials: LoginCredentials) => void) | null) => {
    biometricPromptCallbackRef.current = callback;
  }, []);

  const setBiometricSuccessCallback = useCallback((callback: (() => void) | null) => {
    biometricSuccessCallbackRef.current = callback;
  }, []);

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
    setBiometricPromptCallback,
    setBiometricSuccessCallback,
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