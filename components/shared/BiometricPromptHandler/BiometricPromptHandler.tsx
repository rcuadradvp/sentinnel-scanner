// components/shared/BiometricPromptHandler/BiometricPromptHandler.tsx
import { useState, useCallback } from 'react';
import { useAuth } from '@/context';
import { PermissionModal } from '@/components/shared/PermissionModal';

/**
 * ✅ BiometricPromptHandler
 * 
 * Componente global que maneja el prompt de biometría.
 * Debe ser montado en un nivel alto de la app (ej: _layout.tsx principal)
 * para asegurar que el modal se muestre incluso después de navegar.
 * 
 * Este componente resuelve el problema de timing donde el LoginScreen
 * se desmontaba antes de poder mostrar el modal.
 */
export function BiometricPromptHandler() {
  const {
    pendingBiometricPrompt,
    confirmBiometricPrompt,
    dismissBiometricPrompt,
    biometricType,
    isAuthenticated,
  } = useAuth();

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /**
   * Solo mostrar el prompt si:
   * 1. Hay credenciales pendientes
   * 2. El usuario está autenticado (ya pasó el login)
   */
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
      {/* Modal: Prompt para habilitar biometría */}
      <PermissionModal
        isOpen={shouldShowPrompt}
        onClose={handleDecline}
        onConfirm={handleConfirm}
        onCancel={handleDecline}
        type="biometric-prompt"
        biometricType={biometricType || 'Biometría'}
      />

      {/* Modal: Éxito al habilitar biometría */}
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