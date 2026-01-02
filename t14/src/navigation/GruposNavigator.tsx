import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Grupos from "@/screens/groups/GroupsScreen";
import GrupoForm from "@/screens/groups/GrupoForm";
import DetalhesGrupo from "@/screens/groups/DetalhesGrupo";
import DespesaForm from "@/screens/groups/DespesaForm";
import DetalheDespesa from "@/screens/groups/DetalheDespesa";
import Pagamento from "@/screens/groups/Pagamento";

export type GruposStackParamList = {
  GroupsList: undefined;
  GrupoForm: undefined;
  DetalhesGrupo: {grupoId:string; title: string}
  DespesaForm: undefined;
  DetalheDespesa: { despesaId: string };
  Pagamento: undefined;
};

const Stack = createNativeStackNavigator<GruposStackParamList>();

export default function GruposNavigator() {
  return (
    <Stack.Navigator
        screenOptions={{
        headerTitleAlign: 'center',
        }}
    >
      <Stack.Screen
        name="GroupsList"
        component={Grupos}
        options={{ title: "Grupos" }}
      />
      <Stack.Screen
        name="GrupoForm"
        component={GrupoForm}
        options={{ title: "Novo Grupo" }}
      />
      <Stack.Screen
        name="DetalhesGrupo"
        component={DetalhesGrupo}
        options={{ title: "Detalhes do Grupo" }}
      />
      <Stack.Screen
        name="DespesaForm"
        component={DespesaForm}
        options={{ title: "Nova despesa" }}
      />
      <Stack.Screen
        name="DetalheDespesa"
        component={DetalheDespesa}
        options={{ title: "Detalhe da despesa" }}
      />
      <Stack.Screen
        name="Pagamento"
        component={Pagamento}
        options={{ title: "Pagamento" }}
      />
    </Stack.Navigator>
  );
}
