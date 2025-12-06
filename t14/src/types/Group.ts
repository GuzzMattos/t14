import { AppUser } from "./User"; // ou reorganizar depois

export type GroupStatus = "POR_LIQUIDAR" | "LIQUIDADO";

export type Group = {
    id: string;
    name: string;
    description?: string | null;

    ownerId?: string;

    memberIds?: string[];
    members?: {
        [userId: string]: AppUser;
    };

    currency?: string;
    totalGasto?: number;

    balances?: {
        [userId: string]: number;
    };

    status?: GroupStatus;
    isActive?: boolean;

    createdAt?: any;
    updatedAt?: any;
    lastActivityAt?: any;

    createdBy?: string;
};