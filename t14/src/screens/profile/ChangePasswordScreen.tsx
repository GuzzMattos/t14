import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";

export default function ChangePasswordScreen() {
  const [o1, setO1] = useState("");
  const [o2, setO2] = useState("");
  const [n, setN] = useState("");

  const save = () => {
    if (!o1 || !o2 || !n) {
      Alert.alert("Preencha todos os campos");
      return;
    }
    if (o1 === n) {
      Alert.alert("A password velha e a nova são iguais");
      return;
    }
    if (o1 !== o2) {
      Alert.alert("As password são diferentes");
      return;
    }
    const ok = Math.random() > 0.5;
    if (!ok) {
      Alert.alert("Password não foi alterada com sucesso");
      return;
    }
    Alert.alert("Password alterada com sucesso");
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Alterar Password</Text>
      <View style={s.divider} />

      <Input label="Password Velha" secureTextEntry value={o1} onChangeText={setO1} />
      <Input label="Password Velha" secureTextEntry value={o2} onChangeText={setO2} />
      <Input label="Nova Password" secureTextEntry value={n} onChangeText={setN} />

      <View style={s.saveRow}>
        <View style={{ flex: 1 }} />
        <View style={{ width: 170 }}>
          <Button title="Guardar" onPress={save} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  saveRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
});
