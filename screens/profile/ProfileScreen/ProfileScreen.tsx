// screens/profile/ProfileScreen/ProfileScreen.tsx
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/context';
import { useDevices } from '@/hooks';
import { BleScanner } from '@/services/ble-scanner';
import { AuthService } from '@/services/auth';
import { UserInfoCard } from '@/components/profile/UserInfoCard';
import { DeviceSyncCard } from '@/components/profile/DeviceSyncCard';
import { BiometricSettingsCard } from '@/components/profile/BiometricSettingsCard';
import { EnableBiometricModal } from '@/components/profile/EnableBiometricModal';
import { PermissionModal } from '@/components/shared/PermissionModal';
import { LoadingButton } from '@/components/shared/LoadingButton';

export function ProfileScreen() {
  const { 
    user, 
    logout, 
    biometricAvailable, 
    biometricEnabled, 
    biometricType,
    biometricDeclined,
    disableBiometric,
    enableBiometricFromProfile,
  } = useAuth();

  const { syncDevices, isLoading: isSyncLoading, error, lastSync } = useDevices();
  
  const [showEnableBiometricModal, setShowEnableBiometricModal] = useState(false);
  const [showDisableBiometricModal, setShowDisableBiometricModal] = useState(false);
  const [showBiometricSuccess, setShowBiometricSuccess] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const handleToggleBiometric = useCallback(async (enable: boolean) => {
    if (enable) {
      setShowEnableBiometricModal(true);
    } else {
      setShowDisableBiometricModal(true);
    }
  }, []);

  const handleDisableBiometric = useCallback(async () => {
    setIsBiometricLoading(true);
    await disableBiometric(true);
    setIsBiometricLoading(false);
  }, [disableBiometric]);

  const handleEnableBiometric = useCallback(async (password: string): Promise<boolean> => {
    if (!user?.email) {
      return false;
    }

    setIsBiometricLoading(true);

    try {
      const loginResult = await AuthService.login({
        username: user.email,
        password: password,
      });

      if (!loginResult.success) {
        setIsBiometricLoading(false);
        return false;
      }

      const success = await enableBiometricFromProfile(user.email, password);
      
      if (success) {
        setShowBiometricSuccess(true);
      }

      return success;
    } catch (err) {
      console.error('[Profile] Error enabling biometric:', err);
      return false;
    } finally {
      setIsBiometricLoading(false);
    }
  }, [user?.email, enableBiometricFromProfile]);

  const handleSyncDevices = async () => {
    const success = await syncDevices();
    
    if (success) {
      const bleScanner = BleScanner.getInstance();
      await bleScanner.reloadAuthorizedDevices();
    }
  };

  if (!user) return null;

  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <VStack className="flex-1 px-4 pt-4 bg-background-0">
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <UserInfoCard user={user} />

            <DeviceSyncCard
              lastSync={lastSync}
              isLoading={isSyncLoading}
              error={error}
              onSync={handleSyncDevices}
            />

            {biometricAvailable && (
              <BiometricSettingsCard
                biometricType={biometricType || 'Biometría'}
                biometricEnabled={biometricEnabled}
                biometricDeclined={biometricDeclined}
                isLoading={isBiometricLoading}
                onToggle={handleToggleBiometric}
              />
            )}
          </ScrollView>

          <LoadingButton
            onPress={logout}
            variant="danger"
            className="mb-4"
          >
            Cerrar Sesión
          </LoadingButton>

          {/* Modal: Habilitar biometría (con contraseña) */}
          <EnableBiometricModal
            isOpen={showEnableBiometricModal}
            onClose={() => setShowEnableBiometricModal(false)}
            onConfirm={handleEnableBiometric}
            biometricType={biometricType || 'Biometría'}
            username={user.email}
          />

          {/* Modal: Confirmar desactivar biometría */}
          <PermissionModal
            isOpen={showDisableBiometricModal}
            onClose={() => setShowDisableBiometricModal(false)}
            onConfirm={handleDisableBiometric}
            type="biometric-disable"
          />

          {/* Modal: Éxito al habilitar biometría */}
          <PermissionModal
            isOpen={showBiometricSuccess}
            onClose={() => setShowBiometricSuccess(false)}
            onConfirm={() => setShowBiometricSuccess(false)}
            type="biometric-success"
            biometricType={biometricType || 'Biometría'}
          />
        </VStack>
      </SafeAreaView>
    </>
  );
}