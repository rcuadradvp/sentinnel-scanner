'use client';
// components/ui/modal/index.tsx
// WORKAROUND: Modal SIN animaciones para Expo SDK 54 + gluestack-ui v3
// Issue: https://github.com/gluestack/gluestack-ui/issues/3251

import React from 'react';
import { 
  Modal as RNModal, 
  View, 
  Pressable, 
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

// ============ ESTILOS ============
const modalStyle = tva({
  base: 'flex-1 justify-center items-center',
  variants: {
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      full: '',
    },
  },
});

const modalBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-black/50',
});

const modalContentStyle = tva({
  base: 'bg-background-0 rounded-md overflow-hidden border border-outline-100 p-6',
  variants: {
    size: {
      xs: 'w-[60%] max-w-[360px]',
      sm: 'w-[70%] max-w-[420px]',
      md: 'w-[80%] max-w-[510px]',
      lg: 'w-[90%] max-w-[640px]',
      full: 'w-full',
    },
  },
});

const modalBodyStyle = tva({
  base: 'mt-2 mb-6',
});

const modalCloseButtonStyle = tva({
  base: 'z-10 rounded cursor-pointer',
});

const modalHeaderStyle = tva({
  base: 'justify-between items-center flex-row',
});

const modalFooterStyle = tva({
  base: 'flex-row justify-end items-center gap-2',
});

// ============ TIPOS ============
type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: React.ReactNode;
  className?: string;
}

interface ModalBackdropProps {
  className?: string;
  onPress?: () => void;
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalCloseButtonProps {
  children?: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

// ============ CONTEXTO ============
const ModalContext = React.createContext<{
  onClose: () => void;
  size: ModalSize;
}>({
  onClose: () => {},
  size: 'md',
});

// ============ COMPONENTES ============

const Modal = ({ 
  isOpen, 
  onClose, 
  size = 'md', 
  children, 
  className 
}: ModalProps) => {
  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"  // Animación nativa de RN, NO de @legendapp/motion
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ModalContext.Provider value={{ onClose, size }}>
        <View 
          style={styles.modalContainer}
          className={modalStyle({ size, class: className })}
        >
          {children}
        </View>
      </ModalContext.Provider>
    </RNModal>
  );
};

const ModalBackdrop = ({ className, onPress }: ModalBackdropProps) => {
  const { onClose } = React.useContext(ModalContext);
  
  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      className={modalBackdropStyle({ class: className })}
      onPress={onPress ?? onClose}
    />
  );
};

const ModalContent = ({ children, className, size }: ModalContentProps) => {
  const { size: contextSize } = React.useContext(ModalContext);
  const finalSize = size ?? contextSize;
  
  return (
    <View 
      className={modalContentStyle({ size: finalSize, class: className })}
      style={styles.modalContent}
    >
      {children}
    </View>
  );
};

const ModalHeader = ({ children, className }: ModalHeaderProps) => {
  return (
    <View className={modalHeaderStyle({ class: className })}>
      {children}
    </View>
  );
};

const ModalBody = ({ children, className }: ModalBodyProps) => {
  return (
    <ScrollView className={modalBodyStyle({ class: className })}>
      {children}
    </ScrollView>
  );
};

const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return (
    <View className={modalFooterStyle({ class: className })}>
      {children}
    </View>
  );
};

const ModalCloseButton = ({ children, className, onPress }: ModalCloseButtonProps) => {
  const { onClose } = React.useContext(ModalContext);
  
  return (
    <Pressable
      className={modalCloseButtonStyle({ class: className })}
      onPress={onPress ?? onClose}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {children}
    </Pressable>
  );
};

// ============ ESTILOS NATIVOS ============
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

// ============ EXPORTS ============
Modal.displayName = 'Modal';
ModalBackdrop.displayName = 'ModalBackdrop';
ModalContent.displayName = 'ModalContent';
ModalHeader.displayName = 'ModalHeader';
ModalBody.displayName = 'ModalBody';
ModalFooter.displayName = 'ModalFooter';
ModalCloseButton.displayName = 'ModalCloseButton';

export {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  ModalFooter,
};