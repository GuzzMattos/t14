import React, { useState, useEffect} from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { getDespesaFromFirestore } from "@/services/despesa";
import { getAllUsers } from "@/services/user";
import { getValoresIndividuaisAtualizados } from "@/firebase/pagamento";
import { getAuth } from "firebase/auth";

type Pessoa = {
  id: string;
  nome: string;
  valor: string;
};

export default function DetalheDespesa({ route, navigation }: any) {
  const { despesa } = route.params;
  const [despesaFirebase, setDespesaFirebase] = useState<any>(null);
  const [pagadorNome, setPagadorNome] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return <Text>Usuário não autenticado</Text>;
  }

  useEffect(() => {
    async function loadDespesa() {
      const data = await getDespesaFromFirestore(despesa.id);
      if (data) {
        const valoresAtualizados = await getValoresIndividuaisAtualizados(data);
        setDespesaFirebase({
          ...data,
          valoresIndividuais: valoresAtualizados
        });
      }     
    }
    loadDespesa();
  }, [despesa.id])

  useEffect(() => {
    async function loadPagador() {
      const users = await getAllUsers();

      const pagador = users.find(u => u.id === despesa.quemPagou);

      if (pagador) {
        setPagadorNome(pagador.name ?? "");
      }
    }
    loadPagador()
  }, [despesa.quemPagou])
  
  
  if (!despesaFirebase) {
    return <Text>Carregando...</Text>;
  }

  const saldoUsuario = despesaFirebase?.valoresIndividuais.find(
    (p: any) => p.id === user?.uid
  )?.saldo ?? 0;

  return (
    <View style={s.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={s.title}>{despesaFirebase.descricao}</Text>
        <View style={s.divider} />
      </View>

      <View style={[s.metricCard, { marginBottom: 12 }]}>
        <View style={s.row}>
          <Text style={s.metricLabel}>Valor Total</Text>
          <Text style={s.metricValue}>{despesaFirebase.valorTotal}€</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Quem pagou</Text>
          <Text style={s.metricValue}>{pagadorNome}</Text>
        </View>
      </View>

      <View style={[s.metricCard, { marginBottom: 12 }]}>
        <Text style={[s.metricLabel, { marginBottom: 8 }]}>Divisão</Text>
        <FlatList
          data={despesaFirebase.valoresIndividuais}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Text style={s.metricLabel}>{item.nome}</Text>
              <Text style={s.metricLabel}>
                {item.saldo}€ {item.saldo === 0 ? "(quitado)": ""}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 4 }}
        />
      </View>

      <Button
        title="Quitar parcialmente"
        disabled={saldoUsuario === 0}
        onPress={() =>
          navigation.navigate("Pagamento", { 
            tipoPagamento: "parcial", 
            despesa: despesaFirebase,
            pessoa: {
              id: user?.uid,
              nome: user?.displayName ?? "",
            },
              saldo: saldoUsuario,
            })
        }
        variant="outline"
        style={{ marginBottom: 10 }}
      />
      <Button
        title="Quitar totalmente"
        disabled={saldoUsuario === 0}
        onPress={() =>
          navigation.navigate("Pagamento", { 
            tipoPagamento: "total", 
            despesa: despesaFirebase,
            pessoa: {
              id: user?.uid,
              nome: user?.displayName ?? "",
            },
              saldo: saldoUsuario,
            })
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
