# Script de Migração - Despesas e Pagamentos

## ⚠️ ATENÇÃO: Execute este script apenas UMA VEZ

Este script migra dados das coleções antigas para as novas:
- `despesa` → `expenses`
- `pagamentos` → `payments`

---

## 📋 Pré-requisitos

1. Backup do banco de dados
2. Acesso admin ao Firestore
3. Node.js instalado

---

## 🔧 Script de Migração

Crie um arquivo `migrate.js` na raiz do projeto:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateDespesas() {
  console.log('🔄 Migrando despesas...');
  
  const despesaSnapshot = await db.collection('despesa').get();
  let count = 0;
  
  for (const doc of despesaSnapshot.docs) {
    const oldData = doc.data();
    
    // Converter para novo formato
    const newExpense = {
      id: doc.id,
      groupId: oldData.groupId,
      createdBy: oldData.createdBy || oldData.pagador,
      paidBy: oldData.pagador,
      description: oldData.descricao || oldData.description,
      amount: oldData.valorTotal || oldData.amount,
      currency: 'EUR',
      divisionType: oldData.abaTipo === 'Igual' ? 'EQUAL' : 'CUSTOM',
      divisions: (oldData.valoresIndividuais || []).map(pessoa => ({
        userId: pessoa.id,
        amount: pessoa.valor,
        paid: pessoa.id === oldData.pagador, // Criador já está pago
        paidAt: pessoa.id === oldData.pagador ? admin.firestore.Timestamp.now() : null,
      })),
      status: oldData.status || 'APPROVED',
      createdAt: oldData.createdAt || admin.firestore.Timestamp.now(),
      updatedAt: oldData.updatedAt || admin.firestore.Timestamp.now(),
      approvedAt: oldData.approvedAt || null,
      approvedBy: oldData.approvedBy || null,
    };
    
    // Salvar na nova coleção
    await db.collection('expenses').doc(doc.id).set(newExpense);
    count++;
    
    console.log(`  ✅ Migrada: ${newExpense.description} (${doc.id})`);
  }
  
  console.log(`✅ ${count} despesas migradas com sucesso!\n`);
}

async function migratePagamentos() {
  console.log('🔄 Migrando pagamentos...');
  
  const pagamentosSnapshot = await db.collection('pagamentos').get();
  let count = 0;
  
  for (const doc of pagamentosSnapshot.docs) {
    const oldData = doc.data();
    
    // Converter para novo formato
    const newPayment = {
      id: doc.id,
      expenseId: oldData.despesaId,
      userId: oldData.deUsuarioId,
      amount: oldData.valor,
      paymentMethod: oldData.metodoPagamento || 'Outro',
      comment: oldData.comentario || '',
      status: oldData.status || 'PENDING_CONFIRMATION',
      createdBy: oldData.createdBy || oldData.deUsuarioId,
      createdAt: oldData.createdAt || admin.firestore.Timestamp.now(),
      updatedAt: oldData.updatedAt || admin.firestore.Timestamp.now(),
      confirmedBy: oldData.confirmedBy || null,
      confirmedAt: oldData.confirmedAt || null,
    };
    
    // Salvar na nova coleção
    await db.collection('payments').doc(doc.id).set(newPayment);
    count++;
    
    console.log(`  ✅ Migrado: Pagamento ${doc.id}`);
  }
  
  console.log(`✅ ${count} pagamentos migrados com sucesso!\n`);
}

async function verifyMigration() {
  console.log('🔍 Verificando migração...\n');
  
  const oldDespesaCount = (await db.collection('despesa').get()).size;
  const newExpensesCount = (await db.collection('expenses').get()).size;
  
  const oldPagamentosCount = (await db.collection('pagamentos').get()).size;
  const newPaymentsCount = (await db.collection('payments').get()).size;
  
  console.log('📊 Resumo:');
  console.log(`  Despesas antigas: ${oldDespesaCount}`);
  console.log(`  Despesas novas: ${newExpensesCount}`);
  console.log(`  Pagamentos antigos: ${oldPagamentosCount}`);
  console.log(`  Pagamentos novos: ${newPaymentsCount}\n`);
  
  if (newExpensesCount >= oldDespesaCount && newPaymentsCount >= oldPagamentosCount) {
    console.log('✅ Migração verificada com sucesso!');
    console.log('\n⚠️  PRÓXIMO PASSO: Revise os dados e depois DELETE as coleções antigas:');
    console.log('   - despesa');
    console.log('   - pagamentos');
  } else {
    console.log('⚠️  ATENÇÃO: Alguns dados podem não ter sido migrados!');
  }
}

async function run() {
  try {
    await migrateDespesas();
    await migratePagamentos();
    await verifyMigration();
    
    console.log('\n✅ Migração concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

run();
```

---

## 🚀 Como Executar

### 1. Configurar credenciais

Baixe a chave de serviço do Firebase:
1. Acesse o Firebase Console
2. Configurações do projeto → Contas de serviço
3. Clique em "Gerar nova chave privada"
4. Salve como `serviceAccountKey.json` na raiz do projeto

### 2. Instalar dependências

```bash
npm install firebase-admin --save-dev
```

### 3. Executar migração

```bash
node migrate.js
```

### 4. Verificar dados

Acesse o Firestore Console e verifique:
- ✅ Coleção `expenses` com dados migrados
- ✅ Coleção `payments` com dados migrados
- ✅ Estrutura correta dos documentos

### 5. Deletar coleções antigas (APÓS VERIFICAR)

**⚠️ CUIDADO: Não faça isso até ter certeza que tudo foi migrado!**

No Firestore Console:
1. Selecione a coleção `despesa`
2. Clique em "Excluir coleção"
3. Confirme
4. Repita para `pagamentos`

---

## 🔍 Verificação Manual

### Antes da migração:
```javascript
// Contar documentos antigos
db.collection('despesa').get().then(snap => console.log('Despesas:', snap.size));
db.collection('pagamentos').get().then(snap => console.log('Pagamentos:', snap.size));
```

### Depois da migração:
```javascript
// Contar documentos novos
db.collection('expenses').get().then(snap => console.log('Expenses:', snap.size));
db.collection('payments').get().then(snap => console.log('Payments:', snap.size));
```

---

## ⚠️ Rollback (em caso de erro)

Se algo der errado:

1. **NÃO DELETE** as coleções antigas ainda
2. Delete as coleções novas:
   - `expenses`
   - `payments`
3. Execute o script novamente
4. Verifique os dados

---

## 📝 Notas

- O script preserva os IDs originais dos documentos
- Campos são convertidos automaticamente:
  - `descricao` → `description`
  - `valorTotal` → `amount`
  - `despesaId` → `expenseId`
  - `deUsuarioId` → `userId`
  - `valor` → `amount`
  - etc.
- Divisões do criador são marcadas como `paid: true`
- Timestamps são preservados quando existem
- Status são convertidos ou definidos como padrão

---

## ✅ Checklist Pós-Migração

- [ ] Backup feito
- [ ] Script executado
- [ ] Dados verificados no Console
- [ ] App testado com novos dados
- [ ] Regras do Firestore atualizadas
- [ ] Coleções antigas deletadas
- [ ] Credenciais admin removidas do código

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do script
2. Confira as permissões do Firestore
3. Valide a estrutura dos dados antigos
4. Execute a migração em lotes menores se necessário
