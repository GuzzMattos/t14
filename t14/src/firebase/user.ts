// src/firebase/user.ts
import { User as FirebaseUser } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./config";

export type UserDoc = {
  id: string;
  email: string;
  notification: boolean;
  isActive: boolean;
};

export function mapFirebaseUserToUserDoc(
  firebaseUser: FirebaseUser | null
): UserDoc | null {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    notification: true,
    isActive: true,
  };
}

export async function createOrUpdateUserDoc(firebaseUser: FirebaseUser) {
  const ref = doc(db, "users", firebaseUser.uid);
  await setDoc(
    ref,
    {
      email: firebaseUser.email ?? "",
      notification: true,
      isActive: true,
    },
    { merge: true }
  );
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as any;
  return {
    id: snap.id,
    email: data.email ?? "",
    notification:
      typeof data.notification === "boolean" ? data.notification : true,
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
  };
}

export async function getAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    return users;
  } catch (e) {
    console.error("Erro ao buscar usuários:", e);
    return [];
  }
}

export async function deactivateUser(uid: string) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { isActive: false }, { merge: true });
}
