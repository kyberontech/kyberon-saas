# Kyberon SaaS — Especificação Técnica do Produto

> Documento gerado a partir de análise do código-fonte e da infraestrutura em produção (VPS Hostinger, `72.60.240.153`, gerenciada via EasyPanel em `painel.devsystem.cloud`). Última atualização: 2026-07-17 (seção 2.3 revisada — persistência de leituras migrada para worker server-side, ver commit `d97e165`).

---

## 1. Visão Geral

Kyberon SaaS é uma plataforma **multi-tenant** de supervisão industrial (HMI/SCADA leve) que permite monitorar variáveis de CLPs (Controladores Lógicos Programáveis) em tempo real via **MQTT**, exibir dashboards configuráveis, disparar/reconhecer alarmes e enviar comandos (ON/OFF) para equipamentos — tudo através do navegador.

Cada cliente (grupo/empresa) opera de forma isolada logicamente dentro do mesmo banco de dados, através de um modelo de **tenant**.

---

## 2. Arquitetura

### 2.1 Diagrama de infraestrutura

```
Navegador (HMI)
   │  HTTPS (Next.js) + WSS (MQTT)
   ▼
Traefik (EasyPanel) ── TLS automático (Let's Encrypt)
   │
   ├── app.kyberon.<domínio>      → container "kyberon" (Next.js, porta 3000)
   └── mqtt.devsystem.cloud       → container "mqtt-proxy" (nginx:alpine)
                                        │  proxy_pass (upgrade p/ WebSocket)
                                        ▼
                                    EMQX (broker MQTT) :8083 (ws) / :1883 (tcp) / :8883 (tls) / :18083 (dashboard)
                                        ▲
                                        │  MQTT TCP direto (sem TLS)
                                    CLP / dispositivo de campo (ex: "CLP_1")

kyberon (app) ──► PostgreSQL "kyberon-db" (único banco, multi-tenant via tenantId)
```

### 2.2 Componentes

| Componente | Tecnologia | Papel |
|---|---|---|
| `kyberon` (app) | Next.js 14+ (App Router), React | Frontend + API routes (backend) |
| `kyberon-db` | PostgreSQL 17 | Banco único, multi-tenant |
| `mqtt-proxy` | nginx:alpine | Proxy WS → EMQX, exposto via Traefik com TLS |
| `emqx` | EMQX (broker MQTT) | Broker de mensageria para os CLPs e para o HMI |
| Traefik | Traefik 3.6 | Reverse proxy / TLS termination (gerenciado pelo EasyPanel) |
| Auth | NextAuth (Credentials Provider) + JWT | Login e sessão dos usuários do painel |
| ORM | Prisma | Acesso ao Postgres |

A VPS também hospeda **outros projetos não relacionados** (n8n, um Postgres/Redis/pgweb de outro projeto chamado "dados") no mesmo host Docker — ou seja, o ambiente é compartilhado, não dedicado ao Kyberon.

### 2.3 Fluxo de dados MQTT (ponto crítico de arquitetura)

> **Atualizado em 2026-07-17**: a persistência de leituras deixou de depender do navegador. Um worker server-side (`src/lib/mqttServerWorker.ts`) agora assina o broker diretamente e grava o histórico, independente de haver algum usuário com o dashboard aberto. Ver detalhes no final desta seção.

O MQTT é consumido em **dois pontos**, um no navegador (visualização em tempo real) e outro no processo do servidor Next.js (persistência de histórico):

1. O CLP conecta direto no broker EMQX (`mqtt://VPS:1883`, sem TLS, sem autenticação) e publica valores em um tópico (ex: `planta/sensor1/temperatura`).
2. O navegador do usuário logado, ao abrir o Dashboard, conecta via WebSocket (`wss://mqtt.devsystem.cloud/mqtt`) e assina os tópicos configurados nos **Cards** daquele tenant. O hook `useMqtt` (`src/lib/mqttClient.ts`) apenas atualiza o card na tela — não grava mais nada no banco.
3. Independentemente de qualquer navegador aberto, o worker `startMqttHistoryWorker()` (`src/lib/mqttServerWorker.ts`) roda no processo do servidor, iniciado uma única vez no boot via o hook `register()` de `src/instrumentation.ts` (requer `experimental.instrumentationHook: true` em `next.config.js`). Ele carrega do Postgres todos os `Card` do tipo `leitura`/`leitura_estado` com `mqttTopic` preenchido, assina esses tópicos direto no broker e, a cada mensagem, grava um `Reading` via Prisma — recarregando a lista de assinaturas a cada 30s para acompanhar Cards criados/editados.
4. **Consequência**: a leitura é persistida assim que chega ao broker, mesmo sem nenhum usuário do tenant com o dashboard aberto. O ponto crítico anterior (item 5 da seção de segurança) está resolvido — o que permanece em aberto é a **confiabilidade do próprio broker/infra** (sem auth, sem TLS — ver seção 5).

---

## 3. Modelo de Dados (Prisma / PostgreSQL)

| Modelo | Campos principais | Observação |
|---|---|---|
| `Tenant` | `name`, `slug`, `active` | Representa um cliente/grupo |
| `User` | `email`, `passwordHash`, `role`, `tenantId?` | `tenantId` nulo apenas para `SUPER_ADMIN` |
| `Card` | `type` (leitura/comando), `mqttTopic`, `unit`, `alarmMax/Min`, `row/col` | Configuração visual + vínculo ao tópico MQTT |
| `Reading` | `cardId`, `value`, `unit`, `timestamp` | Histórico de leituras (para gráficos) |
| `AlarmEvent` | `cardId`, `message`, `status` (ATIVO/RECONHECIDO) | Alarmes disparados quando valor sai da faixa |
| `Log` | `action`, `detail`, `userId`, `tenantId?` | Auditoria de ações administrativas |

**Não existe** nenhum campo de `client_id` (MQTT) no schema. O vínculo entre dado do CLP e tenant é feito exclusivamente pelo **tópico MQTT** configurado no `Card`, nunca pelo identificador do dispositivo.

### 3.1 Papéis de usuário (roles)

O campo `User.role` aceita 4 valores (`default: "USUARIO"`), aplicados em duas camadas: `src/middleware.ts` (acesso a páginas) e `src/lib/apiAuth.ts` (`isSuperAdmin`/`isAdmin`/`isSupervisor`, checados em cada API route).

#### SUPER_ADMIN
Usuário da plataforma, **sem `tenantId`** (não pertence a nenhum grupo/cliente).
- Acesso exclusivo à área `/admin/grupos` — único perfil que enxerga essa rota; middleware redireciona qualquer outro role para fora e redireciona o próprio SUPER_ADMIN para `/admin` caso tente acessar área de tenant.
- Único que pode **criar, ativar/desativar e excluir grupos (tenants)**.
- Único que pode **criar, editar, ativar/desativar e excluir usuários de qualquer grupo**, via `/api/admin/grupos/[id]/usuarios/*`.
- Não acessa dashboard operacional de nenhum tenant (sem cards, alarmes, relatórios, comandos).

#### ADMINISTRADOR
Vinculado a um `tenantId`, maior privilégio dentro do próprio grupo.
- Único (dentro do tenant) que acessa `/usuarios` e `/logs`.
- Acessa `/configuracoes`, `/alarmes`, `/relatorios`, `/dashboard`.
- Pode enviar comandos aos cards, editar configurações, reconhecer alarmes.
- Pode **criar, editar, ativar/desativar e excluir usuários do próprio tenant** (não pode excluir/desativar a própria conta).

#### SUPERVISOR
Vinculado a um `tenantId`, um nível abaixo do ADMINISTRADOR.
- Mesmo acesso operacional do ADMINISTRADOR: `/configuracoes`, `/alarmes`, `/relatorios`, `/dashboard`, comandos em cards, edição de cards, reconhecimento de alarmes.
- **Não** acessa `/usuarios` nem `/logs` — sem permissão para gerenciar (criar/editar/excluir) outros usuários.

#### USUARIO
Nível mais simples, vinculado a um `tenantId`.
- Acessa `/dashboard`, `/alarmes`, `/relatorios` e `/perfil` — **somente leitura** (visualiza cards, histórico de alarmes e gráficos de relatórios, mas não reconhece alarmes nem envia comandos).
- Sem acesso a `/configuracoes`, `/usuarios`, `/logs`.

#### Matriz de permissões

| Recurso / Ação | SUPER_ADMIN | ADMINISTRADOR | SUPERVISOR | USUARIO |
|---|---|---|---|---|
| `/admin/grupos` (gestão de tenants) | ✅ exclusivo | ❌ | ❌ | ❌ |
| Criar / ativar-desativar / **excluir grupo** | ✅ | — | — | — |
| Criar / editar / ativar-desativar / **excluir usuário** | ✅ (qualquer grupo) | ✅ (próprio tenant) | ❌ | ❌ |
| `/usuarios`, `/logs` (do tenant) | — | ✅ | ❌ | ❌ |
| `/dashboard`, `/alarmes`, `/relatorios` | — (sem tenant) | ✅ | ✅ | ✅ (leitura) |
| `/configuracoes` | — | ✅ | ✅ | ❌ |
| Comandar cards / editar configs | — | ✅ | ✅ | ❌ |
| Reconhecer alarmes | — | ✅ | ✅ | ❌ |

> **Exclusão de usuários e grupos**: a partir de 2026-07-11, os botões de lixeira em `/usuarios` (ADMINISTRADOR) e `/admin/grupos` (SUPER_ADMIN) executam **exclusão definitiva** (`DELETE`, remove do banco em transação, apagando também os `Log`s do usuário/grupo removido) — distinta do toggle "Ativar/Desativar" (`PUT`, soft-delete via `active=false`), que continua existindo separadamente para suspender acesso sem perder o histórico.

---

## 4. Funcionalidades (por página)

| Rota | Descrição |
|---|---|
| `/login` | Autenticação (NextAuth Credentials) |
| `/dashboard` | Grade de cards com valores em tempo real (MQTT), comandos ON/OFF |
| `/alarmes` | Lista de alarmes ativos/reconhecidos do tenant |
| `/relatorios` | Gráficos históricos de leituras com agregação (1min/5min/15min/1h/1d) |
| `/configuracoes` | Cadastro dos Cards (tópico MQTT, tipo, ícone, faixa de alarme) |
| `/usuarios` | CRUD de usuários do tenant (admin) |
| `/logs` | Auditoria de ações (criação de usuário, comandos, reconhecimento de alarme, etc.) |
| `/perfil` | Troca de senha do próprio usuário |
| `/admin` , `/admin/grupos` | Painel do SUPER_ADMIN — CRUD de tenants (grupos) e seus admins |

### 4.1 API Routes relevantes

- `GET/POST /api/cards` — lista / substitui todos os cards do tenant
- `PATCH /api/cards/[id]/command` — atualiza estado de um comando
- `GET /api/leituras` — histórico de leituras para os gráficos de `/relatorios` (a gravação não é mais feita via API — ver worker server-side, seção 2.3)
- `GET/POST /api/alarmes`, `POST /api/alarmes/[id]/ack` — gestão de alarmes
- `GET/POST /api/usuarios`, `PUT /api/usuarios/[id]` (editar/ativar-desativar), `DELETE /api/usuarios/[id]` (exclusão definitiva) — gestão de usuários do tenant (admin)
- `GET/POST/DELETE /api/admin/grupos`, `/api/admin/grupos/[id]` (`PUT` ativar-desativar, `DELETE` exclusão definitiva), rotas aninhadas `/usuarios` (`PUT`/`DELETE`) — gestão de tenants e seus usuários (super admin)
- `GET /api/logs` — auditoria

Todas as rotas usam `requireSession()` (NextAuth) e escopam consultas por `tenantId` da sessão — exceto os pontos citados na seção de vulnerabilidades abaixo.

---

## 5. Segurança — Vulnerabilidades e Riscos Identificados

> Levantado durante inspeção read-only da VPS (docker inspect/logs) e leitura do código-fonte em 2026-07-04. Nenhuma alteração foi feita na aplicação em produção.

### 🔴 Crítico

1. **Broker MQTT sem autenticação (`authentication = []`)** — Qualquer dispositivo, com qualquer `client_id`, conecta ao EMQX sem usuário/senha/certificado. Confirmado ao vivo: dispositivo `CLP_1` conectado sem credenciais.
2. **Portas do broker expostas publicamente (0.0.0.0), fora do proxy TLS** — `1883` (MQTT), `8883` (MQTTS), `8084` (WSS) e **`18083` (dashboard admin do EMQX)** estão acessíveis diretamente pela internet, não só através do `mqtt-proxy`/Traefik. Isso permite:
   - Qualquer pessoa publicar dados falsos se passando por `CLP_1` ou qualquer outro client_id (spoofing de dispositivo).
   - Qualquer pessoa assinar tópicos e ler todos os dados em trânsito.
   - Tentativa de acesso ao **dashboard administrativo do EMQX** (`:18083`) direto da internet — se a senha padrão não tiver sido trocada, é acesso administrativo total ao broker.
3. **ACL do EMQX nunca customizada** — `acl.conf` está no template padrão de instalação, terminando em `{allow, {security_profile, legacy}}`, que **permite tudo** (publish/subscribe em qualquer tópico) no perfil legacy (padrão em versões < 6.3).
4. ~~**Segredo de sessão com fallback hardcoded**~~ — **Corrigido em 2026-07-13** (`src/lib/auth.ts`): o fallback `?? 'kyberon_super_secret_2026_xJ9mK2pL'` foi removido; `secret` agora usa apenas `process.env.NEXTAUTH_SECRET`. Isso significa que **`NEXTAUTH_SECRET` passa a ser obrigatória** — sem ela definida no ambiente, o NextAuth não terá segredo de assinatura válido para os tokens JWT. Confirme que a variável está configurada na VPS/EasyPanel antes do deploy.

### 🟠 Alto

5. ~~**Persistência dependente de navegador aberto**~~ — **Resolvido em 2026-07-17**: `src/lib/mqttServerWorker.ts`, iniciado via `src/instrumentation.ts`, assina o broker diretamente do processo do servidor e persiste leituras independente de navegador aberto (ver seção 2.3). Continua valendo a ressalva de que **alarmes** ainda não têm um mecanismo de disparo server-side equivalente — o worker atual só grava `Reading`, não avalia `alarmMax/Min` nem cria `AlarmEvent`.
6. ~~**Sem verificação de posse de `cardId` em `POST /api/leituras`**~~ — **Resolvido em 2026-07-17** como efeito colateral do item 5: a rota `POST /api/leituras` foi removida. A gravação agora é feita pelo worker server-side, que obtém o `cardId`/`tenantId` a partir da própria consulta ao banco (`prisma.card.findMany`), não de input do cliente — não há mais superfície para um usuário forjar `cardId` de outro tenant por essa via.
7. **Ambiente de VPS compartilhado** — o mesmo host Docker roda projetos não relacionados (n8n, bancos de outros clientes). Um container comprometido (ex: via a falha nº1/2 do EMQX) amplia a superfície de ataque para os demais serviços na mesma rede Docker.

### 🟡 Médio

8. **Credenciais reais compartilhadas em texto simples no chat** durante esta sessão (senha da conta hPanel e senha root SSH da VPS). Recomenda-se:
   - Trocar a senha da conta hPanel.
   - Trocar a senha root da VPS e, idealmente, migrar para autenticação por **chave SSH**, desabilitando login por senha.
9. **Sem rate limiting / brute-force protection aparente** no login (`/api/auth/[...nextauth]`) — não foi identificado nenhum controle de tentativas de login.
10. **`docker-compose.yml`** do repositório não usa arquivo `.env` — variáveis sensíveis (`DATABASE_URL`) ficam comentadas inline, criando risco de alguém preencher e commitar por engano.

### Recomendações de melhoria (não apenas segurança)

- **Adicionar autenticação no EMQX** (usuário/senha por dispositivo, ou binding client_id↔token) e restringir as portas 1883/8883/18083 para não ficarem expostas em `0.0.0.0` (usar firewall ou bind em interface interna, deixando só o `mqtt-proxy` público).
- ~~Criar um serviço de backend dedicado para persistir leituras independente de navegador aberto~~ — feito em 2026-07-17 (`src/lib/mqttServerWorker.ts`).
- **Fazer o worker também avaliar alarmes** (`alarmMax`/`alarmMin` → `AlarmEvent`), hoje ele só grava `Reading` — sem isso, alarmes continuam dependendo de um navegador aberto para disparar.
- ~~Validar `cardId` contra `tenantId` em `/api/leituras` antes de gravar~~ — não se aplica mais, a rota `POST` foi removida.
- ~~Remover o fallback hardcoded do `NEXTAUTH_SECRET`~~ — feito em 2026-07-13.
- **Adicionar testes automatizados** (não há suíte de testes identificada no repositório).
- Avaliar uso de **client certificates (mTLS)** ou tokens por dispositivo para autenticar CLPs de forma mais robusta do que usuário/senha estático.

---

## 6. Infraestrutura de Produção (referência rápida)

- VPS: Hostinger, IP `72.60.240.153`, gerenciada via **EasyPanel** (`painel.devsystem.cloud`).
- Projeto EasyPanel: `kyberon` — serviços `kyberon` (app), `kyberon-db` (Postgres), `mqtt-proxy` (nginx).
- Broker EMQX roda como container solto (`emqx/emqx:latest`), fora do projeto `kyberon` no EasyPanel, com volumes persistentes de dados/log.
- Domínio público do broker: `mqtt.devsystem.cloud` (TLS via Let's Encrypt/Traefik).
