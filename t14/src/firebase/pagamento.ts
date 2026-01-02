import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./config";
import { Pagamento } from "@/types/Pagamento";
import { getAuth } from "firebase/auth";

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

  const novoPagamento = {
    despesaId,
    valor,
    deUsuarioId,
    paraUsuarioId,
    metodoPagamento,
    comentario: comentario ?? "",
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "pagamentos"), novoPagamento);

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
    const q = query(
    collection(db, "pagamentos"),
    where("despesaId", "==", despesaId),
    where("deUsuarioId", "==", userId)
    );

    const snap = await getDocs(q);

    let totalPago = 0;
    snap.forEach(doc => {
    totalPago += doc.data().valor;
    });

    return totalPago;
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