// src/firebase/user.ts
import { User as FirebaseUser } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./config";

export type User = {
    id: string;
    email: string;
    password?: string; // opcional no Firestore
    name?: string;
    nickname?: string;
    phone?: string;
    avatar?: string;
    notificationsEnabled?: boolean;
};

/**
 * Converte um usuário do Firebase Authentication
 * para o nosso modelo interno.
 */
export function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;

    return {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
    };
}
export async function getAllUsers() {
    try {
        const snapshot = await getDocs(collection(db, "users")); // <-- CORRETO!
        const users = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return users;
    } catch (e) {
        console.error("Erro ao buscar usuários:", e);
        return [];
    }
}
