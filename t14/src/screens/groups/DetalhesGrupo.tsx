import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Pressable, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import Tab from "@/components/Tab";
import Input from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { removeMemberFromGroup, addMembersToGroup } from "@/firebase/group";
import { Group } from "@/types/Group";
import { getUserFromFirestore } from "@/services/user";
import { getUserFriends } from "@/firebase/friend";
import { observeGroupExpenses, Expense } from "@/firebase/expense";

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

export default function DetalhesGrupo({ route, navigation }: any) {
  const { grupoId, name } = route.params;
  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState("Despesas");
  const [pesquisarAmigo, setPesquisarAmigo] = useState<string>();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do grupo
  useEffect(() => {
    if (!grupoId) return;

    const groupRef = doc(db, "group", grupoId);
    const unsubscribe = onSnapshot(groupRef, async (snap) => {
      if (snap.exists()) {
        const groupData = { id: snap.id, ...snap.data() } as Group;
        setGroup(groupData);

        // Carregar dados dos membros
        if (groupData.memberIds) {
          const membersData = [];
          for (const memberId of groupData.memberIds) {
            const memberUser = await getUserFromFirestore(memberId);
            if (memberUser) {
              membersData.push({
                id: memberId,
                nome: memberUser.name || "Usuário",
                admin: memberId === groupData.ownerId,
              });
            }
          }
          setMembers(membersData);
        }

        setLoading(false);
      }
    });

    return unsubscribe;
  }, [grupoId]);

  // Carregar despesas do grupo
  useEffect(() => {
    if (!grupoId) return;

    const unsubscribe = observeGroupExpenses(grupoId, (expensesList) => {
      const approved = expensesList.filter(e => e.status === "APPROVED");
      setExpenses(approved);
    });

    return unsubscribe;
  }, [grupoId]);

  // Carregar amigos do usuário
  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      try {
        const userFriends = await getUserFriends(user.uid);
        const friendsData = [];
        for (const friend of userFriends) {
          const friendUser = await getUserFromFirestore(friend.friendId);
          if (friendUser) {
            friendsData.push({
              id: friend.friendId,
              nome: friendUser.name || "Usuário",
              email: friendUser.email,
            });
          }
        }
        setFriends(friendsData);
      } catch (error) {
        console.error("Erro ao carregar amigos:", error);
      }
    };

    loadFriends();
  }, [user]);

  const removerAcentos = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Obter IDs dos membros já no grupo
  const memberIds = group?.memberIds || [];
  
  // Filtrar amigos que já estão no grupo e aplicar filtro de pesquisa
  const amigosFiltrados = friends
    .filter(amigo => !memberIds.includes(amigo.id)) // Excluir amigos que já estão no grupo
    .filter(amigo =>
      pesquisarAmigo ? removerAcentos(amigo.nome).includes(removerAcentos(pesquisarAmigo)) : true
    );

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!user || !grupoId) return;

    Alert.alert(
      "Remover membro",
      `Tem certeza que deseja remover ${memberName} do grupo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMemberFromGroup(grupoId, memberId, user.uid);
              Alert.alert("Sucesso", `${memberName} foi removido do grupo`);
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível remover o membro");
            }
          },
        },
      ]
    );
  };

  const adicionarSelecionados = async () => {
    if (!user || !grupoId || selecionados.length === 0) return;

    try {
      await addMembersToGroup(grupoId, selecionados, user.uid);
      Alert.alert("Sucesso", `${selecionados.length} amigo(s) adicionado(s) ao grupo!`);
      setSelecionados([]);
      setPesquisarAmigo("");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível adicionar os membros ao grupo");
    }
  };

  const calcularTotalDespesas = () => {
    return expenses.reduce((soma, item) => soma + item.amount, 0);
  };

  const calcularMeuSaldo = () => {
    if (!user || !group) return 0;
    return group.balances?.[user.uid] || 0;
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={s.title}>{group?.name || name}</Text>
        <View style={s.divider} />
      </View>

      <Tab abas={abas} abaAtiva={abaAtiva} onChange={setAbaAtiva} />

      {abaAtiva === "Despesas" && (
        <>
          <View style={s.cardsRow}>
            <View style={[s.metricCard, { marginRight: 12 }]}>
              <Text style={s.metricLabel}>Total gasto</Text>
              <Text style={s.metricValue}>{calcularTotalDespesas().toFixed(2)}€</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Você pagou</Text>
              <Text style={s.metricValue}>
                {expenses
                  .filter(e => e.paidBy === user?.uid)
                  .reduce((soma, item) => soma + item.amount, 0)
                  .toFixed(2)}€
              </Text>
            </View>
          </View>

          <View style={s.cardsRow}>
            <View style={[s.metricCard, { alignItems: "center" }]}>
              <Text style={s.metricLabel}>Seu saldo</Text>
              <Text style={[s.metricValue, { color: calcularMeuSaldo() >= 0 ? "#2E7D32" : "#E11D48" }]}>
                {calcularMeuSaldo() >= 0 ? "+" : ""}{calcularMeuSaldo().toFixed(2)}€
              </Text>
            </View>
          </View>

          <FlatList
            data={expenses}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => <Item item={item} navigation={navigation} group={group} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: colors.label }}>Nenhuma despesa aprovada ainda</Text>
              </View>
            }
          />

          <View style={{ flexDirection: "row", gap: 10, padding: 16, alignItems: "center" }}>
            <Button
              title="Nova despesa"
              onPress={() => navigation.navigate("DespesaForm", { grupoId })}
              style={s.botao}
            />
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
        </>
      )}

      {abaAtiva === "Membros" && (
        <View style={{ padding: 16 }}>
          <View>
            <Text style={[s.activitySub, {margin: 10}]}>Membros</Text>
            <FlatList
              data={[...members].sort((a, b) => a.nome.localeCompare(b.nome))}
              horizontal
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) => (
                <ListaMembros
                  amigo={item}
                  grupoId={grupoId}
                  currentUserId={user?.uid}
                  onRemove={handleRemoveMember}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
          </View>

          <View>
            <Text style={[s.activitySub, {margin: 10}]}>Adicionar amigo ao grupo</Text>
            <Input
              placeholder="Pesquisar amigos"
              value={pesquisarAmigo}
              onChangeText={setPesquisarAmigo}
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.input}
            />
            <FlatList
              data={[...amigosFiltrados].sort((a, b) => a.nome.localeCompare(b.nome))}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) =>
                  <ListaAmigos 
                    amigo={item} 
                    selecionado={selecionados.includes(item.id)} 
                    onPress={() => {
                      if (selecionados.includes(item.id)) {
                        setSelecionados(prev => prev.filter(id => id !== item.id));
                      } else {
                        setSelecionados(prev => [...prev, item.id]);
                      }
                    }}
                  />}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          </View>
          {selecionados.length > 0 && (
            <Button 
              title={`Adicionar ${selecionados.length} amigo(s)`} 
              onPress={adicionarSelecionados} 
              style={{ marginTop: 16 }} 
            />
          )}
        </View>
      )}

      {abaAtiva === "Saldos" && (
        <View style={{ padding: 16 }}>
          <View style={[s.metricCard, { marginRight: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 35 }}>
              <View>
                <Text style={s.metricValue}>João</Text>
                <Text style={s.metricLabel}>A pagar</Text>
              </View>
                <Text style={s.metricValue}>300€</Text>
            </View>
          </View>

          <Text style={[s.activitySub, {margin: 10}]}>Movimentações</Text>

          <FlatList
            data={MOVIMENTACOES}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => <Movimentacao item={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Item({ item, navigation, group }: { item: Expense; navigation: any; group: Group | null }) {
  const paidByName = group?.members?.[item.paidBy] ? "Usuário" : "Desconhecido";
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={s.activityCard}
      onPress={() =>
        navigation.navigate("DetalheDespesa", { despesaId: item.id, title: item.description })
      }
    >
      <View style={s.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.description}</Text>
        <Text style={s.activitySub}>
          {item.amount.toFixed(2)}€ • {paidByName} • {item.divisionType === "EQUAL" ? "Igualitária" : "Personalizada"}
        </Text>
      </View>

      {group?.ownerId === auth.currentUser?.uid && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("DespesaForm", {
              modo: "editar",
              despesa: item,
            })
          }
        >
          <Ionicons name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
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

function ListaMembros({
  amigo,
  grupoId,
  currentUserId,
  onRemove,
}: {
  amigo: { id: string; nome: string; admin: boolean };
  grupoId: string;
  currentUserId?: string;
  onRemove: (memberId: string, memberName: string) => void;
}) {
  const canRemove = !amigo.admin && currentUserId;
  
  return (
    <View style={s.listaMembros}>
      {canRemove && (
        <TouchableOpacity
          style={s.botaoRemover}
          onPress={() => onRemove(amigo.id, amigo.nome)}
        >
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
