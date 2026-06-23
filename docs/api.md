# Referência da API

Base URL padrão (dev): `http://localhost:3333`. Respostas e erros são JSON.

**Convenções**
- Erros de validação retornam **`422`** com `{ "error": "mensagem" }`.
- Falhas do provedor de IA retornam **`502`**.
- Recurso inexistente retorna **`404`**.
- Endpoints de geração exigem uma **chave do Gemini**: a do servidor
  (`GEMINI_API_KEY`) **ou** uma enviada na requisição (BYOK) no campo
  `gemini_api_key`. A chave do usuário tem precedência e nunca é logada/persistida.
- Uploads são limitados a **15 MB** por arquivo; tipos aceitos: `image/jpeg`,
  `image/png`, `image/webp` (a marca d'água deve ser `image/png`).

---

## Health

### `GET /health`
```json
{ "status": "ok", "provider": "gemini", "server_has_key": true }
```
`server_has_key: false` → o cliente **precisa** enviar `gemini_api_key` (BYOK).

---

## Imagem (staging) — síncrono

### `GET /v1/staging/config`
Configuração pública para montar a UI. **Não** expõe `prompt_fragment`.
```json
{
  "parameters": [
    {
      "id": "665...",
      "label": "Estilo",
      "type": "single_select",
      "options": [{ "id": "665...", "label": "Escandinavo" }]
    }
  ],
  "output": {
    "aspect_ratios": [{ "id": "original", "label": "Original (preservar entrada)" }],
    "default_aspect_ratio": "original",
    "image_sizes": [{ "id": "1K", "label": "1K (padrão)" }],
    "default_image_size": "1K",
    "aspect_fits": [{ "id": "crop", "label": "Cortar bordas" }],
    "default_aspect_fit": "crop"
  },
  "modes": [{ "id": "furnish", "label": "Mobiliar" }],
  "default_mode": "furnish",
  "server_has_key": true
}
```

### `POST /v1/staging/preview-prompt`
Monta o prompt final **sem gerar nada** (para preview/edição na UI). Corpo JSON:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `mode` | string | Um dos `modes` (default `furnish`) |
| `selections` | object | Mapa `parameterId → optionId` ou `[optionId]` |
| `extra_prompt` | string | Texto livre adicional |

```json
{ "composed_prompt": "Add furniture and decor to this room. ..." }
```

### `POST /v1/staging`  — `multipart/form-data`
Processa a imagem de forma **síncrona** (pode levar até ~2 min). Campos:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `image` | arquivo | sim | Foto do cômodo |
| `mask` | arquivo | só no modo `edit` | Máscara P&B (branco = região a editar) |
| `mode` | texto | não (default `furnish`) | `furnish` · `empty` · `declutter` · `enhance` · `edit` |
| `selections` | texto (JSON) | não | Mapa de seleções de estilo (só afeta `furnish`) |
| `extra_prompt` | texto | não (obrig. no `edit`) | Texto livre; no `edit` é a instrução da edição |
| `prompt_override` | texto | não | Substitui o prompt composto **verbatim** (≤ 8000 chars) |
| `aspect_ratio` | texto | não (default `original`) | `original`·`21:9`·`16:9`·`1:1`·`3:4`·`9:16`·`4:3` |
| `aspect_fit` | texto | não (default `crop`) | `crop` · `pad` · `ai` (outpaint) |
| `image_size` | texto | não (default `1K`) | `1K` · `2K` · `4K` |
| `variations` | texto | não (default `1`) | Inteiro de 1 a 4 |
| `gemini_api_key` | texto | condicional | BYOK; obrigatório se o servidor não tem chave |
| `watermark` | arquivo | não | PNG da marca d'água |
| `watermark_vertical` / `watermark_horizontal` | texto | não | Posição (banda vertical × horizontal) |
| `watermark_size` | texto | não | Tamanho em % da largura |
| `watermark_opacity` | texto | não | Opacidade |
| `watermark_color` | texto | não | Cor hex (ex.: `#ffffff`) |

**Resposta `200`:**
```json
{
  "result_image_url": "http://localhost:3333/uploads/out/abc.jpg",
  "variations": [{ "result_image_url": "http://localhost:3333/uploads/out/abc.jpg" }],
  "requested_variations": 1,
  "composed_prompt": "Add furniture and decor to this room. ...",
  "mode": "furnish",
  "aspect_ratio": "original",
  "aspect_fit": "crop",
  "image_size": "1K",
  "model": "gemini-3.1-flash-image",
  "processing_ms": 14230,
  "usage": { "prompt_tokens": 1200, "output_tokens": 1290, "total_tokens": 2490 },
  "cost": { "usd": 0.0387, "brl": 0.209, "input_usd": 0.0003, "output_usd": 0.0387, "usd_to_brl": 5.4 }
}
```
> As variações são geradas em paralelo e o sucesso é **parcial**: se ao menos uma
> der certo, a resposta é `200` com as que funcionaram. Só `502` quando todas
> falham.

**Modos**

| Modo | Comportamento |
|------|---------------|
| `furnish`   | Adiciona móveis/decoração a um cômodo (único modo que usa os fragmentos de estilo) |
| `empty`     | Remove tudo, reconstruindo paredes/piso sem inventar elementos novos |
| `declutter` | Remove o excesso, mantendo o mínimo das peças originais |
| `enhance`   | Upscale/melhoria de qualidade com fidelidade estrita à cena |
| `edit`      | Edição localizada por máscara; a saída é composta de volta sobre o original (pixels fora da máscara ficam idênticos) e mantém as dimensões originais |

**Ajuste de proporção (`aspect_fit`)** — `crop`/`pad` são determinísticos (feitos
com `sharp`, sem inventar conteúdo); `ai` faz *outpaint* (o modelo estende a cena).

---

## Vídeo (image-to-video) — assíncrono

### `GET /v1/video/config`
Registro público de modelos, estilos e presets (sem segredos).
```json
{
  "models": [
    {
      "id": "veo-3.1-fast-generate-preview",
      "label": "Veo 3.1 Fast",
      "provider": "gemini",
      "aspect_ratios": ["16:9", "9:16"],
      "resolutions": ["720p", "1080p"],
      "durations": [4, 6, 8],
      "supports_audio": true,
      "supports_last_frame": true,
      "price_per_second_usd": { "720p": 0.1, "1080p": 0.12 },
      "defaults": { "aspect_ratio": "16:9", "resolution": "720p", "duration": 8 }
    }
  ],
  "default_model": "veo-3.1-fast-generate-preview",
  "styles": [{ "id": "motion", "label": "Movimento de câmera", "uses_last_frame": false }],
  "default_style": "motion",
  "default_transform_prompt": "Timelapse of this home renovation. ...",
  "motions": [{ "id": "still", "label": "Apenas mover a foto" }],
  "default_motion": "still",
  "server_has_key": true
}
```

**Modelos disponíveis** (preview — sujeitos a mudança pela Google):

| Modelo | Resoluções | Durações | Áudio | Quadro final | USD/seg |
|--------|------------|----------|-------|--------------|---------|
| `veo-3.1-generate-preview` | 720p, 1080p | 4/6/8 | sim | sim | 0.40 |
| `veo-3.1-fast-generate-preview` *(default)* | 720p, 1080p | 4/6/8 | sim | sim | 0.10 / 0.12 |
| `veo-3.1-lite-generate-preview` | 720p, 1080p | 4/6/8 | sim | sim | 0.05 / 0.08 |
| `veo-2.0-generate-001` | 720p | 5/6/7/8 | não | não | 0.35 |

**Presets de movimento** (estilo `motion`): `still`, `walk`, `pan`, `orbit`,
`pullback`.

### `POST /v1/video`  — `multipart/form-data`
Cria um job e retorna **imediatamente** (`202`); o resultado é obtido por polling.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `image` | arquivo | sim | Primeiro quadro (a foto) |
| `image2` | arquivo | não | Quadro final (estilo `transform`, modo manual) |
| `model` | texto | não | Default `veo-3.1-fast-generate-preview` |
| `style` | texto | não (default `motion`) | `motion` · `transform` |
| `motion` | texto | só no `motion` | Preset de câmera (default `still`) |
| `aspect_ratio` | texto | não | Default vem do modelo |
| `resolution` | texto | não | Default vem do modelo |
| `duration` | texto | não | Em segundos; default vem do modelo |
| `audio` | texto | não | `true`/`1` (só em modelos com áudio) |
| `prompt` | texto | não | Detalhe livre (≤ 2000 chars) |
| `staging_prompt` | texto | não | `transform` AUTO: como gerar o quadro "depois" |
| `gemini_api_key` | texto | condicional | BYOK |

**Estilos**
- **`motion`** — um quadro + preset de câmera; a cena fica congelada (lock
  `STILL_SCENE`), só a câmera se move.
- **`transform`** — primeiro → último quadro (reforma/timelapse). O quadro final é
  **manual** (campo `image2`) ou **auto** (gerado pela pipeline de imagem a partir
  do `image`, usando `staging_prompt`). Exige um modelo com `supports_last_frame`.

**Resposta `202`:**
```json
{ "job_id": "665...", "status": "processing" }
```
Erros possíveis: `422` (validação/sem chave), `502` (falha do provedor ou da
geração automática do quadro final).

### `GET /v1/video/:id`
Consulta o job. Faça polling até `status` ser `done` ou `error`.
```json
{
  "job_id": "665...",
  "status": "done",
  "model": "veo-3.1-fast-generate-preview",
  "style": "motion",
  "motion": "still",
  "final_frame_mode": null,
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "duration_seconds": 8,
  "audio": false,
  "input_image_url": "http://localhost:3333/uploads/in/abc.jpg",
  "input_image_final_url": null,
  "result_video_url": "http://localhost:3333/uploads/vid/xyz.mp4",
  "processing_ms": 92000,
  "cost": { "usd": 0.8, "brl": 4.32, "usd_to_brl": 5.4, "price_per_second_usd": 0.1, "duration_seconds": 8, "resolution": "720p" },
  "error": null
}
```
`404` se o job não existir.

---

## Admin — CRUD de parâmetros de estilo

> ⚠️ **Sem autenticação neste MVP.** Veja a seção de segurança no README. Estas
> rotas expõem `prompt_fragment` e entradas inativas (ao contrário do
> `/v1/staging/config` público).

| Método | Rota | Descrição | Sucesso |
|--------|------|-----------|---------|
| `GET` | `/v1/admin/parameters` | Lista todos os parâmetros (detalhe completo) | `200` |
| `POST` | `/v1/admin/parameters` | Cria parâmetro (`label` obrigatório) | `201` |
| `PATCH` | `/v1/admin/parameters/:id` | Edita `label`/`type`/`order`/`active` | `200` |
| `DELETE` | `/v1/admin/parameters/:id` | Remove o parâmetro | `204` |
| `POST` | `/v1/admin/parameters/:id/options` | Adiciona opção (`label` + `prompt_fragment`) | `201` |
| `PATCH` | `/v1/admin/parameters/:id/options/:optionId` | Edita a opção | `200` |
| `DELETE` | `/v1/admin/parameters/:id/options/:optionId` | Remove a opção | `200` |

**Parâmetro** (admin):
```json
{
  "id": "665...",
  "label": "Estilo",
  "type": "single_select",
  "order": 0,
  "active": true,
  "options": [
    { "id": "665...", "label": "Escandinavo", "prompt_fragment": "scandinavian style, light woods", "order": 0, "active": true }
  ]
}
```
`type` ∈ {`single_select`, `multi_select`}. O `prompt_fragment` de cada opção
selecionada é concatenado no prompt final (apenas no modo `furnish`).
