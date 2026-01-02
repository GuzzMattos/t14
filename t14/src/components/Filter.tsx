import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/theme/colors';

type FilterProps = {
  valor: string | null;
  onChange: (valor: string | null) => void;
  opcoes: { id: string; opcao: string }[];
};

export default function Filter({ valor, onChange, opcoes }: FilterProps) {
  const [dropDownOpen, setDropDownOpen] = useState(false);

  return (
    <View style={{ position: "relative", zIndex: 999 }}>
      <Pressable
        onPress={() => setDropDownOpen(!dropDownOpen)}
        style={[s.botao, dropDownOpen ? s.botaoAtivo : s.botaoInativo]}
      >
        <Ionicons
          name="filter"
          size={22}
          color={dropDownOpen ? "#fff" : "#6B7280"}
        />
      </Pressable>

      {dropDownOpen && (
        <Pressable style={s.overlay} onPress={() => setDropDownOpen(false)}>
          <Pressable style={s.dropdownContainer}>
            <Text style={[s.activitySub, { marginBottom: 10 }]}>
              Filtrar por:
            </Text>

            <FlatList
              data={opcoes}
              renderItem={({ item }) => (
                <FiltroDropDown
                  filtro={item}
                  selecionado={valor === item.id}
                  onPress={() => {
                    onChange(item.id);
                    setDropDownOpen(false);
                  }}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />

            <View style={{ alignItems: "flex-end" }}>
              <Pressable
                onPress={() => {
                  onChange(null); 
                  setDropDownOpen(false);
                }}
              >
                <Text
                  style={[
                    s.activitySub,
                    { textDecorationLine: "underline" },
                  ]}
                >
                  Limpar filtro
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

type FiltroDropDownProps = {
  filtro: { id: string; opcao: string };
  selecionado: boolean;
  onPress: () => void;
};

function FiltroDropDown({ filtro, selecionado, onPress }: FiltroDropDownProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ flexDirection: "row" }}>
        <Ionicons
          name={selecionado ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={selecionado ? "#334B34" : "#999"}
          style={{ marginRight: 8 }}
        />
        <Text style={s.activitySub}>{filtro.opcao}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  botao: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoAtivo: {
    backgroundColor: "#334B34",
  },
  botaoInativo: {
    backgroundColor: "#fff",
  },
  activitySub: {
    color: "#6B7280",
    marginTop: 2,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    zIndex: 1000,
  },
  dropdownContainer: {
    width: 260,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 60,
    marginRight: 10,
    elevation: 20,
    zIndex: 1001,
  },
});
