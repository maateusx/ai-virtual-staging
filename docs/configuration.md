# Configuração (variáveis de ambiente)

Copie `.env.example` para `.env` na raiz e ajuste. O backend carrega o `.env` via
`node --env-file=../.env` (veja `server/package.json`). O frontend (Vite) lê
apenas variáveis com prefixo `VITE_` em tempo de build.

```bash
cp .env.example .env
```

## Backend (server)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | `3333` | Porta da API |
| `HOST` | `0.0.0.0` | Host de escuta |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/decorar_ai` | Conexão do MongoDB |
| `PUBLIC_BASE_URL` | `http://localhost:3333` | Base usada para montar as URLs públicas dos arquivos em `/uploads` |
| `WEB_ORIGIN` | `http://localhost:5173` | Origem do frontend liberada no CORS |

## Provedor de IA (Gemini)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `GEMINI_API_KEY` | *(vazio)* | Chave do servidor. Se vazia, **toda** requisição precisa trazer a sua (BYOK) ou recebe `422`. A chave do usuário tem precedência. Gere em <https://aistudio.google.com/apikey>. |
| `GEMINI_MODEL` | `gemini-3.1-flash-image` | Modelo de imagem ("Nano Banana") |

## Vídeo (Veo)

Reusa `GEMINI_API_KEY`/BYOK (a chave precisa ter acesso a Veo). Os preços por
segundo ficam no registro de modelos (`server/src/services/video/registry.js`),
não em env.

| Variável | Default | Descrição |
|----------|---------|-----------|
| `VIDEO_MODEL` | `veo-3.1-fast-generate-preview` | Modelo de vídeo padrão oferecido pela UI |
| `VIDEO_POLL_INTERVAL_MS` | `10000` | Intervalo entre consultas do poller ao provedor (ms) |
| `VIDEO_TIMEOUT_MS` | `480000` | Tempo máximo por job antes de marcar erro/timeout (ms) |

## Estimativa de custo (opcional)

Convertem o consumo de tokens (imagem) em custo estimado (USD + BRL). Lidas
direto em `services/pricing.js`/`videoPricing.js` (não passam por `config/env.js`).

| Variável | Default | Descrição |
|----------|---------|-----------|
| `GEMINI_INPUT_USD_PER_M` | `0.3` | USD por 1.000.000 de tokens de entrada (prompt + imagem) |
| `GEMINI_OUTPUT_USD_PER_M` | `30` | USD por 1.000.000 de tokens de saída (imagem gerada) |
| `USD_TO_BRL` | `5.4` | Taxa USD→BRL (compartilhada por imagem e vídeo) |

> O custo de vídeo é `duração × preço/segundo` do modelo/resolução (registry), não
> por tokens.

## Frontend (web)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `VITE_API_URL` | `http://localhost:3333` | Base da API consumida pelo Vite em build time |

## Notas

- Defaults sensatos permitem rodar localmente quase sem configurar — só uma chave
  do Gemini (no servidor **ou** via BYOK) é realmente necessária para gerar.
- `.env` está no `.gitignore` e **não** deve ser commitado. Mantenha o
  `.env.example` em dia ao adicionar novas variáveis.
