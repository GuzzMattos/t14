import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type TabProps = {
    abas: string[],
    abaAtiva: string,
    onChange: (aba:string) => void;
}

export default function Tab({ abas, abaAtiva, onChange}: TabProps) {
  return (
    <View style={s.container}>
      {abas.map((aba) => (
        <TouchableOpacity
          key={aba}
          style={[
            s.botao,
            abaAtiva === aba && s.botaoAtivo
          ]}
          onPress={() => onChange(aba)}
        >
          <Text
            style={[
              s.texto,
              abaAtiva === aba && s.textoAtivo
            ]}
          >
            {aba}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F5EEDC", 
    borderRadius: 20,
    padding: 4,
    alignSelf: "center",
    margin: 10,
  },
  botao: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  botaoAtivo: {
    backgroundColor: "#334B34", 
  },
  texto: {
    color: "#334B34",
    fontWeight: "500",
  },
  textoAtivo: {
    color: "#fff",
    fontWeight: "700",
  },
});
