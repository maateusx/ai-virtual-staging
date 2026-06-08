import { useEffect, useState } from 'react';
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Images,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Crop,
  Frame,
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStagingStore } from '@/store/stagingStore';
import { ImageDropzone } from '@/components/ImageDropzone';
import { MaskCanvas } from '@/components/MaskCanvas';
import { ParameterField } from '@/components/ParameterField';
import { BeforeAfter } from '@/components/BeforeAfter';
import { ModeSelect } from '@/components/ModeSelect';
import { WatermarkField } from '@/components/WatermarkField';
import { ApiKeyField } from '@/components/ApiKeyField';
import { MetaLine } from '@/components/MetaLine';
import { ProcessingPlaceholder } from '@/components/ProcessingPlaceholder';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CardSelect } from '@/components/ui/CardSelect';
import { DisclosureToggle } from '@/components/ui/Disclosure';

// Icon + usage hint per aspect-ratio preset id (see server outputFormats.js).
// Descriptions point to where each format fits best on social media.
const ASPECT_RATIO_META = {
  original: { Icon: ImageIcon, description: 'Mantém a proporção da foto enviada.' },
  '16:9': { Icon: RectangleHorizontal, description: 'Widescreen — sites, anúncios e capas.' },
  '1:1': { Icon: Square, description: 'Quadrado — feed do Instagram e catálogos.' },
  '3:4': { Icon: RectangleVertical, description: 'Vertical — posts de feed que ocupam mais a tela.' },
  '9:16': {
    Icon: RectangleVertical,
    description: 'Tela cheia no celular — ideal para Stories e Reels (Instagram/TikTok).',
  },
  '4:3': { Icon: RectangleHorizontal, description: 'Clássico — fotografia e portais de imóveis.' },
};

// Icon + description per aspect-fit strategy.
const ASPECT_FIT_META = {
  ai: {
    Icon: Wand2,
    description:
      'A IA expande a cena para preencher a nova proporção — gera o ambiente ao redor, sem cortar nem adicionar barras (gera uma segunda imagem, leva mais tempo).',
  },
  pad: {
    Icon: Frame,
    description: 'Mantém a imagem inteira e adiciona barras — sem cortar nem inventar nada.',
  },
  crop: {
    Icon: Crop,
    description: 'Recorta as bordas para a nova proporção, preservando a geometria real.',
  },
};

export function StagingPage() {
  const {
    parameters,
    loadConfig,
    imagePreview,
    imageFile,
    setImage,
    maskFile,
    setMaskFile,
    modes,
    mode,
    setMode,
    selections,
    setSelection,
    extraPrompt,
    setExtraPrompt,
    apiKey,
    setApiKey,
    serverHasKey,
    outputConfig,
    aspectRatio,
    setAspectRatio,
    aspectFit,
    setAspectFit,
    imageSize,
    setImageSize,
    variations,
    setVariations,
    promptDraft,
    setPromptDraft,
    promptEdited,
    previewLoading,
    loadPromptPreview,
    resetPromptDraft,
    process,
    processing,
    result,
    error,
    reset,
  } = useStagingStore();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(0);

  // Result variations (falls back to the single-image shape for safety).
  const resultVariations = result
    ? (result.variations ?? [{ result_image_url: result.result_image_url }])
    : [];
  const selectedUrl = resultVariations[selectedVariation]?.result_image_url;

  // Reset the selection whenever a new result arrives.
  useEffect(() => {
    setSelectedVariation(0);
  }, [result]);

  // Short helper text shown under the mode toggle.
  const MODE_HINTS = {
    furnish: 'Adiciona móveis e decoração ao ambiente vazio.',
    empty: 'Remove todos os móveis e decoração, deixando o ambiente vazio e limpo.',
    declutter: 'Mantém apenas o mínimo dos móveis originais, removendo o excesso.',
    enhance:
      'Mantém a foto exatamente como está e devolve em maior nitidez e resolução — sem alterar nada do conteúdo.',
    edit: 'Pinte uma área da foto e descreva a alteração — só ela muda, o resto fica intacto.',
  };
  const isFurnish = mode === 'furnish';
  const isEdit = mode === 'edit';
  const isEnhance = mode === 'enhance';
  // When the backend has no key of its own, the user must bring their own (BYOK).
  const keyRequired = !serverHasKey;
  const missingKey = keyRequired && !apiKey.trim();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // While the prompt editor is open, keep the auto-composed preview in sync with
  // the current settings (debounced). No-ops once the user edits it manually.
  useEffect(() => {
    if (!showPromptEditor) return;
    const t = setTimeout(() => loadPromptPreview(), 300);
    return () => clearTimeout(t);
  }, [showPromptEditor, mode, selections, extraPrompt, loadPromptPreview]);

  const download = async () => {
    try {
      const res = await fetch(selectedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `staging-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível baixar a imagem.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title={
          isFurnish
            ? 'Mobilie ambientes vazios com IA'
            : isEdit
              ? 'Edite trechos da foto com IA'
              : isEnhance
                ? 'Melhore a qualidade da foto com IA'
                : 'Esvazie ambientes com IA'
        }
        subtitle={
          isFurnish
            ? 'Envie a foto de um cômodo vazio, escolha o estilo e receba o ambiente mobiliado — preservando paredes, janelas e perspectiva.'
            : isEdit
              ? 'Envie a foto, pinte a região que quer mudar e descreva a alteração — só a área marcada é editada, o resto fica idêntico.'
              : isEnhance
                ? 'Envie a foto e receba de volta a mesma imagem, sem alterar nada do conteúdo — apenas mais nítida e em maior resolução.'
                : 'Envie a foto de um cômodo e remova os móveis — preservando paredes, janelas e perspectiva.'
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: upload + result */}
        <div className="space-y-6">
          {isEdit && imagePreview && !result ? (
            <MaskCanvas
              src={imagePreview}
              onChange={setMaskFile}
              onClear={() => setImage(null)}
              disabled={processing}
            />
          ) : (
            <ImageDropzone
              preview={imagePreview}
              onSelect={setImage}
              onClear={() => setImage(null)}
              disabled={processing}
            />
          )}

          {processing && !result && (
            <ProcessingPlaceholder
              title="Processando…"
              subtitle="Isso pode levar de 15s a ~2min."
            />
          )}

          {result && imagePreview && selectedUrl && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-xl font-semibold">
                Resultado
                {resultVariations.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {resultVariations.length} variações
                  </span>
                )}
              </h2>
              <BeforeAfter before={imagePreview} after={selectedUrl} />

              {resultVariations.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {resultVariations.map((v, i) => (
                    <button
                      key={v.result_image_url}
                      type="button"
                      onClick={() => setSelectedVariation(i)}
                      className={`relative overflow-hidden rounded-md border-2 transition-colors ${
                        i === selectedVariation
                          ? 'border-primary'
                          : 'border-transparent hover:border-border'
                      }`}
                      aria-label={`Variação ${i + 1}`}
                      aria-pressed={i === selectedVariation}
                    >
                      <img
                        src={v.result_image_url}
                        alt={`Variação ${i + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                      <span className="absolute left-1 top-1 rounded bg-ink/70 px-1.5 text-xs text-white">
                        {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={download}>
                  <Download className="h-4 w-4" /> Baixar imagem
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Novo staging
                </Button>
                <MetaLine
                  items={[
                    result.model,
                    `${(result.processing_ms / 1000).toFixed(1)}s`,
                    result.aspect_ratio,
                    result.image_size,
                    result.usage?.total_tokens &&
                      `${result.usage.total_tokens.toLocaleString('pt-BR')} tokens`,
                    result.cost &&
                      `${result.cost.brl.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })} (${result.cost.usd.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: result.cost.usd < 0.01 ? 4 : 2,
                      })})`,
                  ]}
                />
              </div>

              <DisclosureToggle open={showPrompt} onToggle={() => setShowPrompt((v) => !v)}>
                Ver prompt final
              </DisclosureToggle>
              {showPrompt && (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {result.composed_prompt}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right: parameters */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              {modes.length > 0 && (
                <div className="space-y-2">
                  <Label>O que fazer com o ambiente</Label>
                  <ModeSelect
                    modes={modes}
                    value={mode}
                    onChange={setMode}
                    disabled={processing}
                  />
                  <p className="text-sm text-muted-foreground">{MODE_HINTS[mode]}</p>
                </div>
              )}

              {isFurnish && parameters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum parâmetro configurado ainda. Vá em{' '}
                  <span className="font-medium">Configuração</span>.
                </p>
              )}
              {isFurnish &&
                parameters.map((p) => (
                  <ParameterField
                    key={p.id}
                    parameter={p}
                    value={selections[p.id]}
                    onChange={(v) => setSelection(p.id, v)}
                  />
                ))}

              {!isEdit && outputConfig && (
                <>
                  <div className="space-y-2">
                    <Label>Proporção da saída</Label>
                    <CardSelect
                      options={outputConfig.aspect_ratios.map((opt) => ({
                        id: opt.id,
                        label: opt.label,
                        Icon: ASPECT_RATIO_META[opt.id]?.Icon ?? ImageIcon,
                        description: ASPECT_RATIO_META[opt.id]?.description,
                      }))}
                      value={aspectRatio}
                      onChange={setAspectRatio}
                    />
                  </div>

                  {aspectRatio && aspectRatio !== 'original' && (
                    <div className="space-y-2">
                      <Label>Ajuste de proporção</Label>
                      <CardSelect
                        options={outputConfig.aspect_fits.map((opt) => ({
                          id: opt.id,
                          label: opt.label,
                          Icon: ASPECT_FIT_META[opt.id]?.Icon,
                          description: ASPECT_FIT_META[opt.id]?.description,
                        }))}
                        value={aspectFit}
                        onChange={setAspectFit}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Resolução</Label>
                    <CardSelect
                      options={outputConfig.image_sizes.map((opt) => ({
                        id: opt.id,
                        label: opt.label,
                        Icon: Maximize2,
                      }))}
                      value={imageSize}
                      onChange={setImageSize}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Variações</Label>
                <CardSelect
                  options={[1, 2, 3, 4].map((n) => ({
                    id: n,
                    label: n === 1 ? '1 imagem' : `${n} imagens`,
                    Icon: n === 1 ? ImageIcon : Images,
                    description:
                      n === 1
                        ? 'Gera uma única imagem.'
                        : `Gera ${n} opções de uma vez — consome ${n}× a cota/custo.`,
                  }))}
                  value={variations}
                  onChange={setVariations}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {isEdit ? (
                    <>
                      O que mudar <span className="text-destructive">*</span>
                    </>
                  ) : (
                    'Prompt adicional (opcional)'
                  )}
                </Label>
                <Textarea
                  placeholder={
                    isEdit
                      ? 'ex.: troque o sofá por um de couro caramelo'
                      : isFurnish
                        ? 'ex.: adicionar uma planta no canto'
                        : isEnhance
                          ? 'ex.: dar mais nitidez aos detalhes da madeira'
                          : 'ex.: remover também as cortinas'
                  }
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  aria-invalid={isEdit && !extraPrompt.trim()}
                  className={isEdit && !extraPrompt.trim() ? 'border-destructive' : ''}
                />
                {isEdit && (
                  <p className="text-sm text-muted-foreground">
                    Descreve a alteração para a área pintada na foto.
                  </p>
                )}
              </div>

              <ApiKeyField
                value={apiKey}
                onChange={setApiKey}
                required={keyRequired}
                requiredHint="Este servidor não tem chave própria — cole sua chave do Gemini para processar."
                note="Fica salva apenas neste navegador e é enviada só para processar a imagem."
              />

              <div className="border-t border-border pt-5">
                <WatermarkField disabled={processing} />
              </div>
            </CardContent>
          </Card>

          {/* Final prompt: preview & edit before running a (billed) generation */}
          <div className="space-y-2">
            <DisclosureToggle
              open={showPromptEditor}
              onToggle={() => setShowPromptEditor((v) => !v)}
            >
              {showPromptEditor ? 'Ocultar prompt final' : 'Ver / editar prompt final'}
            </DisclosureToggle>
            {showPromptEditor && (
              <div className="space-y-2">
                <Textarea
                  rows={9}
                  value={promptDraft}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  placeholder={
                    previewLoading ? 'Carregando prompt…' : 'O prompt final aparecerá aqui.'
                  }
                  className="font-mono text-xs leading-relaxed"
                  disabled={processing}
                />
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {promptEdited
                      ? 'Prompt manual — mudanças nos parâmetros não o atualizam.'
                      : 'Gerado a partir dos parâmetros acima.'}
                  </span>
                  {promptEdited && (
                    <button
                      type="button"
                      onClick={resetPromptDraft}
                      className="shrink-0 underline hover:text-foreground"
                    >
                      Restaurar automático
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={
              !imageFile ||
              processing ||
              missingKey ||
              (isEdit && (!maskFile || !extraPrompt.trim()))
            }
            onClick={process}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processando…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Processar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
