import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity, Alert, ActivityIndicator, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import FlatListAmigos, { Amigo } from "@/components/FlatListAmigos";
import InputLupa from "@/components/InputLupa";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Avatar } from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/firebase/config";
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getUserFriends, getPendingFriendRequests, removeFriend } from "@/firebase/friend";
import { createFriendRequestNotification } from "@/firebase/notification";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { getUserFromFirestore } from "@/services/user";
import colors from "@/theme/colors";

interface AmigosProps {
  navigation: any;
}

export default function Amigos({ navigation }: AmigosProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(false);
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [SelectedAmigo, setSelectedAmigo] = useState<Amigo | null>(null);

  // Carregar amigos e solicitações com listeners em tempo real
  useEffect(() => {
    if (!user) return;

    // Listener para amigos
    const friendsRef = collection(db, "friends");
    const friendsQuery = query(
      friendsRef,
      where("userId", "==", user.uid),
      where("status", "==", "ACCEPTED")
    );

    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const amigosData: Amigo[] = [];

      for (const friendDoc of snapshot.docs) {
        const friend = friendDoc.data();
        const friendUser = await getUserFromFirestore(friend.friendId);
        if (friendUser) {
          amigosData.push({
            id: friend.friendId,
            primeiroNome: friendUser.name?.split(' ')[0] || 'Usuário',
            apelido: friendUser.name?.split(' ').slice(1).join(' ') || '',
            nickname: friendUser.nickname || '',
            email: friendUser.email || '',
            telefone: friendUser.phone || '',
            estado: 'ativo',
            avatar: friendUser.avatar || 'https://i.pravatar.cc/150?img=' + friend.friendId.charCodeAt(0) % 10,
          });
        }
      }
      setAmigos(amigosData);
      setLoadingFriends(false);
    });

    // Listener para solicitações pendentes
    const requestsRef = collection(db, "friendRequests");
    const requestsQuery = query(
      requestsRef,
      where("toUserId", "==", user.uid),
      where("status", "==", "PENDING")
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsData: Amigo[] = [];

      for (const requestDoc of snapshot.docs) {
        const request = requestDoc.data();
        const fromUser = await getUserFromFirestore(request.fromUserId);
        if (fromUser) {
          requestsData.push({
            id: request.fromUserId,
            primeiroNome: fromUser.name?.split(' ')[0] || 'Usuário',
            apelido: fromUser.name?.split(' ').slice(1).join(' ') || '',
            nickname: fromUser.nickname || '',
            email: fromUser.email || '',
            telefone: fromUser.phone || '',
            estado: 'pendente',
            avatar: fromUser.avatar || 'https://i.pravatar.cc/150?img=' + request.fromUserId.charCodeAt(0) % 10,
            requestId: requestDoc.id,
          });
        }
      }
      setSolicitacoesPendentes(requestsData);
    });

    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [user]);

  const abrirDetalhes = (amigo: Amigo) => {
    setSelectedAmigo(amigo);
    setModalVisible(true);
  };

  const fecharDetalhes = () => {
    setSelectedAmigo(null);
    setModalVisible(false);
  };

  const handleAdicionarPendente = async (amigo: Amigo) => {
    if (!amigo.requestId) return;
    setLoading(true);
    try {
      await acceptFriendRequest(amigo.requestId);
      Alert.alert("Sucesso", `${amigo.primeiroNome} ${amigo.apelido} foi adicionado como amigo!`);
      // Listeners atualizarão automaticamente
    } catch (error: any) {
      // Se o erro for sobre solicitação já processada mas já são amigos, mostrar mensagem positiva
      if (error.message && error.message.includes("já foi processada")) {
        Alert.alert("Info", "Vocês já são amigos!");
      } else if (error.message && error.message.includes("rejeitada")) {
        Alert.alert("Info", "Esta solicitação já foi rejeitada anteriormente");
      } else {
        Alert.alert("Erro", error.message || "Não foi possível aceitar o convite");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverPendente = async (amigo: Amigo) => {
    if (!amigo.requestId) return;
    Alert.alert(
      "Rejeitar convite",
      `Tem certeza que deseja rejeitar o convite de ${amigo.primeiroNome} ${amigo.apelido}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await rejectFriendRequest(amigo.requestId!);
              // Listener atualizará automaticamente
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível rejeitar o convite");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const validarEmail = (email: string): string => {
    const regex = /^[^@\s]+@([^@\s]+\.)+.+$/;
    if (!regex.test(email.trim())) return "Formato de e-mail inválido. Ex: utilizador@edu.pt";
    return "";
  };

  const handleEnviarConvite = async (): Promise<void> => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado");
      return;
    }

    const erroMsg = validarEmail(email);
    if (erroMsg) {
      setErro(erroMsg);
      setSucesso("");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      await sendFriendRequest(user.uid, email.trim());

      // Buscar o usuário para criar notificação
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const toUser = snapshot.docs[0];
        const toUserId = toUser.id;

        // Buscar a solicitação criada
        const requestsRef = collection(db, "friendRequests");
        const requestQuery = query(
          requestsRef,
          where("fromUserId", "==", user.uid),
          where("toUserId", "==", toUserId)
        );
        const requestSnapshot = await getDocs(requestQuery);

        if (!requestSnapshot.empty) {
          const requestId = requestSnapshot.docs[0].id;
          const fromUser = await getUserFromFirestore(user.uid);
          await createFriendRequestNotification(
            toUserId,
            user.uid,
            requestId,
            fromUser?.name || user.email
          );
        }
      }

      setSucesso(`Convite enviado com sucesso para ${email}`);
      setEmail("");
    } catch (error: any) {
      setErro(error.message || "Não foi possível enviar o convite");
    } finally {
      setLoading(false);
    }
  };

  const corBorda = erro ? "red" : sucesso ? "green" : "#ccc";

  // Combinar amigos e solicitações pendentes, removendo duplicatas
  // Se alguém já é amigo, não deve aparecer nas solicitações pendentes
  const todosAmigos = useMemo(() => {
    const amigosIds = new Set(amigos.map(a => a.id));
    // Filtrar solicitações pendentes que já são amigos
    const solicitacoesFiltradas = solicitacoesPendentes.filter(
      solicitacao => !amigosIds.has(solicitacao.id)
    );
    return [...amigos, ...solicitacoesFiltradas];
  }, [amigos, solicitacoesPendentes]);

  const amigosFiltrados = useMemo(() => {
    const termo = filtro.toLowerCase();
    return todosAmigos.filter((a) =>
      a.primeiroNome.toLowerCase().includes(termo) ||
      a.apelido.toLowerCase().includes(termo) ||
      a.nickname.toLowerCase().includes(termo) ||
      a.email.toLowerCase().includes(termo)
    );
  }, [todosAmigos, filtro]);

  if (loadingFriends) {
    return (
      <View style={[styles.window, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.window}>
      {/* Input email */}
      <View style={styles.topSection}>
        <Text style={styles.sectionTitle}>Adicionar Amigo</Text>
        <InputLupa
          placeholder="Digite o email do amigo"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {erro ? <Text style={styles.erroText}>{erro}</Text> : null}
        {sucesso ? <Text style={styles.sucessoText}>{sucesso}</Text> : null}
        <Button
          title={loading ? "Enviando..." : "Enviar Convite"}
          style={styles.sendButton}
          onPress={handleEnviarConvite}
          disabled={loading}
        />
      </View>

      {/* Filtro */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Meus Amigos</Text>
        <InputLupa
          placeholder="Pesquisar amigos..."
          value={filtro}
          onChangeText={setFiltro}
        />
      </View>

      {/* Lista */}
      <View style={styles.listContainer}>
        {loadingFriends ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={amigosFiltrados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <FriendItem
                item={item}
                onPress={() => abrirDetalhes(item)}
                onAdicionarPendente={handleAdicionarPendente}
                onRemoverPendente={handleRemoverPendente}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum amigo encontrado</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal */}
      {SelectedAmigo && (
        <Modal visible={modalVisible} animationType="slide" onRequestClose={fecharDetalhes}>
          <SafeAreaView style={modalStyles.container} edges={['top']}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Perfil do Amigo</Text>
              <TouchableOpacity onPress={fecharDetalhes} style={modalStyles.closeIcon}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.divider} />

            <View style={modalStyles.card}>
              <Avatar.Image size={100} source={{ uri: SelectedAmigo.avatar }} style={modalStyles.avatar} />

              <View style={modalStyles.infoSection}>
                <Row
                  icon={<MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />}
                  label="Nome"
                  value={`${SelectedAmigo.primeiroNome} ${SelectedAmigo.apelido}`.trim() || "Sem nome"}
                />
                {SelectedAmigo.nickname ? (
                  <Row
                    icon={<MaterialCommunityIcons name="account-circle-outline" size={20} color={colors.primary} />}
                    label="Nickname"
                    value={SelectedAmigo.nickname}
                  />
                ) : null}
                <Row
                  icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />}
                  label="Email"
                  value={SelectedAmigo.email || "Sem email"}
                />
                {SelectedAmigo.telefone ? (
                  <Row
                    icon={<MaterialCommunityIcons name="phone-outline" size={20} color={colors.primary} />}
                    label="Telefone"
                    value={SelectedAmigo.telefone}
                  />
                ) : null}
                <Row
                  icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color={SelectedAmigo.estado === 'ativo' ? "#10B981" : "#F59E0B"} />}
                  label="Estado"
                  value={SelectedAmigo.estado === 'ativo' ? "ATIVO" : "PENDENTE"}
                />
              </View>
            </View>

            <View style={modalStyles.actions}>
              {SelectedAmigo.estado === 'ativo' && (
                <TouchableOpacity
                  onPress={async () => {
                    Alert.alert(
                      "Remover amigo",
                      `Tem certeza que deseja remover ${SelectedAmigo.primeiroNome} ${SelectedAmigo.apelido} dos seus amigos?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Remover",
                          style: "destructive",
                          onPress: async () => {
                            if (!user) return;
                            setLoading(true);
                            try {
                              await removeFriend(user.uid, SelectedAmigo.id);
                              Alert.alert("Sucesso", "Amigo removido com sucesso!");
                              // Listener atualizará automaticamente
                              fecharDetalhes();
                            } catch (error: any) {
                              Alert.alert("Erro", error.message || "Não foi possível remover o amigo");
                            } finally {
                              setLoading(false);
                            }
                          },
                        },
                      ]
                    );
                  }}
                  style={modalStyles.removeButton}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="account-remove" size={20} color="#fff" />
                  <Text style={modalStyles.buttonText}>Remover Amigo</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={fecharDetalhes} style={modalStyles.closeButton} disabled={loading}>
                <Text style={modalStyles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

/* Componente Row */
function Row({
  icon,
  label,
  value,
  right,
  chevron,
  onPress,
  labelStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  labelStyle?: object;
}) {
  const Content = (
    <View style={rowStyles.inner}>
      <View style={rowStyles.left}>
        <View style={rowStyles.iconWrap}>{icon}</View>
        <Text style={[rowStyles.label, labelStyle]}>{label}</Text>
      </View>

      <View style={rowStyles.right}>
        {value ? <Text style={rowStyles.value}>{value}</Text> : null}
        {right}
        {chevron ? (
          <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" style={{ marginLeft: 6 }} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={rowStyles.row}>{Content}</TouchableOpacity>;
  return <View style={rowStyles.row}>{Content}</View>;
}

const rowStyles = StyleSheet.create({
  row: { paddingHorizontal: 10, minHeight: 56, justifyContent: "center" },
  inner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#EEF2F6", alignItems: "center", justifyContent: "center", marginRight: 10 },
  label: { fontSize: 16, color: "#111827" },
  right: { flexDirection: "row", alignItems: "center" },
  value: { color: "#6B7280" },
});

function FriendItem({
  item,
  onPress,
  onAdicionarPendente,
  onRemoverPendente
}: {
  item: Amigo;
  onPress: () => void;
  onAdicionarPendente?: (amigo: Amigo) => void;
  onRemoverPendente?: (amigo: Amigo) => void;
}) {
  const nomeCompleto = `${item.primeiroNome} ${item.apelido}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.friendCard}
      onPress={onPress}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={styles.friendName}>{nomeCompleto}</Text>
        {item.estado === 'ativo' ? (
          <Text style={styles.friendStatus}>ATIVO</Text>
        ) : (
          <View style={styles.pendingActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onAdicionarPendente?.(item)}
            >
              <Text style={styles.actionButtonText}>Aceitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onRemoverPendente?.(item)}
            >
              <Text style={styles.actionButtonText}>Rejeitar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  window: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 12,
  },
  topSection: {
    marginBottom: 20,
  },
  emailInput: {
    width: "100%",
    marginBottom: 8,
  },
  sendButton: {
    marginTop: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  searchInput: {
    width: "100%",
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 16,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  friendStatus: {
    color: "#10B981",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#E11D48",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  erroText: {
    color: "#E11D48",
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
  },
  sucessoText: {
    color: "#10B981",
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
  },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  closeIcon: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  avatar: {
    alignSelf: "center",
    marginBottom: 20,
  },
  infoSection: {
    paddingHorizontal: 10,
  },
  actions: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#E11D48",
    borderRadius: 12,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
