import React from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";

export default function EditProfileScreen() {
  const add = () => {
    Alert.alert("Tem certeza que desejas\nadicionar a foto?", "", [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => Alert.alert("Foto adicionada com sucesso") },
    ]);
  };

  const rem = () => {
    Alert.alert("Tem certeza que desejas\nremover a fota?", "", [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => Alert.alert("Foto removida com sucesso") },
    ]);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Perfil</Text>
      <View style={s.divider} />

      <View style={s.avatarRow}>
        <View style={s.avatar} />
        <View style={s.actionsRight}>
          <TouchableOpacity activeOpacity={0.8} style={s.actionBtn} onPress={rem}>
            <Text style={s.actionText}>Apagar</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={s.actionBtn} onPress={add}>
            <Text style={s.actionText}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Input label="Primeiro Nome" value="João" onChangeText={() => {}} />
      <Input label="Apelido" value="João" onChangeText={() => {}} />
      <Input label="Nickname" value="jsilva" onChangeText={() => {}} />
      <Input label="Email" value="João@gmail.com" onChangeText={() => {}} />

      <Button title="Guardar" onPress={() => Alert.alert("Guardado com sucesso")} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#D1D5DB", marginRight: 16 },
  actionsRight: { marginLeft: "auto" },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
});
