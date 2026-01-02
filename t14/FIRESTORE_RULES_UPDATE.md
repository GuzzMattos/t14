# Atualização das Regras do Firestore

## Problema Corrigido

Ao aceitar um convite de amizade, o sistema precisa criar duas relações de amizade:
1. Uma onde `userId = fromUserId` (quem enviou o convite)
2. Outra onde `userId = toUserId` (quem aceitou o convite)

A regra anterior só permitia criar relações onde o usuário autenticado era o `userId`, o que impedia criar a primeira relação quando o `toUserId` aceitava.

## Correção Aplicada

### Coleção: friends
**Antes:**
```javascript
allow create: if isAuthenticated() && 
                 request.resource.data.userId == request.auth.uid;
```

**Depois:**
```javascript
allow create: if isAuthenticated() && 
                 (request.resource.data.userId == request.auth.uid || 
                  request.resource.data.friendId == request.auth.uid);
```

Agora permite criar relações onde o usuário é o `userId` OU o `friendId`, permitindo que ao aceitar um convite, ambos os usuários possam criar suas relações de amizade.

### Coleção: friendRequests
Adicionada validação adicional para garantir que apenas solicitações pendentes possam ser atualizadas para ACCEPTED ou REJECTED.

## Como Aplicar

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `equalpay-cff9b`
3. Vá em **Firestore Database** → **Regras**
4. Cole o conteúdo atualizado do arquivo `firestore.rules`
5. Clique em **Publicar**

## Teste

Após aplicar as regras:
1. Envie um convite de amizade
2. Aceite o convite do outro usuário
3. Verifique se não há mais erros de permissão

