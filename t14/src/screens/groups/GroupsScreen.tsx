import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import Filter from "@/components/Filter";
import { auth, db } from "@/firebase/config";
import { Group } from "@/types/Group";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const OPCOES = [
  { id: "1", opcao: "LIQUIDADO" },
  { id: "2", opcao: "POR_LIQUIDAR" },
];

export default function Groups({ navigation }: any) {
  const [pesquisar, setPesquisar] = useState<string>("");
  const [filtro, setFiltro] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const user = auth.currentUser;

  // LISTA GRUPOS DO USUÁRIO LOGADO (tempo real)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "group"),
      where("memberIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Group[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];

      setGroups(list);
    });

    return unsubscribe;
  }, []);

  // APLICA FILTRO + PESQUISA
  const gruposFiltrados = groups.filter((grupo) => {
    const correspondeFiltro = filtro ? grupo.status === filtro : true;
    const correspondePesquisa = pesquisar
      ? grupo.name.toLowerCase().includes(pesquisar.toLowerCase())
      : true;
    return correspondeFiltro && correspondePesquisa;
  });

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <Input
          placeholder="Pesquisar grupos..."
          value={pesquisar}
          onChangeText={setPesquisar}
          style={{ width: 325 }}
        />
        <Filter valor={filtro} onChange={setFiltro} opcoes={OPCOES} />
      </View>

      <FlatList
        data={gruposFiltrados}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <GroupItem item={item} navigation={navigation} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* BOTÃO DE ADICIONAR */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Button
          title={<Ionicons name="add" size={24} color="#fff" />}
          onPress={() => navigation.navigate("GrupoForm")}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </View>
    </View>
  );
}

function GroupItem({ item, navigation }: { item: Group; navigation: any }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={s.activityCard}
      onPress={() =>
        navigation.navigate("DetalhesGrupo", {
          grupoId: item.id,
          name: item.name,
        })
      }
    >
      <View style={s.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.name || ""}</Text>
        <Text style={s.activitySub}>
          {item.status === "LIQUIDADO" ? "Liquidado" : "A liquidar"}{item.description ? ` • ${item.description}` : ""}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("GrupoForm", { modo: "editar", grupo: item })
        }
      >
        <Ionicons name="pencil" size={18} color={colors.primary} />
      </TouchableOpacity>
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
  activityCard: {
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
    borderRadius: 10,
    backgroundColor: "#F2EAD9",
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  activitySub: {
    color: "#6B7280",
    marginTop: 2,
  },
  topRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    zIndex: 100,
  },
});
