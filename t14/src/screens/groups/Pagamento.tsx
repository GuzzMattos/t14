import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import Button from "@/components/Button";
import Input from "@/components/Input";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import DocumentPicker, { types } from "react-native-document-picker"; 
import { getAllUsers, getUserFromFirestore } from "@/services/user";
import { createPagamentoInFirestore } from "@/firebase/pagamento";
import { getAuth } from "firebase/auth";
import { Expense } from "@/firebase/expense";
import { getTotalPagoPorUsuario } from "@/firebase/pagamento";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function Pagamento({ route, navigation }: any) {
  const [valor, setValor] = useState<string>();
  const [metodo, setMetodo] = useState<string>();
  const [comprovativo, setComprovativo] = useState<string>();
  const [comentario, setComentario] = useState<string>();
  const { tipoPagamento, despesa, saldo, expenseId } = route.params;
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [pagadorNome, setPagadorNome] = useState("");
  const [expense, setExpense] = useState<Expense | null>(null);
  const [userDebt, setUserDebt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  const opcoesPagamento = ["MB WAY", "Dinheiro", "Transferência", "PayPal"];

  if (!user) {
    return (
      <View style={s.container}>
        <Text>Usuário não autenticado</Text>
      </View>
    )
  }

  // Carregar despesa se expenseId foi passado
  useEffect(() => {
    async function loadExpense() {
      if (expenseId) {
        try {
          const expenseRef = doc(db, "expenses", expenseId);
          const expenseSnap = await getDoc(expenseRef);
          if (expenseSnap.exists()) {
            const expenseData = {
              id: expenseSnap.id,
              ...expenseSnap.data(),
            } as Expense;
            setExpense(expenseData);
          } else {
            console.error("Despesa não encontrada no Firestore");
          }
        } catch (error) {
          console.error("Erro ao carregar despesa:", error);
        }
      } else if (despesa) {
        // Se despesa antiga foi passada, converter para Expense
        setExpense(despesa as any);
      }
      setLoading(false);
    }
    loadExpense();
  }, [expenseId, despesa]);

  // Calcular dívida do usuário
  useEffect(() => {
    async function calculateDebt() {
      if (!expense || !user) return;

      // Encontrar a divisão do usuário
      const userDivision = expense.divisions?.find(d => d.userId === user.uid);
      if (!userDivision) {
        setUserDebt(0);
        return;
      }

      // Calcular quanto já foi pago
      const totalPago = await getTotalPagoPorUsuario(expense.id, user.uid);
      const debt = userDivision.amount - totalPago;
      setUserDebt(debt > 0 ? debt : 0);

      // Se for pagamento total, preencher o valor
      if (tipoPagamento === "total" && debt > 0) {
        setValor(debt.toFixed(2));
      } else if (saldo) {
        setValor(saldo.toString());
      }
    }
    calculateDebt();
  }, [expense, user, tipoPagamento, saldo]);
  
  useEffect(() => {
    async function loadPagador() {
      if (!expense) return;
      
      const pagadorId = expense.paidBy || (despesa as any)?.pagador;
      if (!pagadorId) return;

      const pagador = await getUserFromFirestore(pagadorId);
      if (pagador) {
        setPagadorNome(pagador.name ?? "");
      }
    }
    loadPagador();
  }, [expense, despesa]);

  const confirmarPagamento = async () => {
    try {
      if (!expense) {
        Alert.alert("Erro", "Despesa não encontrada");
        return;
      }

      if (!valor || Number(valor) <= 0) {
        Alert.alert("Erro", "Informe um valor válido");
        return;
      }

      const valorNum = Number(valor);
      const maxDebt = saldo ? Number(saldo) : userDebt;
      if (valorNum > maxDebt) {
        Alert.alert("Erro", "O valor não pode ser maior que a dívida");
        return;
      }

      if (!metodo) {
        Alert.alert("Erro", "Selecione um método de pagamento");
        return;
      }

      const pagadorId = expense.paidBy || (despesa as any)?.pagador;
      if (!pagadorId) {
        Alert.alert("Erro", "Não foi possível identificar quem deve receber o pagamento");
        return;
      }

      await createPagamentoInFirestore({
        despesaId: expense.id,
        valor: valorNum,
        deUsuarioId: user.uid,
        paraUsuarioId: pagadorId,
        metodoPagamento: metodo,
        comentario,
      });

      Alert.alert("Sucesso", "Pagamento registrado com sucesso! Aguardando confirmação.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error.message ?? "Erro ao registrar pagamento");
    }
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Despesa não encontrada</Text>
      </View>
    );
  }

  const saldoDisplay = saldo || userDebt.toFixed(2);

  return (
    <View style={s.container}>
      <Text style={s.title}>
        Você deve {saldoDisplay}€ {pagadorNome ? `para ${pagadorNome}` : ""}
      </Text>

      <Input
        label="Valor que irá pagar (€)"
        placeholder="ex: 50"
        value={valor}
        onChangeText={setValor}
        editable={tipoPagamento !== "total"}
        style={s.input}
      />

      <View style={{ marginBottom: 12, position: "relative", zIndex: 999 }}>
        <Text>Método de pagamento</Text>

        <Pressable
          onPress={() => setMostrarOpcoes(!mostrarOpcoes)}
          style={s.input}
        >
          <Text>
            {metodo || "Selecione um método"}
          </Text>
        </Pressable>

        {mostrarOpcoes && (
          <Pressable style={s.overlay} onPress={() => setMostrarOpcoes(false)}>
            <Pressable style={s.dropdownContainer}>
              <Text style={[s.dropdownTitle]}>Escolher método:</Text>

              {opcoesPagamento.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setMetodo(item);
                    setMostrarOpcoes(false);
                  }}
                  style={s.opcao}
                >
                  <Ionicons
                    name={metodo === item ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={metodo === item ? "#334B34" : "#999"}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={s.opcaoTexto}>{item}</Text>
                </Pressable>
              ))}

              <View style={{ marginTop: 10, alignItems: "flex-end" }}>
                <Pressable
                  onPress={() => {
                    setMetodo("");
                    setMostrarOpcoes(false);
                  }}
                >
                  <Text style={{ textDecorationLine: "underline", color: "#555" }}>
                    Limpar seleção
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </View>

      <Input
        label="Comprovativo de pagamento"
        value={comprovativo}
        onChangeText={setComprovativo}
        style={s.input}
      />

      <Input
        label="Comentários"
        value={comentario}
        onChangeText={setComentario}
        style={s.input}
      />

      <Button
        title="Confirmar pagamento"
        onPress={confirmarPagamento}
        style={{ marginTop: 16 }}
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    zIndex: 1000,
  },
  dropdownContainer: {
    width: 260,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 60,
    marginRight: 10,
    elevation: 20,
    zIndex: 1001,
  },
  dropdownTitle: {
    color: "#6B7280",
    marginBottom: 10,
    fontSize: 14,
  },
  opcao: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  opcaoTexto: {
    fontSize: 16,
    color: "#333",
  },
});
