# 🔥 Configuração Inicial do Firebase CLI

## Passo a Passo Completo

### 1️⃣ Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2️⃣ Fazer Login no Firebase

```bash
firebase login
```

Isso abrirá seu navegador para fazer login com sua conta Google.

### 3️⃣ Inicializar Firebase no Projeto

```bash
cd /Users/gustavo/Sites/localhost/payequal/t14/t14
firebase init
```

Quando perguntado:

1. **Which Firebase features do you want to set up?**
   - Selecione: `Firestore: Configure security rules and indexes files`
   - Use a barra de espaço para marcar/desmarcar
   - Pressione Enter

2. **Please select an option:**
   - Selecione: `Use an existing project`

3. **Select a default Firebase project:**
   - Escolha seu projeto da lista

4. **What file should be used for Firestore Rules?**
   - Pressione Enter (usar `firestore.rules` - já existe)
   - Se perguntar se quer sobrescrever, digite `N` (não)

5. **What file should be used for Firestore indexes?**
   - Pressione Enter (aceitar o padrão)

### 4️⃣ Fazer Deploy das Regras

```bash
firebase deploy --only firestore:rules
```

Ou usando o script npm:

```bash
npm run deploy:rules
```

---

## ⚡ Atalho Rápido (Se já tiver o projeto ID)

Se você sabe o ID do seu projeto Firebase, pode criar os arquivos manualmente:

### Criar `.firebaserc`

```json
{
  "projects": {
    "default": "SEU_PROJECT_ID_AQUI"
  }
}
```

### Criar `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Substitua `SEU_PROJECT_ID_AQUI` pelo ID do seu projeto (encontre em Firebase Console → Configurações do projeto).

---

## 🔍 Como Encontrar o Project ID

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Clique no ícone de engrenagem (⚙️) → **Configurações do projeto**
4. Copie o **ID do projeto**

---

## ✅ Verificação

Após o deploy, você verá algo como:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/SEU_PROJECT/overview
```

---

## 🎯 Alternativa: Deploy Manual

Se não quiser usar o CLI, você pode copiar e colar as regras manualmente:

1. Abra: https://console.firebase.google.com/
2. Selecione seu projeto
3. **Firestore Database** → **Regras**
4. Cole todo o conteúdo do arquivo `firestore.rules`
5. Clique em **Publicar**

---

**Próximo passo:** Após configurar, execute `npm run deploy:rules`
