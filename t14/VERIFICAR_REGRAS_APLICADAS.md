# 🧪 TESTE DE VERIFICAÇÃO - Regras Aplicadas?

## Como Saber se as Regras Foram Aplicadas

### ✅ Método 1: Verificar Data de Publicação

1. **Firebase Console** → Firestore → Regras
2. Olhe para o topo da página
3. Veja: "Última publicação: [DATA]"
4. **Deve mostrar:** 7 de janeiro de 2026 (hoje)
5. **Se mostrar data antiga:** Regras NÃO foram aplicadas

---

### ✅ Método 2: Procurar a Seção `despesa`

1. **Firebase Console** → Firestore → Regras
2. No editor, pressione **Cmd+F** ou **Ctrl+F**
3. Busque por: `match /despesa/`
4. **Encontrou?**
   - ✅ **SIM** → Regras aplicadas!
   - ❌ **NÃO** → Regras NÃO foram aplicadas

---

### ✅ Método 3: Usar o Simulador de Regras

1. **Firebase Console** → Firestore → Regras
2. Clique em **"Simulador de regras"** (Rules Playground)
3. Configure:
   ```
   Tipo: get
   Local: /despesa/teste123
   Usuário autenticado: SIM
   ```
4. Clique em **"Executar"**
5. **Resultado esperado:** 
   - ⚠️ Algum erro relacionado ao documento não existir (OK!)
   - ✅ OU "Permitted" / "Permitido"
   - ❌ "Missing or insufficient permissions" → Regras NÃO aplicadas

---

### ✅ Método 4: Verificar no Código-Fonte

1. **Firebase Console** → Firestore → Regras
2. Role até encontrar: `match /expenses/{expenseId}`
3. Logo abaixo, deve ter: `match /despesa/{despesaId}`
4. **Tem as duas seções?**
   - ✅ **SIM** → Correto!
   - ❌ **NÃO** → Falta aplicar

---

## 🎯 Checklist Rápido

Execute esta verificação no Firebase Console:

- [ ] **Regras → Data de publicação = HOJE**
- [ ] **Buscar "match /despesa/" = ENCONTRADO**
- [ ] **Simulador → get /despesa/teste = NÃO dá erro de permissão**
- [ ] **Tem seção "expenses" E "despesa"**

**Se todos ✅ = Regras aplicadas corretamente!**

---

## 🔍 O Que Procurar nas Regras

Seu arquivo de regras DEVE conter estas 3 seções:

### 1. Coleção: expenses ✅
```javascript
match /expenses/{expenseId} {
  allow read: if isAuthenticated() && ...
  // ... mais regras
}
```

### 2. Coleção: despesa ✅ (IMPORTANTE!)
```javascript
match /despesa/{despesaId} {
  allow read: if isAuthenticated() && ...
  // ... mais regras
}
```

### 3. Coleção: pagamentos ✅
```javascript
match /pagamentos/{paymentId} {
  allow read: if isAuthenticated() && ...
  // ... mais regras
}
```

**Se falta alguma seção:** Regras NÃO foram aplicadas corretamente!

---

## 🚨 Após Aplicar as Regras

**IMPORTANTE:** 

1. Feche o app completamente (não apenas minimizar)
2. Espere 10 segundos
3. Abra o app novamente
4. Teste a funcionalidade

**Por quê?** O app pode ter cache das regras antigas.

---

## 📱 Teste no App

Após aplicar regras, teste:

1. ✅ Login no app
2. ✅ Ver lista de grupos
3. ✅ Entrar em um grupo
4. ✅ Ver lista de despesas
5. ✅ **CLICAR EM UMA DESPESA** ← O erro está aqui
6. ✅ Deve mostrar detalhes e divisões

**Se passo 5 ainda der erro:**
- Regras não foram aplicadas OU
- Despesas estão em coleção diferente

---

## 🆘 Se AINDA der erro após aplicar

Execute este diagnóstico:

1. **Qual coleção tem suas despesas?**
   - Firebase Console → Firestore → Data
   - Procure por: `expenses` ou `despesa`
   - Anote qual tem documentos

2. **Verifique uma despesa:**
   - Clique em um documento de despesa
   - Tem campo `groupId`? (deve ter)
   - Copie o valor do `groupId`

3. **Verifique o grupo:**
   - Firebase Console → Firestore → Data
   - Abra coleção `group`
   - Procure pelo `groupId` copiado
   - Verifique array `memberIds`
   - Seu UID está na lista? (deve estar)

4. **Encontre seu UID:**
   - Firebase Console → Authentication → Users
   - Procure seu email
   - Copie o UID
   - Compare com `memberIds` do grupo

**Se seu UID NÃO está em `memberIds`:**
- Problema: Você não é membro do grupo
- Solução: Adicione seu UID ao array `memberIds`

---

## 💡 RESUMO

**90% dos casos:** Basta aplicar as regras no Console

**10% dos casos:** Problema de dados (UID não está no grupo)

**Próximo passo:** Aplique as regras e teste!
