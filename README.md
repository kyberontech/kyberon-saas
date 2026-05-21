# Kyberon – True Guardian (Versão Iniciante) 🛡️

Versão simplificada do projeto Kyberon, **sem banco de dados e sem autenticação real**.
Perfeita para aprender Next.js e evoluir o sistema passo a passo.

---

## 🚀 Como Rodar (3 passos)

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo desenvolvimento
npm run dev

# 3. Abrir no navegador
# http://localhost:3000
```

**Login:** qualquer email e senha funcionam nesta versão.

---

## 📂 O que tem dentro

```
src/
├── app/
│   ├── login/page.tsx          ← Tela de Login
│   ├── dashboard/page.tsx      ← Dashboard com os cards
│   ├── alarmes/page.tsx        ← Tabela de alarmes
│   ├── relatorios/page.tsx     ← Gráfico + tabela de dados
│   └── configuracoes/page.tsx  ← Cria/edita/exclui cards
├── components/
│   └── Sidebar.tsx             ← Menu lateral (aparece em tudo)
└── data/
    └── store.ts                ← "Banco de dados" simulado (localStorage)
```

---

## 🗺️ Roteiro de Evolução

Siga esta ordem para escalar o projeto:

### Passo 1 — Banco de dados real
Instale o Prisma + PostgreSQL e substitua `src/data/store.ts`:
```bash
npm install prisma @prisma/client
npx prisma init
```
Nos componentes, troque `getCards()` por `fetch('/api/cards')`.

### Passo 2 — Autenticação real
Instale o NextAuth:
```bash
npm install next-auth
```
No login (`src/app/login/page.tsx`), troque `handleLogin()` por:
```ts
import { signIn } from 'next-auth/react'
await signIn('credentials', { email, password, callbackUrl: '/dashboard' })
```

### Passo 3 — Dados reais via MQTT
Instale o cliente MQTT:
```bash
npm install mqtt
```
Crie `src/lib/mqtt.ts` e processe os payloads do seu dispositivo IoT.
Salve os valores no banco com Prisma.

### Passo 4 — Atualização em tempo real
Substitua o `setInterval` do Dashboard por WebSockets ou Server-Sent Events (SSE)
para receber dados do servidor em tempo real sem precisar recarregar a página.

---

## 🎨 Personalizando o Visual

Todas as cores estão centralizadas em `tailwind.config.js`:

```js
colors: {
  'ky-bg':      '#060E1A',  // fundo
  'ky-primary': '#00C8FF',  // cor principal
  'ky-red':     '#FF3B3B',  // alarmes
  // ...
}
```
Mude qualquer cor aqui e o tema inteiro atualiza automaticamente.

---

## 📝 Onde estão os TODO no código

Procure por `// TODO:` em qualquer arquivo para encontrar os pontos
marcados para evolução futura.

---

*Kyberon – True Guardian © 2026*
