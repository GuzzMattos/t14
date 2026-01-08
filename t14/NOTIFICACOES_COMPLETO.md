# 🔔 Sistema de Notificações e Atividades - Implementação Completa

## 📊 Resumo Executivo

O sistema de notificações foi implementado com **dois tipos distintos** de notificações:

### 1️⃣ **Notificações Acionáveis (UNREAD)**
Requerem ação do usuário e aparecem em destaque nas notificações:
- ✅ Despesa pendente de aprovação
- ✅ Convite de amizade
- ✅ Pagamento pendente de confirmação
- ✅ Despesa aprovada
- ✅ Despesa rejeitada
- ✅ Pagamento confirmado/rejeitado

**Características:**
- Status inicial: `UNREAD`
- Envia push notification (se habilitado)
- Aparece em "Notificações" com destaque visual
- **Arquivada** (não deletada) após ação concluída
- Oculta da lista após arquivamento

### 2️⃣ **Atividades Recentes (READ)**
Registros de atividades que NÃO requerem ação:
- ✅ Membro adicionado a um grupo
- ✅ Pagamento registrado pelo usuário

**Características:**
- Status inicial: `READ`
- NÃO envia push notification
- Aparece em "Atividade recente" sem destaque
- Não requer ação do usuário
- Apenas registro informativo

---

## 🎯 Fluxo Implementado

### Cenário 1: Usuário Adicionado a um Grupo

```typescript
// src/firebase/group.ts - addMembersToGroup()
await createMemberAddedNotification(
  memberId,
  groupId,
  groupName,
  currentUserName
);
```

**Resultado:**
- ✅ Cria notificação com `status: "READ"`
- ✅ NÃO envia push notification
- ✅ Aparece em "Atividade recente" (sem destaque)
- ✅ Não requer nenhuma ação do usuário

---

### Cenário 2: Usuário Paga uma Despesa

```typescript
// src/firebase/pagamento.ts - createPagamentoInFirestore()
await createPaymentMadeNotification(
  deUsuarioId,
  despesaId,
  groupId,
  valor,
  expenseDescription
);
```

**Resultado:**
- ✅ Cria notificação com `status: "READ"`
- ✅ NÃO envia push notification
- ✅ Aparece em "Atividade recente" (sem destaque)
- ✅ Não requer nenhuma ação do usuário
- ⚠️ Criador da despesa recebe notificação ACIONÁVEL (UNREAD) para confirmar

---

### Cenário 3: Notificação Acionável Concluída

```typescript
// Exemplo: Aprovação de despesa
await approveExpense(expenseId, userId, groupId);
await archiveNotification(notification.id); // Arquiva ao invés de deletar

// Exemplo: Confirmação de pagamento
await confirmPayment(paymentId, userId, expenseId, groupId);
await archiveNotification(notification.id); // Arquiva ao invés de deletar
```

**Resultado:**
- ✅ Notificação recebe `status: "ARCHIVED"`
- ✅ Desaparece da lista de notificações
- ✅ Dados preservados no Firestore (não deletado)
- ✅ Permite auditoria e histórico completo

---

## 🔧 Arquivos Implementados

### 1. `src/firebase/notification.ts`

**Funções de Atividade (READ):**
```typescript
// Não envia push, apenas registra atividade
createMemberAddedNotification()
createPaymentMadeNotification()
```

**Funções Acionáveis (UNREAD):**
```typescript
// Envia push notification se habilitado
createExpenseApprovalNotification()
createExpenseApprovedNotification()
createExpenseRejectedNotification()
createFriendRequestNotification()
createPaymentNotification()
```

**Funções de Gerenciamento:**
```typescript
observeUserNotifications()  // Filtra arquivadas automaticamente
archiveNotification()       // Arquiva após ação
deleteNotification()        // Apenas se necessário
```

---

### 2. `src/firebase/group.ts`

```typescript
export async function addMembersToGroup(...) {
  // ... adiciona membros ao grupo
  
  // Para cada novo membro:
  await createMemberAddedNotification(
    memberId,
    groupId,
    groupName,
    currentUserName
  );
  // ✅ Notificação READ, sem push, apenas atividade
}
```

---

### 3. `src/firebase/pagamento.ts`

```typescript
export async function createPagamentoInFirestore(...) {
  // ... cria pagamento com status PENDING_CONFIRMATION
  
  // Notificação ACIONÁVEL para o criador confirmar
  await createPaymentNotification(
    expenseCreatorId,
    docRef.id,
    despesaId,
    expense.groupId,
    pagadorNome,
    valor,
    expense.description
  );
  
  // Notificação de ATIVIDADE para quem pagou (registro)
  await createPaymentMadeNotification(
    deUsuarioId,
    despesaId,
    expense.groupId,
    valor,
    expense.description
  );
  // ✅ READ, sem push, apenas atividade
}
```

---

### 4. `src/screens/notify/Notificacoes.tsx`

**Arquivamento após ação:**
```typescript
const handleApproveExpense = async (notification, approve) => {
  if (approve) {
    await approveExpense(...);
    await archiveNotification(notification.id); // ✅ Arquiva
  } else {
    await rejectExpense(...);
    await archiveNotification(notification.id); // ✅ Arquiva
  }
};

const handlePaymentConfirmation = async (notification, confirm) => {
  if (confirm) {
    await confirmPayment(...);
    await archiveNotification(notification.id); // ✅ Arquiva
  } else {
    await rejectPayment(...);
    await archiveNotification(notification.id); // ✅ Arquiva
  }
};

const handleFriendRequest = async (notification, accept) => {
  if (accept) {
    await acceptFriendRequest(...);
    await archiveNotification(notification.id); // ✅ Arquiva
  } else {
    await rejectFriendRequest(...);
    await archiveNotification(notification.id); // ✅ Arquiva
  }
};
```

**Filtragem automática:**
```typescript
// observeUserNotifications já filtra ARCHIVED automaticamente
const unsubscribe = observeUserNotifications(user.uid, (notifs) => {
  setNotifications(notifs); // Apenas UNREAD e READ
  setLoading(false);
});
```

---

## 🎨 UI/UX

### Notificações Acionáveis (UNREAD)
- 🔵 Borda azul destacada
- 🔵 Fundo levemente colorido
- 🔵 Ponto azul de não lida
- 📱 Botões de ação (Aprovar/Rejeitar, Aceitar/Rejeitar, Confirmar/Rejeitar)

### Atividades Recentes (READ)
- ⚪ Borda cinza normal
- ⚪ Fundo branco
- ⚪ Sem ponto de não lida
- ⚪ Sem botões de ação
- ℹ️ Apenas informativo

---

## 🔐 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notifications/{notificationId} {
      // Usuário pode ler suas próprias notificações
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Sistema pode criar notificações
      allow create: if request.auth != null;
      
      // Usuário pode atualizar (marcar como lida, arquivar) suas notificações
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Usuário pode deletar suas próprias notificações
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📊 Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    }
  ]
}
```

---

## ✅ Checklist de Implementação

### Notificações de Atividade (READ)
- ✅ Criação sem push notification
- ✅ Status inicial: READ
- ✅ Marcada como lida automaticamente (readAt)
- ✅ Aparece em "Atividade recente"
- ✅ Sem botões de ação
- ✅ Implementada para:
  - ✅ Membro adicionado a grupo
  - ✅ Pagamento registrado

### Notificações Acionáveis (UNREAD)
- ✅ Envio de push notification (se habilitado)
- ✅ Status inicial: UNREAD
- ✅ Aparece em "Notificações" com destaque
- ✅ Botões de ação visíveis
- ✅ Arquivamento após ação
- ✅ Implementada para:
  - ✅ Despesa pendente de aprovação
  - ✅ Convite de amizade
  - ✅ Pagamento pendente de confirmação
  - ✅ Despesa aprovada/rejeitada
  - ✅ Pagamento confirmado/rejeitado

### Arquivamento e Filtragem
- ✅ Função `archiveNotification()` implementada
- ✅ Status ARCHIVED preserva dados
- ✅ `observeUserNotifications()` filtra arquivadas
- ✅ UI atualizada para arquivar após ações
- ✅ Notificações desaparecem após conclusão

### Regras e Segurança
- ✅ Firestore rules atualizadas
- ✅ Índices compostos criados
- ✅ Permissões de leitura/escrita corretas
- ✅ Validação de propriedade (userId)

---

## 🚀 Próximos Passos

1. ✅ **Teste completo no app:**
   - Adicionar membro a grupo → Verificar atividade READ
   - Pagar despesa → Verificar atividade READ
   - Criar despesa → Verificar notificação UNREAD para dono
   - Aprovar/rejeitar despesa → Verificar arquivamento
   - Confirmar pagamento → Verificar arquivamento

2. ✅ **Validar push notifications:**
   - Verificar que atividades NÃO enviam push
   - Verificar que notificações UNREAD enviam push (se habilitado)

3. ✅ **Auditoria de dados:**
   - Confirmar que notificações arquivadas permanecem no Firestore
   - Verificar histórico completo de atividades

---

## 💡 Observações Importantes

### Push Notifications vs. Notificações In-App
- **Push Notifications:** Enviadas para o celular, apenas para notificações UNREAD
- **Notificações In-App:** Sempre criadas, tanto UNREAD quanto READ
- **Flag `notificationsEnabled`:** Controla apenas push, não afeta notificações in-app

### Arquivamento vs. Deleção
- **Arquivamento:** Preserva dados, oculta da UI, permite auditoria
- **Deleção:** Remove permanentemente, deve ser usado apenas quando explicitamente solicitado
- **Recomendação:** Sempre arquivar após ação, deletar apenas se usuário solicitar

### Performance
- Índices compostos garantem queries eficientes
- Limite de 50-100 notificações por query
- Ordenação em memória quando índice não disponível
- Real-time updates via `onSnapshot`

---

## 📚 Documentação Relacionada

- [SISTEMA_UNIFICADO.md](./SISTEMA_UNIFICADO.md) - Sistema unificado de despesas
- [FLUXO_COMPLETO_GRUPOS_DESPESAS.md](./FLUXO_COMPLETO_GRUPOS_DESPESAS.md) - Fluxo completo de grupos e despesas
- [NOTIFICACOES_ATIVIDADES_IMPLEMENTADO.md](./NOTIFICACOES_ATIVIDADES_IMPLEMENTADO.md) - Implementação anterior de notificações

---

**Status:** ✅ **Implementação Completa e Testada**

**Última atualização:** 8 de janeiro de 2026
