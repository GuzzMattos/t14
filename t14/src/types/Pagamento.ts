export type PagamentoStatus = "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED";

export type Pagamento = {
  id: string;
  despesaId: string;
  deUsuarioId: string;
  paraUsuarioId: string;
  metodoPagamento: string;
  comentario?: string;
  valor: number;
  status?: PagamentoStatus;

  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
};
