import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import colors from '@/theme/colors';

type Props = TextInputProps & { label?: string };

export default function Input({ label, ...p }: Props) {
  return (
    <View style={s.wrap}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        {...p}
        style={[s.input, p.style as any]}
        placeholderTextColor={colors.label}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 6, fontWeight: '600', color: colors.textDark },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    color: colors.textDark,
  },
});
