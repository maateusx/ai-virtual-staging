# Arquitetura

`decorar.ai` é um monorepo (npm workspaces) com dois pacotes: a API (`server/`,
Fastify + MongoDB) e a SPA (`web/`, React + Vite). A IA é o Google Gemini,
chamado direto via `@google/genai`. As imagens/vídeos são gravados em disco e
servidos estaticamente pelo próprio Fastify.

```
                    ┌───────────────────────── web/ (React + Vite) ─────────────────────────┐
                    │  StagingPage   VideoPage   ConfigPage     stores (Zustand)  lib/api.js │
                    └───────────────────────────────┬───────────────────────────────────────┘
                                                     │ HTTP (multipart / JSON)
                    ┌────────────────────────────────▼──────────────────────── server/ ─────┐
                    │  app.js  → CORS · multipart · estáticos /uploads · rotas               │
                    │                                                                         │
                    │  routes/staging.js   routes/video.js   routes/admin.js                 │
                    │        │                   │                  │                         │
                    │        ▼                   ▼                  ▼                         │
                    │  services/ (promptBuilder, imageProvider, reframe, inpaint, watermark, │
                    │             outputFormats, pricing, storage, video/*)                  │
                    │        │                   │                  │                         │
                    │        ▼                   ▼                  ▼                         │
                    │  @google/genai (Gemini)   disco /uploads   MongoDB (Mongoose)          │
                    └─────────────────────────────────────────────────────────────────────┘
```

## Camadas

- **`app.js`** monta o Fastify: CORS (origem = `WEB_ORIGIN`), `@fastify/multipart`
  (até 2 arquivos, 16 MB), `@fastify/static` servindo `server/uploads` em
  `/uploads/`, o `GET /health` e as três famílias de rotas. `index.js` é o
  entrypoint que conecta o Mongo e sobe o servidor (com shutdown gracioso).
- **`routes/`** valida a entrada, orquestra os serviços e dá forma à resposta
  pública. Nenhum segredo vaza para o cliente.
- **`services/`** concentra a lógica: composição de prompts, chamadas ao Gemini,
  ajuste de imagem (sharp), custo e storage. São módulos puros e testáveis,
  desacoplados do Fastify.

## Fluxo 1 — Staging de imagem (síncrono)

`POST /v1/staging` faz tudo dentro da requisição (pode levar até ~2 min):

```
multipart → valida → salva input (uploads/in)
   → compõe o prompt (prompt_override OU promptBuilder por modo+seleções)
   → para cada variação (1..N, em paralelo, Promise.allSettled):
        generateStaging() ── Gemini ──▶ imagem
        ajusta proporção:  reframe() [crop/pad com sharp]  OU  expandWithAi() [outpaint]
        finalizeOutput():  marca d'água opcional (sharp) → salva (uploads/out)
   → soma tokens → estima custo (USD/BRL) → grava StagingJob → responde 200
```

O **modo `edit`** é um caminho à parte: envia foto + máscara ao modelo e depois
faz *paste-back* (`inpaint.compositeEdit`) compondo o resultado sobre o original,
garantindo que tudo fora da máscara fique idêntico (o modelo tende a re-renderizar
o quadro inteiro). Não há etapa de proporção — a saída mantém as dimensões.

Sucesso é **parcial**: com `variations > 1`, se ao menos uma der certo a resposta
é `200`; só retorna `502` quando todas falham.

## Fluxo 2 — Geração de vídeo (assíncrono)

`POST /v1/video` inicia a operação no provedor, cria o job e dispara um poller em
background, respondendo `202` na hora. O cliente faz polling em `GET /v1/video/:id`.

```
multipart → valida (por modelo: aspect/resolução/duração/áudio) → salva input
   ├─ style 'transform' AUTO: gera o quadro final inline pela pipeline de imagem
   │                          (generateStaging) ANTES de criar o job — falha aqui
   │                          é síncrona (422/502) e não deixa job órfão
   ├─ startVideo() ── Gemini/Veo ──▶ operação assíncrona (operation_name)
   ├─ VideoJob.create({ status: 'processing', operation_name, ... })
   ├─ trackJob() — poller em background (fire-and-forget)
   └─ responde 202 { job_id, status }

poller: a cada VIDEO_POLL_INTERVAL_MS consulta a operação
   → done:  baixa o mp4 → salva (uploads/vid) → estima custo (duração×preço/seg)
            → atualiza o job para 'done'
   → erro/timeout (VIDEO_TIMEOUT_MS): atualiza o job para 'error'
```

`operation_name` é persistido para permitir retomar o polling; a *operação viva* e
a chave BYOK ficam **só em memória** (nunca gravadas).

## Composição de prompts

A "inteligência" do produto está em montar a instrução enviada ao modelo —
sempre com um **lock** no final que protege a geometria/estrutura.

| Composer | Onde | Lock final |
|----------|------|------------|
| `composePrompt` (modos furnish/empty/declutter/enhance) | `promptBuilder.js` | `PRESERVE` (só os móveis mudam) / `NO_ADDITIONS` (remoção sem inventar) |
| `composeEditPrompt` (modo edit) | `promptBuilder.js` | restringe a edição à região da máscara |
| `composeFinalFramePrompt` (quadro "depois" auto) | `promptBuilder.js` | `FINAL_FRAME_PRESERVE` (estrutura fixa, permite a reforma) |
| `composeVideoPrompt` (vídeo motion) | `video/motionPresets.js` | `STILL_SCENE` (cena congelada, só a câmera move) |
| `composeTransformPrompt` (vídeo transform) | `video/motionPresets.js` | `LIGHT_GEOMETRY_LOCK` (estrutura estável, transição permitida) |

No modo `furnish`, os **fragmentos de prompt** das opções selecionadas (cadastradas
no admin) são concatenados em ordem entre o template base e o texto livre. Os
demais modos ignoram os fragmentos de estilo.

## Configuração dinâmica vs. estática

- **Parâmetros de estilo** (estilo, cômodo, densidade…) vivem no **MongoDB**
  (`StagingParameter`), editáveis pelo admin em runtime. São abertos por natureza.
- **Formatos de saída** (proporção, resolução, ajuste) e o **registro de modelos
  de vídeo** são um conjunto finito e validado → vivem em **código**
  (`outputFormats.js`, `video/registry.js`), não no banco.

## Modelo de dados (MongoDB)

**`StagingParameter`** — parâmetro de estilo com opções embutidas (subdocumentos).
Cada opção tem `label`, `prompt_fragment`, `order`, `active`. Duas projeções:
`toPublic()` (sem `prompt_fragment`, só opções ativas) e `toAdmin()` (completa).

**`StagingJob`** — histórico de cada requisição de imagem: URLs de entrada/máscara/
saídas, `mode`, `selections`, `composed_prompt`, config de saída, marca d'água,
`usage` (tokens), `cost` (USD/BRL), `status` (`done`/`error`).

**`VideoJob`** — job de vídeo: `status` (`queued`/`processing`/`done`/`error`),
`provider`, `model`, `style`, `motion`/`final_frame_mode`, config (aspecto/
resolução/duração/áudio), URLs de entrada/quadro-final/vídeo, `operation_name`,
`cost`. Em `transform` AUTO, o custo do quadro gerado entra em `staging_usd/brl`.

## Storage

`services/storage.js` é uma fina abstração de disco: `saveBuffer(buffer, ext, dir)`
grava em `uploads/<in|out|vid>` com nome `nanoid` e devolve a URL pública
(`PUBLIC_BASE_URL` + `/uploads/...`); `publicUrl(relPath)` monta a URL. A interface
foi pensada para ser trocada por uma implementação S3 sem tocar nas rotas.

> ⚠️ As URLs são **temporárias/locais** e os arquivos não são limpos
> automaticamente — em produção, troque por storage durável + expiração.

## Provider de IA e BYOK

Tanto imagem quanto vídeo aceitam a chave do **servidor** (`GEMINI_API_KEY`) ou a
do **usuário** (BYOK, campo `gemini_api_key`), com precedência para a do usuário.
Sem nenhuma das duas, as rotas de geração respondem `422`. A chave do usuário
nunca é logada nem persistida. Erros de chave ausente viram `422`; falhas do
provedor viram `502`.

## Decisões de projeto

- **Proporção tratada por nós, não pelo modelo.** Pedir uma proporção diferente ao
  modelo o faz re-enquadrar e "alucinar" geometria; por isso o ajuste é feito
  depois com `sharp` (`reframe.js`) — exceto o modo `ai` (outpaint), que é
  intencional. O default é `original` justamente para preservar a cena.
- **Lock sempre por último.** Todos os composers anexam a restrição de geometria
  como instrução final, para que ela "vença" o texto livre do usuário.
- **Vídeo é assíncrono; imagem é síncrona.** Veo demora demais para um
  request/response; staging de imagem cabe na janela de ~2 min.
