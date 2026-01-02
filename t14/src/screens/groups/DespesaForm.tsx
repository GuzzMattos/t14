import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ScrollView, Alert, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import Tab from "@/components/Tab";
import { collection, addDoc, setDoc, doc, updateDoc, query, where, onSnapshot } from "firebase/firestore"; 
import { db } from "@/firebase/config"
import { createDespesaInFirestore, updateDespesaInFirestore, deleteDespesaFromFirestore } from "@/firebase/despesa";
import { DespesaTipo, DespesaDiferente } from "@/types/Despesa";
import { Ionicons } from "@expo/vector-icons";

type Pessoa = {
  id: string;
  nome: string;
  valor: string;
};

export default function DespesaForm({ route, navigation }: any) {
  const { modo, despesa, grupoId, membros } = route.params || {};

  const [descricao, setDescricao] = useState<string>();
  const [valorTotal, setValorTotal] = useState<string>();
  const [pagador, setPagador] = useState<string | null>(null);
  const [abaTipo, setAbaTipo] = useState<DespesaTipo>("Igual");
  const [abaDiferente, setAbaDiferente] = useState<DespesaDiferente>("Valor");
  const [openSelect, setOpenSelect] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [valoresIndividuais, setValoresIndividuais] = useState<Pessoa[]>(
    membros?.map((m: any) => ({
      id: m.id,
      nome: m.nome,
      valor: "",
    })) || []
  );

  const toggleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const somaDivisoes = () => {
    if (abaDiferente === "Valor") {
      return valoresIndividuais.reduce((total, p) => {
        const valor = parseFloat(p.valor.replace(",", "."));
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    }

    if (abaDiferente === "Porcentagem") {
      return valoresIndividuais.reduce((total, p) => {
        const perc = parseFloat(p.valor.replace(",", "."));
        return total + (isNaN(perc) ? 0 : perc);
      }, 0);
    }
    return 0;
  };

  const valorTotalNum = parseFloat(valorTotal?.replace(",", ".") || "0");
  let restante;

  if (abaDiferente === "Valor") {
    restante = valorTotalNum - somaDivisoes();
  } else {
    restante = 100 - somaDivisoes();
  }

  useEffect(() => {
    if (modo === "editar" && despesa) {
      setDescricao(despesa.title || "");
      setValorTotal(despesa.gasto?.toString() || "");
      setPagador(despesa.quemPagou || "");
      setAbaTipo(despesa.abaTipo || "Igual");
      setAbaDiferente(despesa.abaDiferente || "Valor");
      setValoresIndividuais(despesa.valoresIndividuais || valoresIndividuais);
    }
  }, [modo, despesa]);

  useEffect(() => {
    navigation.setOptions({
      title: modo === "editar" ? "Editar despesa" : "Nova despesa",
    });
  }, [navigation, modo]);

  useEffect(() => {
    if (abaTipo === "Igual" && valorTotal && valoresIndividuais.length > 0) {
      const valorPorPessoa = parseFloat(valorTotal.replace(",", ".")) / valoresIndividuais.length;

      setValoresIndividuais(prev =>
        prev.map(p => ({ ...p, valor: valorPorPessoa.toString() }))
      );
    }
  }, [abaTipo, valorTotal, valoresIndividuais.length]);


  const adicionarDespesa = async () => {
      if (!descricao || !valorTotal || !pagador) { 
        Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
        return;
      }

      try {
        const despesaId = await createDespesaInFirestore ({
          descricao,
          valorTotal: parseFloat(valorTotal.replace(",", ".")),
          pagador,
          groupId: grupoId,
          abaTipo,
          abaDiferente,
          valoresIndividuais: valoresIndividuais.map(p => ({
            id: p.id,
            nome: p.nome,
            valor: parseFloat(p.valor.replace(",", ".")) || 0
          })),
        });

        console.log("Despesa adicionada com sucesso", despesaId);
        Alert.alert("Sucesso", "Despesa adicionada com sucesso!");
        navigation.goBack();
      } catch (error) {
        console.error("Erro ao adicionar despesa:", error);
        Alert.alert("Erro", "Não foi possível adicionar a despesa.");
      }
    }

  const atualizarDespesa = async () => {
    if(!descricao || !valorTotal || !pagador ){
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    try {
      if (!despesa?.id) {
        Alert.alert("Erro", "ID da despesa não encontrada");
        return;
      }

      await updateDespesaInFirestore(despesa.id, {
        descricao,
        valorTotal: parseFloat(valorTotal.replace(",", ".")),
        pagador,
        groupId: grupoId,
        abaTipo,
        abaDiferente,
        valoresIndividuais: valoresIndividuais.map((p) => ({
          id: p.id,
          nome: p.nome,
          valor: parseFloat(p.valor.replace(",", "."))
        })),
      });

      Alert.alert("Sucesso", "Despesa atualizada com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.log("Erro ao atualizar despesa: ", error);
      Alert.alert("Erro", "Não foi possível atualizar a despesa");
    }
  }

  const pessoasIguais: Pessoa[] = [
    { id: "1", nome: "João", valor: "20€" },
    { id: "2", nome: "Maria", valor: "20€" },
    { id: "3", nome: "Pedro", valor: "20€" },
  ];

  const renderPessoaIgual = ({ item }: { item: Pessoa }) => (
    <View
      style={[
        s.metricCard,
        { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
      ]}
    >
      <Text style={s.metricLabel}>{item.nome}</Text>
      <Text style={s.metricLabel}>{item.valor}</Text>
    </View>
  );

  const renderPessoaDiferente = ({ item }: { item: Pessoa }) => {
    const placeholder = abaDiferente === "Valor" ? "0€" : "0%";

    const valorExibido = (() => {
      if (abaDiferente === "Valor") {
        return item.valor ? parseFloat(item.valor).toFixed(2) + "€" : "0€";
      } else if (abaDiferente === "Porcentagem") {
        const perc = item.valor ? parseFloat(item.valor) : 0;
        const total = valorTotal ? parseFloat(valorTotal) : 0;
        return ((perc / 100) * total).toFixed(2) + "€";
      }
      return "0€";
    })();

    return (
      <View
        style={[
          s.metricCard,
          { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
        ]}
      >
        <Text style={s.metricLabel}>{item.nome}</Text>
        <Input
          value={item.valor}
          onChangeText={(text) => {
            const novoValor = parseFloat(text.replace(",", ".")) || 0;
            const totalPermitido = parseFloat(valorTotal || "0");

            const somaAtual = somaDivisoes() - (parseFloat(item.valor) || 0);
            if (somaAtual + novoValor <= totalPermitido) {
              setValoresIndividuais((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, valor: text } : p))
              );
            }
          }}
          placeholder={placeholder}
          style={[s.input, { flex: 0.4, textAlign: "right" }]}
          keyboardType="numeric"
        />
        <Text style={[s.metricLabel, { marginLeft: 8 }]}>{valorExibido}</Text>
      </View>
    );
  };

  return (
    <ScrollView>
      <View style={s.container}>
        <Input
          label="Descrição"
          placeholder="ex: Almoço"
          value={descricao}
          onChangeText={setDescricao}
          style={s.input}
        />
        <Input
          label="Valor total (€)"
          placeholder="ex: 60"
          value={valorTotal}
          onChangeText={setValorTotal}
          style={s.input}
        />
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textDark, fontWeight: "600", marginBottom: 6 }}>
            Pagador
          </Text>

          <View style={s.chipsContainer}>
            {pagador && (
              (() => {
                const membro = membros.find((m: any) => m.id === pagador);
                if (!membro) return null;

                return (
                  <View style={s.chip} key={pagador}>
                    <Text style={s.chipText}>{membro.nome}</Text>

                    <TouchableOpacity
                      style={s.chipRemove}
                      onPress={() => setPagador(null)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })()
            )}

          </View>

            <TouchableOpacity
              style={[s.chip, s.chipAdd]}
              onPress={() => setOpenSelect(true)}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={[s.chipText, { color: "#fff", marginLeft: 4 }]}>
                Selecionar
              </Text>
            </TouchableOpacity>
          </View>

        <Tab<DespesaTipo>
          abas={["Igual", "Diferente"]}
          abaAtiva={abaTipo}
          onChange={setAbaTipo}
        />

        {abaTipo === "Igual" && (
          <FlatList
            data={valoresIndividuais}
            keyExtractor={(item) => item.id}
            renderItem={renderPessoaIgual}
            contentContainerStyle={{ marginTop: 12 }}
          />
        )}

        {abaTipo === "Diferente" && (
          <View style={{ marginTop: 12 }}>
            <Tab<DespesaDiferente>
              abas={["Valor", "Porcentagem"]}
              abaAtiva={abaDiferente}
              onChange={setAbaDiferente}
            />
            <FlatList
              data={valoresIndividuais}
              keyExtractor={(item) => item.id}
              renderItem={renderPessoaDiferente}
              contentContainerStyle={{ marginTop: 12 }}
            />
          </View>
        )}

        {abaTipo === "Diferente" && (
          <Text style={{ marginTop: 12, fontWeight: "600", color: restante < 0 ? "red" : "#6B7280" }}>
            {abaDiferente === "Valor" ? (
              restante >= 0
                ? `Falta distribuir: ${restante.toFixed(2)}€`
                : `Excedeu o valor em ${Math.abs(restante).toFixed(2)}€`
            ) : (
              restante >= 0
                ? `Falta distribuir: ${restante.toFixed(2)}%`
                : `Excedeu a porcentagem em ${Math.abs(restante).toFixed(2)}%`
            )}
          </Text>
        )}

        <Button
          title={modo === "editar" ? "Salvar alterações" : "Adicionar despesa"}
          style={{ marginTop: 16 }}
          onPress={modo === "editar" ? atualizarDespesa : adicionarDespesa}
        />

        {modo === "editar" && (
          <Button
            title="Excluir despesa"
            style={s.botaoApagar}
            onPress={() => {
              Alert.alert(
                "Excluir despesa",
                "Tem certeza que deseja excluir esta despesa?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async() => {
                      try {
                        if(!despesa?.id) {
                          Alert.alert("Erro", "ID não encontrado");
                          return;
                        }

                        await deleteDespesaFromFirestore(despesa.id);
                        Alert.alert("Sucesso", "Despesa excluída com sucesso!");
                        navigation.goBack();
                      } catch (error) {
                        console.log("Erro ao excluir despesa: ", error);
                        Alert.alert("Erro", "Não foi possível excluir a despesa");           
                      }          
                    },
                  },
                ]
              );
            }}
          />
        )}

        <Modal visible={openSelect} animationType="slide" transparent>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Selecione o pagador</Text>

              <View style={{ maxHeight: 340 }}>
                {!membros || membros.length === 0 ? (
                  <View style={{ padding: 16, alignItems: "center" }}>
                    <ActivityIndicator color="white" />
                  </View>
                ) : (
                  membros.map((m: any) => {
                    const isPagador = pagador === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "#444",
                        }}
                        onPress={() => setPagador(m.id)}
                      >
                        <Text style={{ color: "white" }}>
                          {isPagador ? "✔️ " : "○ "} {m.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
                <Button
                  title="Fechar"
                  onPress={() => setOpenSelect(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Confirmar"
                  onPress={() => setOpenSelect(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  input: {
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricLabel: {
    color: "#6B7280",
    fontWeight: "600",
  },
  botaoApagar: {
    backgroundColor: "red",
    marginTop: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EEDC",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: colors.textDark,
    fontSize: 13,
  },
  chipRemove: {
    marginLeft: 6,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  chipAdd: {
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
});
