import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import colors from "@/theme/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateUserInFirestore } from "@/services/user";
import { displayPhone } from "@/utils/phoneMask";
import { deleteUserAccount } from "@/firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/config";
import PasswordModal from "@/components/PasswordModal";

const LANGUAGE_NAMES: Record<string, string> = {
  pt: "Português (Portugal)",
  en: "English",
  es: "Español",
  fr: "Français",
};

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notif, setNotif] = useState(user?.notificationsEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  const handleDeleteAccount = async (password: string) => {
    if (!user) return;

    try {
      // Deletar dados do Firestore
      const userRef = doc(db, "users", user.uid);
      
      // Deletar relações de amizade
      const friendsRef = collection(db, "friends");
      const friendsQuery1 = query(friendsRef, where("userId", "==", user.uid));
      const friendsQuery2 = query(friendsRef, where("friendId", "==", user.uid));
      const [friendsSnap1, friendsSnap2] = await Promise.all([
        getDocs(friendsQuery1),
        getDocs(friendsQuery2),
      ]);
      
      const batch = writeBatch(db);
      
      [...friendsSnap1.docs, ...friendsSnap2.docs].forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Deletar solicitações de amizade
      const requestsRef = collection(db, "friendRequests");
      const requestsQuery1 = query(requestsRef, where("fromUserId", "==", user.uid));
      const requestsQuery2 = query(requestsRef, where("toUserId", "==", user.uid));
      const [requestsSnap1, requestsSnap2] = await Promise.all([
        getDocs(requestsQuery1),
        getDocs(requestsQuery2),
      ]);
      
      [...requestsSnap1.docs, ...requestsSnap2.docs].forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Deletar notificações
      const notificationsRef = collection(db, "notifications");
      const notificationsQuery = query(notificationsRef, where("userId", "==", user.uid));
      const notificationsSnap = await getDocs(notificationsQuery);
      notificationsSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      await deleteDoc(userRef);

      // Deletar conta do Firebase Auth
      await deleteUserAccount(password);
      
      Alert.alert("Sucesso", "Conta apagada com sucesso");
      await logout();
    } catch (error: any) {
      console.error("Erro ao apagar conta:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível apagar a conta. Verifique sua senha."
      );
    } finally {
      setShowPasswordModal(false);
    }
  };

  const onRemove = () => {
    Alert.alert(
      "Apagar conta",
      "Tem certeza que deseja apagar sua conta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () => setShowPasswordModal(true),
        },
      ]
    );
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={s.title}>Configurações</Text>
        <View style={s.divider} />
      </View>

      <Text style={s.sectionTitle}>Conta</Text>
      <View style={s.card}>
        <Row
          icon={<Ionicons name="person-circle-outline" size={22} color={colors.textDark} />}
          label={t("profile.edit")}
          chevron
          onPress={() => navigation.navigate("EditProfile")}
        />
        <Row
          icon={<MaterialCommunityIcons name="account-outline" size={20} color={colors.textDark} />}
          label={t("profile.name")}
          value={user?.name || t("profile.notDefined")}
        />
        {user?.nickname && (
          <Row
            icon={<MaterialCommunityIcons name="at" size={20} color={colors.textDark} />}
            label={t("profile.nickname")}
            value={user.nickname}
          />
        )}
        <Row
          icon={<MaterialCommunityIcons name="phone-outline" size={20} color={colors.textDark} />}
          label={t("profile.phone")}
          value={displayPhone(user?.phone)}
        />
        <Row
          icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textDark} />}
          label={t("profile.email")}
          value={user?.email || ""}
        />
        <Row
          icon={<MaterialCommunityIcons name="key-outline" size={20} color={colors.textDark} />}
          label={t("profile.password")}
          value={"••••••••"}
          chevron
          onPress={() => navigation.navigate("ChangePassword")}
        />
      </View>

      <Text style={s.sectionTitle}>Configurações do app</Text>
      <View style={s.card}>
        <Row
          icon={<MaterialCommunityIcons name="translate" size={20} color={colors.textDark} />}
          label={t("profile.language")}
          value={LANGUAGE_NAMES[language] || "Português (Portugal)"}
          chevron
          onPress={() => {
            Alert.alert(
              t("profile.language"),
              "Selecione um idioma:",
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: "Português",
                  onPress: () => setLanguage("pt"),
                },
                {
                  text: "English",
                  onPress: () => setLanguage("en"),
                },
                {
                  text: "Español",
                  onPress: () => setLanguage("es"),
                },
                {
                  text: "Français",
                  onPress: () => setLanguage("fr"),
                },
              ]
            );
          }}
        />
        <Row
          icon={<Ionicons name="notifications-outline" size={20} color={colors.textDark} />}
          label={t("profile.notifications")}
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
          label={t("profile.logout")}
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
          label={t("profile.deleteAccount")}
          labelStyle={{ color: "#E11D48", fontWeight: "700" }}
          chevron
          onPress={onRemove}
        />
      </View>

      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleDeleteAccount}
        title="Confirmar senha"
        message="Digite sua senha para confirmar a exclusão da conta:"
      />
    </ScrollView>
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
