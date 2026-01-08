# Resumo Visual - Fluxo de Grupos e Despesas

## 📊 Fluxo Completo do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. CRIAÇÃO DO GRUPO                          │
│                                                                  │
│  Usuário A cria grupo "Amigos"                                  │
│  • Usuário A = ownerId (dono)                                   │
│  • Adiciona: Usuário B, C, D                                    │
│  • memberIds = [A, B, C, D]                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. CRIAÇÃO DA DESPESA                        │
│                                                                  │
│  Usuário B cria despesa: "Jantar - 100€"                        │
│  • createdBy = B (quem criou)                                   │
│  • paidBy = B (quem pagou tudo)                                 │
│  • amount = 100€                                                │
│  • divisionType = EQUAL                                         │
│  • divisions:                                                   │
│    - B: 25€ ✅ paid: true (automático)                          │
│    - A: 25€ ❌ paid: false                                      │
│    - C: 25€ ❌ paid: false                                      │
│    - D: 25€ ❌ paid: false                                      │
│  • status = PENDING_APPROVAL                                    │
│                                                                  │
│  📢 Notificação enviada ao ownerId (Usuário A)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. APROVAÇÃO DA DESPESA                      │
│                                                                  │
│  Usuário A (dono) recebe notificação                            │
│  • Revisa a despesa                                             │
│  • Clica em "Aprovar"                                           │
│  • status = APPROVED                                            │
│  • Saldos do grupo atualizados                                  │
│                                                                  │
│  📢 Notificação enviada ao Usuário B (aprovada)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    4. PAGAMENTO DA DESPESA                      │
│                                                                  │
│  Usuário C vê que deve 25€ ao Usuário B                         │
│  • Faz PIX de 25€ para B                                        │
│  • Registra pagamento no app                                    │
│  • Cria payment:                                                │
│    - expenseId = "jantar"                                       │
│    - userId = C                                                 │
│    - amount = 25€                                               │
│    - status = PENDING_CONFIRMATION                              │
│                                                                  │
│  📢 Notificação enviada ao Usuário B (confirmar)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  5. CONFIRMAÇÃO DO PAGAMENTO                    │
│                                                                  │
│  Usuário B recebe notificação                                   │
│  • Verifica que recebeu 25€ do C                                │
│  • Clica em "Confirmar"                                         │
│  • Payment status = CONFIRMED                                   │
│  • Divisão do C marcada: paid = true                            │
│  • Saldos atualizados no grupo                                  │
│                                                                  │
│  📢 Notificação enviada ao Usuário C (confirmado)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  6. CÁLCULO TOTAL NA HOME                       │
│                                                                  │
│  Usuário B abre a Home (Janeiro 2026)                           │
│  • Despesas criadas por B: 100€ (jantar)                        │
│  • Pagamentos confirmados de B: 0€                              │
│  • TOTAL: 100€                                                  │
│                                                                  │
│  Usuário C abre a Home (Janeiro 2026)                           │
│  • Despesas criadas por C: 0€                                   │
│  • Pagamentos confirmados de C: 25€ (jantar do B)               │
│  • TOTAL: 25€                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Exemplo Prático Completo

### Cenário: 4 amigos saem para jantar

**Participantes:**
- 👤 **Ana** - Dona do grupo
- 👤 **Bruno** - Pagou o jantar
- 👤 **Carlos** - Membro
- 👤 **Diana** - Membro

---

### 📅 Timeline

#### **Dia 1 - 18:00**
Ana cria o grupo "Amigos" e adiciona Bruno, Carlos e Diana.

**Estado do grupo:**
```json
{
  "id": "grp001",
  "name": "Amigos",
  "ownerId": "ana",
  "memberIds": ["ana", "bruno", "carlos", "diana"],
  "balances": {}
}
```

---

#### **Dia 1 - 20:00**
Bruno paga jantar de 100€ e cria a despesa no app.

**Despesa criada:**
```json
{
  "id": "exp001",
  "groupId": "grp001",
  "createdBy": "bruno",
  "paidBy": "bruno",
  "description": "Jantar no Italiano",
  "amount": 100,
  "divisionType": "EQUAL",
  "divisions": [
    { "userId": "bruno", "amount": 25, "paid": true, "paidAt": "2026-01-01T20:00:00Z" },
    { "userId": "ana", "amount": 25, "paid": false },
    { "userId": "carlos", "amount": 25, "paid": false },
    { "userId": "diana", "amount": 25, "paid": false }
  ],
  "status": "PENDING_APPROVAL"
}
```

**Notificação para Ana:**
> 🔔 Bruno adicionou uma despesa de 100.00€: Jantar no Italiano

---

#### **Dia 1 - 20:05**
Ana aprova a despesa.

**Despesa atualizada:**
```json
{
  "status": "APPROVED",
  "approvedBy": "ana",
  "approvedAt": "2026-01-01T20:05:00Z"
}
```

**Saldos do grupo:**
```json
{
  "balances": {
    "bruno": 75,    // Recebe 75€ (3 x 25€)
    "ana": -25,     // Deve 25€
    "carlos": -25,  // Deve 25€
    "diana": -25    // Deve 25€
  }
}
```

**Notificação para Bruno:**
> ✅ Sua despesa "Jantar no Italiano" foi aprovada

---

#### **Dia 2 - 10:00**
Carlos faz PIX de 25€ para Bruno e registra no app.

**Pagamento criado:**
```json
{
  "id": "pay001",
  "expenseId": "exp001",
  "userId": "carlos",
  "amount": 25,
  "paymentMethod": "PIX",
  "comment": "Pago via PIX",
  "status": "PENDING_CONFIRMATION",
  "createdAt": "2026-01-02T10:00:00Z"
}
```

**Notificação para Bruno:**
> 💰 Carlos pagou 25.00€ da despesa "Jantar no Italiano". Confirme o pagamento.

---

#### **Dia 2 - 10:05**
Bruno confirma o pagamento.

**Pagamento atualizado:**
```json
{
  "status": "CONFIRMED",
  "confirmedBy": "bruno",
  "confirmedAt": "2026-01-02T10:05:00Z"
}
```

**Divisão atualizada:**
```json
{
  "userId": "carlos",
  "amount": 25,
  "paid": true,
  "paidAt": "2026-01-02T10:05:00Z"
}
```

**Saldos atualizados:**
```json
{
  "balances": {
    "bruno": 50,    // Recebeu 25€, agora faltam 50€
    "ana": -25,
    "carlos": 0,    // Pagou sua parte
    "diana": -25
  }
}
```

**Notificação para Carlos:**
> ✅ Seu pagamento de 25.00€ foi confirmado.

---

#### **Dia 2 - 18:00**
Cada um abre a Home para ver quanto gastou em Janeiro.

**Home - Bruno:**
```
Total pago em Janeiro: 100€
• Jantar no Italiano: 100€ (criada por mim)
```

**Home - Carlos:**
```
Total pago em Janeiro: 25€
• Jantar no Italiano: 25€ (pago e confirmado)
```

**Home - Ana:**
```
Total pago em Janeiro: 0€
• Nenhuma despesa paga ainda
```

**Home - Diana:**
```
Total pago em Janeiro: 0€
• Nenhuma despesa paga ainda
```

---

## 📊 Resumo dos Estados

### Estados da Despesa (Expense)
- 🟡 `PENDING_APPROVAL` - Aguardando aprovação do dono
- 🟢 `APPROVED` - Aprovada, pode receber pagamentos
- 🔴 `REJECTED` - Rejeitada pelo dono

### Estados do Pagamento (Payment)
- 🟡 `PENDING_CONFIRMATION` - Aguardando confirmação do criador
- 🟢 `CONFIRMED` - Confirmado, saldos atualizados
- 🔴 `REJECTED` - Rejeitado pelo criador

### Estados da Divisão (Division)
- ❌ `paid: false` - Ainda não pago
- ✅ `paid: true` - Pago e confirmado

---

## 🎨 Visão das Telas

### 📱 Home Screen
```
┌─────────────────────────────────┐
│  Janeiro 2026                   │
│  ──────────────────────────────│
│  Total pago: 125€               │
│                                 │
│  Suas despesas:                 │
│  • Jantar: 100€ ✅              │
│                                 │
│  Pagamentos confirmados:        │
│  • Cinema (João): 25€ ✅        │
└─────────────────────────────────┘
```

### 📋 Detalhe da Despesa
```
┌─────────────────────────────────┐
│  Jantar no Italiano             │
│  100€ - 01/01/2026              │
│  ──────────────────────────────│
│  Divisão:                       │
│  ✅ Bruno: 25€ (Pago)           │
│  ✅ Carlos: 25€ (Pago)          │
│  ❌ Ana: 25€ (Pendente)         │
│  ❌ Diana: 25€ (Pendente)       │
│                                 │
│  [Solicitar Pagamento]          │
└─────────────────────────────────┘
```

### 🔔 Notificações
```
┌─────────────────────────────────┐
│  🔔 Notificações                │
│  ──────────────────────────────│
│  • Carlos pagou 25€             │
│    Confirme o pagamento         │
│    [Confirmar] [Rejeitar]       │
│                                 │
│  • Bruno adicionou despesa      │
│    100€ - Jantar                │
│    [Aprovar] [Rejeitar]         │
└─────────────────────────────────┘
```

---

## ✅ Resumo das Permissões

| Ação | Quem pode fazer |
|------|----------------|
| Criar grupo | Qualquer usuário |
| Adicionar membros | Dono do grupo |
| Criar despesa | Membros do grupo |
| Aprovar despesa | **Apenas dono do grupo** |
| Rejeitar despesa | **Apenas dono do grupo** |
| Registrar pagamento | Membros com divisão |
| Confirmar pagamento | **Apenas criador da despesa** |
| Rejeitar pagamento | **Apenas criador da despesa** |
| Ver total mensal | Próprio usuário |

---

## 🚀 Pronto para usar!

O sistema está **100% unificado** e pronto para:
- ✅ Criar grupos e despesas
- ✅ Aprovar despesas pelo dono
- ✅ Registrar e confirmar pagamentos
- ✅ Calcular totais mensais corretamente
- ✅ Gerenciar saldos entre amigos
