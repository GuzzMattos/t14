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
        name: user.name,
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
    };
}

/**
 * Atualiza campos do usuário
 */
export async function updateUserInFirestore(
    userId: string,
    data: Partial<User>
) {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, data);
}
