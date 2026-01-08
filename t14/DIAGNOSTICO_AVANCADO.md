# 🔬 DIAGNÓSTICO AVANÇADO - Erro Persistente

## ❌ Problema:
Erro de permissão continua mesmo após aplicar as regras.

## 🔍 Vamos Investigar Passo a Passo

### ETAPA 1: Verificar Logs do Console

1. **Abra o Metro Bundler / Terminal do Expo**
2. **Procure por mensagens começando com:**
   - 🔍 Carregando despesa ID
   - 👤 Usuário atual
   - 📦 Despesa carregada
   - ❌ Erro ao carregar despesa

3. **Copie e cole aqui os logs que aparecem**

---

### ETAPA 2: Verificar Dados no Firestore

#### A. Verificar se a despesa existe

1. **Firebase Console** → Firestore → Data
2. **Abra a coleção:** `expenses`
3. **Procure pelo ID da despesa** que você está tentando abrir
4. **A despesa existe?**
   - ✅ **SIM** → Continue para B
   - ❌ **NÃO** → Problema: despesa não existe na coleção `expenses`

#### B. Verificar campo groupId

1. **Clique na despesa**
2. **Verifique se tem o campo:** `groupId`
3. **Copie o valor do `groupId`**
4. **Exemplo:** `groupId: "abc123xyz"`

#### C. Verificar se você é membro do grupo

1. **Volte para Data**
2. **Abra a coleção:** `group`
3. **Procure o grupo com o ID copiado** (do passo B)
4. **Abra o grupo**
5. **Veja o campo:** `memberIds` (é um array)
6. **Seu UID está neste array?**

#### D. Encontrar seu UID

1. **Firebase Console** → Authentication → Users
2. **Procure seu email**
3. **Copie o UID** (uma string longa tipo "xYz123AbC...")

---

### ETAPA 3: Verificar Regras Aplicadas

1. **Firebase Console** → Firestore → Regras
2. **Pressione Cmd+F ou Ctrl+F**
3. **Busque por:** `match /expenses/`
4. **Encontrou?**
   - ✅ **SIM** → Continue
   - ❌ **NÃO** → PROBLEMA AQUI! Regras não foram aplicadas

5. **Agora busque por:** `match /despesa/`
6. **Encontrou?**
   - ✅ **SIM** → Continue
   - ❌ **NÃO** → PROBLEMA AQUI! Regras não foram aplicadas

7. **Veja a data de publicação** (topo da página)
   - **É de hoje (7 jan 2026)?**
   - ✅ **SIM** → Regras OK
   - ❌ **NÃO** → Precisa publicar novamente

---

### ETAPA 4: Testar Regras com Simulador

1. **Firebase Console** → Firestore → Regras
2. **Clique em "Simulador de regras"** (Rules Playground)
3. **Configure:**
   ```
   Tipo de operação: get
   Local: /expenses/[ID_DA_SUA_DESPESA_AQUI]
   Usuário autenticado: Sim
   UID do Firebase: [SEU_UID_AQUI]
   ```
4. **Clique em "Executar"**
5. **Resultado:**
   - ✅ **Permitido** → Regras OK, problema pode ser outra coisa
   - ❌ **Negado** → PROBLEMA NAS REGRAS!

---

## 🎯 SOLUÇÕES BASEADAS NO DIAGNÓSTICO

### Cenário A: Despesa não existe em `expenses`

**Problema:** Suas despesas estão na coleção `despesa`, não `expenses`

**Solução:** Precisamos migrar ou ajustar o código

**Ação:**
```bash
# Me diga: Tem despesas na coleção 'despesa'?
# Vou ajustar o código para usar a coleção correta
```

---

### Cenário B: Seu UID não está em `memberIds`

**Problema:** Você não é membro do grupo

**Solução:**
1. Firebase Console → Firestore → Data
2. Abra a coleção `group`
3. Encontre o grupo
4. Edite o campo `memberIds`
5. Adicione seu UID ao array

**OU**

Entre no grupo novamente pelo app (peça para alguém te adicionar)

---

### Cenário C: Campo `groupId` está faltando

**Problema:** Despesa sem groupId

**Solução:**
1. Firebase Console → Firestore → Data
2. Abra a coleção `expenses`
3. Edite a despesa
4. Adicione campo `groupId` com o ID do grupo correto

---

### Cenário D: Regras não foram aplicadas

**Problema:** Regras antigas ainda ativas

**Solução:**
1. Copie NOVAMENTE o conteúdo de `FIRESTORE_RULES_COMPLETAS.txt`
2. Firebase Console → Firestore → Regras
3. Cole e substitua TUDO
4. **Importante:** Clique em "Publicar" e AGUARDE a confirmação
5. Feche o app completamente
6. Espere 30 segundos
7. Abra o app novamente

---

## 📊 TABELA DE DIAGNÓSTICO

| Verificação | Status | Ação se ❌ |
|-------------|--------|-----------|
| Despesa existe em `expenses` | ⬜ | Verificar coleção `despesa` |
| Despesa tem `groupId` | ⬜ | Adicionar campo no Firestore |
| Grupo existe | ⬜ | Criar grupo ou corrigir ID |
| Você está em `memberIds` | ⬜ | Adicionar UID ao grupo |
| Regras têm `match /expenses/` | ⬜ | Publicar regras novamente |
| Regras publicadas hoje | ⬜ | Publicar regras novamente |
| Simulador permite acesso | ⬜ | Revisar regras |

---

## 🆘 PRÓXIMOS PASSOS

**Por favor, execute e me informe:**

1. ✅ **Os logs do console** (🔍 Carregando despesa ID...)
2. ✅ **A despesa existe em `expenses`?** (SIM/NÃO)
3. ✅ **A despesa tem `groupId`?** (SIM/NÃO + valor)
4. ✅ **Você está em `memberIds` do grupo?** (SIM/NÃO)
5. ✅ **As regras têm `match /expenses/`?** (SIM/NÃO)
6. ✅ **Data de publicação das regras?** (data)

Com essas informações, posso te dar a solução exata!

---

## 🔧 TESTE RÁPIDO DE PERMISSÃO

Execute este teste no navegador (Console do Chrome/Safari):

1. Abra o app no navegador
2. Abra o **Console** (F12)
3. Tente acessar a despesa
4. Veja o erro completo no console
5. Me envie o erro completo

---

**Aguardando suas respostas para continuar o diagnóstico!**
