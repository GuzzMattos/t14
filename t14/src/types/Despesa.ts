import { AppUser } from "./User";

export type DespesaTipo = "Igual" | "Diferente"
export type DespesaDiferente = "Valor" | "Porcentagem"

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
}