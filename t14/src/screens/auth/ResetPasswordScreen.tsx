import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { useAuth } from "@/contexts/AuthContext";

type P = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: P) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async () => {
    setError("");
    setSent(false);

    if (!email.trim()) {
      const msg = "Informe o email.";
      setError(msg);
      Alert.alert("Erro", msg);
      return;
    }

    if (!validateEmail(email.trim())) {
      const msg = "Email inválido.";
      setError(msg);
      Alert.alert("Erro", msg);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
      Alert.alert(
        "Email enviado",
        "Se existir uma conta com esse email, enviámos um link para redefinir a palavra-passe. Verifique a sua caixa de entrada e a pasta de spam.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (err: any) {
      console.log("Erro ao enviar email de recuperação:", err);
      let msg = "Não foi possível enviar o email de recuperação.";
      let shouldShowAsSent = false;

      if (err.code === "auth/user-not-found") {
        // Por segurança, não revelamos se o email existe ou não
        msg = "Se existir uma conta com esse email, enviámos um link para redefinir a palavra-passe.";
        shouldShowAsSent = true;
        setSent(true);
      } else if (err.code === "auth/invalid-email") {
        msg = "Email inválido.";
        setError(msg);
      } else if (err.code === "auth/too-many-requests") {
        msg = "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.";
        setError(msg);
      }

      if (shouldShowAsSent) {
        Alert.alert(
          "Email enviado",
          msg,
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        setError(msg);
        Alert.alert("Erro", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Redefinir palavra-passe</Text>
        <View style={s.divider} />

        <Text style={s.info}>
          Introduza o email associado à sua conta. Vamos enviar um link para
          redefinir a palavra-passe.
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[s.input, !!error && s.inputError]}
        />

        {!!error && <Text style={s.error}>{error}</Text>}

        {sent && (
          <Text style={s.success}>
            Email enviado! Verifique a sua caixa de entrada.
          </Text>
        )}

        <Button
          title={loading ? "Enviando..." : "Enviar link de recuperação"}
          onPress={onSubmit}
          disabled={loading || sent}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  info: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  success: {
    color: colors.success ?? "#2e7d32",
    marginTop: 8,
    marginLeft: 4,
  },
});
