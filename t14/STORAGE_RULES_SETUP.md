# Configuração das Regras de Segurança do Firebase Storage

## Como Aplicar as Regras

### Opção 1: Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `equalpay-cff9b`
3. Vá em **Storage** → **Regras**
4. Cole o conteúdo do arquivo `storage.rules`
5. Clique em **Publicar**

### Opção 2: Firebase CLI

Se você tem o Firebase CLI instalado:

```bash
firebase deploy --only storage
```

## O que as Regras Fazem

### Avatares (`/avatars/{userId}/**`)

- ✅ Usuários autenticados podem fazer upload apenas em sua própria pasta
- ✅ Limite de tamanho: 5MB por arquivo
- ✅ Apenas imagens são permitidas (contentType deve ser `image/*`)
- ✅ Qualquer usuário autenticado pode ler avatares (para exibir fotos de perfil)

### Segurança

- ✅ Helper functions seguem o mesmo padrão das regras do Firestore
- ✅ Apenas usuários autenticados podem acessar o Storage
- ✅ Usuários só podem fazer upload em suas próprias pastas (`isOwner`)
- ✅ Todos os outros caminhos estão bloqueados por padrão

## Importante

**Você DEVE aplicar essas regras no Firebase Console antes de fazer upload de imagens!**

Sem as regras configuradas, o Firebase Storage bloqueará todos os uploads por padrão.

## Estrutura das Regras

As regras seguem o mesmo padrão das regras do Firestore:

- Helper functions (`isAuthenticated()`, `isOwner()`)
- Mesma estrutura e lógica de segurança
- Consistência entre Firestore e Storage
