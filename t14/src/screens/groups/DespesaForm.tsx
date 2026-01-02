import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import Tab from "@/components/Tab";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Group } from "@/types/Group";
import { getUserFromFirestore } from "@/services/user";
import { createExpense, ExpenseDivisionType, ExpenseDivision } from "@/firebase/expense";

type Pessoa = {
  id: string;
  nome: string;
  valor: string;
  userId: string; // ID do usuário no Firebase
};

export default function DespesaForm({ route, navigation }: any) {
  const { modo, despesa, grupoId } = route.params || {};
  const { user } = useAuth();
  
  const [descricao, setDescricao] = useState<string>("");
  const [valorTotal, setValorTotal] = useState<string>("");
  const [pagador, setPagador] = useState<string>("");
  const [pagadorId, setPagadorId] = useState<string>("");
  const [abaTipo, setAbaTipo] = useState<"Igual" | "Diferente">("Igual");
  const [abaDiferente, setAbaDiferente] = useState<"Valor" | "Porcentagem">("Valor");
  const [valoresIndividuais, setValoresIndividuais] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);

  const somaDivisoes = () => {
    if (abaDiferente === "Porcentagem") {
      // Para porcentagem, calcular baseado no valor total
      const total = parseFloat(valorTotal?.replace(",", ".") || "0");
      return valoresIndividuais.reduce((soma, p) => {
        const perc = parseFloat(p.valor?.replace(",", ".") || "0");
        return soma + ((perc / 100) * total);
      }, 0);
    } else {
      // Para valor, somar diretamente
      return valoresIndividuais.reduce((total, p) => {
        const valor = parseFloat(p.valor?.replace(",", ".") || "0");
        return total + (isNaN(valor) ? 0 : valor);
      }, 0);
    }
  };

  const valorTotalNum = parseFloat(valorTotal?.replace(",", ".") || "0");
  const restante = valorTotalNum - somaDivisoes();

  const handleSave = async () => {
    if (!user || !grupoId || !group) {
      Alert.alert("Erro", "Dados incompletos. Tente novamente.");
      return;
    }

    // Validações
    if (!descricao.trim()) {
      Alert.alert("Erro", "A descrição é obrigatória.");
      return;
    }

    if (!valorTotal || valorTotalNum <= 0) {
      Alert.alert("Erro", "O valor total deve ser maior que zero.");
      return;
    }

    if (!pagadorId) {
      Alert.alert("Erro", "Selecione quem pagou a despesa.");
      return;
    }

    if (valoresIndividuais.length === 0) {
      Alert.alert("Erro", "O grupo precisa ter membros para criar uma despesa.");
      return;
    }

    // Validar divisão
    if (abaTipo === "Diferente") {
      if (abaDiferente === "Porcentagem") {
        const somaPerc = valoresIndividuais.reduce((total, p) => {
          const perc = parseFloat(p.valor?.replace(",", ".") || "0");
          return total + perc;
        }, 0);
        if (Math.abs(somaPerc - 100) > 0.01) {
          Alert.alert("Erro", `A soma das porcentagens deve ser 100%. Atual: ${somaPerc.toFixed(1)}%`);
          return;
        }
      } else {
        if (Math.abs(restante) > 0.01) {
          Alert.alert("Erro", `A soma dos valores deve ser igual ao valor total. Restante: ${restante.toFixed(2)}€`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      // Preparar divisões
      const divisions: ExpenseDivision[] = [];
      
      if (abaTipo === "Igual") {
        // Divisão igual: cada membro paga o mesmo valor
        const valorPorPessoa = valorTotalNum / valoresIndividuais.length;
        valoresIndividuais.forEach((pessoa) => {
          divisions.push({
            userId: pessoa.userId,
            amount: valorPorPessoa,
          });
        });
      } else {
        // Divisão diferente
        valoresIndividuais.forEach((pessoa) => {
          let amount = 0;
          let percentage: number | undefined = undefined;

          if (abaDiferente === "Porcentagem") {
            const perc = parseFloat(pessoa.valor?.replace(",", ".") || "0");
            amount = (perc / 100) * valorTotalNum;
            percentage = perc;
          } else {
            amount = parseFloat(pessoa.valor?.replace(",", ".") || "0");
          }

          if (amount > 0) {
            const division: ExpenseDivision = {
              userId: pessoa.userId,
              amount,
            };
            // Só adicionar percentage se não for undefined
            if (percentage !== undefined && percentage !== null) {
              division.percentage = percentage;
            }
            divisions.push(division);
          }
        });
      }

      // Determinar tipo de divisão
      const divisionType: ExpenseDivisionType = 
        abaTipo === "Igual" 
          ? "EQUAL" 
          : abaDiferente === "Porcentagem" 
          ? "PERCENTAGE" 
          : "CUSTOM";

      // Criar despesa
      await createExpense(
        grupoId,
        user.uid,
        descricao.trim(),
        valorTotalNum,
        pagadorId,
        divisionType,
        divisions,
        group.ownerId,
        pagador
      );

      Alert.alert("Sucesso", "Despesa criada com sucesso! Aguardando aprovação do dono do grupo.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Erro ao criar despesa:", error);
      Alert.alert("Erro", error.message || "Não foi possível criar a despesa.");
    } finally {
      setSaving(false);
    }
  };

  // Carregar membros do grupo
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (!grupoId) {
        setLoading(false);
        return;
      }

      try {
        const groupRef = doc(db, "group", grupoId);
        const groupSnap = await getDoc(groupRef);
        
        if (groupSnap.exists()) {
          const groupData = { id: groupSnap.id, ...groupSnap.data() } as Group;
          setGroup(groupData);

          // Carregar dados dos membros
          if (groupData.memberIds && groupData.memberIds.length > 0) {
            const membersData: Pessoa[] = [];
            for (const memberId of groupData.memberIds) {
              const memberUser = await getUserFromFirestore(memberId);
              if (memberUser) {
                membersData.push({
                  id: memberId,
                  userId: memberId,
                  nome: memberUser.name || "Usuário",
                  valor: "",
                });
              }
            }
            setValoresIndividuais(membersData);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar membros do grupo:", error);
        Alert.alert("Erro", "Não foi possível carregar os membros do grupo.");
      } finally {
        setLoading(false);
      }
    };

    loadGroupMembers();
  }, [grupoId]);

  useEffect(() => {
    if (modo === "editar" && despesa) {
      setDescricao(despesa.descricao || "");
      setValorTotal(despesa.valorTotal?.toString() || "");
      setPagador(despesa.paidBy || "");
      setAbaTipo(despesa.divisionType === "EQUAL" ? "Igual" : "Diferente");
      // TODO: Carregar valores individuais se for edição
    }
  }, [modo, despesa]);

  useEffect(() => {
    navigation.setOptions({
      title: modo === "editar" ? "Editar despesa" : "Nova despesa",
    });
  }, [navigation, modo]);

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
        return item.valor ? parseFloat(item.valor.replace(",", ".")).toFixed(2) + "€" : "0€";
      } else if (abaDiferente === "Porcentagem") {
        const perc = item.valor ? parseFloat(item.valor.replace(",", ".")) : 0;
        const total = valorTotal ? parseFloat(valorTotal.replace(",", ".")) : 0;
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
            // Limpar caracteres não numéricos exceto vírgula e ponto
            const cleaned = text.replace(/[^\d,.]/g, '');
            
            if (abaDiferente === "Valor") {
              // Modo Valor: validar soma dos valores
              const novoValor = parseFloat(cleaned.replace(",", ".")) || 0;
              const totalPermitido = parseFloat(valorTotal?.replace(",", ".") || "0");
              const somaAtual = somaDivisoes() - (parseFloat(item.valor?.replace(",", ".") || "0") || 0);
              
              if (somaAtual + novoValor <= totalPermitido) {
                setValoresIndividuais((prev) =>
                  prev.map((p) => (p.id === item.id ? { ...p, valor: cleaned } : p))
                );
              }
            } else {
              // Modo Porcentagem: validar soma das porcentagens (deve somar até 100%)
              const novoValor = parseFloat(cleaned.replace(",", ".")) || 0;
              
              // Limitar porcentagem individual a 100%
              if (novoValor <= 100) {
                const somaAtual = valoresIndividuais.reduce((total, p) => {
                  const val = parseFloat(p.valor?.replace(",", ".") || "0") || 0;
                  return total + (p.id === item.id ? 0 : val);
                }, 0);
                
                // Permitir se a soma não exceder 100%
                if (somaAtual + novoValor <= 100) {
                  setValoresIndividuais((prev) =>
                    prev.map((p) => (p.id === item.id ? { ...p, valor: cleaned } : p))
                  );
                }
              }
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

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textDark }}>Carregando membros do grupo...</Text>
      </View>
    );
  }

  if (valoresIndividuais.length === 0) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textDark, textAlign: "center" }}>
          O grupo não tem membros. Adicione membros antes de criar uma despesa.
        </Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
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
      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 8, color: colors.textDark, fontWeight: "600" }}>Quem pagou</Text>
        {valoresIndividuais.map((pessoa) => (
          <TouchableOpacity
            key={pessoa.id}
            onPress={() => {
              setPagador(pessoa.nome);
              setPagadorId(pessoa.userId);
            }}
            style={[
              s.pessoaOption,
              pagadorId === pessoa.userId && s.pessoaOptionSelected,
            ]}
          >
            <Text style={[
              s.pessoaOptionText,
              pagadorId === pessoa.userId && s.pessoaOptionTextSelected,
            ]}>
              {pessoa.nome}
            </Text>
            {pagadorId === pessoa.userId && (
              <Text style={s.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Tab abas={["Igual", "Diferente"]} abaAtiva={abaTipo} onChange={setAbaTipo} />

      {abaTipo === "Igual" && (
        <View style={{ marginTop: 12 }}>
          {valoresIndividuais.map((p) => {
            const item = {
              ...p,
              valor: valorTotal
                ? (parseFloat(valorTotal.replace(",", ".")) / valoresIndividuais.length).toFixed(2) + "€"
                : "0€",
            };
            return <View key={item.id}>{renderPessoaIgual({ item })}</View>;
          })}
        </View>
      )}

      {abaTipo === "Diferente" && (
        <View style={{ marginTop: 12 }}>
          <Tab
            abas={["Valor", "Porcentagem"]}
            abaAtiva={abaDiferente}
            onChange={setAbaDiferente}
          />
          <View style={{ marginTop: 12 }}>
            {valoresIndividuais.map((item) => (
              <View key={item.id}>{renderPessoaDiferente({ item })}</View>
            ))}
          </View>
        </View>
      )}

      {abaTipo === "Diferente" && (
        <View style={{ marginTop: 12 }}>
          {abaDiferente === "Porcentagem" ? (
            <Text style={{ fontWeight: "600", color: "#6B7280" }}>
              {(() => {
                const somaPerc = valoresIndividuais.reduce((total, p) => {
                  const perc = parseFloat(p.valor?.replace(",", ".") || "0");
                  return total + perc;
                }, 0);
                const restantePerc = 100 - somaPerc;
                if (restantePerc > 0) {
                  return `Falta distribuir: ${restantePerc.toFixed(1)}%`;
                } else if (restantePerc < 0) {
                  return `Excedeu em ${Math.abs(restantePerc).toFixed(1)}%`;
                } else {
                  return "Distribuição completa (100%)";
                }
              })()}
            </Text>
          ) : (
            <Text style={{ fontWeight: "600", color: restante < 0 ? "red" : "#6B7280" }}>
              {restante >= 0 
                ? `Falta distribuir: ${restante.toFixed(2)}€` 
                : `Excedeu o valor em ${Math.abs(restante).toFixed(2)}€`}
            </Text>
          )}
        </View>
      )}

      <Button
        title={saving ? "Salvando..." : modo === "editar" ? "Salvar alterações" : "Adicionar despesa"}
        style={{ marginTop: 16 }}
        onPress={handleSave}
        disabled={saving || loading}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
  pessoaOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  pessoaOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F0F9FF",
  },
  pessoaOptionText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "600",
  },
  pessoaOptionTextSelected: {
    color: colors.primary,
  },
  checkmark: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
});
