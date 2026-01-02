// src/firebase/friend.ts
import { db } from "./config";
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

export type FriendStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendStatus;
  createdAt: any;
  updatedAt: any;
};

export type Friend = {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: any;
};

/**
 * Envia um convite de amizade
 */
export async function sendFriendRequest(fromUserId: string, toUserEmail: string): Promise<void> {
  // Buscar o usuário pelo email
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", toUserEmail.toLowerCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Usuário não encontrado com este email");
  }

  const toUser = snapshot.docs[0];
  const toUserId = toUser.id;

  if (fromUserId === toUserId) {
    throw new Error("Não é possível adicionar a si mesmo como amigo");
  }

  // Verificar se já existe uma solicitação
  const requestsRef = collection(db, "friendRequests");
  
  // Buscar solicitações do remetente e verificar se alguma é para o destinatário
  const existingQuery = query(
    requestsRef,
    where("fromUserId", "==", fromUserId)
  );
  const existingSnapshot = await getDocs(existingQuery);
  
  // Verificar se existe solicitação para este destinatário
  const existingRequest = existingSnapshot.docs.find(
    doc => doc.data().toUserId === toUserId
  );

  if (existingRequest) {
    const existingData = existingRequest.data();
    if (existingData.status === "PENDING") {
      throw new Error("Já existe uma solicitação pendente para este usuário");
    }
  }

  // Verificar se já são amigos - buscar em friends
  const friendsRef = collection(db, "friends");
  const friendsQuery1 = query(
    friendsRef,
    where("userId", "==", fromUserId),
    where("friendId", "==", toUserId)
  );
  const friendsQuery2 = query(
    friendsRef,
    where("userId", "==", toUserId),
    where("friendId", "==", fromUserId)
  );
  
  const [friendsSnap1, friendsSnap2] = await Promise.all([
    getDocs(friendsQuery1),
    getDocs(friendsQuery2)
  ]);
  
  const friendsSnapshot = {
    docs: [...friendsSnap1.docs, ...friendsSnap2.docs],
    empty: friendsSnap1.empty && friendsSnap2.empty
  };

  if (!friendsSnapshot.empty) {
    const isAccepted = friendsSnapshot.docs.some(doc => doc.data().status === "ACCEPTED");
    if (isAccepted) {
      throw new Error("Vocês já são amigos");
    }
  }

  // Criar solicitação
  const now = Timestamp.now();
  const requestRef = doc(collection(db, "friendRequests"));
  
  await setDoc(requestRef, {
    id: requestRef.id,
    fromUserId,
    toUserId,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Aceita um convite de amizade
 */
export async function acceptFriendRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, "friendRequests", requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error("Solicitação não encontrada");
  }

  const requestData = requestSnap.data() as FriendRequest;

  // Verificar se já existe relação de amizade
  const friendsRef = collection(db, "friends");
  const friendsQuery1 = query(
    friendsRef,
    where("userId", "==", requestData.fromUserId),
    where("friendId", "==", requestData.toUserId),
    where("status", "==", "ACCEPTED")
  );
  const friendsQuery2 = query(
    friendsRef,
    where("userId", "==", requestData.toUserId),
    where("friendId", "==", requestData.fromUserId),
    where("status", "==", "ACCEPTED")
  );

  let [friendsSnap1, friendsSnap2] = await Promise.all([
    getDocs(friendsQuery1).catch(() => ({ docs: [], empty: true })),
    getDocs(friendsQuery2).catch(() => ({ docs: [], empty: true })),
  ]);

  // Se já são amigos, apenas atualizar o status da solicitação se necessário
  if (!friendsSnap1.empty || !friendsSnap2.empty) {
    // Já são amigos, apenas atualizar status da solicitação se ainda estiver PENDING
    if (requestData.status === "PENDING") {
      await updateDoc(requestRef, {
        status: "ACCEPTED",
        updatedAt: Timestamp.now(),
      });
    }
    return; // Retornar silenciosamente pois já são amigos
  }

  // Se a solicitação já foi processada mas não há relação de amizade, criar a relação
  if (requestData.status !== "PENDING" && requestData.status !== "ACCEPTED") {
    // Se foi rejeitada, não podemos aceitar
    if (requestData.status === "REJECTED") {
      throw new Error("Esta solicitação foi rejeitada e não pode ser aceita");
    }
  }

  const now = Timestamp.now();

  // Atualizar status da solicitação apenas se ainda estiver PENDING
  if (requestData.status === "PENDING") {
    await updateDoc(requestRef, {
      status: "ACCEPTED",
      updatedAt: now,
    });
  }

  // Verificar novamente se já existe relação antes de criar (evitar duplicação)
  // Usar uma verificação mais ampla para pegar qualquer status
  const checkQuery1 = query(
    friendsRef,
    where("userId", "==", requestData.fromUserId),
    where("friendId", "==", requestData.toUserId)
  );
  const checkQuery2 = query(
    friendsRef,
    where("userId", "==", requestData.toUserId),
    where("friendId", "==", requestData.fromUserId)
  );

  const [checkSnap1, checkSnap2] = await Promise.all([
    getDocs(checkQuery1).catch(() => ({ docs: [], empty: true })),
    getDocs(checkQuery2).catch(() => ({ docs: [], empty: true })),
  ]);

  const existingFriend1 = checkSnap1.docs.find(d => d.exists());
  const existingFriend2 = checkSnap2.docs.find(d => d.exists());

  // Se já existe relação ACCEPTED em qualquer direção, não criar duplicata
  if (
    (existingFriend1 && existingFriend1.data().status === "ACCEPTED") ||
    (existingFriend2 && existingFriend2.data().status === "ACCEPTED")
  ) {
    return; // Já são amigos, retornar silenciosamente
  }

  // Se existe relação mas não está ACCEPTED, atualizar para ACCEPTED
  if (existingFriend1 && existingFriend1.data().status !== "ACCEPTED") {
    await updateDoc(existingFriend1.ref, {
      status: "ACCEPTED",
      createdAt: now,
    });
  }
  if (existingFriend2 && existingFriend2.data().status !== "ACCEPTED") {
    await updateDoc(existingFriend2.ref, {
      status: "ACCEPTED",
      createdAt: now,
    });
  }

  // Criar relações que não existem
  if (!existingFriend1) {
    // Criar relação fromUserId -> toUserId
    const friend1Ref = doc(friendsRef);
    await setDoc(friend1Ref, {
      id: friend1Ref.id,
      userId: requestData.fromUserId,
      friendId: requestData.toUserId,
      status: "ACCEPTED",
      createdAt: now,
    });
  }

  if (!existingFriend2) {
    // Criar relação toUserId -> fromUserId
    const friend2Ref = doc(friendsRef);
    await setDoc(friend2Ref, {
      id: friend2Ref.id,
      userId: requestData.toUserId,
      friendId: requestData.fromUserId,
      status: "ACCEPTED",
      createdAt: now,
    });
  }
}

/**
 * Rejeita um convite de amizade
 */
export async function rejectFriendRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, "friendRequests", requestId);
  const now = Timestamp.now();

  await updateDoc(requestRef, {
    status: "REJECTED",
    updatedAt: now,
  });
}

/**
 * Remove um amigo
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const friendsRef = collection(db, "friends");
  
  // Remover relação 1
  const q1 = query(
    friendsRef,
    where("userId", "==", userId),
    where("friendId", "==", friendId)
  );
  const snapshot1 = await getDocs(q1);
  snapshot1.docs.forEach(async (doc) => {
    await updateDoc(doc.ref, { status: "REJECTED" });
  });

  // Remover relação 2
  const q2 = query(
    friendsRef,
    where("userId", "==", friendId),
    where("friendId", "==", userId)
  );
  const snapshot2 = await getDocs(q2);
  snapshot2.docs.forEach(async (doc) => {
    await updateDoc(doc.ref, { status: "REJECTED" });
  });
}

/**
 * Busca todos os amigos de um usuário
 */
export async function getUserFriends(userId: string): Promise<Friend[]> {
  const friendsRef = collection(db, "friends");
  
  try {
    const q = query(
      friendsRef,
      where("userId", "==", userId),
      where("status", "==", "ACCEPTED")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Friend[];
  } catch (error: any) {
    // Se falhar por falta de índice, busca todos e filtra em memória
    if (error.code === "failed-precondition") {
      console.warn("Índice composto não encontrado, filtrando em memória");
      const q = query(friendsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((friend) => friend.status === "ACCEPTED") as Friend[];
    }
    throw error;
  }
}

/**
 * Busca todas as solicitações pendentes recebidas por um usuário
 */
export async function getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const requestsRef = collection(db, "friendRequests");
  
  try {
    const q = query(
      requestsRef,
      where("toUserId", "==", userId),
      where("status", "==", "PENDING")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FriendRequest[];
  } catch (error: any) {
    // Se falhar por falta de índice, busca todos e filtra em memória
    if (error.code === "failed-precondition") {
      console.warn("Índice composto não encontrado, filtrando em memória");
      const q = query(requestsRef, where("toUserId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((req) => req.status === "PENDING") as FriendRequest[];
    }
    throw error;
  }
}

