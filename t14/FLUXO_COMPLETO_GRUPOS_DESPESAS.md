# Fluxo Completo de Grupos e Despesas - Sistema Unificado

## ✅ Sistema Completamente Unificado

**Coleções utilizadas:**
- ✅ `expenses` - Única coleção para despesas
- ✅ `payments` - Única coleção para pagamentos
- ❌ `despesa` - **REMOVIDA**
- ❌ `pagamentos` - **REMOVIDA**

---

## 📋 Fluxo Detalhado

### 1️⃣ Criação de Grupos

**Quem pode criar:** Qualquer usuário autenticado

**Processo:**
1. Usuário cria um grupo e se torna o `ownerId` (dono)
2. Adiciona membros ao grupo (`memberIds[]`)
3. Cada membro pode ver e participar do grupo

**Coleção:** `group`

**Campos principais:**
```typescript
{
  id: string;
  name: string;
  ownerId: string;           // Dono do grupo
  memberIds: string[];       // IDs dos membros
  balances: {                // Saldos de cada membro
    [userId]: number
  };
  createdAt: Timestamp;
}
```

---

### 2️⃣ Criação de Despesas

**Quem pode criar:** Qualquer membro do grupo

**Processo:**
1. Membro cria uma despesa no grupo
2. Define o valor total e a divisão (igual ou customizada)
3. Despesa fica com status `PENDING_APPROVAL`
4. Notificação é enviada ao **dono do grupo** para aprovação

**Importante:** 
- Quem cria a despesa (`createdBy`) é quem **pagou** tudo (`paidBy`)
- A divisão do criador já vem marcada como `paid: true` por padrão
- Exemplo: Jantar de 100€ com 4 pessoas = 25€ por pessoa
  - O criador pagou 100€ e sua parte (25€) já está paga
  - Os outros 3 amigos devem 25€ cada

**Coleção:** `expenses`

**Campos principais:**
```typescript
{
  id: string;
  groupId: string;
  createdBy: string;         // Quem criou = quem pagou tudo
  paidBy: string;            // Mesma pessoa que createdBy
  description: string;
  amount: number;            // Valor total (ex: 100€)
  divisionType: "EQUAL" | "CUSTOM" | "PERCENTAGE";
  divisions: [               // Como foi dividido
    {
      userId: string;
      amount: number;        // Ex: 25€
      paid: boolean;         // true se for o criador
      paidAt?: Timestamp;
    }
  ];
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: Timestamp;
}
```

---

### 3️⃣ Aprovação de Despesas

**Quem pode aprovar:** Apenas o **dono do grupo** (`ownerId`)

**Processo:**
1. Dono recebe notificação de nova despesa
2. Pode aprovar ou rejeitar
3. Se aprovado:
   - Status muda para `APPROVED`
   - Saldos do grupo são atualizados
   - Notificação é enviada ao criador
4. Se rejeitado:
   - Status muda para `REJECTED`
   - Notificação de rejeição é enviada

**Funções:**
- `approveExpense(expenseId, approvedBy, groupId)`
- `rejectExpense(expenseId, rejectedBy, reason)`

---

### 4️⃣ Pagamento de Despesas

**Quem pode pagar:** Qualquer membro do grupo que tenha uma divisão

**Processo:**
1. Membro vê sua parte na despesa (ex: 25€)
2. Realiza o pagamento (PIX, transferência, etc.)
3. Registra o pagamento no app
4. Status do pagamento: `PENDING_CONFIRMATION`
5. Notificação é enviada ao **criador da despesa** para confirmar

**Coleção:** `payments`

**Campos principais:**
```typescript
{
  id: string;
  expenseId: string;         // Despesa relacionada
  userId: string;            // Quem está pagando
  amount: number;            // Valor pago
  paymentMethod: string;     // PIX, transferência, etc.
  comment: string;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED";
  createdBy: string;
  createdAt: Timestamp;
}
```

---

### 5️⃣ Confirmação de Pagamentos

**Quem pode confirmar:** Apenas o **criador da despesa** (`createdBy`)

**Processo:**
1. Criador recebe notificação de pagamento
2. Verifica se recebeu o valor (ex: PIX recebido)
3. Confirma ou rejeita o pagamento
4. Se confirmado:
   - Status muda para `CONFIRMED`
   - A divisão é marcada como `paid: true` na despesa
   - Saldos do grupo são atualizados
   - Notificação de confirmação enviada ao pagador
5. Se rejeitado:
   - Status muda para `REJECTED`
   - Notificação de rejeição enviada

**Funções:**
- `confirmPayment(paymentId, confirmedBy, expenseId, groupId)`
- `rejectPayment(paymentId, rejectedBy)`

---

### 6️⃣ Cálculo do Total Mensal na Home

**O que é calculado:** Soma de **tudo** que o usuário pagou no mês

**Inclui:**
1. ✅ Despesas criadas pelo usuário (valor total das despesas)
2. ✅ Pagamentos confirmados em despesas de outros usuários

**Exemplo prático:**
- Usuário criou despesa de 100€ (jantar) → **+100€**
- Usuário pagou 25€ de despesa do amigo (confirmado) → **+25€**
- **Total do mês: 125€**

**Função:**
```typescript
getTotalPaidByUserInMonth(userId: string, year: number, month: number)
```

**Como funciona:**
1. Busca todas as despesas criadas pelo usuário no mês
   - Status = `APPROVED`
   - Soma os valores totais
2. Busca todos os pagamentos confirmados do usuário no mês
   - Status = `CONFIRMED`
   - Soma os valores pagos
3. Retorna o total

---

## 🔐 Regras de Segurança (Firestore)

### Expenses (Despesas)
```javascript
match /expenses/{expenseId} {
  // Membros podem ler despesas do grupo
  allow read: if isGroupMember(resource.data.groupId);
  
  // Membros podem criar despesas
  allow create: if isGroupMember(request.resource.data.groupId);
  
  // Apenas dono do grupo pode aprovar/rejeitar
  allow update: if isGroupOwner(resource.data.groupId);
  
  // Criador ou dono podem deletar
  allow delete: if isCreatorOrOwner();
}
```

### Payments (Pagamentos)
```javascript
match /payments/{paymentId} {
  // Pode ler se for o pagador, criador da despesa ou recebedor
  allow read: if isRelatedToPayment();
  
  // Pode criar se for membro do grupo
  allow create: if isGroupMember() && isSelfPaying();
  
  // Apenas criador da despesa pode confirmar/rejeitar
  allow update: if isExpenseCreator();
  
  // Pode deletar próprios pagamentos pendentes
  allow delete: if isOwner() && isPending();
}
```

---

## 📊 Estrutura de Dados Completa

### Expense (Despesa Aprovada)
```json
{
  "id": "exp123",
  "groupId": "grp456",
  "createdBy": "user789",
  "paidBy": "user789",
  "description": "Jantar no restaurante",
  "amount": 100,
  "currency": "EUR",
  "divisionType": "EQUAL",
  "divisions": [
    {
      "userId": "user789",
      "amount": 25,
      "paid": true,
      "paidAt": "2026-01-07T10:00:00Z"
    },
    {
      "userId": "user001",
      "amount": 25,
      "paid": false
    },
    {
      "userId": "user002",
      "amount": 25,
      "paid": false
    },
    {
      "userId": "user003",
      "amount": 25,
      "paid": false
    }
  ],
  "status": "APPROVED",
  "createdAt": "2026-01-07T10:00:00Z",
  "approvedAt": "2026-01-07T10:05:00Z",
  "approvedBy": "groupOwner123"
}
```

### Payment (Pagamento Confirmado)
```json
{
  "id": "pay456",
  "expenseId": "exp123",
  "userId": "user001",
  "amount": 25,
  "paymentMethod": "PIX",
  "comment": "Pago via PIX",
  "status": "CONFIRMED",
  "createdBy": "user001",
  "createdAt": "2026-01-07T12:00:00Z",
  "confirmedBy": "user789",
  "confirmedAt": "2026-01-07T12:05:00Z"
}
```

---

## 🚀 Funções Principais

### src/firebase/expense.ts
- ✅ `createExpense()` - Cria despesa pendente
- ✅ `approveExpense()` - Aprova despesa
- ✅ `rejectExpense()` - Rejeita despesa
- ✅ `markDivisionAsPaid()` - Marca divisão como paga
- ✅ `getTotalPaidByUserInMonth()` - Calcula total mensal

### src/firebase/pagamento.ts
- ✅ `createPagamentoInFirestore()` - Cria pagamento pendente
- ✅ `confirmPayment()` - Confirma pagamento
- ✅ `rejectPayment()` - Rejeita pagamento
- ✅ `getTotalPagoPorUsuario()` - Total pago por usuário em despesa

---

## ✅ Checklist de Implementação

- ✅ Modelo unificado usando apenas `expenses`
- ✅ Modelo unificado usando apenas `payments`
- ✅ Arquivo `despesa.ts` removido
- ✅ Divisões com campos `paid` e `paidAt`
- ✅ Criador da despesa marcado como pago por padrão
- ✅ Aprovação pelo dono do grupo
- ✅ Confirmação de pagamento pelo criador
- ✅ Cálculo correto do total mensal na Home
- ✅ Regras de segurança atualizadas
- ✅ Documentação completa

---

## 🔄 Próximos Passos

1. **Testar fluxo completo:**
   - Criar grupo
   - Criar despesa
   - Aprovar despesa
   - Pagar despesa
   - Confirmar pagamento
   - Verificar total na Home

2. **Migração de dados (se necessário):**
   - Migrar dados de `despesa` → `expenses`
   - Migrar dados de `pagamentos` → `payments`

3. **Deploy das regras:**
   - Aplicar `firestore.rules` no Firebase Console
   - Testar permissões

4. **Validação:**
   - Verificar cálculos
   - Testar notificações
   - Confirmar saldos dos grupos
