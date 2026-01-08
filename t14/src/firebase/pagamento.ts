import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, addDoc, query, where, getDocs, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { Pagamento } from "@/types/Pagamento";
import { getAuth } from "firebase/auth";
import { createPaymentNotification } from "./notification";
import { getUserFromFirestore } from "@/services/user";
import { markDivisionAsPaid } from "./expense";

interface CreatePagamentoPayload {
  despesaId?: string;
  valor?: number;
  deUsuarioId?: string;
  paraUsuarioId?: string;
  metodoPagamento?: string;
  comentario?: string;
}

export async function createPagamentoInFirestore(payload: CreatePagamentoPayload) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const {
    despesaId,
    valor,
    deUsuarioId,
    paraUsuarioId,
    metodoPagamento,
    comentario,
  } = payload;

  if (!despesaId) throw new Error("Pagamento precisa estar ligado a uma despesa");
  if (!valor || valor <= 0) throw new Error("Valor do pagamento inválido");
  if (!deUsuarioId || !paraUsuarioId)
    throw new Error("Usuários do pagamento são obrigatórios");

  // Buscar dados da despesa para obter o criador e verificar se está aprovada
  const expenseRef = doc(db, "expenses", despesaId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }

  const expense = expenseSnap.data();

  // Verificar se a despesa está aprovada
  if (expense.status !== "APPROVED") {
    throw new Error("Apenas despesas aprovadas podem receber pagamentos");
  }

  const expenseCreatorId = expense.createdBy;

  // Buscar nome do pagador
  const pagadorUser = await getUserFromFirestore(deUsuarioId);
  const pagadorNome = pagadorUser?.name || "Usuário";

  const novoPagamento = {
    expenseId: despesaId, // Usar expenseId ao invés de despesaId
    userId: deUsuarioId, // Simplificar para userId
    amount: valor, // Usar amount ao invés de valor
    paymentMethod: metodoPagamento,
    comment: comentario ?? "",
    status: "PENDING_CONFIRMATION", // Pendente de confirmação
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "payments"), novoPagamento);

  // Criar notificação para o criador da despesa confirmar o pagamento
  await createPaymentNotification(
    expenseCreatorId,
    docRef.id,
    despesaId,
    expense.groupId || "",
    pagadorNome,
    valor,
    expense.description || "Despesa"
  );

  // Criar notificação de atividade para o próprio pagador (registro de pagamento)
  const { createPaymentMadeNotification } = await import("./notification");
  await createPaymentMadeNotification(
    deUsuarioId,
    despesaId,
    expense.groupId || "",
    valor,
    expense.description || "Despesa"
  );

  return docRef.id;
}

export async function updatePagamentoInFirestore(pagamentoId: string, payload: CreatePagamentoPayload) {
  if (!pagamentoId) throw new Error("ID do pagamento não informado");

  const pagamentoRef = doc(db, "payments", pagamentoId);

  await updateDoc(pagamentoRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function getPagamentoFromFirestore(pagamentoId: string) {
  const ref = doc(db, "payments", pagamentoId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    id: pagamentoId,
    valor: data.amount || data.valor,
    deUsuarioId: data.userId || data.deUsuarioId,
    paraUsuarioId: data.paraUsuarioId,
    metodoPagamento: data.paymentMethod || data.metodoPagamento,
    comentario: data.comment || data.comentario,
  };
}

export async function getTotalPagoPorUsuario(expenseId: string, userId: string) {
  try {
    const q = query(
      collection(db, "payments"),
      where("expenseId", "==", expenseId),
      where("userId", "==", userId),
      where("status", "==", "CONFIRMED") // Apenas pagamentos confirmados
    );

    const snap = await getDocs(q);

    let totalPago = 0;
    snap.forEach(doc => {
      totalPago += doc.data().amount;
    });

    return totalPago;
  } catch (error: any) {
    // Se falhar por falta de índice, busca todos e filtra em memória
    if (error.code === "failed-precondition") {
      console.warn("Índice composto não encontrado, filtrando em memória");
      const q = query(
        collection(db, "payments"),
        where("expenseId", "==", expenseId),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      let totalPago = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === "CONFIRMED") {
          totalPago += data.amount;
        }
      });
      return totalPago;
    }
    throw error;
  }
}

export async function getValoresIndividuaisAtualizados(despesa: any) {
  const pessoasAtualizadas = [];

  for (const pessoa of despesa.valoresIndividuais) {
    const totalPago = await getTotalPagoPorUsuario(despesa.id, pessoa.id);
    const saldo = pessoa.valor - totalPago;
    pessoasAtualizadas.push({
      ...pessoa,
      saldo,
    });
  }

  return pessoasAtualizadas;
}

/**
 * Confirma um pagamento pendente
 * Atualiza o status do pagamento e os saldos do grupo
 */
export async function confirmPayment(
  paymentId: string,
  confirmedBy: string,
  expenseId: string,
  groupId: string
): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar o pagamento
  const paymentRef = doc(db, "payments", paymentId);
  const paymentSnap = await getDoc(paymentRef);

  if (!paymentSnap.exists()) {
    throw new Error("Pagamento não encontrado");
  }

  const payment = paymentSnap.data();

  if (payment.status !== "PENDING_CONFIRMATION") {
    throw new Error("Este pagamento já foi processado");
  }

  // Buscar a despesa para verificar se o usuário é o criador
  const expenseRef = doc(db, "expenses", expenseId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }

  const expense = expenseSnap.data();

  if (expense.createdBy !== user.uid) {
    throw new Error("Apenas o criador da despesa pode confirmar pagamentos");
  }

  const now = Timestamp.now();

  // Atualizar status do pagamento
  await updateDoc(paymentRef, {
    status: "CONFIRMED",
    confirmedBy: user.uid,
    confirmedAt: now,
    updatedAt: now,
  });

  // Marcar a divisão como paga na despesa
  await markDivisionAsPaid(expenseId, payment.userId || payment.deUsuarioId);

  // Atualizar saldos do grupo
  const groupRef = doc(db, "group", groupId);
  const groupSnap = await getDoc(groupRef);

  const payerId = payment.userId || payment.deUsuarioId;
  const paymentAmount = payment.amount || payment.valor;

  if (groupSnap.exists()) {
    const groupData = groupSnap.data();
    const balances = groupData.balances || {};

    // Quem pagou: reduz sua dívida
    if (!balances[payerId]) {
      balances[payerId] = 0;
    }
    balances[payerId] += paymentAmount; // Reduz a dívida (soma porque saldo é negativo)

    // Quem recebeu (criador da despesa): aumenta seu crédito
    if (!balances[expense.createdBy]) {
      balances[expense.createdBy] = 0;
    }
    balances[expense.createdBy] -= paymentAmount; // Aumenta o crédito (subtrai porque saldo é negativo)

    await updateDoc(groupRef, {
      balances,
      updatedAt: now,
      lastActivityAt: now,
    });
  }

  // Criar notificação para quem pagou informando que foi confirmado
  const { createNotification } = await import("./notification");
  const pagadorUser = await getUserFromFirestore(payerId);
  const pagadorNome = pagadorUser?.name || "Você";

  await createNotification({
    userId: payerId,
    type: "PAYMENT_RECEIVED",
    status: "UNREAD",
    title: "Pagamento confirmado",
    message: `Seu pagamento de ${paymentAmount.toFixed(2)}€ foi confirmado.`,
    groupId,
    expenseId,
  });
}

/**
 * Rejeita um pagamento pendente
 */
export async function rejectPayment(
  paymentId: string,
  rejectedBy: string
): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar o pagamento
  const paymentRef = doc(db, "payments", paymentId);
  const paymentSnap = await getDoc(paymentRef);

  if (!paymentSnap.exists()) {
    throw new Error("Pagamento não encontrado");
  }

  const payment = paymentSnap.data();

  if (payment.status !== "PENDING_CONFIRMATION") {
    throw new Error("Este pagamento já foi processado");
  }

  // Buscar a despesa para verificar se o usuário é o criador
  const expenseRef = doc(db, "expenses", payment.expenseId || payment.despesaId);
  const expenseSnap = await getDoc(expenseRef);

  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }

  const expense = expenseSnap.data();

  if (expense.createdBy !== user.uid) {
    throw new Error("Apenas o criador da despesa pode rejeitar pagamentos");
  }

  const now = Timestamp.now();

  // Atualizar status do pagamento
  await updateDoc(paymentRef, {
    status: "REJECTED",
    rejectedBy: user.uid,
    rejectedAt: now,
    updatedAt: now,
  });

  const payerId = payment.userId || payment.deUsuarioId;
  const paymentAmount = payment.amount || payment.valor;

  // Criar notificação para quem pagou informando que foi rejeitado
  const { createNotification } = await import("./notification");

  await createNotification({
    userId: payerId,
    type: "PAYMENT_RECEIVED",
    status: "UNREAD",
    title: "Pagamento rejeitado",
    message: `Seu pagamento de ${paymentAmount.toFixed(2)}€ foi rejeitado. Entre em contato para mais informações.`,
    groupId: expense.groupId,
    expenseId: payment.expenseId || payment.despesaId,
  });
}