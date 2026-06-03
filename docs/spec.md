# Spec — Virtual Staging (MVP síncrono)

## 1. Visão geral

Ferramenta de virtual staging em que o usuário faz upload de uma foto de
imóvel, escolhe um **modo** de operação (mobiliar / esvaziar / minimizar) e
alguns parâmetros (estilo, tipo de cômodo, etc.), opcionalmente escreve um
prompt adicional e define o **formato de saída** (proporção e resolução). O
sistema monta uma instrução final, chama um modelo de edição de imagem por IA e
devolve a imagem resultante para download.

Esta versão é **síncrona** (sem fila) e cobre tanto **imóveis vazios** (mobiliar)
quanto **imóveis ocupados** (esvaziar / minimizar).

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
- Três **modos** de operação:
  - `furnish` (Mobiliar) — adiciona móveis e decoração a um cômodo vazio.
  - `empty` (Esvaziar) — remove todos os móveis/decoração, deixando o cômodo
    vazio e limpo.
  - `declutter` (Minimizar) — remove o excesso, mantendo só o mínimo essencial
    dos móveis originais.
- Controle de **formato de saída**: proporção (aspect ratio) e resolução, com
  três estratégias para atingir a proporção (recortar, adicionar barras ou
  expandir com IA / outpaint).

**Fora desta versão (fases futuras)**
- Fila (SQS) e processamento assíncrono.
- Webhook de notificação.
- Máscara automática / consistência multi-view.

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
2. **Modo**: toggle entre Mobiliar / Esvaziar / Minimizar.
3. **Parâmetros**: renderizados dinamicamente a partir da configuração ativa.
   Só aparecem (e só são aplicados) no modo `furnish` — nos modos de remoção os
   fragmentos de estilo não fazem sentido.
4. **Formato de saída**: proporção (16:9, 1:1, 3:4, 9:16, 4:3 ou "original") e
   resolução (1K, 2K, 4K). Ao escolher uma proporção diferente da original,
   aparece o seletor de **ajuste de proporção** (recortar / barras / IA).
5. **Prompt adicional**: campo de texto livre, opcional (aplica-se a todos os modos).
6. Botão **Processar** → chamada síncrona ao backend (mostra loading).
7. **Resultado**: comparação antes/depois + botão de **Download**.
8. (Opcional debug) exibir o prompt final montado.

## 4. Fluxo de processamento (backend, síncrono)

1. Recebe: imagem + `mode` + ids das opções escolhidas + `extra_prompt` +
   formato de saída (`aspect_ratio`, `aspect_fit`, `image_size`).
2. Valida `mode`, `aspect_ratio`, `aspect_fit` e `image_size` (422 se inválidos).
3. Resolve os `prompt_fragment` das opções escolhidas a partir da config (só no
   modo `furnish`).
4. Monta o **prompt final** com a base do modo escolhido (ver seção 6).
5. Chama o modelo de edição (image-to-image) com instrução de **preservar a
   estrutura** do ambiente (paredes, janelas, piso, perspectiva). A resolução
   pedida (`image_size`) vai no `config.imageConfig` da chamada Gemini.
6. **Reframe** para a proporção pedida (ver seção 8):
   - `crop` / `pad` — operação determinística com `sharp` (sem inventar pixels).
   - `ai` — *outpaint*: segunda chamada ao modelo para estender a cena e
     preencher o novo quadro.
7. Persiste o job (`StagingJob`) e devolve a imagem ao cliente por URL temporária.

Provedor atual: **Google Gemini** ("Nano Banana", `gemini-3.1-flash-image`),
chamado direto via `@google/genai` — chamada de API gerenciada, o backend não
precisa de GPU. Sem `GEMINI_API_KEY`, roda em modo *mock* (devolve a entrada).

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
    { "id": "declutter", "label": "Minimizar" }
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
  }
}
```
Observações: `prompt_fragment` **não** é exposto aqui — fica só no backend.
`modes` e `output` são listas curadas no código (`promptBuilder.js` /
`outputFormats.js`), não no banco.

### 5.2. Processar imagem (síncrono)

```
POST /v1/staging
Content-Type: multipart/form-data

image:        <arquivo>            (obrigatório)
selections:   {"estilo":"escandinavo","comodo":"sala"}   (JSON, obrigatório)
extra_prompt: "adicionar uma planta no canto"            (opcional)
mode:         "furnish"            (opcional, default "furnish")
aspect_ratio: "original"          (opcional, default "original")
aspect_fit:   "crop"              (opcional, default "crop"; usado se aspect_ratio ≠ original)
image_size:   "1K"               (opcional, default "1K")

200 OK
{
  "result_image_url": "https://.../out/abc.jpg",   // URL temporária
  "composed_prompt":  "...",                        // para debug/transparência
  "mode":          "furnish",
  "aspect_ratio":  "original",
  "aspect_fit":    "crop",
  "image_size":    "1K",
  "model": "gemini-3.1-flash-image",
  "processing_ms": 14820
}

422 — parâmetro inválido / imagem ausente / mode/aspect_ratio/aspect_fit/image_size inválidos
502 — falha do provedor de modelo
```

## 6. Montagem do prompt final

```
[base do modo] + [fragmentos das opções escolhidas, na ordem dos parâmetros] + [extra_prompt] + [tail]
```

A **base** depende do `mode` escolhido (ver `promptBuilder.js`). Todas as bases
incluem um bloco forte de preservação de geometria/perspectiva (`PRESERVE`); as
bases de remoção (`empty`/`declutter`) incluem ainda um bloco que proíbe inventar
qualquer objeto novo ao preencher o espaço liberado (`NO_ADDITIONS`).

Os **fragmentos** das opções só são concatenados no modo `furnish` — nos modos de
remoção os estilos não se aplicam. O `extra_prompt` e o `tail`
("Photorealistic, consistent lighting and shadows.") valem para todos os modos.

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
  output_image_url text
  mode            text             (furnish | empty | declutter)
  selections      jsonb
  extra_prompt    text
  composed_prompt text
  aspect_ratio    text
  aspect_fit      text
  image_size      text
  model           text
  processing_ms   int
  status          enum(done, error)
  error           text             (preenchido quando status = error)
  created_at      timestamptz
```

## 8. Decisões e suposições (ajustar conforme necessário)

- **Síncrono**: a requisição fica aberta durante o processamento (~15s a ~2min
  conforme o modelo). Aceitável em baixo volume; migrar para fila quando o
  volume ou o timeout incomodar. Sugerido timeout de cliente ≥ 120s.
- **Geometria**: nesta versão a preservação do ambiente vem da *instrução* ao
  modelo (bloco `PRESERVE` no prompt). Para garantia forte (pixels fora da área
  intocados), adicionar inpaint mascarado numa próxima iteração — não incluído
  aqui para manter simples.
- **Proporção de saída**: o default é `original` — manter as proporções da
  entrada, porque forçar outra proporção na chamada ao modelo faz ele re-enquadrar
  e deslocar o ângulo aparente da câmera. Por isso a proporção é resolvida
  **depois** da geração, em `services/reframe.js` com `sharp`:
  - `crop` recorta as bordas (centro), `pad` adiciona barras — ambos
    determinísticos, sem inventar conteúdo;
  - `ai` faz *outpaint*: centraliza a foto numa tela maior e pede ao modelo para
    preencher só as margens, estendendo a cena (segunda chamada, mais lenta).
- **Dependência `sharp`**: usada para o reframe determinístico. É binária
  (libvips) e instala junto no `npm install`.
- **Resolução**: `image_size` (1K/2K/4K) é a única parte de `imageConfig` enviada
  ao Gemini; o modo *mock* a ignora.
- **Parâmetros**: assumidos como globais (definidos por admin). Se forem por
  tenant, adicionar `tenant_id` em `staging_parameter`/`_option`.
- **Auth/tenant**: assume-se que já existe sessão/usuário autenticado.
- **Armazenamento**: imagens de entrada e saída em object storage (ex.: S3),
  resultado entregue por URL temporária.
