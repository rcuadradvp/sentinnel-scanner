// components/shared/FormInput/FormInput.tsx
import { ComponentType, ReactNode } from 'react';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  isDisabled?: boolean;
  error?: string;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  leftIcon?: ComponentType<{ size: number }>;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  autoCapitalize = 'none',
  keyboardType = 'default',
  isDisabled = false,
  error,
  rightIcon,
  onRightIconPress,
  leftIcon: LeftIcon,
}: FormInputProps) {
  return (
    <VStack className="gap-2">
      <Text className="text-sm font-medium text-typography-700">
        {label}
      </Text>
      <View style={{ position: 'relative' }}>
        <Input>
          <InputField
            type={type}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
            editable={!isDisabled}
            style={LeftIcon ? { paddingLeft: 40 } : undefined}
          />
          {rightIcon && onRightIconPress && (
            <InputSlot className="pr-3" onPress={onRightIconPress}>
              {rightIcon}
            </InputSlot>
          )}
        </Input>
        {LeftIcon && (
          <View 
            style={{ 
              position: 'absolute', 
              left: 12, 
              top: 0, 
              bottom: 0, 
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <LeftIcon size={20} />
          </View>
        )}
      </View>
      {error && (
        <Text className="text-sm text-error-500">{error}</Text>
      )}
    </VStack>
  );
}