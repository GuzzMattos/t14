import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
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

type DetalhesGrupo = {
  id: string;
  title: string;
  despesa: number;
  pessoaPagou: string;
  divisao: string;
};

const DESPESA: DetalhesGrupo[] = [
  { id: "1", title: "Hotel", despesa: 1200, pessoaPagou: "João", divisao: "Igualitária" },
  { id: "2", title: "Gasolina", despesa: 45, pessoaPagou: "Maria", divisao: "Proporcional" },
  { id: "3", title: "Jantar", despesa: 300, pessoaPagou: "Pedro", divisao: "Percentual" },
];

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

  // Busca o grupo em tempo real
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

  // Total gasto: se o grupo já tiver totalGasto no Firestore, usa ele
  const calcularTotalDespesas = () => {
    if (group?.totalGasto != null) return group.totalGasto;
    return DESPESA.reduce((soma, item) => soma + item.despesa, 0);
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


function Item({ item, navigation }: { item: DetalhesGrupo; navigation: any }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={s.activityCard}
      onPress={() =>
        navigation.navigate("DetalheDespesa", { despesaId: item.id, title: item.title })
      }
    >
      <View style={s.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.title}</Text>
        <Text style={s.activitySub}>
          {item.despesa}€ • {item.pessoaPagou} • {item.divisao}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("DespesaForm", {
            modo: "editar",
            despesa: {
              descricao: item.title,
              valorTotal: item.despesa.toString(),
              pagador: item.pessoaPagou,
              abaTipo: item.divisao,
              abaDiferente: "Valor",
              valoresIndividuais: [
                { id: "1", nome: "João", valor: "40" },
                { id: "2", nome: "Maria", valor: "30" },
                { id: "3", nome: "Pedro", valor: "30" },
              ],
            },
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
}}
