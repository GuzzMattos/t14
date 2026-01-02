// src/firebase/notification.ts
import { db } from "./config";
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp, onSnapshot, orderBy, limit, deleteDoc } from "firebase/firestore";

export type NotificationType = "EXPENSE_PENDING_APPROVAL" | "EXPENSE_APPROVED" | "EXPENSE_REJECTED" | "FRIEND_REQUEST" | "MEMBER_ADDED" | "PAYMENT_RECEIVED";

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export type Notification = {
  id: string;
  userId: string; // Usuário que recebe a notificação
  type: NotificationType;
  status: NotificationStatus;
  
  // Dados da notificação
  title: string;
  message: string;
  
  // Dados relacionados (opcionais)
  groupId?: string;
  expenseId?: string;
  fromUserId?: string;
  friendRequestId?: string;
  
  // Metadados
  createdAt: any;
  readAt?: any;
};

/**
 * Cria uma notificação (verifica se o usuário tem notificações habilitadas)
 */
export async function createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<string | null> {
  // Verificar se o usuário tem notificações habilitadas
  const enabled = await isNotificationsEnabled(notification.userId);
  if (!enabled) {
    console.log("Notificações desabilitadas para o usuário:", notification.userId);
    return null; // Não cria notificação se estiver desabilitado
  }

  const notificationsRef = collection(db, "notifications");
  const notificationRef = doc(notificationsRef);
  const now = Timestamp.now();

  await setDoc(notificationRef, {
    id: notificationRef.id,
    ...notification,
    status: notification.status || "UNREAD",
    createdAt: now,
  });

  return notificationRef.id;
}

/**
 * Cria notificação de despesa pendente de aprovação
 */
export async function createExpenseApprovalNotification(
  groupOwnerId: string,
  expenseId: string,
  groupId: string,
  payerName: string,
  amount: number,
  description: string
): Promise<string> {
  return await createNotification({
    userId: groupOwnerId,
    type: "EXPENSE_PENDING_APPROVAL",
    status: "UNREAD",
    title: "Despesa pendente de aprovação",
    message: `${payerName} adicionou uma despesa de ${amount.toFixed(2)}€: ${description}`,
    groupId,
    expenseId,
  });
}

/**
 * Cria notificação de despesa aprovada
 */
export async function createExpenseApprovedNotification(
  userId: string,
  expenseId: string,
  groupId: string,
  description: string
): Promise<string> {
  return await createNotification({
    userId,
    type: "EXPENSE_APPROVED",
    status: "UNREAD",
    title: "Despesa aprovada",
    message: `Sua despesa "${description}" foi aprovada e adicionada ao grupo.`,
    groupId,
    expenseId,
  });
}

/**
 * Cria notificação de despesa rejeitada
 */
export async function createExpenseRejectedNotification(
  userId: string,
  expenseId: string,
  groupId: string,
  description: string
): Promise<string> {
  return await createNotification({
    userId,
    type: "EXPENSE_REJECTED",
    status: "UNREAD",
    title: "Despesa rejeitada",
    message: `Sua despesa "${description}" foi rejeitada pelo dono do grupo.`,
    groupId,
    expenseId,
  });
}

/**
 * Cria notificação de convite de amizade
 */
export async function createFriendRequestNotification(
  toUserId: string,
  fromUserId: string,
  friendRequestId: string,
  fromUserName: string
): Promise<string> {
  return await createNotification({
    userId: toUserId,
    type: "FRIEND_REQUEST",
    status: "UNREAD",
    title: "Novo convite de amizade",
    message: `${fromUserName} quer ser seu amigo`,
    fromUserId,
    friendRequestId,
  });
}

/**
 * Cria notificação de membro adicionado ao grupo
 */
export async function createMemberAddedNotification(
  userId: string,
  groupId: string,
  groupName: string,
  addedByName: string
): Promise<string> {
  return await createNotification({
    userId,
    type: "MEMBER_ADDED",
    status: "UNREAD",
    title: "Você foi adicionado a um grupo",
    message: `${addedByName} adicionou você ao grupo "${groupName}"`,
    groupId,
  });
}

/**
 * Verifica se o usuário tem notificações habilitadas
 */
export async function isNotificationsEnabled(userId: string): Promise<boolean> {
  try {
    const { getUserFromFirestore } = await import("@/services/user");
    const user = await getUserFromFirestore(userId);
    return user?.notificationsEnabled ?? true; // Por padrão, habilitado
  } catch (error) {
    console.error("Erro ao verificar preferências de notificação:", error);
    return true; // Por padrão, habilitado em caso de erro
  }
}

/**
 * Busca notificações de um usuário
 */
export async function getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
  const notificationsRef = collection(db, "notifications");
  
  // Se não usar orderBy, não precisa de índice composto
  // Mas vamos tentar com orderBy primeiro, se falhar, fazemos sem
  try {
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error: any) {
    // Se falhar por falta de índice, busca sem orderBy e ordena em memória
    if (error.code === "failed-precondition") {
      console.warn("Índice composto não encontrado, ordenando em memória");
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        limit(limitCount * 2) // Busca mais para garantir
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      // Ordenar em memória
      return notifications
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, limitCount);
    }
    throw error;
  }
}

/**
 * Observa notificações de um usuário em tempo real
 */
export function observeUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const notificationsRef = collection(db, "notifications");
  
  // Query sem orderBy para evitar necessidade de índice composto
  // Ordenamos em memória
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    limit(100) // Busca mais para garantir
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    
    // Ordenar em memória por data
    const sorted = notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    }).slice(0, 50);
    
    callback(sorted);
  }, (error) => {
    console.error("Erro ao observar notificações:", error);
    // Em caso de erro, retorna array vazio
    callback([]);
  });
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);
  const now = Timestamp.now();

  await updateDoc(notificationRef, {
    status: "READ",
    readAt: now,
  });
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    where("status", "==", "UNREAD")
  );

  const snapshot = await getDocs(q);
  const now = Timestamp.now();

  const updates = snapshot.docs.map((doc) =>
    updateDoc(doc.ref, {
      status: "READ",
      readAt: now,
    })
  );

  await Promise.all(updates);
}

/**
 * Remove uma notificação (deleta do Firestore)
 * Verifica se a notificação pertence ao usuário antes de deletar
 */
export async function deleteNotification(notificationId: string, userId?: string): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);
  
  // Se userId foi fornecido, verificar se a notificação pertence ao usuário
  if (userId) {
    const notificationSnap = await getDoc(notificationRef);
    if (!notificationSnap.exists()) {
      throw new Error("Notificação não encontrada");
    }
    
    const notificationData = notificationSnap.data() as Notification;
    if (notificationData.userId !== userId) {
      throw new Error("Você não tem permissão para deletar esta notificação");
    }
  }
  
  await deleteDoc(notificationRef);
}

