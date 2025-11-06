import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import { useAuth } from "@/contexts/AuthContext";
import colors from "@/theme/colors";

type P = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: P) {
  const [email, setEmail] = useState("joao@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const onLogin = () => {
    if (password !== "demo") {
      setError("Email ou palavra-passe incorretos");
      Alert.alert("Email ou palavra-passe incorretos");
      return;
    }
    Alert.alert("Entrou com sucesso!");
    login({ email, name: "João" });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.brand}>
          <Text style={[s.brandEqual, { color: colors.textDark }]}>Equal</Text>
          <Text style={[s.brandPay, { color: colors.primaryLight }]}>Pay</Text>
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={s.input}
        />

        <Input
          label="Palavra-passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[s.input, !!error && s.inputError]}
        />

        {!!error && <Text style={s.error}>{error}</Text>}

        <Button title="Entrar" onPress={onLogin} />

        <View style={s.links}>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={s.link}>Criar conta</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")}>
            <Text style={s.link}>Esqueceu a palavra-passe?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 64, paddingBottom: 32, backgroundColor: colors.background },
  brand: { textAlign: "center", marginBottom: 28 },
  brandEqual: { fontSize: 42, fontWeight: "800", fontStyle: "italic" },
  brandPay: { fontSize: 42, fontWeight: "800", fontStyle: "italic" },
  input: { borderColor: colors.border, backgroundColor: colors.background, borderRadius: 14 },
  inputError: { borderColor: colors.danger },
  links: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  link: { color: colors.primary, fontWeight: "600", fontSize: 16 },
  error: { color: colors.danger, marginTop: 8, marginLeft: 4 },
});
