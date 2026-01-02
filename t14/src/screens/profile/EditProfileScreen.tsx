import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserInFirestore } from "@/services/user";
import { uploadAvatar, deleteAvatar } from "@/firebase/storage";
import { formatPhoneNumber, removePhoneMask } from "@/utils/phoneMask";

export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setNickname(user.nickname || "");
      setPhone(user.phone || "");
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const pickImage = async () => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de permissão para aceder às suas fotos.");
        return;
      }

      // Abrir seletor de imagem
      // Nota: MediaTypeOptions está deprecated, mas ainda funciona
      // A nova forma seria usar 'images' como string, mas vamos manter compatibilidade
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          // Fazer upload da imagem
          const imageUrl = await uploadAvatar(user!.uid, result.assets[0].uri);
          
          // Se já havia um avatar, remover o antigo
          if (avatar) {
            await deleteAvatar(avatar);
          }
          
          setAvatar(imageUrl);
          Alert.alert("Sucesso", "Foto atualizada com sucesso!");
        } catch (error) {
          console.error("Erro ao fazer upload:", error);
          Alert.alert("Erro", "Não foi possível fazer upload da foto.");
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem.");
    }
  };

  const removeAvatar = async () => {
    Alert.alert("Tem certeza que desejas\nremover a foto?", "", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          if (avatar) {
            try {
              await deleteAvatar(avatar);
              setAvatar(null);
              Alert.alert("Sucesso", "Foto removida com sucesso!");
            } catch (error) {
              console.error("Erro ao remover avatar:", error);
            }
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validações básicas
    if (!name.trim()) {
      Alert.alert("Erro", "O nome é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      // Atualizar no Firestore
      await updateUserInFirestore(user.uid, {
        name: name.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim() ? formatPhoneNumber(phone.trim()) : null,
        avatar: avatar || null,
      }, user.email);

      // Atualizar contexto
      await refreshUser();

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView>
        <Text style={s.title}>Perfil</Text>
        <View style={s.divider} />

      <View style={s.avatarRow}>
        <View style={s.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>
                {name.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
          {uploading && (
            <View style={s.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>
        <View style={s.actionsRight}>
          {avatar && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[s.actionBtn, s.removeBtn]}
              onPress={removeAvatar}
              disabled={uploading}
            >
              <Text style={s.actionText}>Apagar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            style={s.actionBtn}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={s.actionText}>{avatar ? "Editar" : "Adicionar"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Input
        label="Nome"
        value={name}
        onChangeText={setName}
        placeholder="Digite seu nome"
      />
      <Input
        label="Nickname"
        value={nickname}
        onChangeText={setNickname}
        placeholder="Digite seu nickname"
      />
      <Input
        label="Telefone"
        value={formatPhoneNumber(phone)}
        onChangeText={(text) => {
          const numbers = removePhoneMask(text);
          setPhone(numbers);
        }}
        placeholder="Digite seu telefone"
        keyboardType="phone-pad"
        maxLength={20}
      />
      <Input
        label="Email"
        value={user?.email || ""}
        editable={false}
        style={{ opacity: 0.6 }}
      />

      <Button
        title={loading ? "Guardando..." : "Guardar"}
        onPress={handleSave}
        disabled={loading || uploading}
      />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatarContainer: { position: "relative", marginRight: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#6B7280" },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRight: { marginLeft: "auto" },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  removeBtn: {
    backgroundColor: "#E11D48",
  },
  actionText: { color: "#fff", fontWeight: "700" },
});
