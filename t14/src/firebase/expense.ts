// src/firebase/expense.ts
import { db } from "./config";
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp, onSnapshot, orderBy } from "firebase/firestore";
import { createExpenseApprovalNotification, createExpenseApprovedNotification, createExpenseRejectedNotification } from "./notification";

export type ExpenseStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type ExpenseDivisionType = "EQUAL" | "CUSTOM" | "PERCENTAGE";

export type ExpenseDivision = {
  userId: string;
  amount: number;
  percentage?: number;
  paid: boolean; // Se já foi pago
  paidAt?: any; // Quando foi pago/confirmado
};

export type Expense = {
  id: string;
  groupId: string;
  createdBy: string; // userId de quem criou

  description: string;
  amount: number;
  currency: string;

  paidBy: string; // userId de quem pagou

  divisionType: ExpenseDivisionType;
  divisions: ExpenseDivision[]; // Como a despesa foi dividida

  status: ExpenseStatus;

  // Metadados
  createdAt: any;
  updatedAt: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  rejectionReason?: string;
};

/**
 * Cria uma despesa (pendente de aprovação)
 */
export async function createExpense(
  groupId: string,
  createdBy: string,
  description: string,
  amount: number,
  paidBy: string,
  divisionType: ExpenseDivisionType,
  divisions: ExpenseDivision[],
  groupOwnerId: string,
  payerName: string
): Promise<string> {
  const expensesRef = collection(db, "expenses");
  const expenseRef = doc(expensesRef);
  const now = Timestamp.now();

  // Filtrar divisões para remover campos undefined e marcar como pago se for o criador
  const cleanDivisions = divisions.map(div => {
    const clean: ExpenseDivision = {
      userId: div.userId,
      amount: div.amount,
      paid: div.userId === paidBy, // Marcar como pago se for quem pagou (criador)
    };

    // Adicionar paidAt se já está pago
    if (clean.paid) {
      clean.paidAt = now;
    }

    // Só adicionar percentage se não for undefined
    if (div.percentage !== undefined && div.percentage !== null) {
      clean.percentage = div.percentage;
    }
    return clean;
  });

  const expense: Expense = {
    id: expenseRef.id,
    groupId,
    createdBy,
    description,
    amount,
    currency: "EUR",
    paidBy,
    divisionType,
    divisions: cleanDivisions,
    status: "PENDING_APPROVAL",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(expenseRef, expense);

  // Criar notificação para o dono do grupo
  await createExpenseApprovalNotification(
    groupOwnerId,
    expenseRef.id,
    groupId,
    payerName,
    amount,
    description
  );

  return expenseRef.id;
}

/**
 * Aprova uma despesa
 */
export async function approveExpense(
  expenseId: string,
  approvedBy: string,
  groupId: string
): Promise<void> {
  const expenseRef = doc(db, "expenses", expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }

  const expense = expenseSnap.data() as Expense;

  if (expense.status !== "PENDING_APPROVAL") {
    throw new Error("Esta despesa já foi processada");
  }

  const now = Timestamp.now();

  // Atualizar status da despesa
  await updateDoc(expenseRef, {
    status: "APPROVED",
    approvedAt: now,
    approvedBy,
    updatedAt: now,
  });

  // Atualizar saldos do grupo
  const groupRef = doc(db, "group", groupId);
  const groupSnap = await getDoc(groupRef);

  if (groupSnap.exists()) {
    const groupData = groupSnap.data();
    const balances = groupData.balances || {};

    // Atualizar saldos baseado nas divisões
    expense.divisions.forEach((division) => {
      if (!balances[division.userId]) {
        balances[division.userId] = 0;
      }
      balances[division.userId] -= division.amount; // Deve pagar
    });

    // Quem pagou recebe o valor total
    if (!balances[expense.paidBy]) {
      balances[expense.paidBy] = 0;
    }
    balances[expense.paidBy] += expense.amount; // Recebe

    // Atualizar total gasto
    const totalGasto = (groupData.totalGasto || 0) + expense.amount;

    await updateDoc(groupRef, {
      balances,
      totalGasto,
      updatedAt: now,
      lastActivityAt: now,
    });
  }

  // Criar notificação para quem criou a despesa
  await createExpenseApprovedNotification(
    expense.createdBy,
    expenseId,
    groupId,
    expense.description
  );
}

/**
 * Rejeita uma despesa
 */
export async function rejectExpense(
  expenseId: string,
  rejectedBy: string,
  rejectionReason?: string
): Promise<void> {
  const expenseRef = doc(db, "expenses", expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }

  const expense = expenseSnap.data() as Expense;

  if (expense.status !== "PENDING_APPROVAL") {
    throw new Error("Esta despesa já foi processada");
  }

  const now = Timestamp.now();

  await updateDoc(expenseRef, {
    status: "REJECTED",
    rejectedAt: now,
    rejectedBy,
    rejectionReason,
    updatedAt: now,
  });

  // Criar notificação para quem criou a despesa
  await createExpenseRejectedNotification(
    expense.createdBy,
    expenseId,
    expense.groupId,
    expense.description
  );
}

/**
 * Busca despesas de um grupo
 */
export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const expensesRef = collection(db, "expenses");

  try {
    const q = query(
      expensesRef,
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
  } catch (error: any) {
    // Se falhar por falta de índice, busca sem orderBy e ordena em memória
    if (error.code === "failed-precondition") {
      console.warn("Índice composto não encontrado, ordenando em memória");
      const q = query(expensesRef, where("groupId", "==", groupId));
      const snapshot = await getDocs(q);
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];

      // Ordenar em memória
      return expenses.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
    }
    throw error;
  }
}

/**
 * Observa despesas de um grupo em tempo real
 */
export function observeGroupExpenses(
  groupId: string,
  callback: (expenses: Expense[]) => void
): () => void {
  const expensesRef = collection(db, "expenses");

  // Query sem orderBy para evitar necessidade de índice composto
  const q = query(
    expensesRef,
    where("groupId", "==", groupId)
  );

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];

    // Ordenar em memória por data
    const sorted = expenses.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    callback(sorted);
  }, (error) => {
    console.error("Erro ao observar despesas:", error);
    callback([]);
  });
}

/**
 * Busca uma despesa por ID
 */
export async function getExpenseById(expenseId: string): Promise<Expense | null> {
  const expenseRef = doc(db, "expenses", expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    return null;
  }

  return {
    id: expenseSnap.id,
    ...expenseSnap.data(),
  } as Expense;
}

/**
 * Calcula o total que o usuário pagou no mês
 * Inclui: despesas criadas por ele (valor total) + pagamentos confirmados de suas partes
 */
export async function getTotalPaidByUserInMonth(userId: string, year: number, month: number): Promise<number> {
  const startOfMonth = Timestamp.fromDate(new Date(year, month, 1));
  const endOfMonth = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59));

  let total = 0;

  // 1. Buscar despesas aprovadas onde o usuário é o paidBy (quem pagou tudo)
  const paidByQuery = query(
    collection(db, "expenses"),
    where("paidBy", "==", userId),
    where("status", "==", "APPROVED"),
    where("createdAt", ">=", startOfMonth),
    where("createdAt", "<=", endOfMonth)
  );

  const paidBySnap = await getDocs(paidByQuery);
  paidBySnap.forEach(doc => {
    const expense = doc.data() as Expense;
    total += expense.amount;
  });

  // 2. Buscar despesas aprovadas onde o usuário tem uma divisão paga
  const allExpensesQuery = query(
    collection(db, "expenses"),
    where("status", "==", "APPROVED"),
    where("createdAt", ">=", startOfMonth),
    where("createdAt", "<=", endOfMonth)
  );

  const allExpensesSnap = await getDocs(allExpensesQuery);
  allExpensesSnap.forEach(doc => {
    const expense = doc.data() as Expense;

    // Pular se já contamos (usuário é paidBy)
    if (expense.paidBy === userId) return;

    // Verificar se tem divisão paga do usuário
    const userDivision = expense.divisions?.find(d => d.userId === userId && d.paid);
    if (userDivision) {
      total += userDivision.amount;
    }
  });

  return total;
}

/**
 * Marca a divisão de um usuário como paga (quando o criador confirma o pagamento)
 */
export async function markDivisionAsPaid(expenseId: string, userId: string): Promise<void> {
  const expenseRef = doc(db, "expenses", expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }

  const expense = expenseSnap.data() as Expense;

  // Atualizar a divisão do usuário para marcá-la como paga
  const updatedDivisions = expense.divisions.map(div => {
    if (div.userId === userId) {
      return {
        ...div,
        paid: true,
        paidAt: Timestamp.now(),
      };
    }
    return div;
  });

  await updateDoc(expenseRef, {
    divisions: updatedDivisions,
    updatedAt: Timestamp.now(),
  });
}
