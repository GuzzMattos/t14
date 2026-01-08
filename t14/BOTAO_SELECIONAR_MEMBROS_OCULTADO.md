# ✅ Botão "Selecionar Membros" Ocultado

## Alteração Realizada

O botão "Selecionar membros" foi **comentado/ocultado** na tela de criação de grupo.

---

## Código Modificado

**Arquivo**: `src/screens/groups/GrupoForm.tsx`

**Antes:**
```tsx
{modo !== "editar" && (
  <View style={{ marginBottom: 12 }}>
    <Button title="Selecionar membros" onPress={() => setOpenSelect(true)} />
    {selectedMembers.length > 0 && (
      <View style={{ marginTop: 8 }}>
        {selectedMembers.map((email) => (
          <Text key={email} style={{ color: "white" }}>
            • {email}
          </Text>
        ))}
      </View>
    )}
  </View>
)}
```

**Depois:**
```tsx
{/* campo de seleção - OCULTO TEMPORARIAMENTE */}
{/* {modo !== "editar" && (
  <View style={{ marginBottom: 12 }}>
    <Button title="Selecionar membros" onPress={() => setOpenSelect(true)} />
    ...
  </View>
)} */}
```

---

## Impacto

### ✅ O que acontece agora:

1. **Tela de Criar Grupo:**
   - Nome do grupo
   - Descrição (opcional)
   - Botão "Criar grupo"
   - ~~Botão "Selecionar membros"~~ ← **OCULTO**

2. **Ao criar grupo:**
   - Grupo é criado apenas com o dono (você)
   - Sem membros adicionais
   - Pode adicionar membros depois (aba Membros nos detalhes do grupo)

3. **Tela de Editar Grupo:**
   - Continua igual (nunca teve botão de membros)
   - Nome e descrição editáveis
   - Botão "Salvar alterações"
   - Botão "Excluir grupo" (se for dono)

---

## Como Adicionar Membros Agora

**1. Criar o grupo:**
   - Apenas nome + descrição
   - Clicar em "Criar grupo"

**2. Entrar nos detalhes do grupo:**
   - Lista de grupos → Clicar no grupo criado

**3. Ir para aba "Membros":**
   - Ver lista de membros (só você por enquanto)
   - Adicionar amigos ao grupo

**4. Selecionar amigos:**
   - Lista mostra apenas seus amigos
   - Selecionar quem adicionar
   - Botão "Adicionar X amigo(s)"

---

## Fluxo Simplificado

```
┌────────────────────────────────┐
│ Criar Novo Grupo               │
├────────────────────────────────┤
│ Nome: Viagem Madrid            │
│ Descrição: Outubro 2025        │
│                                │
│ [Criar grupo] ← Cria só com você
└────────────────────────────────┘
         ↓
┌────────────────────────────────┐
│ Grupo Criado! ✅               │
└────────────────────────────────┘
         ↓
┌────────────────────────────────┐
│ Detalhes do Grupo              │
│ [Despesas] [Membros] [Saldos]  │
└────────────────────────────────┘
         ↓ Clica em "Membros"
┌────────────────────────────────┐
│ Membros                        │
│ • Você (admin)                 │
│                                │
│ Adicionar amigo ao grupo       │
│ [João] [Maria] [Pedro]         │
│ [Adicionar selecionados]       │
└────────────────────────────────┘
```

---

## Para Reativar no Futuro

Se quiser voltar a funcionalidade, basta descomentar:

```tsx
// Remover /* */ do código:
{modo !== "editar" && (
  <View style={{ marginBottom: 12 }}>
    <Button title="Selecionar membros" onPress={() => setOpenSelect(true)} />
    {selectedMembers.length > 0 && (
      <View style={{ marginTop: 8 }}>
        {selectedMembers.map((email) => (
          <Text key={email} style={{ color: "white" }}>
            • {email}
          </Text>
        ))}
      </View>
    )}
  </View>
)}
```

---

## Status

✅ **Botão ocultado com sucesso**

- ✅ Sem erros de compilação
- ✅ Grupo pode ser criado normalmente
- ✅ Membros podem ser adicionados depois via aba Membros
- ✅ Código comentado (fácil de reativar se necessário)

---

**Data**: 8 de janeiro de 2026
