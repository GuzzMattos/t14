import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Pressable, Alert, ScrollView } from "react-native";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import Tab from "@/components/Tab";
import Input from "@/components/Input";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config"

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
  const { title, groupId } = route.params;
  const [abaAtiva, setAbaAtiva] = useState("Despesas");
  const [pesquisarAmigo, setPesquisarAmigo] = useState<string>();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [amigosDoGrupo, setAmigosDoGrupo] = useState<Amigo[]>(AMIGOS.filter(a => a.admin));

  const removerAcentos = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();


  const amigosFiltrados = AMIGOS.filter(amigo =>
    pesquisarAmigo ? removerAcentos(amigo.nome).includes(removerAcentos(pesquisarAmigo)) : true
  );

  const adicionarSelecionados = () => {
    const novosAmigos = AMIGOS.filter(a => selecionados.includes(a.id) && !amigosDoGrupo.find(g => g.id === a.id));
    setAmigosDoGrupo(prev => [...prev, ...novosAmigos]);
    setSelecionados([]);
    console.log("Amigos selecionados: ", selecionados);
    
  };

  const calcularTotalDespesas = () => {
    return DESPESA.reduce((soma, item) => soma + item.despesa, 0);
  };

  return (
    <View style={s.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={s.title}>{title}</Text>
        <View style={s.divider} />
      </View>

      <Tab abas={abas} abaAtiva={abaAtiva} onChange={setAbaAtiva} />

      {abaAtiva === "Despesas" && (
        <>
        <ScrollView>
          <View style={s.cardsRow}>
            <View style={[s.metricCard, { marginRight: 12 }]}>
              <Text style={s.metricLabel}>Total gasto</Text>
              <Text style={s.metricValue}>300€</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Você pagou</Text>
              <Text style={s.metricValue}>40€</Text>
            </View>
          </View>

          <View style={s.cardsRow}>
            <View style={[s.metricCard, { alignItems: "center" }]}>
              <Text style={s.metricLabel}>Seu saldo</Text>
              <Text style={[s.metricValue, { color: "#2E7D32" }]}>+40€</Text>
            </View>
          </View>

          <FlatList
            data={DESPESA}
            scrollEnabled={false}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => <Item item={item} navigation={navigation} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          <View style={{ flexDirection: "row", gap: 10, padding: 16, alignItems: "center" }}>
            <Button title="Nova despesa" onPress={() => navigation.navigate("DespesaForm", { groupId })} style={s.botao} />
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
        </ScrollView>
        </>
      )}

      {abaAtiva === "Membros" && (
        <ScrollView>
          <View style={{ padding: 16 }}>
            <View>
              <Text style={[s.activitySub, {margin: 10}]}>Membros</Text>
              <FlatList
                data={[...AMIGOS].sort((a, b) => a.nome.localeCompare(b.nome))}
                horizontal
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item }) => <ListaMembros amigo={item} />}
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
                scrollEnabled={false}
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
        </ScrollView>
      )}

      {abaAtiva === "Saldos" && (
        <ScrollView>
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
        </ScrollView>
      )}
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
            grupo: {
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
