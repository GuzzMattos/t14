import React, {ReactNode} from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import colors from '@/theme/colors';

type Props = {
  title: string | ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'outline';
  style?: object;
};

export default function Button({ title, onPress, disabled, loading, variant = 'primary', style }: Props) {
  return (
    <TouchableOpacity
      style={[
        s.btn,
        variant === 'ghost' && s.ghost,
        variant === 'outline' && s.outline,
        disabled && s.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={!!disabled || !!loading}
      accessibilityRole="button"
    >
      {loading ? <ActivityIndicator /> : (
        typeof title === 'string' ? (
        <Text style={[s.text, (variant !== 'primary') && s.textAlt]}>{title || ""}</Text>
        ) : (
          title || null
         )
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14, // ligeiramente mais arredondado
    marginVertical: 4,
  },
  text: { color: '#fff', fontWeight: '700' },
  textAlt: { color: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  disabled: { opacity: 0.6 },
});
