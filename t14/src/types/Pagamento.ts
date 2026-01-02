export type Pagamento = {
  id: string;
  despesaId: string;
  deUsuarioId: string;
  paraUsuarioId: string;
  metodoPagamento: string;
  comentario?: string;
  valor: number;

  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
};
