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
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "@/theme/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateUserInFirestore } from "@/services/user";
import { displayPhone } from "@/utils/phoneMask";
import { deleteUserAccount } from "@/firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
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
      console.log("🗑️ Iniciando deleção de conta para usuário:", user.uid);

      // 1. Verificar grupos onde o usuário é dono
      console.log("🔍 Verificando grupos onde é dono...");
      const groupsRef = collection(db, "group");
      const ownerGroupsQuery = query(groupsRef, where("ownerId", "==", user.uid));
      const ownerGroupsSnap = await getDocs(ownerGroupsQuery);

      if (ownerGroupsSnap.size > 0) {
        console.log(`⚠️ Usuário é dono de ${ownerGroupsSnap.size} grupo(s)`);
        Alert.alert(
          "Atenção",
          `Você é dono de ${ownerGroupsSnap.size} grupo(s). Transfira a propriedade ou exclua os grupos antes de deletar sua conta.`
        );
        setShowPasswordModal(false);
        return;
      }

      // 2. Remover usuário de grupos onde é membro (PRIMEIRO, antes do batch)
      console.log("🔍 Buscando grupos onde é membro...");
      const memberGroupsQuery = query(groupsRef, where("memberIds", "array-contains", user.uid));
      const memberGroupsSnap = await getDocs(memberGroupsQuery);

      console.log(`✅ Encontrados ${memberGroupsSnap.size} grupos onde é membro`);

      if (memberGroupsSnap.size > 0) {
        const groupBatch = writeBatch(db);

        for (const groupDoc of memberGroupsSnap.docs) {
          const groupData = groupDoc.data();
          const updatedMemberIds = (groupData.memberIds || []).filter((id: string) => id !== user.uid);
          const updatedMembers = { ...groupData.members };
          const updatedBalances = { ...groupData.balances };

          delete updatedMembers[user.uid];
          delete updatedBalances[user.uid];

          groupBatch.update(groupDoc.ref, {
            memberIds: updatedMemberIds,
            members: updatedMembers,
            balances: updatedBalances,
            updatedAt: Timestamp.now(),
          });
        }

        console.log("💾 Removendo de grupos...");
        await groupBatch.commit();
        console.log("✅ Removido de grupos com sucesso");
      }

      // 3. Deletar dados relacionados (batch separado)
      const deleteBatch = writeBatch(db);

      // Deletar relações de amizade
      console.log("🔍 Buscando relações de amizade...");
      const friendsRef = collection(db, "friends");
      const friendsQuery1 = query(friendsRef, where("userId", "==", user.uid));
      const friendsQuery2 = query(friendsRef, where("friendId", "==", user.uid));
      const [friendsSnap1, friendsSnap2] = await Promise.all([
        getDocs(friendsQuery1),
        getDocs(friendsQuery2),
      ]);

      console.log(`✅ Encontradas ${friendsSnap1.size + friendsSnap2.size} relações de amizade`);
      [...friendsSnap1.docs, ...friendsSnap2.docs].forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });

      // Deletar solicitações de amizade
      console.log("🔍 Buscando solicitações de amizade...");
      const requestsRef = collection(db, "friendRequests");
      const requestsQuery1 = query(requestsRef, where("fromUserId", "==", user.uid));
      const requestsQuery2 = query(requestsRef, where("toUserId", "==", user.uid));
      const [requestsSnap1, requestsSnap2] = await Promise.all([
        getDocs(requestsQuery1),
        getDocs(requestsQuery2),
      ]);

      console.log(`✅ Encontradas ${requestsSnap1.size + requestsSnap2.size} solicitações de amizade`);
      [...requestsSnap1.docs, ...requestsSnap2.docs].forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });

      // Deletar notificações
      console.log("🔍 Buscando notificações...");
      const notificationsRef = collection(db, "notifications");
      const notificationsQuery = query(notificationsRef, where("userId", "==", user.uid));
      const notificationsSnap = await getDocs(notificationsQuery);

      console.log(`✅ Encontradas ${notificationsSnap.size} notificações`);
      notificationsSnap.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });

      // Commit do batch de deleções
      console.log("� Deletando dados relacionados...");
      await deleteBatch.commit();
      console.log("✅ Dados relacionados deletados com sucesso");

      // 4. Deletar documento do usuário
      console.log("🗑️ Deletando documento do usuário...");
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      console.log("✅ Documento do usuário deletado");

      // 5. Deletar conta do Firebase Auth
      console.log("� Deletando conta do Firebase Auth...");
      await deleteUserAccount(password);

      console.log("✅ Conta apagada com sucesso!");
      Alert.alert("Sucesso", "Conta apagada com sucesso");
      await logout();
    } catch (error: any) {
      console.error("❌ Erro ao apagar conta:", error);
      console.error("❌ Código do erro:", error.code);
      console.error("❌ Mensagem:", error.message);
      console.error("❌ Stack:", error.stack);

      // Mensagem de erro mais específica
      let errorMessage = "Não foi possível apagar a conta.";

      if (error.code === "permission-denied" || error.message?.includes("permissions")) {
        errorMessage = "Erro de permissão. Verifique se você tem permissão para deletar todos os dados.";
      } else if (error.code === "auth/wrong-password" || error.message?.includes("password")) {
        errorMessage = "Senha incorreta. Verifique sua senha e tente novamente.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Por segurança, faça logout e login novamente antes de deletar a conta.";
      }

      Alert.alert("Erro", errorMessage);
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
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 16 }}>
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
            value={displayPhone(user?.phone)}
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
            value={LANGUAGE_NAMES[language] || "Português (Portugal)"}
            chevron
            onPress={() => {
              Alert.alert(
                "Idioma",
                "Selecione um idioma:",
                [
                  { text: "Cancelar", style: "cancel" },
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

        <PasswordModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onConfirm={handleDeleteAccount}
          title="Confirmar senha"
          message="Digite sua senha para confirmar a exclusão da conta:"
        />
      </ScrollView>
    </SafeAreaView>
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
