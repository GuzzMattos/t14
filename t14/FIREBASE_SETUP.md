# Configuração do Firebase

## Melhorias Implementadas

### 1. Sistema de Notificações Habilitado/Desabilitado
- Campo `notificationsEnabled` adicionado ao perfil do usuário
- Padrão: `true` (habilitado)
- Pode ser alterado no perfil do usuário
- As funções de notificação verificam automaticamente se estão habilitadas antes de criar

### 2. Queries Otimizadas
As queries foram otimizadas para evitar problemas com índices compostos:

#### Notificações
- `observeUserNotifications`: Busca sem `orderBy` e ordena em memória
- `getUserNotifications`: Tenta com `orderBy`, se falhar, ordena em memória

#### Amigos
- `getUserFriends`: Tenta query composta, se falhar, filtra em memória
- `getPendingFriendRequests`: Tenta query composta, se falhar, filtra em memória
- `sendFriendRequest`: Busca simplificada para evitar índices compostos

#### Despesas
- `getGroupExpenses`: Tenta com `orderBy`, se falhar, ordena em memória
- `observeGroupExpenses`: Busca sem `orderBy` e ordena em memória

### 3. Tratamento de Erros
Todas as queries agora têm tratamento de erro para:
- Falta de índices compostos (código `failed-precondition`)
- Fallback para ordenação/filtragem em memória
- Logs de aviso quando usa fallback

## Índices Opcionais (para melhor performance)

Se quiser criar índices compostos no Firebase Console para melhor performance:

### Coleção: notifications
- `userId` (ASC) + `createdAt` (DESC)

### Coleção: friends
- `userId` (ASC) + `status` (ASC)

### Coleção: friendRequests
- `toUserId` (ASC) + `status` (ASC)
- `fromUserId` (ASC) + `toUserId` (ASC)

### Coleção: expenses
- `groupId` (ASC) + `createdAt` (DESC)

**Nota:** Os índices não são obrigatórios - o código funciona sem eles, apenas com performance um pouco menor.

## Estrutura de Dados

### users
```typescript
{
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  phone?: string;
  avatar?: string;
  notificationsEnabled?: boolean; // NOVO
}
```

### notifications
```typescript
{
  id: string;
  userId: string;
  type: "EXPENSE_PENDING_APPROVAL" | "EXPENSE_APPROVED" | "EXPENSE_REJECTED" | "FRIEND_REQUEST" | "MEMBER_ADDED" | "PAYMENT_RECEIVED";
  status: "UNREAD" | "READ" | "ARCHIVED";
  title: string;
  message: string;
  groupId?: string;
  expenseId?: string;
  fromUserId?: string;
  friendRequestId?: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

### friends
```typescript
{
  id: string;
  userId: string;
  friendId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Timestamp;
}
```

### friendRequests
```typescript
{
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### expenses
```typescript
{
  id: string;
  groupId: string;
  createdBy: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  divisionType: "EQUAL" | "CUSTOM" | "PERCENTAGE";
  divisions: Array<{ userId: string; amount: number; percentage?: number }>;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
}
```

## Como Funciona

1. **Notificações**: Só são criadas se `notificationsEnabled === true` no perfil do usuário
2. **Queries**: Tentam usar índices quando disponíveis, mas funcionam sem eles
3. **Performance**: Com índices, mais rápido. Sem índices, funciona normalmente com ordenação em memória

