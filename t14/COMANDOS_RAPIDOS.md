# 🚀 Comandos Rápidos - Sistema Unificado

## 📋 Verificação Rápida

### Verificar estrutura de arquivos
```bash
# Confirmar que arquivos legados foram removidos
ls src/firebase/despesa.ts 2>/dev/null && echo "❌ ERRO: despesa.ts ainda existe!" || echo "✅ despesa.ts removido"
ls src/services/despesa.ts 2>/dev/null && echo "❌ ERRO: despesa.ts ainda existe!" || echo "✅ despesa.ts removido"

# Verificar arquivos principais
ls src/firebase/expense.ts && echo "✅ expense.ts existe"
ls src/firebase/pagamento.ts && echo "✅ pagamento.ts existe"
ls firestore.rules && echo "✅ firestore.rules existe"
```

### Verificar erros TypeScript
```bash
npx tsc --noEmit 2>&1 | grep -E "(expense|pagamento|DespesaForm)" || echo "✅ Sem erros relacionados ao sistema unificado"
```

---

## 🔥 Firebase - Deploy

### 1. Fazer login no Firebase (se necessário)
```bash
firebase login
```

### 2. Inicializar projeto (se necessário)
```bash
firebase init
# Selecione: Firestore
```

### 3. Deploy apenas das regras
```bash
firebase deploy --only firestore:rules
```

### 4. Verificar regras aplicadas
```bash
firebase firestore:indexes
```

---

## 🧪 Testes Locais

### Executar app em desenvolvimento
```bash
# iOS
npm run ios

# Android
npm run android

# Expo
npx expo start
```

### Verificar logs
```bash
# Limpar cache
npx expo start -c

# Ver logs do app
npx react-native log-android
npx react-native log-ios
```

---

## 📊 Verificar Dados no Firestore

### Via Firebase Console
```
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá em: Firestore Database
4. Verifique as coleções:
   - expenses (deve existir)
   - payments (deve existir)
   - despesa (NÃO deve existir após migração)
   - pagamentos (NÃO deve existir após migração)
```

### Via código (debug)
Adicione no console para debug:

```typescript
// No console do app ou em um arquivo de teste
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Verificar expenses
const expensesSnap = await getDocs(collection(db, 'expenses'));
console.log('Total expenses:', expensesSnap.size);

// Verificar payments
const paymentsSnap = await getDocs(collection(db, 'payments'));
console.log('Total payments:', paymentsSnap.size);
```

---

## 🔄 Migração de Dados

### 1. Preparar ambiente
```bash
# Instalar Firebase Admin SDK
npm install firebase-admin --save-dev
```

### 2. Baixar credenciais
```
1. Firebase Console → Configurações do projeto
2. Contas de serviço
3. Gerar nova chave privada
4. Salvar como: serviceAccountKey.json
```

### 3. Executar migração
```bash
# Criar arquivo migrate.js (consulte MIGRACAO_DADOS.md)
node migrate.js
```

### 4. Verificar migração
```bash
# O script já faz verificação automática
# Mas você pode conferir manualmente no Firebase Console
```

---

## 🗑️ Limpeza (Após Migração)

### Remover dados antigos do Firestore
**⚠️ CUIDADO: Irreversível!**

```javascript
// Via Firebase Console:
// 1. Firestore Database
// 2. Selecione coleção "despesa"
// 3. Botão ⋮ → Excluir coleção
// 4. Repita para "pagamentos"

// Via código (se preferir):
const deleteDespesas = async () => {
  const snapshot = await getDocs(collection(db, 'despesa'));
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

const deletePagamentos = async () => {
  const snapshot = await getDocs(collection(db, 'pagamentos'));
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};
```

---

## 🐛 Debug Rápido

### Ver logs do Firebase
```bash
# Em tempo real
npx expo start --dev-client

# No console do navegador (Expo)
# Pressione: d (para abrir developer tools)
```

### Testar regras localmente
```bash
# Instalar emuladores
npm install -g firebase-tools

# Iniciar emuladores
firebase emulators:start --only firestore

# Testar regras
firebase emulators:exec --only firestore "npm test"
```

### Verificar permissões
```javascript
// No app, adicione logs para debug
try {
  await createExpense(...);
  console.log('✅ Despesa criada com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar despesa:', error.code, error.message);
  // error.code pode ser: 'permission-denied', 'not-found', etc.
}
```

---

## 📱 Testar Fluxo Completo

### Roteiro de Teste
```bash
# 1. Criar grupo
# - Usuário A cria grupo "Teste"
# - Adiciona usuário B, C, D
# ✅ Verificar: Usuário A = ownerId

# 2. Criar despesa
# - Usuário B cria despesa de 100€
# ✅ Verificar: status = PENDING_APPROVAL
# ✅ Verificar: divisão do B = paid: true
# ✅ Verificar: notificação para usuário A

# 3. Aprovar despesa
# - Usuário A aprova
# ✅ Verificar: status = APPROVED
# ✅ Verificar: notificação para usuário B
# ✅ Verificar: saldos atualizados

# 4. Pagar despesa
# - Usuário C registra pagamento de 25€
# ✅ Verificar: payment status = PENDING_CONFIRMATION
# ✅ Verificar: notificação para usuário B

# 5. Confirmar pagamento
# - Usuário B confirma
# ✅ Verificar: payment status = CONFIRMED
# ✅ Verificar: divisão do C = paid: true
# ✅ Verificar: notificação para usuário C

# 6. Verificar total na Home
# - Usuário B abre Home
# ✅ Verificar: Total = 100€ (despesa criada)
# - Usuário C abre Home
# ✅ Verificar: Total = 25€ (pagamento confirmado)
```

---

## 🆘 Resolução de Problemas

### Erro: "Permission denied"
```bash
# Solução: Verificar regras do Firestore
firebase deploy --only firestore:rules

# Ou aplicar manualmente no Firebase Console
```

### Erro: "Despesa não encontrada"
```bash
# Solução: Verificar se a migração foi feita
# Consultar: MIGRACAO_DADOS.md
```

### Erro: "Division paid is required"
```bash
# Solução: Já corrigido! Divisões agora incluem paid: false
# Se ainda aparecer, limpe cache:
npx expo start -c
```

### Erro: "Cannot find module despesa"
```bash
# Solução: Arquivos legados já foram removidos
# Se ainda aparecer:
# 1. Procure imports antigos
grep -r "from.*despesa" src/
# 2. Substitua por expense
```

---

## 📊 Monitoramento

### Ver estatísticas do Firestore
```bash
# Firebase Console → Firestore Database → Uso
# Verifique:
# - Leituras por dia
# - Gravações por dia
# - Exclusões por dia
```

### Ver logs de erro
```bash
# Firebase Console → Crashlytics (se configurado)
# Ou logs no console do app
```

---

## ✅ Checklist Rápido

### Antes do Deploy
- [ ] Arquivos legados removidos
- [ ] Sem erros TypeScript críticos
- [ ] Regras do Firestore atualizadas localmente
- [ ] Código commitado no Git

### Deploy
- [ ] Regras aplicadas no Firebase
- [ ] App testado em desenvolvimento
- [ ] Fluxo completo testado

### Pós-Deploy
- [ ] Dados migrados (se necessário)
- [ ] Coleções antigas removidas
- [ ] Notificações funcionando
- [ ] Total na Home correto

---

## 🎯 Comandos Mais Usados

```bash
# Iniciar app
npx expo start

# Limpar cache e reiniciar
npx expo start -c

# Deploy de regras
firebase deploy --only firestore:rules

# Ver erros TypeScript
npx tsc --noEmit

# Build para produção
eas build --platform ios
eas build --platform android
```

---

## 📞 Suporte

Se algo não funcionar:

1. **Verifique os logs:**
   ```bash
   npx expo start
   # Pressione: d (developer tools)
   ```

2. **Verifique as regras:**
   ```bash
   # Firebase Console → Firestore → Regras
   ```

3. **Verifique os dados:**
   ```bash
   # Firebase Console → Firestore Database
   ```

4. **Consulte a documentação:**
   - SISTEMA_UNIFICADO_COMPLETO.md
   - FLUXO_COMPLETO_GRUPOS_DESPESAS.md
   - RESUMO_VISUAL_FLUXO.md

---

## 🎉 Pronto!

Tudo configurado e pronto para usar! 🚀

Execute os comandos na ordem:
1. Verificação rápida
2. Deploy das regras
3. Testar fluxo completo
4. Migrar dados (se necessário)
5. Limpar dados antigos

Boa sorte! 🍀
