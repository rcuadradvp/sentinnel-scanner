// components/shared/BiometricPromptHandler/BiometricPromptHandler.tsx
import { useState, useCallback } from 'react';
import { useAuth } from '@/context';
import { PermissionModal } from '@/components/shared/PermissionModal';

export function BiometricPromptHandler() {
  const {
    pendingBiometricPrompt,
    confirmBiometricPrompt,
    dismissBiometricPrompt,
    biometricType,
    isAuthenticated,
  } = useAuth();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const shouldShowPrompt = pendingBiometricPrompt !== null && isAuthenticated;

  const handleConfirm = useCallback(async () => {
    const success = await confirmBiometricPrompt();
    
    if (success) {
      setShowSuccessModal(true);
    }
  }, [confirmBiometricPrompt]);

  const handleDecline = useCallback(async () => {
    await dismissBiometricPrompt();
  }, [dismissBiometricPrompt]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  return (
    <>
      <PermissionModal
        isOpen={shouldShowPrompt}
        onClose={handleDecline}
        onConfirm={handleConfirm}
        onCancel={handleDecline}
        type="biometric-prompt"
        biometricType={biometricType || 'Biometría'}
      />

      <PermissionModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        type="biometric-success"
        biometricType={biometricType || 'Biometría'}
      />
    </>
  );
}