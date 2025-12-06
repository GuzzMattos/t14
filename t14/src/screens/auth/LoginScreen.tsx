import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import { useAuth } from "@/contexts/AuthContext";
import colors from "@/theme/colors";

type P = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: P) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, loggingIn } = useAuth();

  const validateEmail = (text: string) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(text);
  };

  const onLogin = async () => {
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password.trim()) {
      const msg = "Preencha email e palavra-passe.";
      setError(msg);
      Alert.alert("Erro", msg);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      const msg = "Insira um email válido.";
      setError(msg);
      Alert.alert("Erro", msg);
      return;
    }

    if (password.length < 6) {
      const msg = "A palavra-passe deve ter pelo menos 6 caracteres.";
      setError(msg);
      Alert.alert("Erro", msg);
      return;
    }

    try {
      await login(trimmedEmail, password);
    } catch (err: any) {
      console.log("Login Error:", err);

      let msg = "Não foi possível iniciar sessão.";

      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
          msg = "Email ou palavra-passe incorretos.";
          break;

        case "auth/user-not-found":
          msg = "Utilizador não encontrado.";
          break;

        case "auth/too-many-requests":
          msg = "Muitas tentativas falhadas. Tente mais tarde.";
          break;

        case "auth/invalid-email":
          msg = "Email inválido.";
          break;

        default:
          msg = "Erro ao iniciar sessão. Verifique a ligação à internet.";
          break;
      }

      setError(msg);
      Alert.alert("Erro", msg);
    }

  };

  const onEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError("");
  };

  const onPasswordChange = (text: string) => {
    setPassword(text);
    if (error) setError("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.brand}>
          <Text style={[s.brandEqual, { color: colors.textDark }]}>Equal</Text>
          <Text style={[s.brandPay, { color: colors.primaryLight }]}>Pay</Text>
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={s.input}
        />

        <Input
          label="Palavra-passe"
          secureTextEntry
          value={password}
          onChangeText={onPasswordChange}
          style={[s.input, !!error && s.inputError]}
        />

        {!!error && <Text style={s.error}>{error}</Text>}

        <Button
          title="Entrar"
          onPress={onLogin}
          loading={loggingIn}
          disabled={loggingIn}
        />

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
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 32,
    backgroundColor: colors.background,
  },
  brand: { textAlign: "center", marginBottom: 28 },
  brandEqual: { fontSize: 42, fontWeight: "800", fontStyle: "italic" },
  brandPay: { fontSize: 42, fontWeight: "800", fontStyle: "italic" },
  input: {
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
  },
  inputError: { borderColor: colors.danger },
  links: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  link: { color: colors.primary, fontWeight: "600", fontSize: 16 },
  error: { color: colors.danger, marginTop: 8, marginLeft: 4 },
});
