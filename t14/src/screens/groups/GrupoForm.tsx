// src/screens/GrupoForm.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Input from "@/components/Input";
import InputLupa from "@/components/InputLupa";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { createGroupInFirestore, updateGroup, deleteGroup } from "@/firebase/group";
import { auth, db } from "@/firebase/config";
import { getAllUsers } from "@/firebase/user";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type FirebaseUserItem = {
  id: string;
  email?: string;
  name?: string;
  [k: string]: any;
};

export default function GrupoForm({ route, navigation }: any) {
  const { user } = useAuth();
  const [nomeGrupo, setNomeGrupo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [allUsers, setAllUsers] = useState<FirebaseUserItem[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // emails
  const [openSelect, setOpenSelect] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false); // Novo estado
  const [searchQuery, setSearchQuery] = useState<string>(""); // Pesquisa no modal
  const { modo, grupo } = route.params || {};

  useEffect(() => {
    if (modo === "editar" && grupo) {
      setNomeGrupo(grupo?.name || grupo?.title || "");
      setDescricao(grupo?.description || grupo?.descricao || "");
    }
  }, [modo, grupo]);

  useEffect(() => {
    navigation.setOptions({
      title: modo === "editar" ? "Editar grupo" : "Novo grupo",
    });
  }, [navigation, modo]);

  useEffect(() => {
    // carrega todos os users (id + email)
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        console.log('🔍 Carregando usuários...');
        const users = await getAllUsers();
        console.log('✅ Usuários carregados:', users.length);
        console.log('📋 Usuários:', users);
        setAllUsers(users);
      } catch (err: any) {
        console.error("❌ Erro ao carregar users:", err);
        Alert.alert("Erro", "Não foi possível carregar a lista de usuários");
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const toggleSelectEmail = (email: string) => {
    setSelectedMembers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  // Filtrar usuários pela pesquisa e remover o próprio usuário
  const filteredUsers = useMemo(() => {
    console.log('🔄 Filtrando usuários...');
    console.log('Total de usuários:', allUsers.length);
    console.log('Email do usuário logado:', user?.email);

    // Remover o próprio usuário da lista
    const usersWithoutSelf = allUsers.filter((u) => u.email !== user?.email);
    console.log('Usuários sem o próprio:', usersWithoutSelf.length);

    // Se não há pesquisa, retornar todos (exceto o próprio)
    if (!searchQuery.trim()) {
      console.log('✅ Sem pesquisa, retornando todos:', usersWithoutSelf.length);
      return usersWithoutSelf;
    }

    // Aplicar filtro de pesquisa
    const query = searchQuery.toLowerCase();
    const filtered = usersWithoutSelf.filter((u) => {
      const email = u.email?.toLowerCase() || "";
      const name = u.name?.toLowerCase() || "";
      return email.includes(query) || name.includes(query);
    });
    console.log('🔍 Com pesquisa "' + query + '", encontrados:', filtered.length);
    return filtered;
  }, [allUsers, searchQuery, user?.email]);

  const handleUpdateGroup = async () => {
    if (!user || !grupo) {
      Alert.alert("Erro", "Você precisa estar logado e o grupo deve existir.");
      return;
    }

    // Verificar se é o dono
    if (grupo.ownerId !== user.uid) {
      Alert.alert("Erro", "Apenas o dono do grupo pode editar.");
      return;
    }

    if (!nomeGrupo || !nomeGrupo.trim()) {
      Alert.alert("Erro", "O nome do grupo é obrigatório.");
      return;
    }

    try {
      setLoadingCreate(true);

      await updateGroup(grupo.id, {
        name: nomeGrupo.trim(),
        description: descricao?.trim() || "",
      }, user.uid);

      Alert.alert("Sucesso", "Grupo atualizado com sucesso!");
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro ao atualizar grupo:", error);
      Alert.alert("Erro", error?.message || "Não foi possível atualizar o grupo");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!user || !grupo) {
      Alert.alert("Erro", "Você precisa estar logado e o grupo deve existir.");
      return;
    }

    // Verificar se é o dono
    if (grupo.ownerId !== user.uid) {
      Alert.alert("Erro", "Apenas o dono do grupo pode excluir.");
      return;
    }

    Alert.alert(
      "Excluir grupo",
      "Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingDelete(true);
              await deleteGroup(grupo.id, user.uid);
              Alert.alert("Sucesso", "Grupo excluído com sucesso!");
              navigation.goBack();
            } catch (error: any) {
              console.error("Erro ao excluir grupo:", error);
              Alert.alert("Erro", error?.message || "Não foi possível excluir o grupo");
            } finally {
              setLoadingDelete(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    try {
      if (!nomeGrupo || !nomeGrupo.trim()) {
        Alert.alert("Erro", "O nome do grupo é obrigatório.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erro", "Você precisa estar logado.");
        return;
      }

      setLoadingCreate(true);

      // 1) cria o grupo básico (owner já vira membro OWNER)
      const groupId = await createGroupInFirestore({
        name: nomeGrupo.trim(),
        description: descricao?.trim() || "",
        currency: "EUR",
        ownerId: user.uid,
      });

      // 2) se houver membros selecionados, converte emails -> ids e atualiza o doc do grupo
      if (selectedMembers.length > 0) {
        // map email -> id (somente emails encontrados)
        const emailToIdMap = new Map<string, string>();
        allUsers.forEach((u) => {
          if (u.email) emailToIdMap.set(u.email.toLowerCase(), u.id);
        });

        const memberIdsFromEmails: string[] = [];
        selectedMembers.forEach((email) => {
          const id = emailToIdMap.get((email || "").toLowerCase());
          if (id && id !== user.uid) memberIdsFromEmails.push(id);
        });

        // se não encontrou nenhum id, ignora
        if (memberIdsFromEmails.length > 0) {
          // prepara estruturas members e balances (mantendo o owner já existente)
          const now = Timestamp.now();

          const membersUpdate: Record<string, any> = {};
          const balancesUpdate: Record<string, number> = {};
          const memberIdsUpdate: string[] = []; // somente os novos + owner será mantido pelo createGroup

          memberIdsFromEmails.forEach((id) => {
            membersUpdate[id] = {
              role: "MEMBER",
              status: "ATIVO",
              joinedAt: now,
            };
            balancesUpdate[id] = 0;
            memberIdsUpdate.push(id);
          });

          // Atualiza o documento do grupo (merge via updateDoc)
          const groupRef = doc(db, "group", groupId);

          await updateDoc(groupRef, {
            // concatena memberIds: aqui usamos arrayUnion seria melhor, mas o SDK modular não exporta arrayUnion direto aqui;
            // portanto pegamos que o createGroupInFirestore já criou memberIds = [ownerId], nós substituiremos por owner + novos
            memberIds: [...(memberIdsFromEmails ? [user.uid, ...memberIdsFromEmails] : [user.uid])],
            members: {
              // isso sobrescreve a chave members (merge parcial)
              ...membersUpdate,
            },
            balances: {
              ...balancesUpdate,
              // o owner já tem 0 criado inicialmente pelo createGroupInFirestore
            },
            lastActivityAt: now,
            updatedAt: now,
          });
        }
      }

      Alert.alert("Sucesso", "Grupo criado com sucesso!");
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro criar grupo:", error);
      Alert.alert("Erro ao criar grupo", error?.message || String(error));
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <View style={s.container}>
      <Input
        label="Nome do grupo"
        placeholder="ex: Viagem para Madrid"
        value={nomeGrupo}
        onChangeText={setNomeGrupo}
        style={s.input}
      />

      <Input
        label="Descrição (opcional)"
        placeholder="ex: Viagem de outubro de 2025"
        value={descricao}
        onChangeText={setDescricao}
        style={s.input}
      />

      {/* campo de seleção - OCULTO TEMPORARIAMENTE */}
      {/* {modo !== "editar" && (
        <View style={{ marginBottom: 12 }}>
          <Button title="Selecionar membros" onPress={() => setOpenSelect(true)} />
          {selectedMembers.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {selectedMembers.map((email) => (
                <Text key={email} style={{ color: "white" }}>
                  • {email}
                </Text>
              ))}
            </View>
          )}
        </View>
      )} */}

      <Button
        title={modo === "editar" ? (loadingCreate ? "Salvando..." : "Salvar alterações") : (loadingCreate ? "Criando..." : "Criar grupo")}
        onPress={() => {
          if (modo === "editar") {
            handleUpdateGroup();
          } else {
            handleCreateGroup();
          }
        }}
        disabled={loadingCreate || loadingDelete}
      />

      {modo === "editar" && grupo && user && grupo.ownerId === user.uid && (
        <Button
          title={loadingDelete ? "Excluindo..." : "Excluir grupo"}
          style={s.botaoApagar}
          onPress={handleDeleteGroup}
          disabled={loadingCreate || loadingDelete}
        />
      )}

      {/* Modal de seleção */}
      <Modal visible={openSelect} animationType="slide" transparent onRequestClose={() => setOpenSelect(false)}>
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalContainer} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={s.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>Selecionar Membros</Text>
                <Text style={s.modalSubtitle}>
                  {loadingUsers
                    ? "Carregando..."
                    : `${filteredUsers.length} usuário${filteredUsers.length !== 1 ? 's' : ''} disponível${filteredUsers.length !== 1 ? 'eis' : ''}`
                  }
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                console.log('🔍 Debug - Total usuarios:', allUsers.length);
                console.log('🔍 Debug - Filtrados:', filteredUsers.length);
                console.log('🔍 Debug - Loading:', loadingUsers);
                setSearchQuery("");
                setOpenSelect(false);
              }} style={s.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Input de pesquisa */}
            <View style={s.searchContainer}>
              <InputLupa
                placeholder="Buscar por email ou nome..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Membros selecionados */}
            {selectedMembers.length > 0 && (
              <View style={s.selectedSection}>
                <Text style={s.selectedTitle}>
                  {selectedMembers.length} membro{selectedMembers.length !== 1 ? 's' : ''} selecionado{selectedMembers.length !== 1 ? 's' : ''}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.selectedScroll}>
                  {selectedMembers.map((email) => (
                    <View key={email} style={s.selectedChip}>
                      <Text style={s.selectedChipText} numberOfLines={1}>
                        {email.split('@')[0]}
                      </Text>
                      <TouchableOpacity onPress={() => toggleSelectEmail(email)}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Lista de usuários */}
            <View style={s.userListContainer}>
              {loadingUsers || allUsers.length === 0 ? (
                <View style={s.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={s.loadingText}>Carregando usuários...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={s.emptyContainer}>
                  <MaterialCommunityIcons name="account-search" size={48} color="#9CA3AF" />
                  <Text style={s.emptyText}>
                    {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const email = item.email ?? "";
                    const name = item.name ?? email.split('@')[0];
                    const selected = selectedMembers.includes(email);

                    return (
                      <TouchableOpacity
                        style={[s.userItem, selected && s.userItemSelected]}
                        onPress={() => toggleSelectEmail(email)}
                        activeOpacity={0.7}
                      >
                        <View style={s.userAvatar}>
                          <MaterialCommunityIcons
                            name="account"
                            size={24}
                            color={selected ? "#fff" : colors.primary}
                          />
                        </View>
                        <View style={s.userInfo}>
                          <Text style={[s.userName, selected && s.userNameSelected]}>
                            {name}
                          </Text>
                          <Text style={[s.userEmail, selected && s.userEmailSelected]}>
                            {email}
                          </Text>
                        </View>
                        <View style={s.checkbox}>
                          <MaterialCommunityIcons
                            name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                            size={24}
                            color={selected ? colors.primary : "#D1D5DB"}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  contentContainerStyle={{ paddingBottom: 16 }}
                />
              )}
            </View>

            {/* Botões de ação */}
            <View style={s.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setSearchQuery("");
                  setOpenSelect(false);
                }}
                variant="outline"
                style={s.actionButton}
              />
              <Button
                title={`Confirmar${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ''}`}
                onPress={() => {
                  setSearchQuery("");
                  setOpenSelect(false);
                }}
                style={s.actionButton}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  input: {
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botaoApagar: {
    backgroundColor: "#E11D48",
    marginTop: 12,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textDark,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  selectedSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },
  selectedScroll: {
    flexGrow: 0,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  selectedChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 120,
  },
  userListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  userItemSelected: {
    backgroundColor: "#F0F9FF",
    borderColor: colors.primary,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 2,
  },
  userNameSelected: {
    color: colors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  userEmailSelected: {
    color: colors.primary,
  },
  checkbox: {
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },
});
