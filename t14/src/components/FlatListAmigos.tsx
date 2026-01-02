// FlatListAmigos.tsx
import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

export type Amigo = {
  id: string;
  primeiroNome: string;
  apelido: string;
  nickname: string;
  email: string;
  telefone: string;
  estado: 'ativo' | 'pendente';
  avatar: string;
  nomeCompleto?: string; // opcional, pode ser gerado dinamicamente
  requestId?: string; // ID da solicitação de amizade (para pendentes)
};

type FlatListAmigosProps = {
  amigos: Amigo[];
  onPressItem?: (item: Amigo) => void;
  onAdicionarPendente?: (amigo: Amigo) => void;
  onRemoverPendente?: (amigo: Amigo) => void;
};

type ItemProps = {
  amigo: Amigo;
  onPress?: (item: Amigo) => void;
  onAdicionarPendente?: (amigo: Amigo) => void;
  onRemoverPendente?: (amigo: Amigo) => void;
};

const Item: React.FC<ItemProps> = ({ amigo, onPress, onAdicionarPendente, onRemoverPendente }) => {
  const { primeiroNome, apelido, estado, avatar } = amigo;
  const nomeCompleto = `${primeiroNome} ${apelido}`;

  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress?.(amigo)} activeOpacity={0.7}>
      {/* Avatar */}
      <Image source={{ uri: avatar }} style={styles.avatar} />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{nomeCompleto}</Text>

        {/* Estado */}
        {estado === 'ativo' ? (
          <Text style={[styles.estado, { color: 'green' }]}>ATIVO</Text>
        ) : (
          <View style={styles.linhaBotoes}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'green' }]}
              onPress={() => onAdicionarPendente?.(amigo)}
            >
              <Text style={styles.buttonText}>Adicionar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'red' }]}
              onPress={() => onRemoverPendente?.(amigo)}
            >
              <Text style={styles.buttonText}>Apagar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function FlatListAmigos({
  amigos,
  onPressItem,
  onAdicionarPendente,
  onRemoverPendente,
}: FlatListAmigosProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={amigos}
          renderItem={({ item }) => (
            <Item
              amigo={item}
              onPress={onPressItem}
              onAdicionarPendente={onAdicionarPendente}
              onRemoverPendente={onRemoverPendente}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
    backgroundColor: '#FFFFFF',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  estado: {
    fontSize: 16,
    marginTop: 4,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
