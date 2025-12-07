import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '@/theme/colors';

export default function SelectFilter({
    options = [],
    onSelect,
    }: {
    options: string[];
    onSelect?: (item: string) => void;
    }) {
    const [filter, setFilter] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [listaOptions, setListaOptions] = useState(options);

    const filtered = listaOptions.filter(opt =>
    opt.toLowerCase().includes(filter.toLowerCase())
    );

    const toggleSelect = (item: string) => {
    if (selected.includes(item)) {
        setSelected(prev => prev.filter(i => i !== item));
        setListaOptions(prev => [...prev, item]); // volta para lista
    } else {
        setSelected(prev => [...prev, item]);
        setListaOptions(prev => prev.filter(o => o !== item)); // tira da lista
    }

    if (onSelect) onSelect(item);
    };


    const removerItem = (item: string) => {
        setSelected(prev => prev.filter(i => i !== item));
    };

  return (
    <View style={s.container}>
      <TextInput
        style={s.input}
        placeholder="Adicionar amigos"
        value={filter}
        onFocus={() => setFilterOpen(true)}
        onChangeText={(t) => {
          setFilter(t);
          setFilterOpen(true);
        }}
      />

      {filterOpen && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          style={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                s.item,
                selected.includes(item) && { backgroundColor: '#e5ffe5' }
              ]}
              onPress={() => toggleSelect(item)}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
        {selected.map(item => (
          <View key={item} style={s.listaMembros}>
            <TouchableOpacity
              style={s.botaoRemover}
              onPress={() => removerItem(item)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>

            <Text style={s.activitySub}>{item}</Text>
          </View>
        ))}
      </View>
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
  container: {
    width: '100%',
  },
  input: {
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listaMembros: {
    backgroundColor: "#F5EEDC",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    minWidth: 80,
    alignItems: "center",
    position: "relative",
    marginTop: 10,
  },
  botaoRemover: {
    position: "absolute",
    top: -8,
    right: -8,
    padding: 4,
    backgroundColor: "red",
    borderRadius: 25,
  },
})