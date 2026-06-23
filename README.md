# decorar.ai — Virtual Staging (MVP síncrono)

Ferramenta de *virtual staging*: o usuário envia a foto de um cômodo, escolhe um
**modo**, parâmetros (estilo, tipo de cômodo, densidade de mobília…) e o
**formato de saída** (proporção e resolução), e recebe a imagem editada. Os
parâmetros de estilo **não são fixos em código** — são configurados numa tela de
admin e cada opção carrega um *fragmento de prompt* concatenado na instrução
final enviada ao modelo de IA.

**Modos:** `furnish` (adiciona móveis a um cômodo vazio), `empty` (remove tudo,
deixando vazio), `declutter` (remove o excesso, mantendo o mínimo), `enhance`
(melhora a qualidade / upscale, sem alterar a cena) e `edit` (edição localizada
guiada por máscara — só a região pintada muda). **Saída:** proporção (16:9, 1:1,
3:4, 9:16, 4:3 ou original) atingida por recorte, barras ou *outpaint* com IA, e
resolução 1K/2K/4K. Pode-se gerar **1 a 4 variações** por requisição.

**Extras:** antes de processar, a UI mostra (e permite **editar**) o prompt final
que será enviado ao modelo; cada resultado traz uma **estimativa de custo**
(USD + BRL) a partir do consumo de tokens; e é possível estampar uma **marca
d'água** (PNG local, via `sharp`, sem custo de modelo) na imagem de saída.

Veja a especificação completa em [`docs/spec.md`](docs/spec.md) e o design system
em [`docs/design-system.md`](docs/design-system.md).

## Stack

- **Backend** (`server/`): Node.js + Fastify + Mongoose (MongoDB)
- **Frontend** (`web/`): React + Vite + Tailwind + shadcn-style UI + Zustand
- **IA**: Google Gemini ("Nano Banana", `gemini-3.1-flash-image`) chamado direto via `@google/genai` — a chave pode vir do servidor (`GEMINI_API_KEY`) ou do próprio usuário (BYOK, colada na interface)
- **Imagem**: `sharp` (libvips) para reframe determinístico (recorte / barras) da proporção de saída
- **Storage**: disco local servido pelo Fastify (`/uploads`), abstraído para troca por S3

## Pré-requisitos

- Node.js ≥ 20
- MongoDB rodando localmente (`mongodb://127.0.0.1:27017`) ou via Docker:
  `docker run -d -p 27017:27017 --name decorar-mongo mongo:8`

## Setup

```bash
cp .env.example .env        # defina GEMINI_API_KEY (ou deixe vazio e use BYOK na interface)
npm install                 # instala server + web (workspaces)
npm run seed                # popula os parâmetros sugeridos da spec
npm run dev                 # sobe backend (:3333) e frontend (:5173)
```

- App: http://localhost:5173
- API: http://localhost:3333 (`GET /health`)

É preciso uma chave do Gemini para processar: defina `GEMINI_API_KEY` no servidor
**ou** deixe vazio e cole a chave na própria interface (BYOK — fica salva só no
navegador do usuário e tem precedência sobre a do servidor). Sem nenhuma das duas,
a API responde `422`. Gere a key em https://aistudio.google.com/apikey.

## Estrutura

```
server/src
  config/env.js          configuração via env
  db/                    conexão Mongoose
  models/                StagingParameter (com opções embutidas), StagingJob
  services/
    promptBuilder.js     monta o prompt final por modo (spec §6)
    imageProvider.js     Gemini (Nano Banana); chave do servidor ou BYOK
    outputFormats.js     presets/validação de proporção, resolução e ajuste
    reframe.js           reframe com sharp (crop/pad) + outpaint com IA
    inpaint.js           composição "paste-back" da edição mascarada (modo edit)
    watermark.js         estampa o PNG de marca d'água com sharp (sem IA)
    pricing.js           estima custo (USD/BRL) a partir do uso de tokens
    storage.js           disco local → URL pública
  routes/
    staging.js           GET /config · POST /preview-prompt · POST /v1/staging
    admin.js             CRUD de parâmetros/opções
web/src
  pages/                 StagingPage, ConfigPage
  components/            ImageDropzone, ParameterField, BeforeAfter, ModeSelect,
                         WatermarkField, MaskCanvas, ui/ (shadcn)
  store/                 stagingStore, configStore (Zustand)
  lib/api.js             cliente da API
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/v1/staging/config` | Parâmetros ativos (sem `prompt_fragment`) + modos + formatos de saída |
| `POST` | `/v1/staging/preview-prompt` | Monta o prompt final (JSON) sem gerar nada — para preview/edição na UI |
| `POST` | `/v1/staging` | Processa imagem (multipart) — síncrono. Campos: `image`, `mask`, `selections`, `extra_prompt`, `prompt_override`, `mode`, `aspect_ratio`, `aspect_fit`, `image_size`, `variations`, `gemini_api_key` e marca d'água (`watermark` + `watermark_*`) |
| `GET` | `/v1/admin/parameters` | Lista parâmetros (detalhe completo) |
| `POST` | `/v1/admin/parameters` | Cria parâmetro |
| `PATCH`/`DELETE` | `/v1/admin/parameters/:id` | Edita/remove parâmetro |
| `POST` | `/v1/admin/parameters/:id/options` | Adiciona opção |
| `PATCH`/`DELETE` | `/v1/admin/parameters/:id/options/:optionId` | Edita/remove opção |

> ⚠️ **Aviso de segurança:** as rotas `/v1/admin/*` **não têm autenticação** neste
> MVP — qualquer um com acesso à API pode criar/editar/remover parâmetros. Elas
> assumem uma sessão de admin já autenticada (fora do escopo desta versão). **Não
> faça deploy público sem antes plugar um middleware de auth** em
> `server/src/routes/admin.js`. Como está, rode apenas localmente ou em rede
> confiável.

## Fora desta versão (fases futuras)

Fila/processamento assíncrono, webhook, máscara automática (a do modo `edit` é
pintada manualmente), consistência multi-view, multi-tenant e storage em S3.
