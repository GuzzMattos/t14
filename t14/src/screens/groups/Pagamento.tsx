import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import Button from "@/components/Button";
import Input from "@/components/Input";
import colors from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import DocumentPicker, { types } from "react-native-document-picker"; 

export default function Pagamento({ route }: any) {
  const [valor, setValor] = useState<string>();
  const [metodo, setMetodo] = useState<string>();
  const [comprovativo, setComprovativo] = useState<string>();
  const [comentario, setComentario] = useState<string>();
  const { tipoPagamento, valorDivida, pessoa } = route.params;
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);

  const opcoesPagamento = ["MB WAY", "Dinheiro", "Transferência", "PayPal"];


  useEffect(() => {
    if (tipoPagamento === "total") {
      setValor(valorDivida.toString());
    }
  }, [tipoPagamento, valorDivida]);

  const confirmarPagamento = () => {
    console.log("Dados do pagamento:", { valor, metodo, comprovativo, comentario });
    Alert.alert("Sucesso", "Pagamento feito com sucesso!");
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Você deve {valorDivida}€ {pessoa ? `para ${pessoa}` : ""}</Text>

      <Input
        label="Valor que irá pagar (€)"
        placeholder="ex: 50"
        value={valor}
        onChangeText={setValor}
        editable={tipoPagamento !== "total"}
        style={s.input}
      />

      <View style={{ marginBottom: 12, position: "relative", zIndex: 999 }}>
        <Text>Método de pagamento</Text>

        <Pressable
          onPress={() => setMostrarOpcoes(!mostrarOpcoes)}
          style={s.input}
        >
          <Text>
            {metodo || "Selecione um método"}
          </Text>
        </Pressable>

        {mostrarOpcoes && (
          <Pressable style={s.overlay} onPress={() => setMostrarOpcoes(false)}>
            <Pressable style={s.dropdownContainer}>
              <Text style={[s.dropdownTitle]}>Escolher método:</Text>

              {opcoesPagamento.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setMetodo(item);
                    setMostrarOpcoes(false);
                  }}
                  style={s.opcao}
                >
                  <Ionicons
                    name={metodo === item ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={metodo === item ? "#334B34" : "#999"}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={s.opcaoTexto}>{item}</Text>
                </Pressable>
              ))}

              <View style={{ marginTop: 10, alignItems: "flex-end" }}>
                <Pressable
                  onPress={() => {
                    setMetodo("");
                    setMostrarOpcoes(false);
                  }}
                >
                  <Text style={{ textDecorationLine: "underline", color: "#555" }}>
                    Limpar seleção
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </View>

      <Input
        label="Comprovativo de pagamento"
        value={comprovativo}
        onChangeText={setComprovativo}
        style={s.input}
      />

      <Input
        label="Comentários"
        value={comentario}
        onChangeText={setComentario}
        style={s.input}
      />

      <Button
        title="Confirmar pagamento"
        onPress={confirmarPagamento}
        style={{ marginTop: 16 }}
      />
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  dropdownTitle: {
    color: "#6B7280",
    marginBottom: 10,
    fontSize: 14,
  },
  opcao: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  opcaoTexto: {
    fontSize: 16,
    color: "#333",
  },
});
