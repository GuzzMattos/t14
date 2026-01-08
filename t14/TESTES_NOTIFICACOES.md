# 🧪 Plano de Testes - Sistema de Notificações e Atividades

## 📋 Checklist de Testes

### ✅ Teste 1: Adicionar Membro a Grupo

**Objetivo:** Verificar que uma notificação de ATIVIDADE é criada (READ, sem push)

**Passos:**
1. Login como Usuário A
2. Criar ou abrir um grupo existente
3. Adicionar Usuário B ao grupo

**Resultado Esperado:**
- ✅ Usuário B recebe notificação com:
  - Tipo: "Adicionado a um grupo"
  - Status: READ (sem destaque visual)
  - Sem push notification no celular
  - Aparece em "Atividade recente"
  - Sem botões de ação
  - Mensagem: "[Nome do Usuário A] adicionou você ao grupo '[Nome do Grupo]'"

**Como Verificar:**
1. Login como Usuário B
2. Abrir tela de Notificações
3. Verificar que notificação aparece SEM borda azul
4. Verificar que não há botões de ação
5. Verificar que o celular NÃO recebeu push notification

---

### ✅ Teste 2: Pagar Despesa

**Objetivo:** Verificar que duas notificações são criadas:
- Atividade READ para quem pagou (sem push)
- Notificação UNREAD para criador confirmar (com push)

**Passos:**
1. Login como Usuário A
2. Criar despesa no grupo (Usuário A é criador)
3. Aguardar aprovação pelo dono do grupo
4. Login como Usuário B (membro do grupo)
5. Pagar a parte da despesa de Usuário B

**Resultado Esperado - Usuário B (quem pagou):**
- ✅ Recebe notificação de ATIVIDADE:
  - Tipo: "Pagamento registrado"
  - Status: READ (sem destaque)
  - Sem push notification
  - Mensagem: "Você pagou [valor]€ da despesa '[descrição]'"

**Resultado Esperado - Usuário A (criador):**
- ✅ Recebe notificação ACIONÁVEL:
  - Tipo: "Pagamento pendente de confirmação"
  - Status: UNREAD (com borda azul)
  - COM push notification (se habilitado)
  - Botões: "Rejeitar" e "Confirmar"
  - Mensagem: "[Nome do Usuário B] pagou [valor]€ da despesa '[descrição]'. Confirme o pagamento."

**Como Verificar:**
1. Login como Usuário B → Ver notificação de atividade (sem destaque)
2. Login como Usuário A → Ver notificação acionável (com destaque e botões)
3. Verificar celular do Usuário A para push notification

---

### ✅ Teste 3: Confirmar Pagamento

**Objetivo:** Verificar que notificação é arquivada após confirmação

**Passos:**
1. Continuando do Teste 2
2. Login como Usuário A (criador da despesa)
3. Abrir notificação de pagamento pendente
4. Clicar em "Confirmar"

**Resultado Esperado:**
- ✅ Notificação desaparece da lista imediatamente
- ✅ Status da notificação muda para ARCHIVED (verificar no Firestore)
- ✅ Usuário B recebe nova notificação UNREAD:
  - Tipo: "Pagamento confirmado"
  - Mensagem: "Seu pagamento de [valor]€ foi confirmado."

**Como Verificar:**
1. Confirmar pagamento
2. Verificar que notificação sumiu da tela
3. Abrir Firestore Console
4. Buscar notificação por ID
5. Verificar campo `status: "ARCHIVED"`
6. Login como Usuário B
7. Verificar notificação de confirmação

---

### ✅ Teste 4: Criar e Aprovar Despesa

**Objetivo:** Verificar fluxo completo de aprovação e arquivamento

**Passos:**
1. Login como Usuário A (membro do grupo, NÃO dono)
2. Criar despesa no grupo
3. Login como Dono do Grupo
4. Ver notificação de aprovação pendente
5. Aprovar despesa

**Resultado Esperado - Dono do Grupo:**
- ✅ Recebe notificação UNREAD:
  - Tipo: "Despesa pendente de aprovação"
  - Borda azul, destaque visual
  - Botões: "Rejeitar" e "Aprovar"
  - Push notification (se habilitado)

**Resultado Esperado - Após Aprovação:**
- ✅ Notificação do dono é arquivada (desaparece)
- ✅ Usuário A recebe notificação UNREAD:
  - Tipo: "Despesa aprovada"
  - Mensagem: "Sua despesa '[descrição]' foi aprovada e adicionada ao grupo."

---

### ✅ Teste 5: Rejeitar Despesa

**Passos:**
1. Repetir Teste 4, mas clicar em "Rejeitar"

**Resultado Esperado:**
- ✅ Notificação do dono é arquivada
- ✅ Usuário A recebe notificação UNREAD:
  - Tipo: "Despesa rejeitada"
  - Mensagem: "Sua despesa '[descrição]' foi rejeitada pelo dono do grupo."

---

### ✅ Teste 6: Convite de Amizade

**Objetivo:** Verificar arquivamento após aceitar/rejeitar

**Passos:**
1. Usuário A envia convite de amizade para Usuário B
2. Login como Usuário B
3. Ver notificação de convite
4. Aceitar convite

**Resultado Esperado:**
- ✅ Notificação UNREAD para Usuário B
- ✅ Botões: "Rejeitar" e "Aceitar"
- ✅ Push notification (se habilitado)
- ✅ Após aceitar: notificação é arquivada
- ✅ Amizade criada com sucesso

---

### ✅ Teste 7: Filtragem de Notificações Arquivadas

**Objetivo:** Verificar que notificações arquivadas não aparecem

**Passos:**
1. Realizar vários testes acima
2. Abrir tela de Notificações
3. Verificar lista

**Resultado Esperado:**
- ✅ Apenas notificações UNREAD e READ aparecem
- ✅ Notificações ARCHIVED não aparecem
- ✅ Real-time updates funcionando (onSnapshot)

**Como Verificar no Firestore:**
1. Abrir Firebase Console
2. Navegar para coleção `notifications`
3. Buscar por `userId` do usuário de teste
4. Verificar que existem notificações com `status: "ARCHIVED"`
5. Confirmar que essas NÃO aparecem no app

---

### ✅ Teste 8: Push Notifications

**Objetivo:** Verificar que apenas notificações UNREAD enviam push

**Configuração:**
- Habilitar notificações nas configurações do perfil
- Ter push token registrado

**Passos:**
1. Realizar Teste 1 (Adicionar membro) - NÃO deve enviar push
2. Realizar Teste 2 (Pagar despesa) - Criador DEVE receber push
3. Realizar Teste 4 (Criar despesa) - Dono DEVE receber push

**Resultado Esperado:**
- ✅ Atividades (READ): SEM push notification
  - Membro adicionado
  - Pagamento registrado
  
- ✅ Notificações (UNREAD): COM push notification
  - Despesa pendente de aprovação
  - Pagamento pendente de confirmação
  - Convite de amizade
  - Despesa aprovada/rejeitada
  - Pagamento confirmado/rejeitado

---

### ✅ Teste 9: Desabilitar Push Notifications

**Objetivo:** Verificar que notificações in-app continuam funcionando

**Passos:**
1. Abrir Perfil
2. Desabilitar "Notificações"
3. Realizar Teste 4 (Criar despesa)

**Resultado Esperado:**
- ✅ Notificação in-app criada normalmente (UNREAD)
- ✅ SEM push notification no celular
- ✅ Notificação aparece na tela de Notificações
- ✅ Botões de ação funcionam normalmente

---

### ✅ Teste 10: Logs de Debug

**Objetivo:** Verificar logs no console

**Como Verificar:**
1. Abrir console do React Native (terminal onde app está rodando)
2. Realizar ações que criam notificações
3. Buscar por:

```
✅ Notificação de atividade criada (membro adicionado) - sem push
✅ Notificação de atividade criada (pagamento registrado) - sem push
🔔 Enviando push notification para: [userId]
⚠️  Push notification não enviada - usuário desabilitou notificações: [userId]
```

---

## 📊 Resumo dos Tipos de Notificação

| Tipo | Status | Push | Botões | Exemplo |
|------|--------|------|--------|---------|
| **Atividade Recente** | READ | ❌ Não | ❌ Não | Membro adicionado, Pagamento registrado |
| **Notificação Acionável** | UNREAD | ✅ Sim* | ✅ Sim | Despesa pendente, Convite de amizade, Pagamento pendente |

\* Se `notificationsEnabled = true`

---

## 🔍 Verificação no Firestore

### Estrutura de Notificação de Atividade (READ)
```json
{
  "id": "ABC123",
  "userId": "user_b_id",
  "type": "MEMBER_ADDED",
  "status": "READ",
  "title": "Adicionado a um grupo",
  "message": "João adicionou você ao grupo \"Viagem 2026\"",
  "groupId": "group_123",
  "createdAt": "Timestamp",
  "readAt": "Timestamp"
}
```

### Estrutura de Notificação Acionável (UNREAD)
```json
{
  "id": "DEF456",
  "userId": "group_owner_id",
  "type": "EXPENSE_PENDING_APPROVAL",
  "status": "UNREAD",
  "title": "Despesa pendente de aprovação",
  "message": "Maria adicionou uma despesa de 50.00€: Jantar",
  "groupId": "group_123",
  "expenseId": "expense_456",
  "createdAt": "Timestamp"
}
```

### Estrutura de Notificação Arquivada
```json
{
  "id": "DEF456",
  "userId": "group_owner_id",
  "type": "EXPENSE_PENDING_APPROVAL",
  "status": "ARCHIVED",
  "title": "Despesa pendente de aprovação",
  "message": "Maria adicionou uma despesa de 50.00€: Jantar",
  "groupId": "group_123",
  "expenseId": "expense_456",
  "createdAt": "Timestamp",
  "readAt": "Timestamp"
}
```

---

## ✅ Checklist Final

- [ ] Teste 1: Adicionar membro (atividade READ)
- [ ] Teste 2: Pagar despesa (atividade READ + notificação UNREAD)
- [ ] Teste 3: Confirmar pagamento (arquivamento)
- [ ] Teste 4: Aprovar despesa (arquivamento)
- [ ] Teste 5: Rejeitar despesa (arquivamento)
- [ ] Teste 6: Convite de amizade (arquivamento)
- [ ] Teste 7: Filtragem de arquivadas
- [ ] Teste 8: Push notifications seletivas
- [ ] Teste 9: Desabilitar push (in-app continua)
- [ ] Teste 10: Logs de debug
- [ ] Verificação no Firestore
- [ ] Testes de performance (100+ notificações)

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: Notificação não desaparece após ação
**Solução:** Verificar que `archiveNotification()` está sendo chamada após a ação

### Problema: Push notification enviada para atividades
**Solução:** Verificar que funções de atividade NÃO chamam `createNotification()`, mas setam diretamente no Firestore com `setDoc()`

### Problema: Notificações arquivadas aparecem na lista
**Solução:** Verificar que `observeUserNotifications()` filtra `status !== "ARCHIVED"`

### Problema: Índices faltando no Firestore
**Solução:** Criar índices compostos conforme NOTIFICACOES_COMPLETO.md

---

**Data:** 8 de janeiro de 2026
**Status:** Pronto para testes
