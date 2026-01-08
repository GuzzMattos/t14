# Fluxo de Aprovação de Despesas e Pagamentos

## Resumo das Implementações

Este documento descreve o sistema de aprovação de despesas e pagamentos implementado no aplicativo.

---

## 1. Sistema de Aprovação de Despesas

### 1.1 Modelo de Dados (`Despesa`)

**Arquivo:** `src/types/Despesa.ts`

Adicionado:
- Tipo `DespesaStatus` com valores: `"PENDING_APPROVAL"`, `"APPROVED"`, `"REJECTED"`
- Campo `status?: DespesaStatus` no tipo `Despesa`

### 1.2 Criação de Despesas

**Arquivo:** `src/firebase/despesa.ts`

Quando uma despesa é criada:
1. O status é definido como `"PENDING_APPROVAL"`
2. O sistema busca o `ownerId` do grupo (criador do grupo)
3. Uma notificação é enviada para o owner do grupo aprovar a despesa
4. A despesa fica pendente até ser aprovada ou rejeitada

**Funções implementadas:**

```typescript
// Criar despesa (status = PENDING_APPROVAL)
createDespesaInFirestore(payload)

// Aprovar despesa (apenas owner do grupo)
aprovarDespesa(despesaId)

// Rejeitar despesa (apenas owner do grupo)
rejeitarDespesa(despesaId)

// Buscar despesas pendentes
getDespesasPendentesAprovacao(groupId)

// Buscar apenas despesas aprovadas
getDespesasAprovadas(groupId)
```

### 1.3 Notificações

**Arquivo:** `src/firebase/notification.ts`

Três tipos de notificações são enviadas:

1. **EXPENSE_PENDING_APPROVAL** - Enviada para o owner do grupo quando uma despesa é criada
2. **EXPENSE_APPROVED** - Enviada para o criador da despesa quando ela é aprovada
3. **EXPENSE_REJECTED** - Enviada para o criador da despesa quando ela é rejeitada

---

## 2. Sistema de Aprovação de Pagamentos

### 2.1 Validação de Despesas Aprovadas

**Arquivo:** `src/firebase/pagamento.ts`

Antes de criar um pagamento:
1. O sistema verifica se a despesa está aprovada (`status === "APPROVED"`)
2. Se não estiver aprovada, lança erro: `"Apenas despesas aprovadas podem receber pagamentos"`
3. Se aprovada, cria o pagamento com status `"PENDING_CONFIRMATION"`

### 2.2 Confirmação de Pagamentos

**Fluxo:**
1. Usuário faz um pagamento → Status: `"PENDING_CONFIRMATION"`
2. Notificação é enviada para o **criador da despesa** confirmar
3. Criador da despesa pode **confirmar** ou **rejeitar** o pagamento
4. Se confirmado → Status: `"CONFIRMED"` e saldos são atualizados
5. Se rejeitado → Status: `"REJECTED"` e saldos não são alterados

---

## 3. Interface de Usuário

### 3.1 Tela de Notificações

**Arquivo:** `src/screens/notify/Notificacoes.tsx`

Exibe notificações com botões de ação:

- **Despesas Pendentes**: Botões "Aprovar" e "Rejeitar"
- **Pagamentos Pendentes**: Botões "Confirmar" e "Rejeitar"
- **Convites de Amizade**: Botões "Aceitar" e "Rejeitar"

### 3.2 Tela de Detalhes da Despesa

**Arquivo:** `src/screens/groups/DetalheDespesa.tsx`

- Exibe o status da despesa (Aprovada, Pendente, Rejeitada)
- Só permite pagamentos para despesas aprovadas
- Mostra mensagem informativa se a despesa não estiver aprovada

### 3.3 Tela de Detalhes do Grupo

**Arquivo:** `src/screens/groups/DetalhesGrupo.tsx`

- Filtra e exibe apenas despesas aprovadas na lista
- Calcula totais considerando apenas despesas aprovadas

### 3.4 Tela Inicial (HomeScreen)

**Arquivo:** `src/screens/home/HomeScreen.tsx`

- Calcula "Despesas no mês" considerando apenas despesas aprovadas
- Filtra despesas pelo mês atual e status `"APPROVED"`

---

## 4. Funções de Cálculo Ajustadas

**Arquivo:** `src/firebase/despesa.ts`

Todas as funções de cálculo foram ajustadas para considerar apenas despesas aprovadas:

```typescript
// Total de despesas do grupo (apenas aprovadas)
getTotalDespesasGrupo(groupId)

// Total pago por usuário (apenas despesas aprovadas)
getTotalPagoPorUsuario(groupId, userId)
```

---

## 5. Fluxo Completo

### 5.1 Criação e Aprovação de Despesa

1. **Usuário A** cria uma despesa no **Grupo X**
2. Despesa é salva com status `"PENDING_APPROVAL"`
3. **Owner do Grupo X** recebe notificação
4. Owner acessa a tela de notificações
5. Owner clica em "Aprovar" ou "Rejeitar"
6. Se aprovado:
   - Status muda para `"APPROVED"`
   - **Usuário A** recebe notificação de aprovação
   - Despesa aparece na lista do grupo
7. Se rejeitado:
   - Status muda para `"REJECTED"`
   - **Usuário A** recebe notificação de rejeição
   - Despesa não aparece na lista do grupo

### 5.2 Criação e Confirmação de Pagamento

1. **Usuário B** acessa uma despesa **aprovada**
2. Usuário B clica em "Pagar"
3. Pagamento é criado com status `"PENDING_CONFIRMATION"`
4. **Criador da despesa** recebe notificação
5. Criador acessa a tela de notificações
6. Criador clica em "Confirmar" ou "Rejeitar"
7. Se confirmado:
   - Status muda para `"CONFIRMED"`
   - Saldos do grupo são atualizados
   - Pagamento é contabilizado
8. Se rejeitado:
   - Status muda para `"REJECTED"`
   - Saldos não são alterados
   - Pagamento não é contabilizado

---

## 6. Permissões

### Quem pode aprovar/rejeitar despesas?
- **Apenas o owner do grupo** (campo `ownerId` no tipo `Group`)

### Quem pode confirmar/rejeitar pagamentos?
- **Apenas o criador da despesa** (campo `createdBy` no tipo `Expense`)

---

## 7. Coleções no Firestore

### Sistema Atual (Modelo `Expense`)

- **Coleção:** `expenses`
- **Campos principais:**
  - `status`: `"PENDING_APPROVAL"`, `"APPROVED"`, `"REJECTED"`
  - `createdBy`: ID do criador da despesa
  - `groupId`: ID do grupo
  - `paidBy`: ID de quem pagou

### Sistema Legado (Modelo `Despesa`)

- **Coleção:** `despesa`
- **Campos principais:**
  - `status`: `"PENDING_APPROVAL"`, `"APPROVED"`, `"REJECTED"` (adicionado)
  - `createdBy`: ID do criador da despesa
  - `groupId`: ID do grupo
  - `pagador`: ID de quem pagou

**Nota:** O sistema usa principalmente o modelo `Expense` (coleção `expenses`), mas algumas partes antigas ainda usam o modelo `Despesa` (coleção `despesa`). Ambos foram ajustados para suportar o fluxo de aprovação.

---

## 8. Benefícios do Sistema

✅ **Controle**: Owner do grupo tem controle sobre quais despesas são adicionadas  
✅ **Transparência**: Todos os pagamentos precisam ser confirmados pelo criador da despesa  
✅ **Segurança**: Evita despesas indevidas ou pagamentos falsos  
✅ **Notificações**: Todos são notificados das ações importantes  
✅ **Histórico**: Status é rastreado para auditoria  

---

## 9. Próximos Passos Recomendados

1. **Migração**: Migrar todo o sistema legado (`despesa`) para o novo modelo (`expenses`)
2. **Regras Firestore**: Adicionar regras de segurança no Firestore para garantir que apenas owners possam aprovar despesas
3. **Timeout**: Implementar timeout automático para despesas/pagamentos pendentes (ex: rejeitar automaticamente após 7 dias)
4. **Dashboard**: Criar uma tela para o owner visualizar todas as despesas pendentes de aprovação
5. **Histórico**: Adicionar tela de histórico de aprovações/rejeições

---

**Data de Implementação:** Janeiro 2026  
**Desenvolvido por:** Sistema de IA  
