import { useEffect, useState } from 'react';
import { Loader2, Download, Wand2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useStagingStore } from '@/store/stagingStore';
import { ImageDropzone } from '@/components/ImageDropzone';
import { ParameterField } from '@/components/ParameterField';
import { BeforeAfter } from '@/components/BeforeAfter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function StagingPage() {
  const {
    parameters,
    loadConfig,
    imagePreview,
    imageFile,
    setImage,
    selections,
    setSelection,
    extraPrompt,
    setExtraPrompt,
    process,
    processing,
    result,
    error,
    reset,
  } = useStagingStore();

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const download = async () => {
    try {
      const res = await fetch(result.result_image_url);
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
          Mobilie ambientes vazios com IA
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Envie a foto de um cômodo vazio, escolha o estilo e receba o ambiente
          mobiliado — preservando paredes, janelas e perspectiva.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: upload + result */}
        <div className="space-y-6">
          <ImageDropzone
            preview={imagePreview}
            onSelect={setImage}
            onClear={() => setImage(null)}
            disabled={processing}
          />

          {result && imagePreview && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-xl font-semibold">Resultado</h2>
              <BeforeAfter before={imagePreview} after={result.result_image_url} />
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={download}>
                  <Download className="h-4 w-4" /> Baixar imagem
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Novo staging
                </Button>
                <span className="text-sm text-muted-foreground">
                  {result.model} · {(result.processing_ms / 1000).toFixed(1)}s
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
              {parameters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum parâmetro configurado ainda. Vá em{' '}
                  <span className="font-medium">Configuração</span>.
                </p>
              )}
              {parameters.map((p) => (
                <ParameterField
                  key={p.id}
                  parameter={p}
                  value={selections[p.id]}
                  onChange={(v) => setSelection(p.id, v)}
                />
              ))}

              <div className="space-y-2">
                <Label>Prompt adicional (opcional)</Label>
                <Textarea
                  placeholder="ex.: adicionar uma planta no canto"
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={!imageFile || processing}
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
