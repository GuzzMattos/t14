# Como Aplicar as Regras do Firestore

## ⚠️ IMPORTANTE: Você precisa aplicar as novas regras do Firestore

O erro "Missing or insufficient permissions" acontece porque as regras do Firestore não permitem acesso à coleção `despesa`.

---

## Opção 1: Deploy via Firebase CLI (Recomendado)

### 1. Instalar Firebase CLI (se ainda não tiver)
```bash
npm install -g firebase-tools
```

### 2. Fazer login
```bash
firebase login
```

### 3. Fazer deploy das regras
```bash
cd /Users/gustavo/Sites/localhost/payequal/t14/t14
firebase deploy --only firestore:rules
```

---

## Opção 2: Aplicar Manualmente via Console do Firebase

### 1. Acesse o Firebase Console
https://console.firebase.google.com/

### 2. Selecione seu projeto

### 3. Vá em "Firestore Database" → "Regras"

### 4. Copie todo o conteúdo do arquivo `firestore.rules` e cole no editor de regras

### 5. Clique em "Publicar"

---

## O que foi adicionado nas regras?

Foi adicionada uma nova seção para a coleção `despesa` (modelo legado):

```javascript
// Coleção: despesa (modelo legado)
match /despesa/{despesaId} {
  // Usuários podem ler despesas de grupos dos quais são membros
  allow read: if isAuthenticated() && 
                 resource != null &&
                 exists(/databases/$(database)/documents/group/$(resource.data.groupId)) &&
                 get(/databases/$(database)/documents/group/$(resource.data.groupId)).data.memberIds.hasAny([request.auth.uid]);
  
  // Usuários podem criar despesas em grupos dos quais são membros
  allow create: if isAuthenticated() && 
                   exists(/databases/$(database)/documents/group/$(request.resource.data.groupId)) &&
                   get(/databases/$(database)/documents/group/$(request.resource.data.groupId)).data.memberIds.hasAny([request.auth.uid]);
  
  // Apenas o dono do grupo pode atualizar despesas (aprovar/rejeitar)
  allow update: if isAuthenticated() && 
                  resource != null &&
                  exists(/databases/$(database)/documents/group/$(resource.data.groupId)) &&
                  get(/databases/$(database)/documents/group/$(resource.data.groupId)).data.ownerId == request.auth.uid;
  
  // Apenas o criador ou dono do grupo pode deletar despesas
  allow delete: if isAuthenticated() && 
                  resource != null &&
                  (resource.data.createdBy == request.auth.uid ||
                   (exists(/databases/$(database)/documents/group/$(resource.data.groupId)) &&
                    get(/databases/$(database)/documents/group/$(resource.data.groupId)).data.ownerId == request.auth.uid));
}
```

---

## Permissões Definidas:

✅ **Leitura**: Membros do grupo podem ler despesas  
✅ **Criação**: Membros do grupo podem criar despesas  
✅ **Atualização**: Apenas owner do grupo pode aprovar/rejeitar  
✅ **Exclusão**: Apenas criador da despesa ou owner do grupo  

---

## Verificação

Após aplicar as regras, teste:
1. Abrir o app
2. Acessar um grupo
3. Ver se as despesas carregam sem erro

Se ainda tiver erro, verifique:
- Se o usuário está autenticado
- Se o usuário é membro do grupo
- Se o campo `groupId` está presente na despesa
