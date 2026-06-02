# decorar.ai — Virtual Staging (MVP síncrono)

Ferramenta de *virtual staging*: o usuário envia a foto de um cômodo vazio,
escolhe parâmetros (estilo, tipo de cômodo, densidade de mobília…) e recebe a
imagem mobiliada. Os parâmetros **não são fixos em código** — são configurados
numa tela de admin e cada opção carrega um *fragmento de prompt* concatenado na
instrução final enviada ao modelo de IA.

Veja a especificação completa em [`docs/spec.md`](docs/spec.md) e o design system
em [`docs/design-system.md`](docs/design-system.md).

## Stack

- **Backend** (`server/`): Node.js + Fastify + Mongoose (MongoDB)
- **Frontend** (`web/`): React + Vite + Tailwind + shadcn-style UI + Zustand
- **IA**: Google Gemini ("Nano Banana", `gemini-3.1-flash-image`) chamado direto via `@google/genai` — com *fallback* mock quando `GEMINI_API_KEY` não está definido
- **Storage**: disco local servido pelo Fastify (`/uploads`), abstraído para troca por S3

## Pré-requisitos

- Node.js ≥ 20
- MongoDB rodando localmente (`mongodb://127.0.0.1:27017`) ou via Docker:
  `docker run -d -p 27017:27017 --name decorar-mongo mongo:8`

## Setup

```bash
cp .env.example .env        # ajuste GEMINI_API_KEY para usar o modelo real (opcional)
npm install                 # instala server + web (workspaces)
npm run seed                # popula os parâmetros sugeridos da spec
npm run dev                 # sobe backend (:3333) e frontend (:5173)
```

- App: http://localhost:5173
- API: http://localhost:3333 (`GET /health`)

Sem `GEMINI_API_KEY`, o backend roda em **modo mock** e devolve a imagem original —
útil para desenvolver toda a interface sem credenciais. Gere a key em
https://aistudio.google.com/apikey.

## Estrutura

```
server/src
  config/env.js          configuração via env
  db/                    conexão Mongoose
  models/                StagingParameter (com opções embutidas), StagingJob
  services/
    promptBuilder.js     monta o prompt final (spec §6)
    imageProvider.js     Gemini (Nano Banana) + fallback mock
    storage.js           disco local → URL pública
  routes/
    staging.js           GET /v1/staging/config · POST /v1/staging
    admin.js             CRUD de parâmetros/opções
web/src
  pages/                 StagingPage, ConfigPage
  components/            ImageDropzone, ParameterField, BeforeAfter, ui/ (shadcn)
  store/                 stagingStore, configStore (Zustand)
  lib/api.js             cliente da API
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/v1/staging/config` | Parâmetros ativos (sem `prompt_fragment`) |
| `POST` | `/v1/staging` | Processa imagem (multipart) — síncrono |
| `GET` | `/v1/admin/parameters` | Lista parâmetros (detalhe completo) |
| `POST` | `/v1/admin/parameters` | Cria parâmetro |
| `PATCH`/`DELETE` | `/v1/admin/parameters/:id` | Edita/remove parâmetro |
| `POST` | `/v1/admin/parameters/:id/options` | Adiciona opção |
| `PATCH`/`DELETE` | `/v1/admin/parameters/:id/options/:optionId` | Edita/remove opção |

> As rotas `/v1/admin/*` assumem uma sessão de admin autenticada (fora do escopo
> deste MVP — plugue o middleware de auth em `server/src/routes/admin.js`).

## Fora desta versão (fases futuras)

Fila/processamento assíncrono, webhook, remoção de móveis (imóvel ocupado),
máscara automática / inpaint, multi-tenant e storage em S3.
