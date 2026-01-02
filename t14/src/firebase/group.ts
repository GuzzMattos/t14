import { db } from "./config";
import { collection, addDoc, Timestamp, doc, updateDoc, getDoc, arrayRemove, FieldValue } from "firebase/firestore";

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

/**
 * Remove um membro de um grupo
 */
export async function removeMemberFromGroup(
    groupId: string,
    memberId: string,
    currentUserId: string
): Promise<void> {
    const groupRef = doc(db, "group", groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        throw new Error("Grupo não encontrado");
    }

    const groupData = groupSnap.data();

    // Verificar se o usuário atual é o dono
    if (groupData.ownerId !== currentUserId) {
        throw new Error("Apenas o dono do grupo pode remover membros");
    }

    // Verificar se não está tentando remover o dono
    if (memberId === groupData.ownerId) {
        throw new Error("Não é possível remover o dono do grupo");
    }

    // Verificar se o membro existe no grupo
    if (!groupData.memberIds || !groupData.memberIds.includes(memberId)) {
        throw new Error("Membro não encontrado no grupo");
    }

    const now = Timestamp.now();

    // Remover do array memberIds
    const updatedMemberIds = (groupData.memberIds || []).filter((id: string) => id !== memberId);

    // Remover dos membros e balances
    const updatedMembers = { ...groupData.members };
    const updatedBalances = { ...groupData.balances };
    
    delete updatedMembers[memberId];
    delete updatedBalances[memberId];

    await updateDoc(groupRef, {
        memberIds: updatedMemberIds,
        members: updatedMembers,
        balances: updatedBalances,
        updatedAt: now,
        lastActivityAt: now,
    });
}

/**
 * Adiciona membros a um grupo
 */
export async function addMembersToGroup(
    groupId: string,
    memberIds: string[],
    currentUserId: string
): Promise<void> {
    const groupRef = doc(db, "group", groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        throw new Error("Grupo não encontrado");
    }

    const groupData = groupSnap.data();

    // Verificar se o usuário atual é o dono ou é membro do grupo
    if (groupData.ownerId !== currentUserId && !groupData.memberIds?.includes(currentUserId)) {
        throw new Error("Apenas o dono ou membros do grupo podem adicionar novos membros");
    }

    // Filtrar membros que já estão no grupo
    const existingMemberIds = groupData.memberIds || [];
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
        throw new Error("Todos os membros selecionados já estão no grupo");
    }

    const now = Timestamp.now();

    // Preparar atualizações
    const membersUpdate: Record<string, any> = {};
    const balancesUpdate: Record<string, number> = {};

    newMemberIds.forEach((memberId) => {
        membersUpdate[memberId] = {
            role: "MEMBER",
            status: "ATIVO",
            joinedAt: now,
        };
        balancesUpdate[memberId] = 0;
    });

    // Atualizar o grupo
    await updateDoc(groupRef, {
        memberIds: [...existingMemberIds, ...newMemberIds],
        members: {
            ...groupData.members,
            ...membersUpdate,
        },
        balances: {
            ...groupData.balances,
            ...balancesUpdate,
        },
        updatedAt: now,
        lastActivityAt: now,
    });
}
