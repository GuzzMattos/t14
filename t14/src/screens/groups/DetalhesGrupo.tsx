import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import Tab from "@/components/Tab";
import Input from "@/components/Input";
import { auth, db } from "@/firebase/config";
import { Group } from "@/types/Group";
import { getAllUsers } from "@/firebase/user";
import { doc, onSnapshot } from "firebase/firestore";
import { getDespesasByGroup, getTotalDespesasGrupo, getTotalPagoPorUsuario } from "@/firebase/despesa";

type DetalhesGrupo = {
  id: string;
  title: string;
  gasto: number;
  divisao: string;
};

type DetalhesMovimentacao = {
  id: string,
  pagou: string, 
  recebeu: string,
  valor: number,
  data: Date,
};

const MOVIMENTACOES: DetalhesMovimentacao[] = [
  { id: "1", pagou: "João", recebeu: "Maria", valor: 150, data: new Date("2025-11-01") },
  { id: "2", pagou: "Pedro", recebeu: "João", valor: 80, data: new Date("2025-11-03") },
  { id: "3", pagou: "Maria", recebeu: "Pedro", valor: 200, data: new Date("2025-11-05") },
];

type Amigo = {
  id: string,
  nome: string, 
  numero: string,
  admin: boolean,
};

const AMIGOS: Amigo[] = [
  { id: "1", nome: "Carlos", numero: "11912345678", admin: true},
  { id: "2", nome: "Maria", numero: "11987654321", admin: false},
  { id: "3", nome: "João", numero: "11999999999", admin: false},
];

const abas = ["Despesas", "Membros", "Saldos"];

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
  botao: {
    flex: 1,
  },
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
  metricLabel: {
    color: "#6B7280",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 12,
  },
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
  exportar: {
    color: "#334B34",
    textDecorationLine: "underline",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 15,
  },
  input: { 
    borderColor: colors.border, 
    borderRadius: 14, 
    backgroundColor: colors.background },
  listaMembros: {
    backgroundColor: "#F5EEDC",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    minWidth: 80,
    alignItems: "center",
    position: "relative",
    marginTop: 10,
  },
  botaoRemover: {
    position: "absolute",
    top: -8,
    right: -8,
    padding: 4,
    backgroundColor: "red",
    borderRadius: 25,
  },
});

export default function DetalhesGrupo({ route, navigation }: any) {
  const { grupoId, name } = route.params;
  const [abaAtiva, setAbaAtiva] = useState("Despesas");
  const [pesquisarAmigo, setPesquisarAmigo] = useState<string>("");
  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const user = auth.currentUser;
  const [despesas, setDespesas] = useState<DetalhesGrupo[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(true);

  const [totalPago, setTotalPago] = useState<number>(0);

  const [totalDespesas, setTotalDespesas] = useState<number>(0);

  useEffect(() => {
    const ref = doc(db, "group", grupoId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setGroup({ id: snap.id, ...(snap.data() as any) });
        } else {
          setGroup(null);
        }
        setLoadingGroup(false);
      },
      (err) => {
        console.error("Erro ao carregar grupo:", err);
        setLoadingGroup(false);
      }
    );

    return unsub;
  }, [grupoId]);

  useEffect(() => {
    (async () => {
      const users = await getAllUsers();
      setAllUsers(users);
    })();
  }, []);

  useEffect(() => {
    setLoadingDespesas(true);

    getDespesasByGroup(grupoId)
      .then((dados) => {
        const despesasFormatadas = dados.map((d) => ({
          id: d.id,
          title: d.descricao,
          gasto: d.valorTotal,
          divisao: d.abaTipo === "Igual" ? "Igual" : "Diferente",
          quemPagou: d.pagador,
          valores: d.valoresIndividuais
        }));
        setDespesas(despesasFormatadas);
      })
      .catch((err) => {
        console.log("Erro ao buscar despesas: ", err);
      })
      .finally(() => setLoadingDespesas(false));
  }, [grupoId])

  useEffect(() => {
    async function loadTotal() {
      const total = await getTotalDespesasGrupo(grupoId);
      setTotalDespesas(total);
    }
    loadTotal();
  }, [grupoId]);

  useEffect(() => {
  async function loadTotalPagoUsuario() {
    if (!user) return;
    if (!grupoId) return;

    try {
      const total = await getTotalPagoPorUsuario(grupoId, user.uid);
      setTotalPago(total);
    } catch (err) {
      console.error("Erro ao calcular total pago pelo usuário:", err);
    }
  }

    loadTotalPagoUsuario();
  }, [user, grupoId, despesas]);



  const removerAcentos = (str: string) =>
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const amigosDoGrupo: Amigo[] = useMemo(() => {
    if (!group?.memberIds || allUsers.length === 0) return [];

    return group.memberIds
      .map((id) => {
        const u = allUsers.find((usr) => usr.id === id);
        if (!u) return null;

        const displayName =
          (u.name as string) ||
          (u.primeiroNome as string) ||
          (u.apelido as string) ||
          (u.email as string) ||
          "Sem nome";

        return {
          id,
          nome: displayName,
          numero: "",
          admin: group.ownerId === id,
        } as Amigo;
      })
      .filter(Boolean) as Amigo[];
  }, [group, allUsers]);

  const amigosFiltrados = useMemo(
    () =>
      amigosDoGrupo.filter((amigo) =>
        pesquisarAmigo
          ? removerAcentos(amigo.nome).includes(removerAcentos(pesquisarAmigo))
          : true
      ),
    [amigosDoGrupo, pesquisarAmigo]
  );

  const calcularTotalDespesas = () => {
    if (group?.totalGasto != null) return group.totalGasto;
    return despesas.reduce((soma, item) => soma + item.gasto, 0);
  };

  const meuSaldo =
    group?.balances && user ? group.balances?.[user.uid] ?? 0 : 0;

  const handleEditarGrupo = () => {
    if (!group) return;
    navigation.navigate("GrupoForm", {
      modo: "editar",
      grupo: group,
    });
  };

  if (loadingGroup) {
    return (
      <View style={s.container}>
        <Text style={{ color: "#fff" }}>Carregando grupo...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={s.container}>
        <Text style={{ color: "#fff" }}>Grupo não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>{group.name || name}</Text>
      <View style={s.divider} />

      <View style={{ marginBottom: 16 }}>
        <Button title="Editar grupo" onPress={handleEditarGrupo} />
      </View>

      <Tab abas={abas} abaAtiva={abaAtiva} onChange={(tab: string) => setAbaAtiva(tab)} />

      {abaAtiva === "Despesas" && (
        <View style={{ paddingVertical: 16 }}>
          <View style={s.cardsRow}>
            <View style={[s.metricCard, { marginRight: 12 }]}>
              <Text style={s.metricLabel}>Total gasto</Text>
              <Text style={s.metricValue}>{totalDespesas}€</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Você pagou</Text>
              <Text style={s.metricValue}>{totalPago}€</Text>
            </View>
          </View>

          <View style={s.cardsRow}>
            <View style={[s.metricCard, { alignItems: "center" }]}>
              <Text style={s.metricLabel}>Seu saldo</Text>
              <Text
                style={[
                  s.metricValue,
                  { color: meuSaldo >= 0 ? "#2E7D32" : "#C62828" },
                ]}
              >
                {meuSaldo >= 0 ? `+${meuSaldo}€` : `${meuSaldo}€`}
              </Text>
            </View>
          </View>

          <View style={{ paddingTop: 12, paddingBottom: 16 }}>
            {despesas.map((item) => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <Item item={item} navigation={navigation} grupoId={grupoId} membros={amigosDoGrupo}/>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10, padding: 16, alignItems: "center" }}>
            <Button title="Nova despesa" onPress={() => navigation.navigate("DespesaForm", { grupoId, membros: amigosDoGrupo })} style={s.botao} />
            <Button 
              title="Liquidar conta" 
              onPress={() => {
                const totalDespesas = calcularTotalDespesas();
                navigation.navigate("Pagamento", { tipoPagamento: "total", valorDivida: totalDespesas });
              }} 
              variant="outline" 
              style={s.botao} 
            />
          </View>
          <TouchableOpacity>
            <Text style={s.exportar}>Exportar relatório</Text>
          </TouchableOpacity>
        </View>
      )}

      {abaAtiva === "Membros" && (
        <View style={{ paddingVertical: 16 }}>
          <Text style={s.sectionTitle}>Membros do grupo</Text>

          <Text style={[s.activitySub, { margin: 10 }]}>
            Pesquisar entre membros
          </Text>

          <Input
            placeholder="Pesquisar membros"
            value={pesquisarAmigo}
            onChangeText={setPesquisarAmigo}
            style={s.input}
          />

          <View style={{ marginTop: 12, paddingBottom: 16 }}>
            {amigosFiltrados.map((amigo) => (
              <View key={amigo.id} style={{ marginBottom: 12 }}>
                <ListaMembros amigo={amigo} />
              </View>
            ))}
          </View>
        </View>
      )}

      {abaAtiva === "Saldos" && (
        <View style={{ paddingVertical: 16 }}>
          <Text style={s.sectionTitle}>Movimentações (mock)</Text>

          <View style={{ paddingTop: 12, paddingBottom: 16 }}>
            {MOVIMENTACOES.map((item) => (
              <View key={item.id} style={s.activityCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.activityTitle}>
                    {item.pagou} → {item.recebeu}
                  </Text>
                  <Text style={s.activitySub}>
                    {item.valor}€ • {item.data.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

function Item({ item, navigation, grupoId, membros }: { item: DetalhesGrupo; navigation: any; grupoId: string; membros: Amigo[] }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={s.activityCard}
      onPress={() =>
        navigation.navigate("DetalheDespesa", { despesa: item })
      }
    >
      <View style={s.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.title}</Text>
        <Text style={s.activitySub}>
          {item.gasto}€ • {item.divisao}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("DespesaForm", {
            modo: "editar",
            grupoId,
            despesa: item,
            membros
          })
        }
      >
        <Ionicons name="pencil" size={18} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

type ListaAmigosProps = {
  amigo: Amigo,
  selecionado: boolean;
  onPress: () => void;
}

function ListaAmigos({ amigo, selecionado, onPress }: ListaAmigosProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[s.activityCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
        <View>
          <Text style={s.activityTitle}>{amigo.nome}</Text>
          <Text style={s.activitySub}>{amigo.numero}</Text>
        </View>

        <View>
          <Ionicons
            name={selecionado ? "radio-button-on" : "radio-button-off"}
            size={20}
            color={selecionado ? "#334B34" : "#999"}
            style={{ marginRight: 8 }}
            />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ListaMembros({ amigo }: { amigo: Amigo}) {
  const confirmarRemocao = () => {
    Alert.alert(
      "Remover amigo",
      `Tem certeza que deseja remover ${amigo.nome} do grupo?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Remover", 
          style: "destructive", 
          onPress: () => {
            console.log(`${amigo.nome} removido`);
          } 
        }
      ]
    );
  };
  
  return (
    <View style={s.listaMembros}>
      {!amigo.admin && (
        <TouchableOpacity style={s.botaoRemover} onPress={confirmarRemocao}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      )}
      <View>
        <Text style={s.activitySub}>{amigo.nome}{amigo.admin ? " (admin)" : ""}</Text>
      </View>
    </View>
  );
}

function Movimentacao({ item }: { item: DetalhesMovimentacao }) {
  const hoje = new Date();
  const difMs = hoje.getTime() - item.data.getTime();
  const difDias = Math.floor(difMs / (1000 * 60 * 60 * 24));

  return (
    <TouchableOpacity activeOpacity={0.8} style={s.activityCard}>
      <View style={s.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.pagou} pagou {item.valor}€ a {item.recebeu} </Text>
        <Text style={s.activitySub}>
          Há {difDias} dias
        </Text>
      </View>
    </TouchableOpacity>
  );
}
