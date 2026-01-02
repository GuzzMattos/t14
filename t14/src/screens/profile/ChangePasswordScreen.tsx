import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function ChangePasswordScreen({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { changePassword } = useAuth();

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres";
    }
    return null;
  };

  const save = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Erro", "A senha nova deve ser diferente da senha atual");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert("Erro", passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas novas não coincidem");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert(
        "Sucesso",
        "Senha alterada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              // Limpar campos
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      let errorMessage = "Não foi possível alterar a senha.";

      if (error.code === "auth/wrong-password") {
        errorMessage = "Senha atual incorreta.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A nova senha é muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Por segurança, faça login novamente antes de alterar a senha.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Alterar Password</Text>
      <View style={s.divider} />

      <Input
        label="Senha Atual"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Digite sua senha atual"
        autoCapitalize="none"
      />
      <Input
        label="Nova Senha"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Digite a nova senha (mín. 6 caracteres)"
        autoCapitalize="none"
      />
      <Input
        label="Confirmar Nova Senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirme a nova senha"
        autoCapitalize="none"
      />

      <View style={s.saveRow}>
        <View style={{ flex: 1 }} />
        <View style={{ width: 170 }}>
          <Button
            title={loading ? "Alterando..." : "Guardar"}
            onPress={save}
            disabled={loading}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  saveRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
});
