import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, addDoc, query, where, getDocs, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./config";
import { Pagamento } from "@/types/Pagamento";
import { getAuth } from "firebase/auth";
import { createPaymentNotification } from "./notification";
import { getUserFromFirestore } from "@/services/user";

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

  // Buscar dados da despesa para obter o criador
  const expenseRef = doc(db, "expenses", despesaId);
  const expenseSnap = await getDoc(expenseRef);
  
  if (!expenseSnap.exists()) {
    throw new Error("Despesa não encontrada");
  }
  
  const expense = expenseSnap.data();
  const expenseCreatorId = expense.createdBy;
  
  // Buscar nome do pagador
  const pagadorUser = await getUserFromFirestore(deUsuarioId);
  const pagadorNome = pagadorUser?.name || "Usuário";

  const novoPagamento = {
    despesaId,
    valor,
    deUsuarioId,
    paraUsuarioId,
    metodoPagamento,
    comentario: comentario ?? "",
    status: "PENDING_CONFIRMATION", // Pendente de confirmação
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "pagamentos"), novoPagamento);

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

  return docRef.id;
}

export async function updatePagamentoInFirestore(pagamentoId: string, payload: CreatePagamentoPayload) {
    if (!pagamentoId) throw new Error("ID do pagamento não informado");

    const pagamentoRef = doc(db, "pagamento", pagamentoId);

    await updateDoc(pagamentoRef, {
    ...payload,
    atualizadoEm: serverTimestamp(),
    });
}

export async function getPagamentoFromFirestore(pagamentoId: string) {
    const ref = doc(db, "pagamento", pagamentoId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    return {
        id: pagamentoId,
        valor: data.valor,
        deUsuarioId: data.deUsuarioId,
        paraUsuarioId: data.paraUsuarioId,
        metodoPagamento: data.metodoPagamento,
        comentario: data.comentario,
    };
}

export async function getTotalPagoPorUsuario(despesaId: string, userId: string) {
    try {
      const q = query(
        collection(db, "pagamentos"),
        where("despesaId", "==", despesaId),
        where("deUsuarioId", "==", userId),
        where("status", "==", "CONFIRMED") // Apenas pagamentos confirmados
      );

      const snap = await getDocs(q);

      let totalPago = 0;
      snap.forEach(doc => {
        totalPago += doc.data().valor;
      });

      return totalPago;
    } catch (error: any) {
      // Se falhar por falta de índice, busca todos e filtra em memória
      if (error.code === "failed-precondition") {
        console.warn("Índice composto não encontrado, filtrando em memória");
        const q = query(
          collection(db, "pagamentos"),
          where("despesaId", "==", despesaId),
          where("deUsuarioId", "==", userId)
        );
        const snap = await getDocs(q);
        let totalPago = 0;
        snap.forEach(doc => {
          const data = doc.data();
          if (data.status === "CONFIRMED") {
            totalPago += data.valor;
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
  const paymentRef = doc(db, "pagamentos", paymentId);
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

  // Atualizar saldos do grupo
  const groupRef = doc(db, "group", groupId);
  const groupSnap = await getDoc(groupRef);

  if (groupSnap.exists()) {
    const groupData = groupSnap.data();
    const balances = groupData.balances || {};

    // Quem pagou: reduz sua dívida
    if (!balances[payment.deUsuarioId]) {
      balances[payment.deUsuarioId] = 0;
    }
    balances[payment.deUsuarioId] += payment.valor; // Reduz a dívida (soma porque saldo é negativo)

    // Quem recebeu: aumenta seu crédito
    if (!balances[payment.paraUsuarioId]) {
      balances[payment.paraUsuarioId] = 0;
    }
    balances[payment.paraUsuarioId] -= payment.valor; // Aumenta o crédito (subtrai porque saldo é negativo)

    await updateDoc(groupRef, {
      balances,
      updatedAt: now,
      lastActivityAt: now,
    });
  }

  // Criar notificação para quem pagou informando que foi confirmado
  const { createNotification } = await import("./notification");
  const pagadorUser = await getUserFromFirestore(payment.deUsuarioId);
  const pagadorNome = pagadorUser?.name || "Você";

  await createNotification({
    userId: payment.deUsuarioId,
    type: "PAYMENT_RECEIVED",
    status: "UNREAD",
    title: "Pagamento confirmado",
    message: `Seu pagamento de ${payment.valor.toFixed(2)}€ foi confirmado.`,
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
  const paymentRef = doc(db, "pagamentos", paymentId);
  const paymentSnap = await getDoc(paymentRef);

  if (!paymentSnap.exists()) {
    throw new Error("Pagamento não encontrado");
  }

  const payment = paymentSnap.data();

  if (payment.status !== "PENDING_CONFIRMATION") {
    throw new Error("Este pagamento já foi processado");
  }

  // Buscar a despesa para verificar se o usuário é o criador
  const expenseRef = doc(db, "expenses", payment.despesaId);
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

  // Criar notificação para quem pagou informando que foi rejeitado
  const { createNotification } = await import("./notification");

  await createNotification({
    userId: payment.deUsuarioId,
    type: "PAYMENT_RECEIVED",
    status: "UNREAD",
    title: "Pagamento rejeitado",
    message: `Seu pagamento de ${payment.valor.toFixed(2)}€ foi rejeitado. Entre em contato para mais informações.`,
    groupId: expense.groupId,
    expenseId: payment.despesaId,
  });
}