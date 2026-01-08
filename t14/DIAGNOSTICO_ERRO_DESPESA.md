# 🔧 DIAGNÓSTICO: Erro ao Carregar Despesa

## ❌ Erro Atual:
```
Erro ao carregar despesa: [FirebaseError: Missing or insufficient permissions.]
```

## 🔍 DIAGNÓSTICO: 2 Causas Possíveis

### ✅ PASSO 1: Verificar se as Regras Foram Aplicadas

**VOCÊ JÁ APLICOU AS REGRAS NO FIREBASE CONSOLE?**

- [ ] **NÃO** → Vá para **SOLUÇÃO A**
- [ ] **SIM** → Vá para **SOLUÇÃO B**

---

## 🎯 SOLUÇÃO A: Aplicar Regras do Firestore

### Se você ainda NÃO aplicou as regras:

1. **Abra:** https://console.firebase.google.com/
2. **Selecione** seu projeto
3. **Vá em:** Firestore Database → **Regras**
4. **Copie** todo conteúdo de `FIRESTORE_RULES_COMPLETAS.txt`
5. **Cole** no editor (substituindo tudo)
6. **Clique em "Publicar"**
7. **Aguarde** a confirmação de sucesso
8. **Teste** o app novamente

---

## 🎯 SOLUÇÃO B: Verificar Qual Coleção Está Sendo Usada

### Se você JÁ aplicou as regras mas o erro persiste:

**Suas despesas estão na coleção `expenses` ou `despesa`?**

#### Como Verificar:

1. **Firebase Console** → Firestore Database → **Data**
2. Procure pelas coleções:
   - Tem coleção `expenses`? 
   - Tem coleção `despesa`?
   - Qual tem seus dados?

#### Se suas despesas estão em `despesa`:

Você tem 2 opções:

##### Opção 1: Migrar dados para `expenses` (recomendado)
```
Copiar todos documentos de 'despesa' para 'expenses'
```

##### Opção 2: Ajustar código para usar `despesa` (rápido)
Execute o comando abaixo para eu ajustar o código:

---

## 🔬 TESTE RÁPIDO: Verificar Regras no Firebase

1. **Firebase Console** → Firestore → **Regras**
2. Procure pela seção: `match /expenses/{expenseId}`
3. **Está lá?** 
   - ✅ SIM → Regras OK
   - ❌ NÃO → Precisa aplicar regras (SOLUÇÃO A)

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute estes passos em ordem:

### 1. Verificar Regras Publicadas
- [ ] Acesse Firebase Console → Firestore → Regras
- [ ] Veja a data da última publicação
- [ ] Deve ser hoje (7 de janeiro de 2026)
- [ ] Se não for, aplique as regras (SOLUÇÃO A)

### 2. Verificar Coleção de Dados
- [ ] Acesse Firebase Console → Firestore → Data
- [ ] Anote qual coleção tem suas despesas:
  - [ ] `expenses` (modelo novo)
  - [ ] `despesa` (modelo antigo)
  - [ ] Ambas (sistema misto)

### 3. Verificar Campos da Despesa
- [ ] Abra uma despesa no Firebase
- [ ] Verifique se tem o campo `groupId`
- [ ] Verifique se o valor de `groupId` está correto

### 4. Verificar Membership no Grupo
- [ ] Abra o grupo no Firebase (use o `groupId` da despesa)
- [ ] Verifique se o array `memberIds` contém seu UID
- [ ] Seu UID está em: Firebase Console → Authentication → Users

---

## 🚨 AÇÃO IMEDIATA

**Me informe:**

1. ✅ Você JÁ aplicou as regras no Firebase Console?
   - [ ] SIM
   - [ ] NÃO

2. ✅ Suas despesas estão em qual coleção?
   - [ ] `expenses`
   - [ ] `despesa`
   - [ ] Não sei / Preciso verificar

Com essas informações, posso te dar a solução exata!

---

## 🎬 SOLUÇÃO RÁPIDA (Provavelmente é isso):

**90% de chance:** Você precisa aplicar as regras no Console.

**Faça agora:**
1. Abra `FIRESTORE_RULES_COMPLETAS.txt`
2. Copie TUDO (Cmd+A, Cmd+C)
3. Console Firebase → Firestore → Regras
4. Cole (Cmd+V)
5. Publicar
6. Teste o app

**Se ainda der erro após isso, me avise com:**
- Screenshot das regras publicadas
- Nome da coleção onde estão suas despesas
