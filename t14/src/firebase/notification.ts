// src/firebase/notification.ts
import { db } from "./config";
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp, onSnapshot, orderBy, limit, deleteDoc } from "firebase/firestore";

export type NotificationType = "EXPENSE_PENDING_APPROVAL" | "EXPENSE_APPROVED" | "EXPENSE_REJECTED" | "FRIEND_REQUEST" | "MEMBER_ADDED" | "GROUP_CREATED" | "PAYMENT_RECEIVED" | "PAYMENT_PENDING_CONFIRMATION";

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
  paymentId?: string; // ID do pagamento

  // Metadados
  createdAt: any;
  readAt?: any;
};

/**
 * Cria uma notificação (sempre cria no app, mas push apenas se habilitado)
 */
export async function createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<string | null> {
  // SEMPRE cria a notificação no app (dentro do app)
  // A flag notificationsEnabled controla apenas push notifications (celular)

  const notificationsRef = collection(db, "notifications");
  const notificationRef = doc(notificationsRef);
  const now = Timestamp.now();

  await setDoc(notificationRef, {
    id: notificationRef.id,
    ...notification,
    status: notification.status || "UNREAD",
    createdAt: now,
  });

  // Enviar push notification APENAS se o usuário tiver notificações habilitadas
  try {
    const enabled = await isNotificationsEnabled(notification.userId);
    if (enabled) {
      console.log('🔔 Enviando push notification para:', notification.userId);
      console.log('📝 Título:', notification.title);
      console.log('📝 Mensagem:', notification.message);

      const { sendPushNotification } = await import("@/services/sendPushNotification");
      await sendPushNotification(
        notification.userId,
        notification.title,
        notification.message,
        {
          notificationId: notificationRef.id,
          type: notification.type,
          groupId: notification.groupId,
          expenseId: notification.expenseId,
          paymentId: notification.paymentId,
        }
      );
    } else {
      console.log("⚠️  Push notification não enviada - usuário desabilitou notificações:", notification.userId);
    }
  } catch (error: any) {
    console.error("❌ Erro ao enviar push notification:", error);
    console.error("❌ Stack:", error.stack);
    // Não falhar se o push não for enviado
  }

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
): Promise<string | null> {
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
): Promise<string | null> {
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
): Promise<string | null> {
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
): Promise<string | null> {
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
 * Cria notificação de membro adicionado ao grupo (atividade recente, sem necessidade de ação)
 * Esta notificação serve como registro de atividade e NÃO envia push notification
 */
export async function createMemberAddedNotification(
  userId: string,
  groupId: string,
  groupName: string,
  addedByName: string
): Promise<string> {
  // Notificação de atividade - já marcada como lida, não precisa de ação
  const notificationsRef = collection(db, "notifications");
  const notificationRef = doc(notificationsRef);
  const now = Timestamp.now();

  await setDoc(notificationRef, {
    id: notificationRef.id,
    userId,
    type: "MEMBER_ADDED",
    status: "READ", // Já marcado como lido (apenas atividade recente, não requer ação)
    title: "Adicionado a um grupo",
    message: `${addedByName} adicionou você ao grupo "${groupName}"`,
    groupId,
    createdAt: now,
    readAt: now,
  });

  // NÃO envia push notification para atividades recentes (apenas registro no app)
  console.log("✅ Notificação de atividade criada (membro adicionado) - sem push");
  return notificationRef.id;
}

/**
 * Cria notificação quando um grupo é criado (atividade recente, sem necessidade de ação)
 * Esta notificação serve como registro de atividade e NÃO envia push notification
 */
export async function createGroupCreatedNotification(
  userId: string,
  groupId: string,
  groupName: string
): Promise<string> {
  // Notificação de atividade - já marcada como lida, não precisa de ação
  const notificationsRef = collection(db, "notifications");
  const notificationRef = doc(notificationsRef);
  const now = Timestamp.now();

  await setDoc(notificationRef, {
    id: notificationRef.id,
    userId,
    type: "GROUP_CREATED",
    status: "READ", // Já marcado como lido (apenas atividade recente, não requer ação)
    title: "Grupo criado",
    message: `Você criou o grupo "${groupName}"`,
    groupId,
    createdAt: now,
    readAt: now,
  });

  // NÃO envia push notification para atividades recentes (apenas registro no app)
  console.log("✅ Notificação de atividade criada (grupo criado) - sem push");
  return notificationRef.id;
}

/**
 * Cria notificação de pagamento pendente de confirmação
 */
export async function createPaymentNotification(
  expenseCreatorId: string,
  paymentId: string,
  expenseId: string,
  groupId: string,
  payerName: string,
  amount: number,
  expenseDescription: string
): Promise<string | null> {
  return await createNotification({
    userId: expenseCreatorId,
    type: "PAYMENT_PENDING_CONFIRMATION",
    status: "UNREAD",
    title: "Pagamento pendente de confirmação",
    message: `${payerName} pagou ${amount.toFixed(2)}€ da despesa "${expenseDescription}". Confirme o pagamento.`,
    groupId,
    expenseId,
    paymentId,
  });
}

/**
 * Cria notificação quando usuário paga uma despesa (atividade recente, sem necessidade de ação)
 * Esta notificação serve como registro de atividade e NÃO envia push notification
 */
export async function createPaymentMadeNotification(
  payerId: string,
  expenseId: string,
  groupId: string,
  amount: number,
  expenseDescription: string
): Promise<string> {
  const notificationsRef = collection(db, "notifications");
  const notificationRef = doc(notificationsRef);
  const now = Timestamp.now();

  await setDoc(notificationRef, {
    id: notificationRef.id,
    userId: payerId,
    type: "PAYMENT_RECEIVED", // Tipo de atividade (registro de pagamento feito)
    status: "READ", // Já marcado como lido (apenas atividade recente, não requer ação)
    title: "Pagamento registrado",
    message: `Você pagou ${amount.toFixed(2)}€ da despesa "${expenseDescription}"`,
    groupId,
    expenseId,
    createdAt: now,
    readAt: now,
  });

  // NÃO envia push notification para atividades recentes (apenas registro no app)
  console.log("✅ Notificação de atividade criada (pagamento registrado) - sem push");
  return notificationRef.id;
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
 * Observa notificações de um usuário em tempo real (apenas não arquivadas)
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

    // Filtrar notificações arquivadas
    const notArchived = notifications.filter(n => n.status !== "ARCHIVED");

    // Ordenar em memória por data
    const sorted = notArchived.sort((a, b) => {
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

/**
 * Arquiva uma notificação (oculta após ação concluída)
 */
export async function archiveNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, {
    status: "ARCHIVED",
  });
}

