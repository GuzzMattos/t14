import { db } from "./config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export interface CreateGroupPayload {
    name: string;
    description?: string;
    currency?: string; // "EUR", "BRL", etc.
    ownerId: string;
}

export async function createGroupInFirestore({
    name,
    description = "",
    currency = "EUR",
    ownerId,
}: CreateGroupPayload) {
    const now = Timestamp.now();

    const groupData = {
        name,
        description,
        currency,
        ownerId,
        createdBy: ownerId,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,

        status: "POR_LIQUIDAR",
        isActive: true,
        totalGasto: 0,

        memberIds: [ownerId],

        members: {
            [ownerId]: {
                role: "OWNER",
                status: "ATIVO",
                joinedAt: now,
            },
        },

        balances: {
            [ownerId]: 0,
        },
    };

    const ref = collection(db, "group");
    const docRef = await addDoc(ref, groupData);

    return docRef.id;
}
