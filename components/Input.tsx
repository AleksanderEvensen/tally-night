import { forwardRef } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

type InputSize = 'default' | 'compact';

interface InputProps extends TextInputProps {
  /** 'default' for forms (profile, onboarding), 'compact' for inline (add/edit drink) */
  size?: InputSize;
}

const SIZE_STYLES = {
  default: {
    container: 'border-2 border-gray-200 rounded-2xl',
    input: 'px-4 text-lg text-gray-900',
    height: 56,
  },
  compact: {
    container: 'border border-gray-200 rounded-xl',
    input: 'px-3 text-base text-gray-900',
    height: 48,
  },
} as const;

export const Input = forwardRef<TextInput, InputProps>(
  ({ size = 'default', className, style, ...props }, ref) => {
    const s = SIZE_STYLES[size];

    return (
      <View className={`${s.container} ${className ?? ''}`}>
        <TextInput
          ref={ref}
          className={s.input}
          placeholderTextColor="#9ca3af"
          style={[{ height: s.height, textAlignVertical: 'center' }, style]}
          {...props}
        />
      </View>
    );
  }
);

Input.displayName = 'Input';
