import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth, db } from "@/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Group } from "@/types/Group";
import { observeUserNotifications, Notification } from "@/firebase/notification";

type Activity = {
  id: string;
  title: string;
  group: string;
  time: string;
};

const ACTIVITY: Activity[] = [
  {
    id: "1",
    title: "Despesa 'Almoço' adicionada",
    group: "Grupo Jantar",
    time: "hoje",
  },
  {
    id: "2",
    title: "Recebeu 15€ de Pedro",
    group: "Grupo Viagem",
    time: "ontem",
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar grupos do usuário
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "group"),
      where("memberIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Group[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      setGroups(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Carregar notificações recentes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = observeUserNotifications(user.uid, (notifs) => {
      // Pegar as 5 mais recentes
      const recent = notifs
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      setNotifications(recent);
    });

    return unsubscribe;
  }, [user]);

  const calcularTotalMes = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return groups.reduce((total, group) => {
      // Somar apenas despesas aprovadas do mês atual
      // Por enquanto, usar totalGasto do grupo
      return total + (group.totalGasto || 0);
    }, 0);
  };

  const calcularSaldoTotal = () => {
    if (!user) return 0;
    return groups.reduce((total, group) => {
      const balance = group.balances?.[user.uid] || 0;
      return total + balance;
    }, 0);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Agora";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return date.toLocaleDateString("pt-PT");
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const activities = notifications.map((notif) => ({
    id: notif.id,
    title: notif.title,
    group: notif.groupName || "Sistema",
    time: formatTime(notif.createdAt),
  }));

  return (
    <View style={s.container}>
      <View style={s.cardsRow}>
        <View style={[s.metricCard, { marginRight: 12 }]}>
          <Text style={s.metricLabel}>{t("home.totalMonth")}</Text>
          <Text style={s.metricValue}>{calcularTotalMes().toFixed(2)}€</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>{t("home.yourBalance")}</Text>
          <Text style={[s.metricValue, { color: calcularSaldoTotal() >= 0 ? "#2E7D32" : "#E11D48" }]}>
            {calcularSaldoTotal() >= 0 ? "+" : ""}{calcularSaldoTotal().toFixed(2)}€
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>{t("home.recentActivity")}</Text>
      <FlatList
        data={activities}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => <ActivityItem item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: colors.label }}>{t("home.noActivity")}</Text>
          </View>
        }
      />
    </View>
  );
}

function ActivityItem({ item }: { item: Activity }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={s.activityCard}>
      {/* Avatar quadrado bege */}
      <View style={s.avatar} />

      {/* Texto */}
      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.title}</Text>
        <Text style={s.activitySub}>
          {item.group} • {item.time}
        </Text>
      </View>

      {/* Ação*/}
      <Ionicons name="create-outline" size={18} color={colors.primary} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },

  // Métricas
  cardsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  metricLabel: { color: "#6B7280", marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: "800", color: colors.textDark },

  // Seção
  sectionTitle: {
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 12,
  },

  // Card da atividade
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F2EAD9",
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  activitySub: {
    color: "#6B7280",
    marginTop: 2,
  },
});
