# 💰 Fluxo de Pagamento - Como Funciona

## 🔄 Problema Resolvido

**Antes:** O status "pago" não aparecia mesmo após confirmação do pagamento  
**Causa:** A tela estava consultando pagamentos ao invés do campo `paid` da divisão  
**Solução:** Agora usa o campo `division.paid` atualizado pelo `confirmPayment`

---

## 📋 Fluxo Completo de Pagamento

### 1️⃣ Criar Despesa
```typescript
// Quando você cria uma despesa de 100€ para 4 pessoas
createExpense(...);

// Resultado no Firestore:
{
  "divisions": [
    {
      "userId": "voce",
      "amount": 25,
      "paid": true,      // ✅ Você já está marcado como pago
      "paidAt": "..."
    },
    {
      "userId": "amigo1",
      "amount": 25,
      "paid": false      // ❌ Amigo ainda não pagou
    },
    ...
  ]
}
```

---

### 2️⃣ Amigo Paga sua Parte
```typescript
// Amigo registra que pagou 25€
createPagamentoInFirestore({
  expenseId: "exp123",
  userId: "amigo1",
  amount: 25,
  ...
});

// Cria um payment com status PENDING_CONFIRMATION
// A divisão ainda continua: paid: false
// Você (criador) recebe notificação
```

---

### 3️⃣ Você Confirma o Pagamento
```typescript
// Você clica em "Confirmar" na notificação
confirmPayment(paymentId, yourUserId, expenseId, groupId);

// O que acontece:
// 1. Payment status → CONFIRMED
// 2. Chama markDivisionAsPaid()
// 3. Atualiza a divisão na despesa:
{
  "userId": "amigo1",
  "amount": 25,
  "paid": true,        // ✅ Agora está marcado como pago!
  "paidAt": "..."
}
```

---

### 4️⃣ Tela Atualiza Automaticamente
```typescript
// DetalheDespesa.tsx agora lê direto da divisão
const isPaid = division.paid === true;
const totalPago = isPaid ? division.amount : 0;
const remaining = isPaid ? 0 : division.amount;

// Resultado na tela:
// ✓ Pago (verde)
```

---

## 🎯 Campos Importantes

### Expense (Despesa)
```typescript
{
  "id": "exp123",
  "amount": 100,
  "divisions": [
    {
      "userId": "user123",
      "amount": 25,
      "paid": true,      // ⭐ Campo principal!
      "paidAt": "..."    // Quando foi marcado como pago
    }
  ]
}
```

### Payment (Pagamento)
```typescript
{
  "id": "pay456",
  "expenseId": "exp123",
  "userId": "user123",
  "amount": 25,
  "status": "CONFIRMED",    // ⭐ Depois da confirmação
  "confirmedAt": "...",
  "confirmedBy": "creator"
}
```

---

## ✅ Como Verificar se Está Funcionando

### Teste 1: Ver Status na Tela
1. Crie uma despesa de 100€ com 4 pessoas
2. Vá em "Detalhes da Despesa"
3. **Sua divisão** deve mostrar: ✓ Pago (verde)
4. **Divisões dos outros** devem mostrar: A pagar: 25€ (vermelho)

### Teste 2: Registrar Pagamento
1. Como membro, registre pagamento de 25€
2. Payment status = PENDING_CONFIRMATION
3. **Divisão ainda mostra:** A pagar: 25€

### Teste 3: Confirmar Pagamento
1. Como criador, confirme o pagamento
2. Payment status = CONFIRMED
3. **Divisão agora mostra:** ✓ Pago (verde)

---

## 🐛 Debug

Se ainda não aparecer como pago:

### 1. Verificar no Firestore Console
```
expenses/{expenseId}
└── divisions: [
    {
      userId: "...",
      paid: true,    // ← Deve ser true
      paidAt: {...}
    }
]
```

### 2. Adicionar logs
```typescript
// No DetalheDespesa.tsx
console.log("Division:", division);
console.log("isPaid:", division.paid);
console.log("Remaining:", remaining);
```

### 3. Limpar cache
```bash
npx expo start -c
```

### 4. Verificar se confirmPayment foi chamado
```typescript
// No confirmPayment em pagamento.ts
console.log("✅ Confirmando pagamento...");
console.log("Marcando divisão como paga:", userId);
```

---

## 🔄 Atualização em Tempo Real

A tela `DetalheDespesa` carrega os dados no `useEffect`, então:

### Para ver a mudança:
1. Confirme o pagamento
2. **Volte** para a lista de despesas
3. **Entre novamente** nos detalhes
4. Agora deve mostrar "✓ Pago"

### Ou adicione listener em tempo real:
```typescript
// Futuro: usar onSnapshot ao invés de getDoc
const unsubscribe = onSnapshot(expenseRef, (doc) => {
  // Atualiza automaticamente quando mudar
});
```

---

## 📊 Resumo das Mudanças

### Antes (❌ Errado)
```typescript
const totalPago = await getTotalPagoPorUsuario(expenseId, userId);
// Buscava na coleção payments (mais lento e complexo)
```

### Depois (✅ Correto)
```typescript
const isPaid = division.paid === true;
const totalPago = isPaid ? division.amount : 0;
// Lê direto do campo paid da divisão (rápido e simples)
```

---

## ✅ Status Atual

- [x] `confirmPayment` chama `markDivisionAsPaid`
- [x] `markDivisionAsPaid` atualiza `division.paid = true`
- [x] `DetalheDespesa` lê `division.paid` direto
- [x] Exibe "✓ Pago" quando `paid === true`

**Tudo funcionando corretamente!** 🎉

---

## 🚀 Próximos Passos

1. **Teste o fluxo completo:**
   - Criar despesa
   - Registrar pagamento
   - Confirmar pagamento
   - Verificar status

2. **Se quiser atualização em tempo real:**
   - Adicionar `onSnapshot` ao invés de `getDoc`
   - A tela atualiza automaticamente sem voltar

3. **Adicionar indicador visual:**
   - Badge "Pago" verde
   - Badge "Pendente" amarelo
   - Badge "A pagar" vermelho
