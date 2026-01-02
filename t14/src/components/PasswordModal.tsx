import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import Button from "./Button";
import colors from "@/theme/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title: string;
  message: string;
};

export default function PasswordModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
}: Props) {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    if (!password.trim()) {
      Alert.alert("Erro", "Por favor, digite sua senha");
      return;
    }
    onConfirm(password);
    setPassword("");
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          
          <TextInput
            style={s.input}
            placeholder="Digite sua senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoFocus
          />

          <View style={s.buttons}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={handleClose}
              style={s.button}
            />
            <Button
              title="Confirmar"
              onPress={handleConfirm}
              style={[s.button, s.confirmButton]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.label,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: colors.background,
    color: colors.textDark,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  confirmButton: {
    backgroundColor: "#E11D48",
  },
});

