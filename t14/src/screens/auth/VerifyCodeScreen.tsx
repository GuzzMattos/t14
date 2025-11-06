import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import Button from "@/components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import colors from "@/theme/colors";

const CORRECT = "123456";
type P = NativeStackScreenProps<AuthStackParamList, "VerifyCode">;

export default function VerifyCodeScreen({ route, navigation }: P) {
  const { email } = route.params;
  const [cells, setCells] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const refs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  const setAt = (idx: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...cells];
    next[idx] = v;
    setCells(next);
    setError("");
    if (v && idx < 5) refs[idx + 1].current?.focus();
    if (!v && idx > 0) refs[idx - 1].current?.focus();
  };

  const code = cells.join("");

  const submit = () => {
    if (code !== CORRECT) {
      setError("Código incorreto. Tente novamente.");
      return;
    }
    Alert.alert("Conta verificada!");
    navigation.popToTop();
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Verifique o seu email</Text>
      <Text style={s.subtitle}>Enviámos um código para {email}</Text>

      <View style={s.pinRow}>
        {cells.map((c, i) => (
          <TextInput
            key={i}
            ref={refs[i]}
            value={c}
            onChangeText={(t) => setAt(i, t)}
            keyboardType="number-pad"
            maxLength={1}
            style={[s.pinCell, !!error && s.pinCellError]}
          />
        ))}
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      <Button title="Submeter código" onPress={submit} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 32, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "800", color: colors.textDark, textAlign: "center", marginBottom: 6 },
  subtitle: { textAlign: "center", color: colors.label, marginBottom: 18 },
  pinRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pinCell: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, textAlign: "center", fontSize: 20,
    backgroundColor: colors.background,
  },
  pinCellError: { borderColor: colors.danger },
  error: { color: colors.danger, marginTop: 8, marginBottom: 8, textAlign: "left" },
});
