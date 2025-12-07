import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ScrollView, Alert } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import Tab from "@/components/Tab";
import { collection, addDoc, setDoc, doc, updateDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore"; 
import { db } from "@/firebase/config"
import { createDespesaInFirestore, updateDespesaInFirestore } from "@/services/despesa";
import { DespesaTipo, DespesaDiferente } from "@/types/Despesa";

type Pessoa = {
  id: string;
  nome: string;
  valor: string;
};

export default function DespesaForm({ route, navigation }: any) {
  const { modo, despesa, groupId } = route.params || {};

  const [descricao, setDescricao] = useState<string>();
  const [valorTotal, setValorTotal] = useState<string>();
  const [pagador, setPagador] = useState<string>();
  const [abaTipo, setAbaTipo] = useState<DespesaTipo>("Igual");
  const [abaDiferente, setAbaDiferente] = useState<DespesaDiferente>("Valor");

  const [valoresIndividuais, setValoresIndividuais] = useState<Pessoa[]>([
    { id: "1", nome: "João", valor: "" },
    { id: "2", nome: "Maria", valor: "" },
    { id: "3", nome: "Pedro", valor: "" },
  ]);

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
      setDescricao(despesa.descricao || "");
      setValorTotal(despesa.valorTotal || "");
      setPagador(despesa.pagador || "");
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
          groupId,
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
        groupId,
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
        <Input
          label="Quem pagou"
          placeholder="ex: João"
          value={pagador}
          onChangeText={setPagador}
          style={s.input}
        />

        <Tab<DespesaTipo>
          abas={["Igual", "Diferente"]}
          abaAtiva={abaTipo}
          onChange={setAbaTipo}
        />

        {abaTipo === "Igual" && (
          <FlatList
            data={valoresIndividuais.map((p) => ({
              ...p,
              valor: valorTotal
                ? (parseFloat(valorTotal.replace(",", ".")) / valoresIndividuais.length).toFixed(2) + "€"
                : "0€",
            }))}
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
                    onPress: () => {
                      Alert.alert("Sucesso", "Despesa excluída com sucesso!");
                    },
                  },
                ]
              );
            }}
          />
        )}
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
});
