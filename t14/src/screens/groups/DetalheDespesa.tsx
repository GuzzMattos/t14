import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import Button from "@/components/Button";
import colors from "@/theme/colors";

type Pessoa = {
  id: string;
  nome: string;
  valor: string;
};

const pessoasIguais: Pessoa[] = [
  { id: "1", nome: "João", valor: "20€" },
  { id: "2", nome: "Maria", valor: "20€" },
  { id: "3", nome: "Pedro", valor: "20€" },
];

const renderPessoaIgual = ({ item }: { item: Pessoa }) => (
  <View style={s.row}>
    <Text style={s.metricLabel}>{item.nome}</Text>
    <Text style={s.metricLabel}>{item.valor}</Text>
  </View>
);

export default function DetalheDespesa({ route, navigation }: any) {
  const { title } = route.params;

  return (
    <View style={s.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={s.title}>{title}</Text>
        <View style={s.divider} />
      </View>

      <View style={[s.metricCard, { marginBottom: 12 }]}>
        <View style={s.row}>
          <Text style={s.metricLabel}>Grupo</Text>
          <Text style={s.metricValue}>Viagem</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Valor Total</Text>
          <Text style={s.metricValue}>1000€</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Quem pagou</Text>
          <Text style={s.metricValue}>João</Text>
        </View>
      </View>

      <View style={[s.metricCard, { marginBottom: 12 }]}>
        <Text style={[s.metricLabel, { marginBottom: 8 }]}>Divisão</Text>
        <FlatList
          data={pessoasIguais}
          keyExtractor={(item) => item.id}
          renderItem={renderPessoaIgual}
          contentContainerStyle={{ paddingTop: 4 }}
        />
      </View>

      <Button
        title="Quitar parcialmente"
        onPress={() =>
          navigation.navigate("Pagamento", { tipoPagamento: "parcial", valorDivida: 100, pessoa: "João" })
        }
        variant="outline"
        style={{ marginBottom: 10 }}
      />
      <Button
        title="Quitar totalmente"
        onPress={() =>
          navigation.navigate("Pagamento", { tipoPagamento: "total", valorDivida: 100, pessoa: "João" })
        }
        style={{ marginBottom: 10 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metricCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricLabel: {
    color: "#6B7280",
    fontWeight: "600",
  },
  metricValue: {
    fontWeight: "600",
    color: "#111827",
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
});
