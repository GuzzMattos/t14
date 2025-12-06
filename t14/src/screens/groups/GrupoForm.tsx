// src/screens/GrupoForm.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { createGroupInFirestore,
         updateGroupInFirestore,
         deleteGroupFromFirestore, } from "@/firebase/group";
import { auth, db } from "@/firebase/config";
import { getAllUsers } from "@/firebase/user";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

type FirebaseUserItem = {
  id: string;
  email?: string;
  name?: string;
  [k: string]: any;
};

export default function GrupoForm({ route, navigation }: any) {
  const [nomeGrupo, setNomeGrupo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [allUsers, setAllUsers] = useState<FirebaseUserItem[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // emails
  const [openSelect, setOpenSelect] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const { modo, grupo } = route.params || {};

  useEffect(() => {
    if (modo === "editar" && grupo) {
      setNomeGrupo(grupo.name || "");
      setDescricao(grupo.description || "");
    }
  }, [modo, grupo]);


  useEffect(() => {
    navigation.setOptions({
      title: modo === "editar" ? "Editar grupo" : "Novo grupo",
    });
  }, [navigation, modo]);

  useEffect(() => {
    // carrega todos os users
    async function loadUsers() {
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (err: any) {
        console.log("Erro ao carregar users:", err);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (modo !== "editar" || !grupo || allUsers.length === 0) return;

    const emailsSelecionados: string[] = [];

    allUsers.forEach((u) => {
      if (grupo.memberIds?.includes(u.id) && u.email) {
        emailsSelecionados.push(u.email);
      }
    });

    setSelectedMembers(emailsSelecionados);
  }, [modo, grupo, allUsers]);


  const toggleSelectEmail = (email: string) => {
    setSelectedMembers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
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

      //cria o grupo básico
      const groupId = await createGroupInFirestore({
        name: nomeGrupo.trim(),
        description: descricao?.trim() || "",
        currency: "EUR",
        ownerId: user.uid,
      });

      //se houver membros selecionados, converte emails -> ids e atualiza o doc do grupo
      if (selectedMembers.length > 0) {
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
          // prepara estruturas members e balances
          const now = Timestamp.now();

          const membersUpdate: Record<string, any> = {};
          const balancesUpdate: Record<string, number> = {};
          const memberIdsUpdate: string[] = [];

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
              ...membersUpdate,
            },
            balances: {
              ...balancesUpdate,
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

  const handleUpdateGroup = async () => {
    try {
      if (!grupo?.id) {
        Alert.alert("Erro", "ID do grupo não encontrado.");
        return;
      }

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

      // mapa email -> id
      const emailToIdMap = new Map<string, string>();
      allUsers.forEach((u) => {
        if (u.email) emailToIdMap.set(u.email.toLowerCase(), u.id);
      });

      const memberIdsFromEmails: string[] = [];
      selectedMembers.forEach((email) => {
        const id = emailToIdMap.get((email || "").toLowerCase());
        if (id && id !== user.uid) memberIdsFromEmails.push(id);
      });

      const now = Timestamp.now();

      const membersUpdate: Record<string, any> = {};
      const balancesUpdate: Record<string, number> = {};

      memberIdsFromEmails.forEach((id) => {
        membersUpdate[id] = {
          role: "MEMBER",
          status: "ATIVO",
          joinedAt: now,
        };
        balancesUpdate[id] = 0;
      });

      const updatePayload: any = {
        name: nomeGrupo.trim(),
        description: descricao?.trim() || "",
        // owner + demais membros selecionados
        memberIds: [user.uid, ...memberIdsFromEmails],
        // mantemos o que já existia + sobrescrevemos/ adicionamos os novos
        members: {
          ...(grupo.members || {}),
          ...membersUpdate,
        },
        balances: {
          ...(grupo.balances || {}),
          ...balancesUpdate,
        },
      };

      await updateGroupInFirestore(grupo.id, updatePayload);

      Alert.alert("Sucesso", "Grupo atualizado com sucesso!");
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro ao editar grupo:", error);
      Alert.alert("Erro ao editar grupo", error?.message || String(error));
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      if (!grupo?.id) {
        Alert.alert("Erro", "ID do grupo não encontrado.");
        return;
      }

      await deleteGroupFromFirestore(grupo.id);

      Alert.alert("Sucesso", "Grupo excluído com sucesso!");
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro ao excluir grupo:", error);
      Alert.alert("Erro ao excluir grupo", error?.message || String(error));
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

      {/* campo de seleção (mantive o input original escondido caso você precise) */}
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

      <Button
        title={modo === "editar" ? "Salvar alterações" : loadingCreate ? "Criando..." : "Criar grupo"}
        onPress={() => {
          if (modo === "editar") {
            handleUpdateGroup();
          } else {
            handleCreateGroup();
          }
        }}
        disabled={loadingCreate}
      />

      {modo === "editar" && (
        <Button
          title="Excluir grupo"
          style={s.botaoApagar}
          onPress={() => {
            Alert.alert(
              "Excluir grupo",
              "Tem certeza que deseja excluir este grupo?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Excluir",
                  style: "destructive",
                  onPress: handleDeleteGroup,
                },
              ]
            );
          }}
        />
      )}


      {/* Modal de seleção */}
      <Modal visible={openSelect} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Selecione os membros</Text>

            <View style={{ maxHeight: 340 }}>
              {allUsers.length === 0 && (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <ActivityIndicator color="white" />
                </View>
              )}

              {allUsers.map((u) => {
                const email = u.email ?? "";
                const selected = selectedMembers.includes(email);

                return (
                  <TouchableOpacity
                    key={u.id}
                    style={s.option}
                    onPress={() => toggleSelectEmail(email)}
                  >
                    <Text style={{ color: "white" }}>
                      {selected ? "✔️ " : "○ "} {email}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
              <Button title="Fechar" onPress={() => setOpenSelect(false)} />
              <Button
                title="Confirmar"
                onPress={() => setOpenSelect(false)}
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
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
    backgroundColor: "red",
    marginTop: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  option: {
    paddingVertical: 10,
  },
});
