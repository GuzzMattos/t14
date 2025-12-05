import { AppUser } from "./User"; // ou reorganizar depois

export type GroupStatus = "POR_LIQUIDAR" | "LIQUIDADO";

export type Group = {
    id: string;                            // ID do documento (igual ao groupId do Firestore)
    name: string;                          // Nome do grupo
    description?: string | null;           // Descrição opcional

    ownerId?: string;                       // UID de quem criou o grupo

    memberIds?: string[];                   // Lista rápida de UIDs
    members?: {                             // Dados detalhados por membro
        [userId: string]: AppUser;
    };

    currency?: string;                      // Moeda padrão do grupo (ex.: "EUR")
    totalGasto?: number;                    // Total de todas as despesas ativas do grupo

    balances?: {                            // Saldo por utilizador
        [userId: string]: number;
    };

    status?: GroupStatus;                   // POR_LIQUIDAR | LIQUIDADO
    isActive?: boolean;                     // false = arquivado

    createdAt?: any;                        // Timestamp
    updatedAt?: any;                        // Timestamp
    lastActivityAt?: any;                   // Timestamp

    createdBy?: string;                     // UID de quem criou
};