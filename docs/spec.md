# Spec — Virtual Staging (MVP síncrono)

## 1. Visão geral

Ferramenta de virtual staging em que o usuário faz upload de uma foto de
imóvel, escolhe um **modo** de operação (mobiliar / esvaziar / minimizar /
melhorar qualidade / editar) e alguns parâmetros (estilo, tipo de cômodo, etc.),
opcionalmente escreve um prompt adicional e define o **formato de saída**
(proporção e resolução). O sistema monta uma instrução final, chama um modelo de
edição de imagem por IA e devolve a imagem resultante para download.

Antes de processar, o usuário pode **revisar e editar** o prompt final montado;
cada resultado vem com uma **estimativa de custo** (USD/BRL) calculada a partir
do consumo de tokens; e a saída pode receber uma **marca d'água** (PNG estampado
localmente, sem custo de modelo).

Esta versão é **síncrona** (sem fila) e cobre tanto **imóveis vazios** (mobiliar)
quanto **imóveis ocupados** (esvaziar / minimizar), além de melhoria de qualidade
e edição localizada por máscara.

A grande ideia de design: **os parâmetros não são fixos em código**. Eles são
definidos numa tela de configuração separada, e cada opção de parâmetro carrega
um *fragmento de prompt*. A tela de processamento apenas renderiza os parâmetros
configurados e, ao processar, concatena os fragmentos das opções escolhidas +
o prompt adicional para formar a instrução enviada ao modelo. Isso permite
adicionar/ajustar estilos sem deploy.

## 2. Escopo

**Dentro desta versão**
- Fluxo síncrono: enviar → esperar → receber imagem.
- Duas telas: Configuração de parâmetros e Processamento (staging).
- Endpoint de API síncrono equivalente à tela de processamento.
- Cinco **modos** de operação:
  - `furnish` (Mobiliar) — adiciona móveis e decoração a um cômodo vazio.
  - `empty` (Esvaziar) — remove todos os móveis/decoração, deixando o cômodo
    vazio e limpo.
  - `declutter` (Minimizar) — remove o excesso, mantendo só o mínimo essencial
    dos móveis originais.
  - `enhance` (Melhorar qualidade) — *upscale* / recuperação de detalhe em alta
    resolução, com fidelidade estrita: a cena não muda, só fica mais nítida.
  - `edit` (Editar) — edição localizada guiada por **máscara**: o usuário pinta a
    região a alterar e descreve a mudança; só aquela área muda.
- Controle de **formato de saída**: proporção (aspect ratio) e resolução, com
  três estratégias para atingir a proporção (recortar, adicionar barras ou
  expandir com IA / outpaint).
- **1 a 4 variações** por requisição, geradas em paralelo.
- **Preview/edição do prompt final** antes de gerar (endpoint dedicado).
- **Estimativa de custo** (USD/BRL) por requisição, a partir do uso de tokens.
- **Marca d'água** opcional: PNG estampado na saída com `sharp` (posição, tamanho,
  opacidade e recolor configuráveis) — operação local, sem chamada ao modelo.

**Fora desta versão (fases futuras)**
- Fila (SQS) e processamento assíncrono.
- Webhook de notificação.
- Máscara automática (a do modo `edit` é pintada manualmente) / consistência
  multi-view.

## 3. Telas

### 3.1. Tela de Configuração (parâmetros)

Onde se definem os parâmetros que aparecerão na tela de processamento.

Estrutura de um parâmetro:
- `label` — nome exibido (ex.: "Estilo de decoração").
- `type` — `single_select` ou `multi_select`.
- `options` — lista de opções, cada uma com:
  - `label` — texto exibido (ex.: "Escandinavo").
  - `prompt_fragment` — trecho injetado no prompt (ex.: "in a Scandinavian
    style with light wood, neutral tones and minimal furniture").
- `order` e `active` — ordenação e visibilidade.

Parâmetros sugeridos para começar:
- **Estilo de decoração** (single_select): escandinavo, moderno, industrial,
  clássico, minimalista.
- **Tipo de cômodo** (single_select): sala, quarto, cozinha, escritório.
- **Densidade de mobília** (single_select): leve, média, completa.

Ações: criar/editar/remover parâmetro, criar/editar/remover opção, ativar/desativar.

### 3.2. Tela de Processamento (staging)

1. **Upload** da imagem (drag-and-drop) + preview.
2. **Modo**: seletor entre Mobiliar / Esvaziar / Minimizar / Melhorar qualidade /
   Editar.
3. **Máscara** (só no modo `edit`): canvas para pintar a região a alterar sobre a
   foto; gera um PNG preto/branco (branco = região editável) enviado junto.
4. **Parâmetros**: renderizados dinamicamente a partir da configuração ativa.
   Só aparecem (e só são aplicados) no modo `furnish` — nos demais modos os
   fragmentos de estilo não fazem sentido.
5. **Formato de saída**: proporção (16:9, 1:1, 3:4, 9:16, 4:3 ou "original") e
   resolução (1K, 2K, 4K). Ao escolher uma proporção diferente da original,
   aparece o seletor de **ajuste de proporção** (recortar / barras / IA).
6. **Variações**: quantas opções gerar por requisição (1 a 4).
7. **Marca d'água** (opcional): upload de um PNG + posição (vertical × horizontal),
   tamanho (% da largura), opacidade e cor. Estampada localmente na saída.
8. **Prompt adicional**: campo de texto livre, opcional (aplica-se a todos os modos).
9. **Prompt final** (accordion): a UI busca o prompt montado no endpoint de
   preview e o exibe num editor; o usuário pode editá-lo e, nesse caso, o texto é
   enviado como `prompt_override` (substitui o auto-montado). Botão para resetar.
10. Botão **Processar** → chamada síncrona ao backend (mostra loading).
11. **Resultado**: comparação antes/depois + variações + **estimativa de custo**
    (USD/BRL) + botão de **Download**.

## 4. Fluxo de processamento (backend, síncrono)

1. Recebe: imagem (+ `mask` no modo `edit`) + `mode` + ids das opções escolhidas
   + `extra_prompt` + `prompt_override` (opcional) + formato de saída
   (`aspect_ratio`, `aspect_fit`, `image_size`) + `variations` + marca d'água
   opcional (`watermark` + `watermark_*`).
2. Valida `mode`, `aspect_ratio`, `aspect_fit`, `image_size`, `variations`,
   `prompt_override` (tamanho) e os campos de marca d'água (422 se inválidos).
3. Resolve os `prompt_fragment` das opções escolhidas a partir da config (só no
   modo `furnish`).
4. Monta o **prompt final** com a base do modo escolhido (ver seção 6). Se vier
   `prompt_override`, ele substitui o auto-montado **verbatim**.
5. Para cada variação (1..N, em paralelo): chama o modelo (image-to-image) com
   instrução de **preservar a estrutura** do ambiente (paredes, janelas, piso,
   perspectiva). A resolução pedida (`image_size`) vai no `config.imageConfig` da
   chamada Gemini.
   - No modo `edit`, a foto + a máscara vão ao modelo e a saída é recomposta
     sobre a original com a máscara como alpha (`inpaint.js`), garantindo que tudo
     fora da região pintada fique pixel a pixel idêntico.
6. **Reframe** para a proporção pedida (ver seção 8):
   - `crop` / `pad` — operação determinística com `sharp` (sem inventar pixels).
   - `ai` — *outpaint*: segunda chamada ao modelo para estender a cena e
     preencher o novo quadro.
7. **Marca d'água** (se enviada): estampa o PNG na saída com `sharp`
   (`watermark.js`) — recolor/opacidade/posição/tamanho locais, sem chamar o modelo.
8. **Custo**: estima o custo (USD/BRL) somando o uso de tokens de todas as
   variações (`pricing.js`).
9. Persiste o job (`StagingJob`) e devolve as variações ao cliente por URLs
   temporárias, junto com `usage` e `cost`.

Provedor atual: **Google Gemini** ("Nano Banana", `gemini-3.1-flash-image`),
chamado direto via `@google/genai` — chamada de API gerenciada, o backend não
precisa de GPU. A chave pode ser do servidor (`GEMINI_API_KEY`) ou enviada pelo
cliente (BYOK, campo `gemini_api_key`), que tem precedência. Sem nenhuma das
duas, a requisição é rejeitada com `422`.

## 5. Contrato da API

### 5.1. Obter configuração (para a tela de processamento)

```
GET /v1/staging/config
200 OK
{
  "parameters": [
    {
      "id": "estilo",
      "label": "Estilo de decoração",
      "type": "single_select",
      "options": [
        { "id": "escandinavo", "label": "Escandinavo" },
        { "id": "industrial",  "label": "Industrial" }
      ]
    }
  ],
  "modes": [
    { "id": "furnish",   "label": "Mobiliar" },
    { "id": "empty",     "label": "Esvaziar" },
    { "id": "declutter", "label": "Minimizar" },
    { "id": "enhance",   "label": "Melhorar qualidade" },
    { "id": "edit",      "label": "Editar" }
  ],
  "default_mode": "furnish",
  "output": {
    "aspect_ratios": [
      { "id": "original", "label": "Original (preservar entrada)" },
      { "id": "16:9",     "label": "Paisagem 16:9" }
    ],
    "default_aspect_ratio": "original",
    "image_sizes": [
      { "id": "1K", "label": "1K (padrão)" },
      { "id": "2K", "label": "2K" },
      { "id": "4K", "label": "4K" }
    ],
    "default_image_size": "1K",
    "aspect_fits": [
      { "id": "crop", "label": "Cortar bordas" },
      { "id": "pad",  "label": "Adicionar barras" },
      { "id": "ai",   "label": "Expandir com IA" }
    ],
    "default_aspect_fit": "crop"
  },
  "server_has_key": true
}
```
Observações: `prompt_fragment` **não** é exposto aqui — fica só no backend.
`server_has_key` indica se o backend tem chave própria; quando `false`, o cliente
**precisa** enviar `gemini_api_key` (BYOK) na requisição de processamento.
`modes` e `output` são listas curadas no código (`promptBuilder.js` /
`outputFormats.js`), não no banco.

### 5.1b. Preview do prompt (sem gerar)

Monta o prompt final para as configurações atuais sem chamar o modelo nem gastar
tokens — usado pela UI para mostrar/editar o prompt antes de uma geração real
(billed). Usa a mesma lógica de composição da rota de processamento.

```
POST /v1/staging/preview-prompt
Content-Type: application/json
{ "mode": "furnish", "selections": {"estilo":"escandinavo"}, "extra_prompt": "..." }

200 OK
{ "composed_prompt": "Add furniture and decor to this room. ..." }

422 — mode inválido / selections não-objeto
```

### 5.2. Processar imagem (síncrono)

```
POST /v1/staging
Content-Type: multipart/form-data

image:        <arquivo>            (obrigatório)
mask:         <arquivo PNG>        (obrigatório no modo "edit"; PNG p/b, branco = região a editar)
selections:   {"estilo":"escandinavo","comodo":"sala"}   (JSON, obrigatório)
extra_prompt: "adicionar uma planta no canto"            (opcional)
prompt_override: "..."             (opcional; se presente, substitui o prompt auto-montado. Máx. 8000 chars)
mode:         "furnish"            (opcional, default "furnish")
aspect_ratio: "original"          (opcional, default "original")
aspect_fit:   "crop"              (opcional, default "crop"; usado se aspect_ratio ≠ original)
image_size:   "1K"               (opcional, default "1K")
variations:   "1"                 (opcional, default 1; inteiro 1..4 — geradas em paralelo)
gemini_api_key: "AIza..."         (BYOK; obrigatório se o servidor não tiver chave. Tem precedência. Não é persistido.)

# Marca d'água (opcional) — só validada quando "watermark" é enviado:
watermark:           <arquivo PNG>  (PNG; máx. 15MB)
watermark_vertical:  "bottom"       (top | middle | bottom; default bottom)
watermark_horizontal:"right"        (left | center | right; default right)
watermark_size:      "20"           (% da largura da saída; 2..80; default 20)
watermark_opacity:   "100"          (% ; 5..100; default 100)
watermark_color:     "#ffffff"      (hex; opcional — recolore a marca; sem isso usa as cores próprias)

200 OK
{
  "result_image_url": "https://.../out/abc.jpg",   // 1ª variação (back-compat)
  "variations": [                                   // 1..N variações geradas
    { "result_image_url": "https://.../out/abc.jpg" }
  ],
  "requested_variations": 1,
  "composed_prompt":  "...",                        // para debug/transparência
  "mode":          "furnish",
  "aspect_ratio":  "original",
  "aspect_fit":    "crop",
  "image_size":    "1K",
  "model": "gemini-3.1-flash-image",
  "processing_ms": 14820,
  "usage": {                                        // tokens somados de todas as variações
    "prompt_tokens": 312,
    "output_tokens": 1290,
    "total_tokens": 1602
  },
  "cost": {                                         // estimativa a partir do usage (pricing.js)
    "usd": 0.0388,
    "brl": 0.2095,
    "input_usd": 0.0001,
    "output_usd": 0.0387,
    "usd_to_brl": 5.4
  }
}

422 — parâmetro inválido / imagem ausente / mode/aspect_ratio/aspect_fit/image_size/variations/prompt_override/watermark_* inválidos / máscara ausente no modo edit
502 — falha do provedor de modelo
```

## 6. Montagem do prompt final

```
[base do modo] + [fragmentos das opções escolhidas, na ordem dos parâmetros] + [extra_prompt] + [tail]
```

A **base** depende do `mode` escolhido (ver `promptBuilder.js`). As bases de
mobiliar/remoção incluem um bloco forte de preservação de geometria/perspectiva
(`PRESERVE`); as bases de remoção (`empty`/`declutter`) incluem ainda um bloco que
proíbe inventar qualquer objeto novo ao preencher o espaço liberado
(`NO_ADDITIONS`). O modo `enhance` usa um template próprio de *upscale* com
fidelidade estrita (a cena não muda, só ganha nitidez/resolução). O modo `edit`
**não** usa esse pipeline de concatenação: monta uma instrução própria via
`composeEditPrompt`, descrevendo a edição da região mascarada (ver §4).

Os **fragmentos** das opções só são concatenados no modo `furnish` — nos demais
modos os estilos não se aplicam. O `extra_prompt` e o `tail`
("Photorealistic, consistent lighting and shadows.") valem para os modos que usam
a composição padrão. Se o request trouxer `prompt_override`, ele substitui todo
esse prompt montado (qualquer modo).

Exemplo `furnish` (estilo=escandinavo, cômodo=sala, extra="planta no canto"):
> "Add furniture and decor to this room. \<bloco PRESERVE\>. Place the new
> furniture realistically on the existing floor. In a Scandinavian style with
> light wood and neutral tones; as a living room; medium furniture density. Add
> a plant in the corner. Photorealistic, consistent lighting and shadows."

Exemplo `empty`:
> "Remove all furniture, decor and clutter from this room, leaving it completely
> empty and clean. Realistically reconstruct the floor and walls that were hidden
> behind the removed objects. \<bloco NO_ADDITIONS\> \<bloco PRESERVE\>.
> Photorealistic, consistent lighting and shadows."

## 7. Modelo de dados

```
staging_parameter
  id            (pk)
  label         text
  type          enum(single_select, multi_select)
  order         int
  active        bool

staging_parameter_option
  id              (pk)
  parameter_id    (fk -> staging_parameter)
  label           text
  prompt_fragment text
  order           int
  active          bool

staging_job          (opcional — histórico)
  id              (pk)
  user_id         (fk)
  input_image_url text
  mask_image_url  text             (modo edit)
  output_image_url text
  mode            text             (furnish | empty | declutter | enhance | edit)
  selections      jsonb
  extra_prompt    text
  composed_prompt text             (prompt efetivamente usado, incl. override)
  aspect_ratio    text
  aspect_fit      text
  image_size      text
  watermark       jsonb            (vertical, horizontal, size, opacity, color) — quando aplicada
  model           text
  processing_ms   int
  usage           jsonb            (prompt_tokens, output_tokens, total_tokens)
  cost            jsonb            (usd, brl, input_usd, output_usd, usd_to_brl)
  status          enum(done, error)
  error           text             (preenchido quando status = error)
  created_at      timestamptz
```

## 8. Decisões e suposições (ajustar conforme necessário)

- **Síncrono**: a requisição fica aberta durante o processamento (~15s a ~2min
  conforme o modelo). Aceitável em baixo volume; migrar para fila quando o
  volume ou o timeout incomodar. Sugerido timeout de cliente ≥ 120s.
- **Geometria**: nos modos de mobiliar/remoção a preservação do ambiente vem da
  *instrução* ao modelo (bloco `PRESERVE` no prompt). A garantia forte (pixels
  fora da área intocados) existe no modo `edit`, que recompõe a saída sobre a
  original usando a máscara como alpha (`services/inpaint.js`), com a borda
  suavizada para esconder a emenda.
- **Proporção de saída**: o default é `original` — manter as proporções da
  entrada, porque forçar outra proporção na chamada ao modelo faz ele re-enquadrar
  e deslocar o ângulo aparente da câmera. Por isso a proporção é resolvida
  **depois** da geração, em `services/reframe.js` com `sharp`:
  - `crop` recorta as bordas (centro), `pad` adiciona barras — ambos
    determinísticos, sem inventar conteúdo;
  - `ai` faz *outpaint*: centraliza a foto numa tela maior e pede ao modelo para
    preencher só as margens, estendendo a cena (segunda chamada, mais lenta).
- **Dependência `sharp`**: usada para o reframe determinístico, a recomposição da
  edição mascarada (`inpaint.js`) e a marca d'água (`watermark.js`). É binária
  (libvips) e instala junto no `npm install`.
- **Resolução**: `image_size` (1K/2K/4K) é a única parte de `imageConfig` enviada
  ao Gemini.
- **Marca d'água**: estampada localmente com `sharp` (sem custo de modelo). O PNG
  é escalado a um % da largura, recolorido/atenuado opcionalmente e posicionado em
  uma das 9 âncoras (vertical × horizontal). A marca **não** é persistida; só suas
  configurações ficam no job.
- **Custo**: estimado a partir do `usage` de tokens com tarifas configuráveis por
  env (`GEMINI_INPUT_USD_PER_M`, `GEMINI_OUTPUT_USD_PER_M`, `USD_TO_BRL`) — assim
  acompanha a tabela de preços do Gemini sem deploy. É uma *estimativa*, não a
  cobrança real.
- **Parâmetros**: assumidos como globais (definidos por admin). Se forem por
  tenant, adicionar `tenant_id` em `staging_parameter`/`_option`.
- **Auth/tenant**: assume-se que já existe sessão/usuário autenticado.
- **Armazenamento**: imagens de entrada e saída em object storage (ex.: S3),
  resultado entregue por URL temporária.
