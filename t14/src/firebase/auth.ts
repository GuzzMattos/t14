import { User } from "firebase/auth";
import { auth } from "./config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";

import { AppUser } from "@/types/User";

export function mapFirebaseUser(user: User | null): AppUser | null {
  if (!user) return null;

  return {
    uid: user.uid,                // agora existe
    email: user.email ?? "",     // nunca mais erro TS
    name: user.displayName ?? null
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

  return mapFirebaseUser(cred.user)!;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(cred.user)!;
}

export async function logoutFirebase() {
  await signOut(auth);
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Atualiza a senha do usuário autenticado
 * Requer reautenticação antes de atualizar
 */
export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Usuário não autenticado");
  }

  // Criar credencial para reautenticação
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  // Reautenticar o usuário
  await reauthenticateWithCredential(user, credential);
  
  // Atualizar a senha
  await updatePassword(user, newPassword);
}

/**
 * Deleta a conta do usuário
 * Requer reautenticação antes de deletar
 */
export async function deleteUserAccount(currentPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Usuário não autenticado");
  }

  // Criar credencial para reautenticação
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  // Reautenticar o usuário
  await reauthenticateWithCredential(user, credential);
  
  // Deletar a conta do Firebase Auth
  await deleteUser(user);
}
