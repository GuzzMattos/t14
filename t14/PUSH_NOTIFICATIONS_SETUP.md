# Configuração de Push Notifications

## Instalação

Execute o seguinte comando para instalar as dependências necessárias:

```bash
npm install expo-notifications expo-device expo-constants
```

## Configuração do Expo Project ID

O Expo precisa de um Project ID para gerar tokens de push. Você pode obter isso de duas formas:

### Opção 1: Usar EAS (Recomendado)

1. Instale o EAS CLI:
```bash
npm install -g eas-cli
```

2. Faça login:
```bash
eas login
```

3. Configure o projeto:
```bash
eas build:configure
```

Isso criará um arquivo `eas.json` com o projectId.

### Opção 2: Usar o app.json

Adicione o projectId no `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "seu-project-id-aqui"
      }
    }
  }
}
```

Para obter o projectId:
1. Acesse https://expo.dev
2. Crie um projeto ou use um existente
3. O projectId estará disponível nas configurações do projeto

## Como Funciona

1. **Registro do Token**: Quando o usuário faz login, o app solicita permissão de notificações e registra o token do dispositivo no Firestore.

2. **Envio de Push**: Quando uma notificação é criada no Firestore, o sistema automaticamente:
   - Busca o `pushToken` do usuário
   - Envia uma push notification via Expo Push Notification API
   - O celular recebe a notificação mesmo com o app fechado

3. **Recebimento**: O app está configurado para:
   - Mostrar notificações quando o app está em foreground
   - Processar toques em notificações para navegar para a tela apropriada

## Testando

1. Instale o app em um dispositivo físico (push notifications não funcionam em emuladores)
2. Faça login
3. Peça para outro usuário criar uma despesa ou enviar uma solicitação de amizade
4. Você deve receber uma notificação push no celular

## Troubleshooting

- **Token não está sendo gerado**: Verifique se está usando um dispositivo físico
- **Notificações não chegam**: Verifique se as permissões foram concedidas e se o pushToken está salvo no Firestore
- **Erro de projectId**: Certifique-se de que o projectId está configurado corretamente no app.json ou eas.json

