# 🔧 Correção: Deleção de Conta - Permissões Firestore

## 🐛 Problema Identificado

**Erro:** `FirebaseError: Missing or insufficient permissions.`

**Causa:** As regras do Firestore não permitiam deletar documentos relacionados ao usuário ao apagar a conta.

---

## ✅ Correções Implementadas

### 1. **Firestore Rules - Permissões de Delete**

#### Coleção: `friends`
```javascript
// ANTES: Sem permissão de delete
match /friends/{friendId} {
  allow read: if ...;
  allow create: if ...;
  allow update: if ...;
  // ❌ Sem allow delete
}

// DEPOIS: Com permissão de delete
match /friends/{friendId} {
  allow read: if ...;
  allow create: if ...;
  allow update: if ...;
  // ✅ Adicionado
  allow delete: if isAuthenticated() && 
                  (resource.data.userId == request.auth.uid || 
                   resource.data.friendId == request.auth.uid);
}
```

#### Coleção: `friendRequests`
```javascript
// ANTES: Sem permissão de delete
match /friendRequests/{requestId} {
  allow read: if ...;
  allow create: if ...;
  allow update: if ...;
  // ❌ Sem allow delete
}

// DEPOIS: Com permissão de delete
match /friendRequests/{requestId} {
  allow read: if ...;
  allow create: if ...;
  allow update: if ...;
  // ✅ Adicionado
  allow delete: if isAuthenticated() && 
                  (resource.data.fromUserId == request.auth.uid || 
                   resource.data.toUserId == request.auth.uid);
}
```

**Observação:** A coleção `notifications` já tinha permissão de delete correta.

---

### 2. **Lógica de Deleção de Conta Melhorada**

**Arquivo:** `src/screens/profile/ProfileScreen.tsx`

#### Melhorias Implementadas:

1. ✅ **Logs detalhados** para debug
2. ✅ **Verificação de propriedade de grupos** antes de deletar
3. ✅ **Remoção do usuário de grupos** onde é membro
4. ✅ **Ordem correta de operações** (batch → deleteDoc → deleteAuth)
5. ✅ **Mensagens informativas** sobre o processo

#### Novo Fluxo:

```typescript
async function handleDeleteAccount(password: string) {
  // 1. Deletar relações de amizade (userId ou friendId)
  // 2. Deletar solicitações de amizade (fromUserId ou toUserId)
  // 3. Deletar notificações (userId)
  // 4. Verificar se é dono de grupos → BLOQUEIA se sim
  // 5. Remover de grupos onde é membro (atualiza memberIds)
  // 6. Commit do batch
  // 7. Deletar documento do usuário
  // 8. Deletar conta do Firebase Auth
}
```

---

## 🚨 Proteção Contra Deleção Indevida

### Usuário Dono de Grupos

Se o usuário for **dono de algum grupo**, a deleção é **bloqueada**:

```typescript
if (ownerGroupsSnap.size > 0) {
  Alert.alert(
    "Atenção",
    `Você é dono de ${ownerGroupsSnap.size} grupo(s). ` +
    `Transfira a propriedade ou exclua os grupos antes de deletar sua conta.`
  );
  return; // Não permite deletar
}
```

**Motivo:** Evita deixar grupos sem dono, o que causaria problemas de permissões.

**Solução:** Usuário deve:
1. Transferir propriedade do grupo para outro membro, OU
2. Excluir o grupo completamente

---

## 📋 O que é Deletado/Atualizado

### ✅ Deletado Completamente

| Coleção | Condição | Documentos |
|---------|----------|------------|
| `friends` | `userId == user.uid` OU `friendId == user.uid` | Todas relações de amizade |
| `friendRequests` | `fromUserId == user.uid` OU `toUserId == user.uid` | Todos convites enviados/recebidos |
| `notifications` | `userId == user.uid` | Todas notificações do usuário |
| `users` | `userId == user.uid` | Documento do usuário |
| Firebase Auth | Conta do usuário | Credenciais de login |

### ✅ Atualizado (Não Deletado)

| Coleção | Ação | Motivo |
|---------|------|--------|
| `group` (membro) | Remove `user.uid` de `memberIds`, `members`, `balances` | Preserva o grupo para outros membros |

### 🚫 Bloqueado

| Situação | Ação |
|----------|------|
| Dono de grupo(s) | Deleção bloqueada até transferir/excluir grupos |

---

## 🔐 Regras de Segurança Atualizadas

### Resumo das Permissões de Delete

```javascript
// Coleção: users
allow delete: if isOwner(userId);

// Coleção: friends
allow delete: if isAuthenticated() && 
                (resource.data.userId == request.auth.uid || 
                 resource.data.friendId == request.auth.uid);

// Coleção: friendRequests
allow delete: if isAuthenticated() && 
                (resource.data.fromUserId == request.auth.uid || 
                 resource.data.toUserId == request.auth.uid);

// Coleção: notifications
allow delete: if isAuthenticated() && 
                resource.data.userId == request.auth.uid;

// Coleção: group
allow delete: if isAuthenticated() && 
                resource.data.ownerId == request.auth.uid;

// Coleção: expenses
allow delete: if isAuthenticated() && 
                (resource.data.createdBy == request.auth.uid || 
                 groupOwnerId == request.auth.uid);

// Coleção: payments
allow delete: if isAuthenticated() && 
                resource.data.userId == request.auth.uid && 
                resource.data.status == "PENDING";
```

---

## 📊 Logs de Debug

Durante a deleção, os seguintes logs são exibidos:

```
🗑️ Iniciando deleção de conta para usuário: [userId]
🔍 Buscando relações de amizade...
✅ Encontradas X relações de amizade
🔍 Buscando solicitações de amizade...
✅ Encontradas X solicitações de amizade
🔍 Buscando notificações...
✅ Encontradas X notificações
🔍 Verificando grupos onde é dono...
✅ Encontrados X grupos onde é membro
💾 Salvando alterações no Firestore...
🗑️ Deletando documento do usuário...
🔐 Deletando conta do Firebase Auth...
✅ Conta apagada com sucesso!
```

**Em caso de erro:**
```
❌ Erro ao apagar conta: [mensagem]
❌ Stack: [stack trace]
```

---

## 🧪 Como Testar

### Cenário 1: Deleção Bem-Sucedida (Membro de Grupos)

1. Login como usuário A
2. Estar em 1+ grupos (não ser dono)
3. Ter amigos e notificações
4. Ir para Perfil → "Apagar conta"
5. Inserir senha
6. Confirmar

**Resultado Esperado:**
- ✅ Conta deletada com sucesso
- ✅ Removido de todos os grupos
- ✅ Amizades deletadas
- ✅ Notificações deletadas
- ✅ Logout automático

### Cenário 2: Deleção Bloqueada (Dono de Grupo)

1. Login como usuário B
2. Ser dono de 1+ grupos
3. Ir para Perfil → "Apagar conta"
4. Inserir senha
5. Confirmar

**Resultado Esperado:**
- ⚠️ Alert: "Você é dono de X grupo(s)..."
- ❌ Deleção bloqueada
- ✅ Usuário permanece logado
- ℹ️ Instrução para transferir/excluir grupos

### Cenário 3: Senha Incorreta

1. Ir para Perfil → "Apagar conta"
2. Inserir senha incorreta
3. Confirmar

**Resultado Esperado:**
- ❌ Erro: Firebase Auth rejeita
- ℹ️ Mensagem: "Verifique sua senha"
- ✅ Nenhum dado deletado

---

## ✅ Status

- ✅ Regras do Firestore corrigidas
- ✅ Lógica de deleção melhorada
- ✅ Proteção contra deleção indevida
- ✅ Logs de debug adicionados
- ✅ Sem erros TypeScript
- ⏳ Aguardando teste no app

---

## 📚 Arquivos Modificados

1. ✅ `firestore.rules`
   - Adicionada permissão de delete para `friends`
   - Adicionada permissão de delete para `friendRequests`

2. ✅ `src/screens/profile/ProfileScreen.tsx`
   - Lógica de deleção melhorada
   - Verificação de propriedade de grupos
   - Remoção de grupos onde é membro
   - Logs detalhados

---

**Data:** 8 de janeiro de 2026

**Status:** ✅ **Correção Completa - Pronto para Teste**
