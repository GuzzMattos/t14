import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { getExpenseById, Expense } from "@/firebase/expense";
import { getTotalPagoPorUsuario } from "@/firebase/pagamento";
import { getUserFromFirestore } from "@/services/user";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

type DivisionDisplay = {
  userId: string;
  userName: string;
  amount: number;
  paid: number;
  remaining: number;
  percentage?: number;
};

export default function DetalheDespesa({ route, navigation }: any) {
  const { despesaId, title } = route.params;
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [divisions, setDivisions] = useState<DivisionDisplay[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const [payerName, setPayerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userDebt, setUserDebt] = useState<number>(0);

  useEffect(() => {
    async function loadExpense() {
      if (!despesaId) {
        setLoading(false);
        return;
      }

      try {
        // Carregar despesa
        const expenseData = await getExpenseById(despesaId);
        if (!expenseData) {
          setLoading(false);
          return;
        }

        setExpense(expenseData);

        // Carregar nome do grupo
        if (expenseData.groupId) {
          const groupRef = doc(db, "group", expenseData.groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            setGroupName(groupSnap.data().name || "Grupo");
          }
        }

        // Carregar nome de quem pagou
        if (expenseData.paidBy) {
          const payer = await getUserFromFirestore(expenseData.paidBy);
          setPayerName(payer?.name || "Usuário");
        }

        // Carregar divisões com nomes dos usuários
        if (expenseData.divisions && expenseData.divisions.length > 0) {
          const divisionsData: DivisionDisplay[] = [];
          let foundUserDivision = false;
          
          for (const division of expenseData.divisions) {
            const divisionUser = await getUserFromFirestore(division.userId);
            const totalPago = await getTotalPagoPorUsuario(expenseData.id, division.userId);
            const remaining = Math.max(0, division.amount - totalPago);

            divisionsData.push({
              userId: division.userId,
              userName: divisionUser?.name || "Usuário",
              amount: division.amount,
              paid: totalPago,
              remaining,
              percentage: division.percentage,
            });

            // Calcular dívida do usuário atual
            if (division.userId === user?.uid) {
              setUserDebt(remaining);
              foundUserDivision = true;
            }
          }

          // Se o usuário não está nas divisões, não tem dívida
          if (!foundUserDivision) {
            setUserDebt(0);
          }

          setDivisions(divisionsData);
        } else {
          // Se não há divisões, não há dívida
          setUserDebt(0);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar despesa:", error);
        setLoading(false);
      }
    }

    loadExpense();
  }, [despesaId, user]);

  const handlePagarParcial = () => {
    if (!expense) return;
    navigation.navigate("Pagamento", {
      tipoPagamento: "parcial",
      expenseId: expense.id,
      saldo: userDebt,
    });
  };

  const handlePagarTotal = () => {
    if (!expense) return;
    navigation.navigate("Pagamento", {
      tipoPagamento: "total",
      expenseId: expense.id,
      saldo: userDebt,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: "center", alignItems: "center" }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <Text style={s.title}>Despesa não encontrada</Text>
      </SafeAreaView>
    );
  }

  const canPay = userDebt > 0 && expense.status === "APPROVED";

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={s.title}>{expense.description || title}</Text>
        <View style={s.divider} />
      </View>

      <View style={[s.metricCard, { marginBottom: 12, marginHorizontal: 16 }]}>
        <View style={s.row}>
          <Text style={s.metricLabel}>Grupo</Text>
          <Text style={s.metricValue}>{groupName || "N/A"}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Valor Total</Text>
          <Text style={s.metricValue}>{expense.amount.toFixed(2)}€</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Quem pagou</Text>
          <Text style={s.metricValue}>{payerName}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Status</Text>
          <Text style={s.metricValue}>
            {expense.status === "APPROVED" ? "Aprovada" : 
             expense.status === "PENDING_APPROVAL" ? "Pendente" : "Rejeitada"}
          </Text>
        </View>
        <View style={s.row}>
          <Text style={s.metricLabel}>Tipo de divisão</Text>
          <Text style={s.metricValue}>
            {expense.divisionType === "EQUAL" ? "Igualitária" : 
             expense.divisionType === "PERCENTAGE" ? "Por porcentagem" : "Personalizada"}
          </Text>
        </View>
      </View>

      <View style={[s.metricCard, { marginBottom: 12, marginHorizontal: 16 }]}>
        <Text style={[s.metricLabel, { marginBottom: 8 }]}>Divisão</Text>
        {divisions.map((item, index) => (
          <View key={item.userId}>
            {index > 0 && <View style={{ height: 8 }} />}
            <View style={s.divisionRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.divisionName}>{item.userName}</Text>
                {item.percentage !== undefined && (
                  <Text style={s.divisionSubtext}>{item.percentage.toFixed(1)}%</Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.divisionAmount}>{item.amount.toFixed(2)}€</Text>
                {item.paid > 0 && (
                  <Text style={s.divisionPaid}>Pago: {item.paid.toFixed(2)}€</Text>
                )}
                {item.remaining > 0 && (
                  <Text style={[s.divisionRemaining, { color: "#E11D48" }]}>
                    Restante: {item.remaining.toFixed(2)}€
                  </Text>
                )}
                {item.remaining === 0 && item.paid > 0 && (
                  <Text style={[s.divisionRemaining, { color: "#2E7D32" }]}>
                    ✓ Pago
                  </Text>
                )}
                {item.remaining > 0 && (
                  <Text style={[s.divisionRemaining, { color: "#E11D48" }]}>
                    A pagar: {item.remaining.toFixed(2)}€
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {canPay && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={[s.metricLabel, { marginBottom: 8 }]}>
              Você deve: {userDebt.toFixed(2)}€
            </Text>
          </View>
          <Button
            title="Quitar parcialmente"
            onPress={handlePagarParcial}
            variant="outline"
            style={{ marginBottom: 10 }}
          />
          <Button
            title="Quitar totalmente"
            onPress={handlePagarTotal}
            style={{ marginBottom: 10 }}
          />
        </View>
      )}

      {!canPay && userDebt === 0 && expense.status === "APPROVED" && divisions.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={[s.metricLabel, { textAlign: "center", color: "#2E7D32" }]}>
            ✓ Você já quitou sua parte desta despesa
          </Text>
        </View>
      )}

      {!canPay && userDebt === 0 && expense.status === "APPROVED" && divisions.length === 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={[s.metricLabel, { textAlign: "center", color: "#6B7280" }]}>
            Você não está incluído nesta despesa
          </Text>
        </View>
      )}

      {expense.status !== "APPROVED" && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={[s.metricLabel, { textAlign: "center", color: "#6B7280" }]}>
            Esta despesa ainda não foi aprovada
          </Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  divisionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  divisionName: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 16,
  },
  divisionSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  divisionAmount: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 16,
  },
  divisionPaid: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  divisionRemaining: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
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
