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
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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

  // Carregar amigos e solicitações
  useEffect(() => {
    if (!user) return;
    loadFriends();
    loadPendingRequests();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const friends = await getUserFriends(user.uid);
      const amigosData: Amigo[] = [];

      for (const friend of friends) {
        const friendUser = await getUserFromFirestore(friend.friendId);
        if (friendUser) {
          amigosData.push({
            id: friend.friendId,
            primeiroNome: friendUser.name?.split(' ')[0] || 'Usuário',
            apelido: friendUser.name?.split(' ').slice(1).join(' ') || '',
            nickname: friendUser.nickname || '',
            email: friendUser.email,
            telefone: friendUser.phone || '',
            estado: 'ativo',
            avatar: friendUser.avatar || 'https://i.pravatar.cc/150?img=' + friend.friendId.charCodeAt(0) % 10,
          });
        }
      }
      setAmigos(amigosData);
    } catch (error) {
      console.error("Erro ao carregar amigos:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    try {
      const requests = await getPendingFriendRequests(user.uid);
      const requestsData: Amigo[] = [];

      for (const request of requests) {
        const fromUser = await getUserFromFirestore(request.fromUserId);
        if (fromUser) {
          requestsData.push({
            id: request.fromUserId,
            primeiroNome: fromUser.name?.split(' ')[0] || 'Usuário',
            apelido: fromUser.name?.split(' ').slice(1).join(' ') || '',
            nickname: fromUser.nickname || '',
            email: fromUser.email,
            telefone: fromUser.phone || '',
            estado: 'pendente',
            avatar: fromUser.avatar || 'https://i.pravatar.cc/150?img=' + request.fromUserId.charCodeAt(0) % 10,
            requestId: request.id,
          });
        }
      }
      setSolicitacoesPendentes(requestsData);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  };

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
      await loadFriends();
      await loadPendingRequests();
    } catch (error: any) {
      // Se o erro for sobre solicitação já processada mas já são amigos, mostrar mensagem positiva
      if (error.message && error.message.includes("já foi processada")) {
        Alert.alert("Info", "Vocês já são amigos!");
        await loadFriends();
        await loadPendingRequests();
      } else if (error.message && error.message.includes("rejeitada")) {
        Alert.alert("Info", "Esta solicitação já foi rejeitada anteriormente");
        await loadPendingRequests();
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
              await loadPendingRequests();
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

  // Combinar amigos e solicitações pendentes
  const todosAmigos = useMemo(() => {
    return [...amigos, ...solicitacoesPendentes];
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
        <InputLupa
          placeholder="Digite o email do amigo"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          style={[
            styles.emailInput,
            { borderColor: corBorda, borderWidth: 1, borderRadius: 5 },
          ]}
        />
        {erro ? <Text style={styles.erroText}>{erro || ""}</Text> : null}
        {sucesso ? <Text style={styles.sucessoText}>{sucesso || ""}</Text> : null}
        <Button
          title={loading ? "Enviando..." : "Enviar Convite"}
          style={styles.sendButton}
          onPress={handleEnviarConvite}
          disabled={loading}
        />
      </View>

      {/* Filtro */}
      <View style={styles.filterSection}>
        <InputLupa
          placeholder="Pesquisar amigos..."
          value={filtro}
          onChangeText={setFiltro}
          style={styles.searchInput}
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
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <Text style={modalStyles.title}>Perfil do Amigo</Text>
              <View style={modalStyles.divider} />
            </View>

            <View style={modalStyles.card}>
              <Avatar.Image size={100} source={{ uri: SelectedAmigo.avatar }} style={modalStyles.avatar} />

              <Row icon={<MaterialCommunityIcons name="account-outline" size={20} color="#111827" />} label="Nome" value={`${SelectedAmigo.primeiroNome} ${SelectedAmigo.apelido}`} />
              <Row icon={<MaterialCommunityIcons name="account-circle-outline" size={20} color="#111827" />} label="Nickname" value={SelectedAmigo.nickname} />
              <Row icon={<MaterialCommunityIcons name="email-outline" size={20} color="#111827" />} label="Email" value={SelectedAmigo.email} />
              <Row icon={<MaterialCommunityIcons name="phone-outline" size={20} color="#111827" />} label="Telefone" value={SelectedAmigo.telefone} />
              <Row icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color="#111827" />} label="Estado" value={SelectedAmigo.estado.toUpperCase()} />
            </View>

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
                            await loadFriends();
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
                style={[modalStyles.closeButton, { backgroundColor: "#E11D48", marginTop: 10 }]}
              >
                <Text style={modalStyles.closeText}>Remover Amigo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={fecharDetalhes} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeText}>Fechar</Text>
            </TouchableOpacity>
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
  topSection: {
    marginBottom: 16,
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
  erroText: { color: "red", marginTop: 5, fontSize: 12 },
  sucessoText: { color: "green", marginTop: 5, fontSize: 12 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center", marginTop: 4, marginBottom: 10 },
  divider: { height: 1, backgroundColor: "#D1D5DB", opacity: 0.7 },
  card: { backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16, paddingHorizontal: 6, paddingVertical: 6, 
      borderWidth: 1, borderColor: "#D1D5DB", marginTop: 10 },

  avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: "center", marginBottom: 16 },
  
  closeButton: { marginTop: 20, alignSelf: "center", paddingVertical: 8, paddingHorizontal: 16, 
    backgroundColor: "#334B34", borderRadius: 8 },

  closeText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
