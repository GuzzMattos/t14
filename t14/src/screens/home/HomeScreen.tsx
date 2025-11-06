import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";

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
  return (
    <View style={s.container}>

      <View style={s.cardsRow}>
        <View style={[s.metricCard, { marginRight: 12 }]}>
          <Text style={s.metricLabel}>Total do mês</Text>
          <Text style={s.metricValue}>300€</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Seu saldo</Text>
          <Text style={[s.metricValue, { color: "#2E7D32" }]}>+40€</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Atividade recente</Text>
      <FlatList
        data={ACTIVITY}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => <ActivityItem item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
