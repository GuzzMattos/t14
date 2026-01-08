# 📋 REGRAS DO FIRESTORE - MUDANÇAS E INSTRUÇÕES

## 🔴 Problema Identificado

Suas regras atuais têm um problema: a coleção `despesa` não está definida, causando o erro de permissão.

## ✅ Mudanças Aplicadas

### 1️⃣ Adicionada Coleção `despesa` (NOVA)

```javascript
// Coleção: despesa (modelo legado) - ADICIONADO
match /despesa/{despesaId} {
  // Mesmas regras da coleção expenses
  allow read: if isAuthenticated() && ...
  allow create: if isAuthenticated() && ...
  allow update: if isAuthenticated() && ... (apenas owner do grupo)
  allow delete: if isAuthenticated() && ... (criador ou owner)
}
```

### 2️⃣ Permissão de Delete em Pagamentos (ADICIONADO)

```javascript
// Adicionado no final da seção pagamentos:
allow delete: if isAuthenticated() && 
              resource != null &&
              resource.data.createdBy == request.auth.uid;
```

## 📝 Resumo das Coleções

| Coleção | Status | Permissões |
|---------|--------|------------|
| `users` | ✅ OK | Leitura própria + autenticados |
| `friends` | ✅ OK | Próprias amizades |
| `friendRequests` | ✅ OK | Próprias solicitações |
| `notifications` | ✅ OK | Próprias notificações |
| `group` | ✅ OK | Membros leem, owner gerencia |
| `expenses` | ✅ OK | Membros leem/criam, owner aprova |
| `despesa` | ✅ **ADICIONADO** | Mesmas regras de expenses |
| `pagamentos` | ✅ **CORRIGIDO** | Referência correta + delete |

## 🚀 Como Aplicar

### Passo a Passo:

1. **Acesse o Firebase Console:**
   - URL: https://console.firebase.google.com/

2. **Navegue até as Regras:**
   - Selecione seu projeto
   - Menu lateral: **Firestore Database**
   - Aba: **Regras**

3. **Copie as Regras:**
   - Abra o arquivo `FIRESTORE_RULES_COMPLETAS.txt`
   - Selecione TUDO (Cmd+A ou Ctrl+A)
   - Copie (Cmd+C ou Ctrl+C)

4. **Cole no Firebase:**
   - No editor de regras do Firebase Console
   - Selecione tudo que está lá (Cmd+A ou Ctrl+A)
   - Cole as novas regras (Cmd+V ou Ctrl+V)

5. **Publique:**
   - Clique no botão **"Publicar"** (canto superior direito)
   - Aguarde confirmação de sucesso

## ✅ Verificação Após Publicar

Teste no app:
- [ ] Consegue listar despesas de um grupo
- [ ] Consegue criar uma despesa
- [ ] Owner consegue aprovar/rejeitar despesa
- [ ] Consegue fazer pagamento de despesa aprovada
- [ ] Criador da despesa consegue confirmar pagamento

## 🔍 Se Ainda Houver Erros

1. **Verifique a data/hora de publicação:**
   - No console, veja quando foi a última atualização
   - Deve ser agora (hoje)

2. **Teste com o Simulador:**
   - No console: **Regras** → **Simulador de regras**
   - Tipo: `get`
   - Local: `/despesa/[qualquer-id]`
   - Autenticado: Sim
   - Execute e veja se passa

3. **Verifique os dados:**
   - Vá em **Data** (Dados)
   - Abra a coleção `despesa`
   - Verifique se os documentos têm o campo `groupId`

## 📄 Arquivo Gerado

O arquivo completo está em:
```
FIRESTORE_RULES_COMPLETAS.txt
```

Copie todo o conteúdo deste arquivo e cole no Firebase Console.

---

**⚠️ IMPORTANTE:** Após colar, clique em **Publicar** para as mudanças terem efeito!

## 🎯 Diferença Principal

**ANTES:** Tentava ler `/despesa` → ❌ Sem regras → Erro de permissão

**DEPOIS:** Tentava ler `/despesa` → ✅ Com regras → Sucesso!

---

**Status:** ✅ Regras geradas e prontas para aplicar  
**Próxima ação:** Copiar e colar no Firebase Console
