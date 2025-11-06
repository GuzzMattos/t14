import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";

export default function ResetPasswordScreen() {
  const [pwd, setPwd] = useState("");
  const [conf, setConf] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const onSave = () => {
    const mis = pwd !== conf;
    setMismatch(mis);
    if (mis) {
      Alert.alert("As palavras-passe não coincidem");
      return;
    }
    Alert.alert("Senha alterada!", "A sua palavra-passe foi atualizada.");
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Redefinir palavra-passe</Text>
      <View style={s.divider} />

      <Input label="Nova palavra-passe" secureTextEntry value={pwd} onChangeText={setPwd} style={s.input} />
      <Input
        label="Confirmar palavra-passe"
        secureTextEntry
        value={conf}
        onChangeText={(t) => {
          setConf(t);
          setMismatch(pwd !== t);
        }}
        style={[s.input, mismatch && s.inputError]}
      />
      {mismatch && <Text style={s.error}>As palavras-passe não coincidem</Text>}

      <Button title="Guardar nova palavra-passe" onPress={onSave} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "800", color: colors.textDark, marginBottom: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14, marginRight: 6 },
  input: { borderColor: colors.border, borderRadius: 14, backgroundColor: colors.background },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, marginTop: 6, marginLeft: 4 },
});
