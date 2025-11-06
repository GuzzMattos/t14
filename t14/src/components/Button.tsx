import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import colors from '@/theme/colors';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'outline';
};

export default function Button({ title, onPress, disabled, loading, variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      style={[
        s.btn,
        variant === 'ghost' && s.ghost,
        variant === 'outline' && s.outline,
        disabled && s.disabled,
      ]}
      onPress={onPress}
      disabled={!!disabled || !!loading}
      accessibilityRole="button"
    >
      {loading ? <ActivityIndicator /> : (
        <Text style={[s.text, (variant !== 'primary') && s.textAlt]}>{title}</Text>
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
