// src/services/user.ts
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { User } from "@/firebase/user";
import { AppUser } from "@/types/User";

/**
 * Cria o usuário na coleção "users"
 */
export async function createUserInFirestore(user: AppUser) {
    const ref = doc(db, "users", user.uid);

    await setDoc(ref, {
        id: user.uid,
        email: user.email,
        name: user.name ?? null,
        nickname: user.nickname ?? null,
        phone: user.phone ?? null,
        avatar: user.avatar ?? null,
        notificationsEnabled: user.notificationsEnabled ?? true,
    });
}

/**
 * Retorna o usuário a partir do Firestore
 */
export async function getUserFromFirestore(userId: string): Promise<User | null> {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    return {
        id: userId,
        email: data.email,
        password: data.password ?? undefined,
        name: data.name ?? undefined,
        nickname: data.nickname ?? undefined,
        phone: data.phone ?? undefined,
        avatar: data.avatar ?? undefined,
        notificationsEnabled: data.notificationsEnabled ?? true,
        pushToken: data.pushToken ?? undefined,
    };
}

/**
 * Atualiza campos do usuário
 * Se o documento não existir, cria um novo
 */
export async function updateUserInFirestore(
    userId: string,
    data: Partial<User>,
    email?: string
) {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        // Documento existe, atualiza
        await updateDoc(ref, data);
    } else {
        // Documento não existe, cria com merge
        const userData: any = {
            id: userId,
            email: email || data.email || "",
            ...data,
        };
        await setDoc(ref, userData, { merge: true });
    }
}
