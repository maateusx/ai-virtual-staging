import { useEffect, useState } from 'react';
import {
  Loader2,
  Download,
  Film,
  Eye,
  EyeOff,
  KeyRound,
  RectangleHorizontal,
  RectangleVertical,
  Proportions,
  MonitorPlay,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVideoStore } from '@/store/videoStore';
import { ImageDropzone } from '@/components/ImageDropzone';
import { VideoModelSelect } from '@/components/VideoModelSelect';
import { MotionSelect } from '@/components/MotionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CardSelect } from '@/components/ui/CardSelect';

// Label + icon + usage hint per video aspect ratio. The description calls out
// where each format fits best — 9:16 is the one for Stories/Reels.
const ASPECT_META = {
  '16:9': {
    label: 'Paisagem (16:9)',
    Icon: RectangleHorizontal,
    description: 'Widescreen horizontal — ideal para YouTube, site e apresentações.',
  },
  '9:16': {
    label: 'Retrato (9:16)',
    Icon: RectangleVertical,
    description: 'Vertical de tela cheia — ideal para Stories e Reels (Instagram/TikTok).',
  },
};

export function VideoPage() {
  const {
    models,
    motions,
    loadConfig,
    imageFile,
    imagePreview,
    setImage,
    model,
    setModel,
    motion,
    setMotion,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    duration,
    setDuration,
    audio,
    setAudio,
    prompt,
    setPrompt,
    apiKey,
    setApiKey,
    serverHasKey,
    create,
    submitting,
    status,
    result,
    error,
    reset,
    stopPolling,
  } = useVideoStore();

  const [showKey, setShowKey] = useState(false);

  const descriptor = models.find((m) => m.id === model) ?? null;
  const keyRequired = !serverHasKey;
  const missingKey = keyRequired && !apiKey.trim();
  const processing = status === 'processing';
  const done = status === 'done' && result?.result_video_url;

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Cancel any in-flight poll when leaving the page.
  useEffect(() => () => stopPolling(), [stopPolling]);

  const download = async () => {
    try {
      const res = await fetch(result.result_video_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível baixar o vídeo.');
    }
  };

  const fmtCost = (cost) =>
    `${cost.brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${cost.usd.toLocaleString(
      'en-US',
      { style: 'currency', currency: 'USD', minimumFractionDigits: cost.usd < 0.01 ? 4 : 2 }
    )})`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold leading-tight">
          Crie vídeos a partir de uma imagem
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Envie uma foto, escolha o modelo e os parâmetros, e a IA gera um vídeo curto animando a
          cena. A geração é assíncrona — pode levar alguns minutos.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: upload + result */}
        <div className="space-y-6">
          <ImageDropzone
            preview={imagePreview}
            onSelect={setImage}
            onClear={() => setImage(null)}
            disabled={processing || submitting}
          />

          {processing && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-secondary/40 py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="font-medium">Gerando vídeo…</p>
              <p className="text-sm text-muted-foreground">
                Isso pode levar alguns minutos. Você pode deixar esta aba aberta.
              </p>
            </div>
          )}

          {done && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-xl font-semibold">Resultado</h2>
              <video
                src={result.result_video_url}
                controls
                playsInline
                className="w-full rounded-lg border border-border bg-ink"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={download}>
                  <Download className="h-4 w-4" /> Baixar vídeo
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Novo vídeo
                </Button>
                <span className="text-sm text-muted-foreground">
                  {result.model}
                  {result.processing_ms ? ` · ${(result.processing_ms / 1000).toFixed(0)}s` : ''}
                  {result.aspect_ratio ? ` · ${result.aspect_ratio}` : ''}
                  {result.resolution ? ` · ${result.resolution}` : ''}
                  {result.duration_seconds ? ` · ${result.duration_seconds}s` : ''}
                  {result.cost
                    ? ` · ${result.cost.duration_seconds}s × $${result.cost.price_per_second_usd.toFixed(
                        2
                      )}/s · ${fmtCost(result.cost)}`
                    : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              {models.length > 0 && (
                <div className="space-y-2">
                  <Label>Modelo de vídeo</Label>
                  <VideoModelSelect
                    models={models}
                    value={model}
                    onChange={setModel}
                    disabled={processing || submitting}
                  />
                </div>
              )}

              {motions.length > 0 && (
                <div className="space-y-2">
                  <Label>Movimento de câmera</Label>
                  <MotionSelect
                    motions={motions}
                    value={motion}
                    onChange={setMotion}
                    disabled={processing || submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Só a câmera se move — o ambiente continua idêntico à foto, sem mudar a
                    estrutura nem adicionar nada novo.
                  </p>
                </div>
              )}

              {descriptor && (
                <>
                  <div className="space-y-2">
                    <Label>Proporção</Label>
                    <CardSelect
                      options={descriptor.aspect_ratios.map((opt) => ({
                        id: opt,
                        label: ASPECT_META[opt]?.label ?? opt,
                        Icon: ASPECT_META[opt]?.Icon ?? Proportions,
                        description: ASPECT_META[opt]?.description,
                      }))}
                      value={aspectRatio}
                      onChange={setAspectRatio}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Resolução</Label>
                    <CardSelect
                      options={descriptor.resolutions.map((opt) => ({
                        id: opt,
                        label: opt,
                        Icon: MonitorPlay,
                      }))}
                      value={resolution}
                      onChange={setResolution}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duração</Label>
                    <CardSelect
                      options={descriptor.durations.map((opt) => ({
                        id: opt,
                        label: `${opt}s`,
                        Icon: Clock,
                      }))}
                      value={duration ?? null}
                      onChange={setDuration}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label className="block">Áudio</Label>
                      <p className="text-xs text-muted-foreground">
                        {descriptor.supports_audio
                          ? 'Gera trilha/áudio junto com o vídeo.'
                          : 'Este modelo não gera áudio.'}
                      </p>
                    </div>
                    <Switch
                      checked={audio}
                      onCheckedChange={setAudio}
                      disabled={!descriptor.supports_audio || processing || submitting}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Detalhes adicionais (opcional)</Label>
                <Textarea
                  placeholder="ex.: movimento mais lento, leve aproximação ao final"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Ajuste fino do movimento escolhido acima. A foto enviada é o primeiro quadro e o
                  ambiente permanece inalterado.
                </p>
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
                    ? 'Este servidor não tem chave própria — cole sua chave do Gemini para gerar.'
                    : 'Cole sua chave para usar sua própria cota do Gemini (opcional).'}{' '}
                  A chave precisa de acesso ao Veo. Fica salva apenas neste navegador.{' '}
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
            disabled={!imageFile || processing || submitting || missingKey}
            onClick={create}
          >
            {processing || submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
              </>
            ) : (
              <>
                <Film className="h-4 w-4" /> Gerar vídeo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
