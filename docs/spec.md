# Spec — Virtual Staging (MVP síncrono)

## 1. Visão geral

Ferramenta de virtual staging em que o usuário faz upload de uma foto de
imóvel, escolhe alguns parâmetros (estilo, tipo de cômodo, etc.) e opcionalmente
escreve um prompt adicional. O sistema monta uma instrução final, chama um
modelo de edição de imagem por IA e devolve a imagem mobiliada para download.

Esta versão é **síncrona** (sem fila) e mira **imóveis vazios**.

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
- Alvo: cômodo vazio (sem móveis para remover).

**Fora desta versão (fases futuras)**
- Fila (SQS) e processamento assíncrono.
- Webhook de notificação.
- Remoção de móveis (imóvel ocupado).
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
2. **Parâmetros**: renderizados dinamicamente a partir da configuração ativa.
3. **Prompt adicional**: campo de texto livre, opcional.
4. Botão **Processar** → chamada síncrona ao backend (mostra loading).
5. **Resultado**: comparação antes/depois + botão de **Download**.
6. (Opcional debug) exibir o prompt final montado.

## 4. Fluxo de processamento (backend, síncrono)

1. Recebe: imagem + ids das opções escolhidas + `extra_prompt`.
2. Resolve os `prompt_fragment` das opções escolhidas a partir da config.
3. Monta o **prompt final** (ver seção 6).
4. Chama o modelo de edição (image-to-image) com instrução de **preservar a
   estrutura** do ambiente (paredes, janelas, piso, perspectiva).
5. Recebe a imagem gerada e devolve ao cliente (URL temporária ou base64).

Provedor sugerido: fal (modelo Nano Banana 2 Edit), por ser chamada de API
gerenciada — o backend não precisa de GPU.

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
  ]
}
```
Observação: `prompt_fragment` **não** é exposto aqui — fica só no backend.

### 5.2. Processar imagem (síncrono)

```
POST /v1/staging
Content-Type: multipart/form-data

image:        <arquivo>            (obrigatório)
selections:   {"estilo":"escandinavo","comodo":"sala"}   (JSON, obrigatório)
extra_prompt: "adicionar uma planta no canto"            (opcional)

200 OK
{
  "result_image_url": "https://.../out/abc.jpg",   // URL temporária
  "composed_prompt":  "...",                        // para debug/transparência
  "model": "nano-banana-2",
  "processing_ms": 14820
}

422 — parâmetro inválido / imagem ausente
502 — falha do provedor de modelo
```

## 6. Montagem do prompt final

```
[base] + [fragmentos das opções escolhidas, na ordem dos parâmetros] + [extra_prompt]
```

Template base (exemplo):
> "Furnish this empty room. Keep the walls, windows, floor and camera
> perspective exactly unchanged; only add furniture and decor. {fragmentos}.
> {extra_prompt} Photorealistic, consistent lighting and shadows."

Exemplo montado (estilo=escandinavo, cômodo=sala, extra="planta no canto"):
> "Furnish this empty room. Keep the walls, windows, floor and camera
> perspective exactly unchanged; only add furniture and decor. In a Scandinavian
> style with light wood and neutral tones; as a living room; medium furniture
> density. Add a plant in the corner. Photorealistic, consistent lighting and
> shadows."

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
  selections      jsonb
  extra_prompt    text
  composed_prompt text
  status          enum(done, error)
  created_at      timestamptz
```

## 8. Decisões e suposições (ajustar conforme necessário)

- **Síncrono**: a requisição fica aberta durante o processamento (~15s a ~2min
  conforme o modelo). Aceitável em baixo volume; migrar para fila quando o
  volume ou o timeout incomodar. Sugerido timeout de cliente ≥ 120s.
- **Geometria**: nesta versão a preservação do ambiente vem da *instrução* ao
  modelo. Para garantia forte (pixels fora da área intocados), adicionar inpaint
  mascarado numa próxima iteração — não incluído aqui para manter simples.
- **Parâmetros**: assumidos como globais (definidos por admin). Se forem por
  tenant, adicionar `tenant_id` em `staging_parameter`/`_option`.
- **Auth/tenant**: assume-se que já existe sessão/usuário autenticado.
- **Armazenamento**: imagens de entrada e saída em object storage (ex.: S3),
  resultado entregue por URL temporária.
