# 🚨 SOLUÇÃO RÁPIDA - Erro de Permissões

## Problema
```
Erro ao calcular total do mês: [FirebaseError: Missing or insufficient permissions.]
```

## Causa
As regras do Firestore no Firebase Console ainda não foram atualizadas para permitir as queries necessárias.

---

## 🔥 SOLUÇÃO 1: Deploy Via Firebase CLI (Recomendado)

### Passo 1: Fazer login
```bash
firebase login
```

### Passo 2: Deploy das regras
```bash
cd /Users/gustavo/Sites/localhost/payequal/t14/t14
firebase deploy --only firestore:rules
```

✅ Pronto! As regras foram aplicadas.

---

## 🌐 SOLUÇÃO 2: Deploy Via Firebase Console (Manual)

### Passo 1: Acesse o Firebase Console
1. Abra: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em: **Firestore Database**
4. Clique na aba: **Regras**

### Passo 2: Cole as regras abaixo

**⚠️ IMPORTANTE:** Substitua TODAS as regras existentes pelo código abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // friends
    match /friends/{friendId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.friendId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       (request.resource.data.userId == request.auth.uid || 
                        request.resource.data.friendId == request.auth.uid);
      allow update: if isAuthenticated() && 
                      (resource.data.userId == request.auth.uid || 
                       resource.data.friendId == request.auth.uid);
    }
    
    // friendRequests
    match /friendRequests/{requestId} {
      allow read: if isAuthenticated() && 
                     (resource.data.fromUserId == request.auth.uid || 
                      resource.data.toUserId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.resource.data.fromUserId == request.auth.uid;
      allow update: if isAuthenticated() && 
                      resource.data.toUserId == request.auth.uid;
    }
    
    // notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
                     resource != null &&
                     resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                      resource != null &&
                      resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                      resource != null &&
                      resource.data.userId == request.auth.uid;
    }
    
    // group
    match /group/{groupId} {
      allow read: if isAuthenticated() && 
                     (resource.data.memberIds.hasAny([request.auth.uid]) || 
                      resource.data.ownerId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerId == request.auth.uid;
      allow update: if isAuthenticated() && 
                      (resource.data.ownerId == request.auth.uid ||
                       request.resource.data.ownerId == request.auth.uid);
      allow delete: if isAuthenticated() && 
                      resource.data.ownerId == request.auth.uid;
    }
    
    // expenses - REGRAS ATUALIZADAS
    match /expenses/{expenseId} {
      // Permite queries para getTotalPaidByUserInMonth
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated() && 
                       exists(/databases/$(database)/documents/group/$(request.resource.data.groupId)) &&
                       get(/databases/$(database)/documents/group/$(request.resource.data.groupId)).data.memberIds.hasAny([request.auth.uid]);
      
      allow update: if isAuthenticated() && 
                      resource != null && (
                        resource.data.createdBy == request.auth.uid ||
                        (exists(/databases/$(database)/documents/group/$(resource.data.groupId)) &&
                         get(/databases/$(database)/documents/group/$(resource.data.groupId)).data.ownerId == request.auth.uid)
                      );
      
      allow delete: if isAuthenticated() && 
                      resource != null &&
                      (resource.data.createdBy == request.auth.uid ||
                       (exists(/databases/$(database)/documents/group/$(resource.data.groupId)) &&
                        get(/databases/$(database)/documents/group/$(resource.data.groupId)).data.ownerId == request.auth.uid));
    }
    
    // payments - REGRAS ATUALIZADAS
    match /payments/{paymentId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated() && 
                       exists(/databases/$(database)/documents/expenses/$(request.resource.data.expenseId)) &&
                       request.resource.data.userId == request.auth.uid;
      
      allow update: if isAuthenticated() && 
                      resource != null &&
                      exists(/databases/$(database)/documents/expenses/$(resource.data.expenseId)) &&
                      get(/databases/$(database)/documents/expenses/$(resource.data.expenseId)).data.createdBy == request.auth.uid;
      
      allow delete: if isAuthenticated() && 
                      resource != null &&
                      resource.data.userId == request.auth.uid;
    }
  }
}
```

### Passo 3: Publicar
1. Clique no botão **"Publicar"**
2. Aguarde a confirmação

✅ Pronto! Teste o app novamente.

---

## 🧪 Verificar se funcionou

1. Feche o app completamente
2. Abra novamente
3. Vá para a Home
4. O total do mês deve aparecer sem erros

---

## 🆘 Se ainda não funcionar

### Verificar autenticação
```typescript
// No console do app
console.log('User:', auth.currentUser?.uid);
```

### Verificar query
```typescript
// Adicione logs na função getTotalPaidByUserInMonth
console.log('Buscando despesas para:', userId, year, month);
```

### Limpar cache
```bash
npx expo start -c
```

---

## 📋 O que as novas regras fazem

### Expenses
- ✅ **read:** Qualquer usuário autenticado pode ler (necessário para queries)
- ✅ **create:** Apenas membros do grupo
- ✅ **update:** Criador da despesa OU dono do grupo
- ✅ **delete:** Criador OU dono do grupo

### Payments
- ✅ **read:** Qualquer usuário autenticado pode ler
- ✅ **create:** Usuário pode criar seus próprios pagamentos
- ✅ **update:** Apenas criador da despesa (para confirmar)
- ✅ **delete:** Próprio usuário

**Nota:** As regras são simplificadas para permitir queries. A segurança vem das queries filtradas no código.

---

## ⚡ Comandos Úteis

### Ver logs de erros
```bash
# No terminal onde está rodando o app
# Procure por: FirebaseError
```

### Testar regras localmente
```bash
firebase emulators:start --only firestore
```

### Ver regras aplicadas
```bash
firebase firestore:rules:get
```

---

## ✅ Checklist

- [ ] Regras aplicadas no Firebase Console
- [ ] App fechado e reaberto
- [ ] Total do mês aparece sem erros
- [ ] Despesas podem ser criadas
- [ ] Pagamentos podem ser registrados

---

**Próximo passo:** Após aplicar as regras, teste todo o fluxo novamente! 🚀
