import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./config";
import { Despesa, DespesaPessoa, DespesaTipo, DespesaDiferente } from "@/types/Despesa";
import { getAuth } from "firebase/auth";

interface CreateDespesaPayload {
  descricao: string;
  valorTotal: number;
  pagador: string;
  groupId: string;
  abaTipo: DespesaTipo;
  abaDiferente: DespesaDiferente;
  valoresIndividuais: DespesaPessoa[];
}

export async function createDespesaInFirestore(payload: CreateDespesaPayload) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const { descricao, valorTotal, pagador, groupId, abaTipo, abaDiferente, valoresIndividuais } = payload;

  if (!descricao.trim()) throw new Error("Descrição é obrigatória");
  if (!valorTotal || valorTotal <= 0) throw new Error("Valor total inválido");
  if (!pagador) throw new Error("É necessário informar quem pagou");
  if (!groupId) throw new Error("Despesa precisa de um grupo");

  const novaDespesa: Partial<Despesa> = {
  descricao,
  valorTotal,
  pagador,
  groupId,
  abaTipo,
  abaDiferente,
  valoresIndividuais,
  createdBy: user.uid,
  createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "despesa"), novaDespesa);
  return docRef.id;
}

export async function updateDespesaInFirestore(despesaId: string, payload: CreateDespesaPayload) {
  if (!despesaId) throw new Error("ID da despesa não informado");

  const despesaRef = doc(db, "despesa", despesaId);

  await updateDoc(despesaRef, {
    ...payload,
    atualizadoEm: serverTimestamp(),
  });
}

export async function getDespesaFromFirestore(despesaId: string): Promise<Despesa | null> {
    const ref = doc(db, "despesa", despesaId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    return {
        id: despesaId,
        descricao: data.descricao,
        valorTotal: data.valorTotal,
        pagador: data.pagador,
        groupId: data.groupId,
        abaTipo: data.abaTipo as DespesaTipo,
        abaDiferente: data.abaDiferente as DespesaDiferente,
        valoresIndividuais: data.valoresIndividuais as DespesaPessoa[],
    };
}

export async function getDespesasByGroup(groupId: string): Promise<Despesa[]> {
  const q = query(
    collection(db, "despesa"),
    where("groupId", "==", groupId)
  );

  const querySnapshot = await getDocs(q);
  const despesas: Despesa[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    despesas.push({
      id: doc.id,
      descricao: data.descricao,
      valorTotal: data.valorTotal,
      pagador: data.pagador,
      groupId: data.groupId,
      abaTipo: data.abaTipo,
      abaDiferente: data.abaDiferente,
      valoresIndividuais: data.valoresIndividuais,
    });
  });

  return despesas;
}

export async function getTotalDespesasGrupo(groupId: string): Promise<number> {
  const despesas: Despesa[] = await getDespesasByGroup(groupId);
  const total = despesas.reduce((acc, despesa) => acc + (despesa.valorTotal || 0), 0);

  return total;
}

export async function getTotalPagoPorUsuario(groupId: string, userId: string): Promise<number> {
  const despesas: Despesa[] = await getDespesasByGroup(groupId);

  const totalPago = despesas
    .filter(d => d.pagador === userId)
    .reduce((acc, d) => acc + (d.valorTotal || 0), 0);

  return totalPago;
}

export async function deleteDespesaFromFirestore(despesaId: string) {
  const ref = doc(db, "despesa", despesaId);
  await deleteDoc(ref);
}
