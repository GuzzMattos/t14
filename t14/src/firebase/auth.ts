// src/firebase/auth.ts
import { User } from "firebase/auth";
import { auth } from "./config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./config";

import { AppUser } from "@/types/User";

export function mapFirebaseUser(user: User | null): AppUser | null {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? null,
    notification: true,
    isActive: true,
  };
}

async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  await setDoc(
    ref,
    {
      email: user.email ?? "",
      notification: true,
      isActive: true,
    },
    { merge: true }
  );
}

async function fetchUserDoc(user: User): Promise<{
  notification: boolean;
  isActive: boolean;
}> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await ensureUserDoc(user);
    return { notification: true, isActive: true };
  }

  const data = snap.data() as any;
  return {
    notification:
      typeof data.notification === "boolean" ? data.notification : true,
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
  };
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }

  await ensureUserDoc(cred.user);
  const extra = await fetchUserDoc(cred.user);

  return {
    uid: cred.user.uid,
    email: cred.user.email ?? "",
    name: cred.user.displayName ?? null,
    notification: extra.notification,
    isActive: extra.isActive,
  };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const extra = await fetchUserDoc(cred.user);

  if (!extra.isActive) {
    await signOut(auth);
    const error: any = new Error("Conta desativada");
    error.code = "auth/user-inactive";
    throw error;
  }

  return {
    uid: cred.user.uid,
    email: cred.user.email ?? "",
    name: cred.user.displayName ?? null,
    notification: extra.notification,
    isActive: extra.isActive,
  };
}

export async function logoutFirebase() {
  await signOut(auth);
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}
