# 📋 Plano de Melhorias - Grupos

## 🎯 Objetivos

### 1. ✅ Edição de Grupo
- [ ] Puxar dados atuais nos inputs ao entrar na edição
- [ ] Ocultar opção de selecionar membros na edição
- [ ] Trazer informações populadas nos inputs

### 2. ✅ Aba Despesas
- [ ] Listar todas as despesas do grupo (aprovadas)
- [ ] Implementar filtro funcional

### 3. ✅ Aba Saldos
- [ ] Listar movimentações do grupo
- [ ] Card mostrando quanto o usuário ainda tem que pagar

### 4. ✅ Filtros
- [ ] Fazer funcionar filtro nas despesas
- [ ] Fazer funcionar filtro nos saldos (se aplicável)

---

## 📂 Arquivos a Modificar

### 1. GrupoForm.tsx
**Problemas Identificados:**
- ✅ Inputs já são populados no `useEffect` (linha 41-44)
- ❌ Seleção de membros aparece mesmo na edição
- ❌ Precisa ocultar seleção de membros quando `modo === "editar"`

**Ações:**
- [x] Verificar se dados são populados corretamente
- [ ] Adicionar condição para ocultar seleção de membros na edição
- [ ] Testar edição funcional

---

### 2. DetalhesGrupo.tsx
**Problemas Identificados:**
- ✅ Despesas já são carregadas (linha 115-122)
- ❌ Aba "Despesas" usa dados mockados (DESPESA)
- ❌ Aba "Saldos" usa dados mockados (MOVIMENTACOES)
- ❌ Filtros não estão implementados

**Ações:**
- [ ] Substituir mock DESPESA por expenses reais
- [ ] Calcular saldo do usuário no grupo
- [ ] Listar movimentações reais (payments)
- [ ] Implementar filtro de busca nas despesas
- [ ] Implementar filtro de busca nos saldos

---

## 🔧 Implementação Detalhada

### 1. GrupoForm - Ocultar Seleção de Membros

```tsx
// Condição: só mostrar seleção de membros se estiver criando
{modo !== "editar" && (
  <>
    {/* Seletor de membros */}
  </>
)}
```

---

### 2. DetalhesGrupo - Aba Despesas

**Dados Atuais:**
```tsx
const expenses = []; // Já carregado via observeGroupExpenses
```

**Renderização:**
```tsx
<FlatList
  data={filteredExpenses}
  renderItem={({ item }) => (
    <DespesaItem expense={item} onPress={() => navigateToExpense(item)} />
  )}
/>
```

**Filtro:**
```tsx
const filteredExpenses = expenses.filter(exp => 
  exp.description?.toLowerCase().includes(search.toLowerCase())
);
```

---

### 3. DetalhesGrupo - Aba Saldos

**Cálculo do Saldo:**
```tsx
const mySaldo = group?.balances?.[user.uid] || 0;
```

**Card de Saldo:**
```tsx
<View style={s.saldoCard}>
  <Text>Você deve pagar</Text>
  <Text style={s.valor}>{Math.abs(mySaldo).toFixed(2)}€</Text>
</View>
```

**Movimentações:**
- Buscar payments do grupo
- Filtrar pagamentos confirmados
- Exibir em lista com data, pagador, recebedor, valor

---

### 4. Filtros

**Estado de Pesquisa:**
```tsx
const [searchText, setSearchText] = useState("");
```

**Input de Busca:**
```tsx
<InputLupa
  value={searchText}
  onChangeText={setSearchText}
  placeholder="Buscar..."
/>
```

**Aplicar Filtro:**
```tsx
const filtered = data.filter(item =>
  item.description?.toLowerCase().includes(searchText.toLowerCase())
);
```

---

## ✅ Checklist de Implementação

### GrupoForm.tsx
- [ ] Ocultar seleção de membros quando `modo === "editar"`
- [ ] Verificar se dados são populados corretamente
- [ ] Testar criação de grupo
- [ ] Testar edição de grupo

### DetalhesGrupo.tsx - Despesas
- [ ] Substituir DESPESA mock por expenses reais
- [ ] Implementar filtro de busca
- [ ] Navegar para DetalheDespesa ao clicar
- [ ] Exibir mensagem quando não há despesas

### DetalhesGrupo.tsx - Saldos
- [ ] Calcular saldo do usuário
- [ ] Exibir card com valor a pagar
- [ ] Buscar e listar payments do grupo
- [ ] Implementar filtro de busca
- [ ] Exibir mensagem quando não há movimentações

### Testes
- [ ] Criar grupo novo
- [ ] Editar grupo existente
- [ ] Visualizar despesas do grupo
- [ ] Visualizar saldos do grupo
- [ ] Testar filtros em despesas
- [ ] Testar filtros em saldos

---

**Próximos Passos:**
1. Modificar GrupoForm.tsx para ocultar seleção de membros
2. Modificar DetalhesGrupo.tsx para usar dados reais
3. Implementar filtros funcionais
4. Testar todas as funcionalidades

**Status:** 🔄 Em Progresso

**Data:** 8 de janeiro de 2026
