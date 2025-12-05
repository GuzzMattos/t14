import { createGroupInFirestore } from "../firebase/group";

export async function createGroup(name: string, ownerId: string) {
    if (!name.trim()) throw new Error("Nome do grupo é obrigatório");

    return await createGroupInFirestore({
        name,
        ownerId,
    });
}
