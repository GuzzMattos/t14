# 📊 Atividades Recentes na Home - Apenas Grupos

## 🎯 Objetivo

Exibir na **Home** em "Atividade recente" apenas notificações relacionadas a **grupos**:
1. ✅ Quando você **cria um grupo**
2. ✅ Quando você é **adicionado a um grupo**

---

## ✅ Implementação

### 1. Novo Tipo de Notificação

**Arquivo:** `src/firebase/notification.ts`

```typescript
export type NotificationType = 
  | "EXPENSE_PENDING_APPROVAL" 
  | "EXPENSE_APPROVED" 
  | "EXPENSE_REJECTED" 
  | "FRIEND_REQUEST" 
  | "MEMBER_ADDED"         // ✅ Já existia
  | "GROUP_CREATED"        // ✅ NOVO
  | "PAYMENT_RECEIVED" 
  | "PAYMENT_PENDING_CONFIRMATION";
```

---

### 2. Função para Notificação de Grupo Criado

**Arquivo:** `src/firebase/notification.ts`

```typescript
/**
 * Cria notificação quando um grupo é criado (atividade recente)
 * Esta notificação serve como registro de atividade e NÃO envia push notification
 */
export async function createGroupCreatedNotification(
  userId: string,
  groupId: string,
  groupName: string
): Promise<string> {
  const notificationsRef = collection(db, "notifications");
  const notificationRef = doc(notificationsRef);
  const now = Timestamp.now();

  await setDoc(notificationRef, {
    id: notificationRef.id,
    userId,
    type: "GROUP_CREATED",
    status: "READ", // Já marcado como lido (apenas atividade)
    title: "Grupo criado",
    message: `Você criou o grupo "${groupName}"`,
    groupId,
    createdAt: now,
    readAt: now,
  });

  console.log("✅ Notificação de atividade criada (grupo criado) - sem push");
  return notificationRef.id;
}
```

**Características:**
- ✅ Status: `READ` (não requer ação)
- ✅ NÃO envia push notification
- ✅ Aparece apenas em atividades recentes

---

### 3. Integração ao Criar Grupo

**Arquivo:** `src/firebase/group.ts`

```typescript
export async function createGroupInFirestore({
  name,
  description = "",
  currency = "EUR",
  ownerId,
}: CreateGroupPayload) {
  const now = Timestamp.now();
  
  const groupData = {
    // ...dados do grupo
  };

  const ref = collection(db, "group");
  const docRef = await addDoc(ref, groupData);

  // ✅ NOVO: Criar notificação de atividade
  const { createGroupCreatedNotification } = await import("./notification");
  await createGroupCreatedNotification(ownerId, docRef.id, name);

  return docRef.id;
}
```

---

### 4. Filtro na Home

**Arquivo:** `src/screens/home/HomeScreen.tsx`

```typescript
// Carregar notificações recentes (apenas atividades de grupos)
useEffect(() => {
  if (!user) return;

  const unsubscribe = observeUserNotifications(user.uid, (notifs) => {
    // ✅ Filtrar apenas notificações de grupos
    const groupActivities = notifs.filter(
      (n) => n.type === "MEMBER_ADDED" || n.type === "GROUP_CREATED"
    );
    
    // Pegar as 5 mais recentes
    const recent = groupActivities
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 5);
    setNotifications(recent);
  });

  return unsubscribe;
}, [user]);
```

---

### 5. Exibição Melhorada

**Antes:**
- Título: "Adicionado a um grupo"
- Subtítulo: "Sistema • Há 2h"

**Depois:**
- Título: "Grupo criado"
- Mensagem: "Você criou o grupo 'Viagem 2026'"
- Subtítulo: "Viagem 2026 • Há 2h"

```typescript
// Mapear notificações para atividades
const activities = notifications.map((notif) => {
  // Encontrar o grupo relacionado
  const group = notif.groupId ? groups.find(g => g.id === notif.groupId) : null;
  const groupName = group?.name || "Grupo";
  
  return {
    id: notif.id,
    title: notif.title,
    message: notif.message,  // ✅ Exibe a mensagem completa
    group: groupName,        // ✅ Nome real do grupo
    time: formatTime(notif.createdAt),
  };
});
```

---

### 6. Visual Atualizado

**Componente ActivityItem:**

```tsx
function ActivityItem({ item }: { item: Activity }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={s.activityCard}>
      {/* Ícone de grupo */}
      <View style={s.avatar}>
        <Ionicons name="people-outline" size={20} color={colors.textDark} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{item.title}</Text>
        
        {/* Mensagem detalhada */}
        {item.message && (
          <Text style={s.activityBody}>{item.message}</Text>
        )}
        
        {/* Grupo e tempo */}
        <Text style={s.activitySub}>
          {item.group} • {item.time}
        </Text>
      </View>

      <Ionicons name="arrow-forward" size={18} color={colors.label} />
    </TouchableOpacity>
  );
}
```

---

## 📊 Tipos de Atividades na Home

| Tipo | Quando Aparece | Exemplo |
|------|---------------|---------|
| **GROUP_CREATED** | Você cria um grupo | "Você criou o grupo 'Viagem 2026'" |
| **MEMBER_ADDED** | Você é adicionado a um grupo | "João adicionou você ao grupo 'Jantar'" |

---

## 🚫 O Que NÃO Aparece na Home

As seguintes notificações **NÃO aparecem** em "Atividade recente" na Home:

- ❌ Despesas pendentes de aprovação
- ❌ Despesas aprovadas/rejeitadas
- ❌ Convites de amizade
- ❌ Pagamentos pendentes
- ❌ Pagamentos confirmados
- ❌ Pagamentos registrados

**Por quê?** Essas notificações aparecem apenas na tela de **Notificações** (aba dedicada).

---

## 🎨 Exemplos Visuais

### Home - Atividade Recente

```
┌────────────────────────────────────────┐
│ Atividade recente                     │
├────────────────────────────────────────┤
│ 👥  Grupo criado                      │
│     Você criou o grupo "Viagem 2026"  │
│     Viagem 2026 • Há 1h               │
├────────────────────────────────────────┤
│ 👥  Adicionado a um grupo             │
│     João adicionou você ao grupo      │
│     "Jantar"                          │
│     Jantar • Há 3h                    │
├────────────────────────────────────────┤
│ 👥  Grupo criado                      │
│     Você criou o grupo "Despesas Casa"│
│     Despesas Casa • Ontem             │
└────────────────────────────────────────┘
```

---

## 🔧 Ícones Utilizados

| Tipo | Ícone | Cor |
|------|-------|-----|
| GROUP_CREATED | `add-circle-outline` | Verde |
| MEMBER_ADDED | `people-outline` | Verde |

---

## ✅ Checklist de Implementação

- ✅ Tipo `GROUP_CREATED` adicionado
- ✅ Função `createGroupCreatedNotification()` criada
- ✅ Integração ao criar grupo
- ✅ Filtro na Home (apenas MEMBER_ADDED e GROUP_CREATED)
- ✅ Exibição do nome real do grupo
- ✅ Exibição da mensagem completa
- ✅ Ícone de grupo no avatar
- ✅ Ícone correto na tela de Notificações
- ✅ Sem erros TypeScript

---

## 🧪 Como Testar

### Teste 1: Criar Grupo

1. Login no app
2. Ir para **Grupos**
3. Clicar em "Criar Grupo"
4. Preencher nome: "Teste Atividade"
5. Salvar
6. Voltar para **Home**

**Resultado Esperado:**
```
👥 Grupo criado
   Você criou o grupo "Teste Atividade"
   Teste Atividade • Agora
```

---

### Teste 2: Ser Adicionado a Grupo

1. Usuário A cria grupo
2. Usuário A adiciona Usuário B ao grupo
3. Login como Usuário B
4. Ir para **Home**

**Resultado Esperado:**
```
👥 Adicionado a um grupo
   [Nome do Usuário A] adicionou você ao grupo "[Nome do Grupo]"
   [Nome do Grupo] • Há X min
```

---

### Teste 3: Outras Notificações NÃO Aparecem

1. Criar uma despesa
2. Enviar convite de amizade
3. Pagar uma despesa
4. Ir para **Home**

**Resultado Esperado:**
- ✅ "Atividade recente" mostra **APENAS** grupos criados/adicionados
- ✅ Outras notificações aparecem apenas na aba **Notificações**

---

## 📚 Arquivos Modificados

1. ✅ `src/firebase/notification.ts`
   - Tipo `GROUP_CREATED` adicionado
   - Função `createGroupCreatedNotification()` criada

2. ✅ `src/firebase/group.ts`
   - Integração com `createGroupCreatedNotification()`

3. ✅ `src/screens/home/HomeScreen.tsx`
   - Filtro para apenas atividades de grupos
   - Exibição do nome do grupo
   - Exibição da mensagem completa
   - Ícone de grupo no avatar

4. ✅ `src/screens/notify/Notificacoes.tsx`
   - Ícone para `GROUP_CREATED`

---

## 🎉 Conclusão

A Home agora exibe em "Atividade recente" **apenas** atividades relacionadas a grupos:

1. ✅ **Grupo criado** - Quando você cria um grupo
2. ✅ **Adicionado a um grupo** - Quando alguém te adiciona

Todas as outras notificações (despesas, pagamentos, convites) aparecem apenas na **tela de Notificações**.

**Status:** ✅ **Implementado e Pronto para Teste**

**Data:** 8 de janeiro de 2026
