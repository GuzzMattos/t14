// src/firebase/group.ts
import { db } from "./config";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export interface CreateGroupPayload {
  name: string;
  description?: string;
  currency?: string;
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

    memberIds: [ownerId],
    members: {
      [ownerId]: {
        role: "OWNER",
        status: "ATIVO",
        joinedAt: now,
      },
    },

    totalGasto: 0,
    balances: {
      [ownerId]: 0,
    },

    status: "POR_LIQUIDAR",
    isActive: true,

    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };

  const ref = collection(db, "group");
  const docRef = await addDoc(ref, groupData);

  return docRef.id;
}

export async function updateGroupInFirestore(groupId: string, data: any) {
  const groupRef = doc(db, "group", groupId);
  await updateDoc(groupRef, {
    ...data,
    updatedAt: Timestamp.now(),
    lastActivityAt: Timestamp.now(),
  });
}

export async function deleteGroupFromFirestore(groupId: string) {
  const groupRef = doc(db, "group", groupId);
  await deleteDoc(groupRef);
}
