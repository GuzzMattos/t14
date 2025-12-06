import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import Input from "@/components/Input";
import Button from "@/components/Button";
import colors from "@/theme/colors";
import SelectFilter from "@/components/SelectFilter";

type Grupo = {
  id: string;
  title: string;
  status: string;
  descricao: string;
  despesas: number;
};

const GRUPO: Grupo[] = [
  {
    id: "1",
    title: "Viagem para Madrid",
    status: "Por liquidar",
    descricao: "Viagem com amigos para Madrid",
    despesas: 2,
  },
  {
    id: "2",
    title: "Lanche",
    status: "Liquidado",
    descricao: "Lanche de sexta-feira",
    despesas: 2,
  },
  {
    id: "3",
    title: "Londres",
    status: "Liquidada parcialmente",
    descricao: "Viagem de estudos",
    despesas: 2,
  },
];

export default function GrupoForm({ route, navigation }: any) {
  const [nomeGrupo, setNomeGrupo] = useState<string>();
  const [descricao, setDescricao] = useState<string>();
  const [membros, setMembros] = useState<string>();

  const { modo, grupo } = route.params || {};

  useEffect(() => {
    if (modo === "editar") {
      setNomeGrupo(grupo.title || "");
      setDescricao(grupo.descricao || "");
    }
  }, [modo, grupo]);

  useEffect(() => {
    navigation.setOptions({
      title: modo === "editar" ? "Editar grupo" : "Novo grupo",
    });
  }, [navigation, modo]);

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

      <SelectFilter
        options={['Ana', 'Carlos']}
        onSelect={(item) => console.log("Selecionado:", item)}
      />

      <Button
        title={modo === "editar" ? "Salvar alterações" : "Criar grupo"}
        onPress={() => {
          if (modo === "editar") {
            Alert.alert("Sucesso", "Grupo atualizado com sucesso!");
          } else {
            Alert.alert("Sucesso", "Grupo criado com sucesso!");
          }
          console.log("Dados do grupo:", { nomeGrupo, descricao, membros });
        }}
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
                  onPress: () => {
                    Alert.alert("Sucesso", "Grupo excluído com sucesso!");
                  },
                },
              ]
            );
          }}
        />
      )}
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
});
