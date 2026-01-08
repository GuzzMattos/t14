# 🔧 SOLUÇÃO: Erro de Permissão no Firestore

## ❌ Erro:
```
Erro ao carregar despesa: [FirebaseError: Missing or insufficient permissions.]
```

## ✅ Causa:
As regras do Firestore não tinham permissões definidas para a coleção `despesa` (modelo legado).

## ✅ Solução Aplicada:

### 1. Regras Atualizadas
Foi adicionada a seção `match /despesa/{despesaId}` no arquivo `firestore.rules` com as seguintes permissões:

- ✅ **Leitura**: Membros do grupo podem ler despesas
- ✅ **Criação**: Membros do grupo podem criar despesas  
- ✅ **Atualização**: Apenas owner do grupo pode aprovar/rejeitar
- ✅ **Exclusão**: Apenas criador ou owner do grupo

### 2. Script npm Adicionado
Adicionado comando no `package.json`:
```bash
npm run deploy:rules
```

---

## 🚀 AÇÃO NECESSÁRIA: Deploy das Regras

As regras foram atualizadas no arquivo local, mas **você precisa fazer o deploy** para o Firebase.

### Opção 1: Via Firebase CLI

```bash
# 1. Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# 2. Fazer login no Firebase
firebase login

# 3. Fazer deploy das regras
npm run deploy:rules
```

### Opção 2: Via Console do Firebase (Manual)

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Regras**
4. Cole o conteúdo do arquivo `firestore.rules`
5. Clique em **Publicar**

---

## 📋 Checklist Pós-Deploy

Após fazer o deploy, verifique:

- [ ] Regras publicadas com sucesso no Firebase Console
- [ ] App consegue carregar despesas sem erro
- [ ] Membros do grupo conseguem ver despesas
- [ ] Owner do grupo consegue aprovar/rejeitar despesas
- [ ] Apenas membros do grupo têm acesso

---

## 🔍 Se o Erro Persistir

Se após o deploy o erro continuar:

1. **Verifique o console do Firebase:**
   - Vá em Firestore → Regras
   - Certifique-se de que as regras estão publicadas
   - Verifique a data/hora da última publicação

2. **Limpe o cache do app:**
   ```bash
   npm run clear
   ```

3. **Verifique os dados:**
   - Abra o Firestore no console
   - Verifique se as despesas têm o campo `groupId`
   - Verifique se o usuário está em `memberIds` do grupo

4. **Teste com simulador de regras:**
   - No Firebase Console, vá em Firestore → Regras
   - Clique em "Simulador de regras"
   - Teste uma operação de leitura na coleção `despesa`

---

## 📝 Documentação Relacionada

- `DEPLOY_FIRESTORE_RULES.md` - Instruções detalhadas de deploy
- `firestore.rules` - Arquivo de regras atualizado
- `FLUXO_APROVACAO_DESPESAS_PAGAMENTOS.md` - Documentação do sistema

---

**Status:** ✅ Regras atualizadas localmente  
**Próximo passo:** 🚀 Fazer deploy para o Firebase
