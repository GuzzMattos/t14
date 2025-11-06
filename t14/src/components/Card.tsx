import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '@/theme/colors';

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flex: 1,
  },
});
