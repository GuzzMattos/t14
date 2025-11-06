import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/navigation/AuthNavigator";
import colors from "@/theme/colors";

type P = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: P) {
  const [first, setFirst] = useState("João");
  const [last, setLast] = useState("Silva");
  const [email, setEmail] = useState("joao@example.com");
  const [pwd, setPwd] = useState("");
  const [conf, setConf] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const onSubmit = () => {
    const mis = pwd !== conf;
    setMismatch(mis);
    if (mis) {
      Alert.alert("As palavras-passe não coincidem");
      return;
    }
    Alert.alert("Código enviado!", `Enviámos um código para ${email}`);
    navigation.navigate("VerifyCode", { email });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Registo</Text>
        <View style={s.divider} />

        <Input label="Primeiro Nome" value={first} onChangeText={setFirst} style={s.input} />
        <Input label="Apelido" value={last} onChangeText={setLast} style={s.input} />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={s.input}
        />
        <Input label="Palavra-passe" value={pwd} onChangeText={setPwd} secureTextEntry style={s.input} />
        <Input
          label="Confirmar palavra-passe"
          value={conf}
          onChangeText={(t) => {
            setConf(t);
            setMismatch(pwd !== t);
          }}
          secureTextEntry
          style={[s.input, mismatch && s.inputError]}
        />
        {mismatch && <Text style={s.error}>As palavras-passe não coincidem</Text>}

        <Button title="Criar conta" onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, backgroundColor: colors.background },
  title: { fontSize: 32, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 8, marginBottom: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 12, marginHorizontal: 4 },
  input: { borderColor: colors.border, borderRadius: 14, backgroundColor: colors.background },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, marginTop: 6, marginLeft: 4 },
});
