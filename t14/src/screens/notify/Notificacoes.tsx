import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import {
  observeUserNotifications,
  markNotificationAsRead,
  getUserNotifications,
  deleteNotification,
  Notification,
} from "@/firebase/notification";
import { approveExpense, rejectExpense } from "@/firebase/expense";
import { acceptFriendRequest, rejectFriendRequest } from "@/firebase/friend";
import { confirmPayment, rejectPayment } from "@/firebase/pagamento";

export default function Notificacoes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Observar notificações em tempo real
    const unsubscribe = observeUserNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleNotificationPress = async (notification: Notification) => {
    if (notification.status === "UNREAD") {
      await markNotificationAsRead(notification.id);
    }
  };

  const handleApproveExpense = async (notification: Notification) => {
    if (!notification.expenseId || !notification.groupId) return;

    Alert.alert(
      "Aprovar despesa",
      notification.message,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectExpense(notification.expenseId!, user!.uid);
              await deleteNotification(notification.id, user!.uid);
              Alert.alert("Sucesso", "Despesa rejeitada");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível rejeitar a despesa");
            }
          },
        },
        {
          text: "Aprovar",
          onPress: async () => {
            try {
              await approveExpense(notification.expenseId!, user!.uid, notification.groupId!);
              // Deletar a notificação de aprovação pendente após aprovar
              await deleteNotification(notification.id, user!.uid);
              Alert.alert("Sucesso", "Despesa aprovada e adicionada ao grupo!");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível aprovar a despesa");
            }
          },
        },
      ]
    );
  };

  const handlePaymentConfirmation = async (notification: Notification, confirm: boolean) => {
    if (!notification.paymentId || !notification.expenseId || !notification.groupId || !user) return;

    try {
      if (confirm) {
        await confirmPayment(notification.paymentId, user.uid, notification.expenseId, notification.groupId);
        await deleteNotification(notification.id, user.uid);
        Alert.alert("Sucesso", "Pagamento confirmado!");
      } else {
        await rejectPayment(notification.paymentId, user.uid);
        await deleteNotification(notification.id, user.uid);
        Alert.alert("Sucesso", "Pagamento rejeitado");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível processar o pagamento");
    }
  };

  const handleFriendRequest = async (notification: Notification, accept: boolean) => {
    if (!notification.friendRequestId || !user) return;

    try {
      if (accept) {
        await acceptFriendRequest(notification.friendRequestId);
        // Deletar a notificação ao aceitar
        await deleteNotification(notification.id, user.uid);
        Alert.alert("Sucesso", "Convite de amizade aceito!");
      } else {
        await rejectFriendRequest(notification.friendRequestId);
        await deleteNotification(notification.id, user.uid);
        Alert.alert("Sucesso", "Convite de amizade rejeitado");
      }
    } catch (error: any) {
      // Se o erro for sobre solicitação já processada mas já são amigos, deletar notificação e mostrar mensagem positiva
      if (error.message && error.message.includes("já foi processada")) {
        try {
          await deleteNotification(notification.id, user.uid);
        } catch (deleteError) {
          console.error("Erro ao deletar notificação:", deleteError);
        }
        Alert.alert("Info", "Vocês já são amigos!");
      } else if (error.message && error.message.includes("rejeitada")) {
        Alert.alert("Info", "Esta solicitação já foi rejeitada anteriormente");
        try {
          await deleteNotification(notification.id, user.uid);
        } catch (deleteError) {
          console.error("Erro ao deletar notificação:", deleteError);
        }
      } else {
        Alert.alert("Erro", error.message || "Não foi possível processar o convite");
      }
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Agora";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return date.toLocaleDateString("pt-PT");
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "EXPENSE_PENDING_APPROVAL":
        return "time-outline";
      case "EXPENSE_APPROVED":
        return "checkmark-circle-outline";
      case "EXPENSE_REJECTED":
        return "close-circle-outline";
      case "FRIEND_REQUEST":
        return "person-add-outline";
      case "MEMBER_ADDED":
        return "people-outline";
      case "PAYMENT_RECEIVED":
        return "cash-outline";
      case "PAYMENT_PENDING_CONFIRMATION":
        return "cash-outline";
      default:
        return "notifications-outline";
    }
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Atividade recente</Text>

      {notifications.length === 0 ? (
        <View style={s.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.border} />
          <Text style={s.emptyText}>Nenhuma notificação</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={handleNotificationPress}
              onApproveExpense={handleApproveExpense}
              onFriendRequest={handleFriendRequest}
              onPaymentConfirmation={handlePaymentConfirmation}
              formatTime={formatTime}
              getIcon={getNotificationIcon}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

type NotificationItemProps = {
  item: Notification;
  onPress: (notification: Notification) => void;
  onApproveExpense: (notification: Notification) => void;
  onFriendRequest: (notification: Notification, accept: boolean) => void;
  onPaymentConfirmation: (notification: Notification, confirm: boolean) => void;
  formatTime: (timestamp: any) => string;
  getIcon: (type: Notification["type"]) => string;
};

function NotificationItem({
  item,
  onPress,
  onApproveExpense,
  onFriendRequest,
  onPaymentConfirmation,
  formatTime,
  getIcon,
}: NotificationItemProps) {
  const isUnread = item.status === "UNREAD";
  const isExpensePending = item.type === "EXPENSE_PENDING_APPROVAL";
  const isFriendRequest = item.type === "FRIEND_REQUEST";
  const isPaymentPending = item.type === "PAYMENT_PENDING_CONFIRMATION";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[s.activityCard, isUnread && s.unreadCard]}
      onPress={() => onPress(item)}
    >
      <View style={[s.avatar, isUnread && s.unreadAvatar]}>
        <Ionicons name={getIcon(item.type) as any} size={20} color={isUnread ? colors.primary : colors.textDark} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[s.activityTitle, isUnread && s.unreadTitle]}>
          {item.title}
        </Text>

        <Text style={s.activitySub}>{formatTime(item.createdAt)}</Text>

        <Text style={s.activityBody}>{item.message}</Text>

        {/* Botões de ação para despesas pendentes */}
        {isExpensePending && (
          <View style={s.actionButtons}>
            <TouchableOpacity
              style={[s.actionButton, s.rejectButton]}
              onPress={() => onApproveExpense(item)}
            >
              <Text style={s.actionButtonText}>Rejeitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionButton, s.approveButton]}
              onPress={() => onApproveExpense(item)}
            >
              <Text style={[s.actionButtonText, { color: "#fff" }]}>Aprovar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botões de ação para convites de amizade */}
        {isFriendRequest && (
          <View style={s.actionButtons}>
            <TouchableOpacity
              style={[s.actionButton, s.rejectButton]}
              onPress={() => onFriendRequest(item, false)}
            >
              <Text style={s.actionButtonText}>Rejeitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionButton, s.approveButton]}
              onPress={() => onFriendRequest(item, true)}
            >
              <Text style={[s.actionButtonText, { color: "#fff" }]}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botões de ação para pagamentos pendentes */}
        {isPaymentPending && (
          <View style={s.actionButtons}>
            <TouchableOpacity
              style={[s.actionButton, s.rejectButton]}
              onPress={() => onPaymentConfirmation(item, false)}
            >
              <Text style={s.actionButtonText}>Rejeitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionButton, s.approveButton]}
              onPress={() => onPaymentConfirmation(item, true)}
            >
              <Text style={[s.actionButtonText, { color: "#fff" }]}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isUnread && <View style={s.unreadDot} />}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 12,
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.label,
    marginTop: 16,
    fontSize: 16,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    position: "relative",
  },
  unreadCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: "#F0F9F4",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F2EAD9",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadAvatar: {
    backgroundColor: "#E8F5E9",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  unreadTitle: {
    fontWeight: "900",
  },
  activitySub: {
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 4,
    fontSize: 12,
  },
  activityBody: {
    color: colors.textDark,
    fontSize: 14,
    marginTop: 4,
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
  rejectButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    color: colors.textDark,
    fontWeight: "600",
    fontSize: 14,
  },
});
