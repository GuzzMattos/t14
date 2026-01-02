# 🔔 Configurar Push Notifications para Teste

## Problema
O Expo Go precisa de um `projectId` para gerar tokens de push notification.

## Solução Rápida (5 minutos)

### Opção 1: Usar Expo Dev (Recomendado)

1. **Instale o EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Faça login no Expo:**
   ```bash
   eas login
   ```

3. **Inicialize o projeto:**
   ```bash
   eas init
   ```
   
   Isso vai criar um `projectId` automaticamente e adicionar no `app.json`.

### Opção 2: Criar Manualmente no Expo.dev

1. Acesse: https://expo.dev
2. Faça login ou crie uma conta
3. Clique em "Create a project"
4. Escolha "Blank" ou "Template"
5. Copie o `projectId` que aparece
6. Adicione no `app.json`:
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

### Opção 3: Usar ProjectId Temporário

Se você só quer testar rapidamente, pode usar um projectId temporário:

1. Abra o `app.json`
2. Adicione um projectId temporário:
   ```json
   {
     "expo": {
       "extra": {
         "eas": {
           "projectId": "00000000-0000-0000-0000-000000000000"
         }
       }
     }
   }
   ```

   **Nota:** Este projectId temporário pode não funcionar para enviar notificações, mas pode permitir obter o token.

## Depois de Configurar

1. Reinicie o Expo Go no celular
2. Faça login novamente no app
3. O token será registrado automaticamente
4. Teste usando o botão "🧪 Testar Notificação Push" no perfil

## Verificar se Funcionou

Verifique os logs no terminal. Você deve ver:
```
✅ ProjectId encontrado: seu-project-id
✅ Token obtido com sucesso: ExponentPushToken[...]
✅ Token salvo no Firestore!
```

## Problemas?

- Se ainda não funcionar, verifique se aceitou a permissão de notificação
- Certifique-se de estar usando um dispositivo físico (não emulador)
- Certifique-se de estar usando Expo Go (não build de produção)

