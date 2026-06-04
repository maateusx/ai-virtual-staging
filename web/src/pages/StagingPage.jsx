import { useEffect, useState } from 'react';
import { Loader2, Download, Wand2, ChevronDown, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useStagingStore } from '@/store/stagingStore';
import { ImageDropzone } from '@/components/ImageDropzone';
import { MaskCanvas } from '@/components/MaskCanvas';
import { ParameterField } from '@/components/ParameterField';
import { BeforeAfter } from '@/components/BeforeAfter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    process,
    processing,
    result,
    error,
    reset,
  } = useStagingStore();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showKey, setShowKey] = useState(false);
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
    edit: 'Pinte uma área da foto e descreva a alteração — só ela muda, o resto fica intacto.',
  };
  const isFurnish = mode === 'furnish';
  const isEdit = mode === 'edit';
  // When the backend has no key of its own, the user must bring their own (BYOK).
  const keyRequired = !serverHasKey;
  const missingKey = keyRequired && !apiKey.trim();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

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
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold leading-tight">
          {isFurnish
            ? 'Mobilie ambientes vazios com IA'
            : isEdit
              ? 'Edite trechos da foto com IA'
              : 'Esvazie ambientes com IA'}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isFurnish
            ? 'Envie a foto de um cômodo vazio, escolha o estilo e receba o ambiente mobiliado — preservando paredes, janelas e perspectiva.'
            : isEdit
              ? 'Envie a foto, pinte a região que quer mudar e descreva a alteração — só a área marcada é editada, o resto fica idêntico.'
              : 'Envie a foto de um cômodo e remova os móveis — preservando paredes, janelas e perspectiva.'}
        </p>
      </div>

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
                <span className="text-sm text-muted-foreground">
                  {result.model} · {(result.processing_ms / 1000).toFixed(1)}s
                  {result.aspect_ratio ? ` · ${result.aspect_ratio}` : ''}
                  {result.image_size ? ` · ${result.image_size}` : ''}
                  {result.usage?.total_tokens
                    ? ` · ${result.usage.total_tokens.toLocaleString('pt-BR')} tokens`
                    : ''}
                </span>
              </div>

              <button
                onClick={() => setShowPrompt((v) => !v)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`}
                />
                Ver prompt final
              </button>
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
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        disabled={processing}
                        className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                          mode === m.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
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
                    <Select value={aspectRatio ?? ''} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {outputConfig.aspect_ratios.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {aspectRatio && aspectRatio !== 'original' && (
                    <div className="space-y-2">
                      <Label>Ajuste de proporção</Label>
                      <Select value={aspectFit ?? ''} onValueChange={setAspectFit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione…" />
                        </SelectTrigger>
                        <SelectContent>
                          {outputConfig.aspect_fits.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {aspectFit === 'ai'
                          ? 'A IA expande a cena para preencher a nova proporção — gera o ambiente ao redor, sem cortar nem adicionar barras (gera uma segunda imagem, leva mais tempo).'
                          : aspectFit === 'pad'
                            ? 'Mantém a imagem inteira e adiciona barras — sem cortar nem inventar nada.'
                            : 'Recorta as bordas para a nova proporção, preservando a geometria real.'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Resolução</Label>
                    <Select value={imageSize ?? ''} onValueChange={setImageSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {outputConfig.image_sizes.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Variações</Label>
                <Select
                  value={String(variations)}
                  onValueChange={(v) => setVariations(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 1 ? '1 imagem' : `${n} imagens`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {variations > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Gera {variations} opções de uma vez para você escolher — consome{' '}
                    {variations}× a cota/custo.
                  </p>
                )}
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

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4" /> Chave da API Gemini{' '}
                  {keyRequired ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="AIza…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    aria-invalid={missingKey}
                    className={`pr-11 ${missingKey ? 'border-destructive' : ''}`}
                  />
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {keyRequired
                    ? 'Este servidor não tem chave própria — cole sua chave do Gemini para processar.'
                    : 'Cole sua chave para usar sua própria cota do Gemini (opcional).'}{' '}
                  Fica salva apenas neste navegador e é enviada só para processar a imagem.{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Obter uma chave
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

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
          {processing && (
            <p className="text-center text-sm text-muted-foreground">
              Isso pode levar de 15s a ~2min.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
