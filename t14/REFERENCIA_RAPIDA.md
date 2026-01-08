# 🚀 Referência Rápida - Sistema de Notificações

## 📌 Como Funciona (Simplificado)

### 1. Quando adiciono alguém a um grupo?
- ✅ A pessoa recebe **atividade** (sem push, sem botões)
- ✅ Aparece em "Atividade recente"
- ✅ Mensagem: "João adicionou você ao grupo 'X'"

### 2. Quando pago uma despesa?
- ✅ Eu recebo **atividade** (sem push, sem botões)
- ✅ Criador da despesa recebe **notificação** (com push*, com botões)
- ✅ Criador precisa confirmar meu pagamento
- ✅ Após confirmação, a notificação desaparece

### 3. Quando crio uma despesa?
- ✅ Dono do grupo recebe **notificação** (com push*, com botões)
- ✅ Dono pode aprovar ou rejeitar
- ✅ Após aprovação/rejeição, a notificação desaparece
- ✅ Recebo notificação do resultado

### 4. O que acontece após clicar em "Aprovar", "Confirmar", etc.?
- ✅ Notificação **desaparece imediatamente**
- ✅ Fica arquivada no Firestore (não deletada)
- ✅ Não aparece mais na lista

---

## 🎯 Tipos de Notificação

| O que aconteceu | Você recebe | Push? | Botões? | Desaparece? |
|----------------|-------------|-------|---------|-------------|
| Adicionado a grupo | Atividade | ❌ | ❌ | ❌ |
| Você pagou | Atividade | ❌ | ❌ | ❌ |
| Alguém pagou você | Notificação | ✅* | ✅ Confirmar/Rejeitar | ✅ Após ação |
| Alguém criou despesa | Notificação | ✅* | ✅ Aprovar/Rejeitar | ✅ Após ação |
| Convite de amizade | Notificação | ✅* | ✅ Aceitar/Rejeitar | ✅ Após ação |

\* Se notificações estiverem habilitadas

---

## 📂 Arquivos Importantes

### Lógica de Notificações
- `src/firebase/notification.ts` - Todas as funções de notificações
- `src/firebase/group.ts` - Adicionar membros
- `src/firebase/pagamento.ts` - Registrar pagamentos

### Tela de Notificações
- `src/screens/notify/Notificacoes.tsx` - UI e ações

### Documentação
- `NOTIFICACOES_COMPLETO.md` - Documentação técnica completa
- `TESTES_NOTIFICACOES.md` - Como testar tudo
- `RESUMO_FINAL.md` - Resumo executivo

---

## 🔧 Funções Principais

### Criar Atividade (Sem Push)
```typescript
// Membro adicionado
await createMemberAddedNotification(userId, groupId, groupName, addedByName);

// Pagamento registrado
await createPaymentMadeNotification(payerId, expenseId, groupId, amount, description);
```

### Criar Notificação (Com Push*)
```typescript
// Despesa pendente
await createExpenseApprovalNotification(ownerId, expenseId, groupId, payerName, amount, description);

// Pagamento pendente
await createPaymentNotification(creatorId, paymentId, expenseId, groupId, payerName, amount, description);

// Convite de amizade
await createFriendRequestNotification(toUserId, fromUserId, requestId, fromUserName);
```

### Arquivar Notificação
```typescript
await archiveNotification(notificationId);
```

---

## 🎨 Visual

### Atividade (READ)
```
┌─────────────────────────┐
│ 👥 Adicionado a grupo  │
│    Há 5 min            │
│    João adicionou...   │
└─────────────────────────┘
```

### Notificação (UNREAD)
```
┌═════════════════════════┐ ← Azul
║ 💰 Pagamento pendente ║ 🔵
║    Há 2 min           ║
║    Maria pagou...     ║
║ [Rejeitar] [Confirmar]║
└═════════════════════════┘
```

---

## ✅ Status do Projeto

- ✅ Implementação completa
- ✅ Sem erros TypeScript
- ✅ Documentação criada
- ⏳ Aguardando testes no app

---

## 🧪 Como Testar

Veja arquivo completo: `TESTES_NOTIFICACOES.md`

**Teste rápido:**
1. Adicione um usuário a um grupo → Veja atividade (sem destaque)
2. Pague uma despesa → Veja atividade (sem destaque)
3. Crie uma despesa → Dono vê notificação (com destaque e botões)
4. Aprove/rejeite → Notificação desaparece

---

**Pronto para usar!** 🎉
