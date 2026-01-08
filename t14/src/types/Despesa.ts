export type DespesaTipo = "Igual" | "Diferente"
export type DespesaDiferente = "Valor" | "Porcentagem"
export type DespesaStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

export type DespesaPessoa = {
    id: string;
    nome: string;
    valor: number;
};

export type Despesa = {
    id: string;
    descricao: string;
    valorTotal: number;
    pagador: string;
    groupId: string;
    abaTipo: DespesaTipo;
    abaDiferente: DespesaDiferente;
    valoresIndividuais: DespesaPessoa[];

    createdAt?: any;
    updatedAt?: any;
    lastActivityAt?: any;

    createdBy?: string;
    status?: DespesaStatus;
}