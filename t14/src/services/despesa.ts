import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Despesa, DespesaPessoa, DespesaTipo, DespesaDiferente } from "@/types/Despesa";

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
