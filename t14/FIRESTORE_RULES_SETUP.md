# Configuração das Regras de Segurança do Firestore

## Como Aplicar as Regras

### Opção 1: Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `equalpay-cff9b`
3. Vá em **Firestore Database** → **Regras**
4. Cole o conteúdo do arquivo `firestore.rules`
5. Clique em **Publicar**

### Opção 2: Firebase CLI

Se você tem o Firebase CLI instalado:

```bash
firebase deploy --only firestore:rules
```

## O que as Regras Fazem

### users
- ✅ Usuários podem ler seu próprio perfil
- ✅ Usuários podem atualizar seu próprio perfil
- ✅ Usuários autenticados podem ler outros usuários (para buscar amigos)

### friends
- ✅ Usuários podem ler suas próprias relações de amizade
- ✅ Usuários podem criar relações de amizade
- ✅ Usuários podem atualizar suas próprias relações de amizade

### friendRequests
- ✅ Usuários podem ler solicitações que enviaram ou receberam
- ✅ Usuários podem criar solicitações (como remetente)
- ✅ Usuários podem atualizar solicitações que receberam (aceitar/rejeitar)

### notifications
- ✅ Usuários podem ler suas próprias notificações
- ✅ Sistema pode criar notificações para qualquer usuário
- ✅ Usuários podem atualizar suas próprias notificações (marcar como lida)
- ✅ Usuários podem deletar suas próprias notificações

### group
- ✅ Usuários podem ler grupos dos quais são membros
- ✅ Usuários podem criar grupos (como dono)
- ✅ Apenas o dono pode atualizar/deletar o grupo

### expenses
- ✅ Usuários podem ler despesas de grupos dos quais são membros
- ✅ Usuários podem criar despesas em grupos dos quais são membros
- ✅ Apenas o dono do grupo pode aprovar/rejeitar despesas
- ✅ Criador ou dono podem deletar despesas

## Segurança

As regras garantem que:
- ✅ Apenas usuários autenticados podem acessar dados
- ✅ Usuários só podem modificar seus próprios dados
- ✅ Membros de grupos só podem ver dados do grupo
- ✅ Apenas donos podem aprovar/rejeitar despesas

## Teste das Regras

Após aplicar as regras, teste:
1. Login com um usuário
2. Verificar se consegue ver amigos
3. Verificar se consegue ver notificações
4. Verificar se consegue criar grupos
5. Verificar se consegue criar despesas

Se ainda houver erros de permissão, verifique:
- Se o usuário está autenticado
- Se o usuário é membro do grupo (para despesas)
- Se o usuário é o dono (para aprovar despesas)

