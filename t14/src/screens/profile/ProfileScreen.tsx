import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from "react-native";
import colors from "@/theme/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserInFirestore } from "@/services/user";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, refreshUser } = useAuth();
  const [notif, setNotif] = useState(user?.notificationsEnabled ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotif(user?.notificationsEnabled ?? true);
  }, [user]);

  const handleToggleNotifications = async (value: boolean) => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateUserInFirestore(user.uid, {
        notificationsEnabled: value,
      }, user.email);
      
      setNotif(value);
      await refreshUser();
    } catch (error) {
      console.error("Erro ao atualizar preferências:", error);
      Alert.alert("Erro", "Não foi possível atualizar as preferências de notificação");
      setNotif(!value); // Reverter o estado
    } finally {
      setSaving(false);
    }
  };

  const onRemove = () => {
    Alert.alert("Queres apagar a conta?", "", [
      { text: "Cancelar", style: "cancel", onPress: () => Alert.alert("A conta não foi apagada com sucesso") },
      { text: "Confirmar", onPress: () => Alert.alert("A conta foi apagada com sucesso") },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={s.title}>Configurações</Text>
        <View style={s.divider} />
      </View>

      <Text style={s.sectionTitle}>Conta</Text>
      <View style={s.card}>
        <Row
          icon={<Ionicons name="person-circle-outline" size={22} color={colors.textDark} />}
          label="Editar perfil"
          chevron
          onPress={() => navigation.navigate("EditProfile")}
        />
        <Row
          icon={<MaterialCommunityIcons name="account-outline" size={20} color={colors.textDark} />}
          label="Nome"
          value={user?.name || "Não definido"}
        />
        {user?.nickname && (
          <Row
            icon={<MaterialCommunityIcons name="at" size={20} color={colors.textDark} />}
            label="Nickname"
            value={user.nickname}
          />
        )}
        <Row
          icon={<MaterialCommunityIcons name="phone-outline" size={20} color={colors.textDark} />}
          label="Telefone"
          value={user?.phone || "Não definido"}
        />
        <Row
          icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textDark} />}
          label="Email"
          value={user?.email || ""}
        />
        <Row
          icon={<MaterialCommunityIcons name="key-outline" size={20} color={colors.textDark} />}
          label="Senha"
          value={"••••••••"}
          chevron
          onPress={() => navigation.navigate("ChangePassword")}
        />
      </View>

      <Text style={s.sectionTitle}>Configurações do app</Text>
      <View style={s.card}>
        <Row
          icon={<MaterialCommunityIcons name="translate" size={20} color={colors.textDark} />}
          label="Idioma"
          value="Português (Portugal)"
          chevron
          onPress={() => {}}
        />
        <Row
          icon={<Ionicons name="notifications-outline" size={20} color={colors.textDark} />}
          label="Notificações"
          right={
            <Switch
              value={notif}
              onValueChange={handleToggleNotifications}
              disabled={saving}
              thumbColor={notif ? "#fff" : undefined}
              trackColor={{ true: "#34C759", false: "#e5e7eb" }}
            />
          }
        />
      </View>

      <Text style={s.sectionTitle}>Geral</Text>
      <View style={s.card}>
        <Row
          icon={<Ionicons name="log-out-outline" size={20} color={colors.textDark} />}
          label="Sair"
          chevron
          onPress={async () => {
            try {
              await logout();
            } catch (err) {
              console.log("Erro ao sair:", err);
            }
          }}
        />
        <Row
          icon={<Ionicons name="person-remove-outline" size={20} color={"#E11D48"} />}
          label="Apagar conta"
          labelStyle={{ color: "#E11D48", fontWeight: "700" }}
          chevron
          onPress={onRemove}
        />
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  right,
  chevron,
  onPress,
  labelStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  labelStyle?: object;
}) {
  const Content = (
    <View style={rowStyles.inner}>
      <View style={rowStyles.left}>
        <View style={rowStyles.iconWrap}>{icon}</View>
        <Text style={[rowStyles.label, labelStyle]}>{label}</Text>
      </View>

      <View style={rowStyles.right}>
        {value ? <Text style={rowStyles.value}>{value}</Text> : null}
        {right}
        {chevron ? <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 6 }} /> : null}
      </View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={rowStyles.row}>{Content}</TouchableOpacity>;
  return <View style={rowStyles.row}>{Content}</View>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 4, marginBottom: 10 },
  divider: { height: 1, backgroundColor: colors.border, opacity: 0.7 },
  sectionTitle: { marginTop: 16, marginBottom: 8, marginLeft: 16, fontWeight: "700", color: colors.textDark },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    paddingHorizontal: 10,
    minHeight: 56,
    justifyContent: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  label: { fontSize: 16, color: colors.textDark },
  right: { flexDirection: "row", alignItems: "center" },
  value: { color: "#6B7280" },
});
