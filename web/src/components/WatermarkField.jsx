import { useRef } from 'react';
import {
  Stamp,
  X,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Scaling,
} from 'lucide-react';
import { useStagingStore } from '@/store/stagingStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CardSelect } from '@/components/ui/CardSelect';

const VERTICALS = [
  { id: 'top', label: 'Topo', Icon: ArrowUpToLine },
  { id: 'middle', label: 'Meio', Icon: AlignVerticalJustifyCenter },
  { id: 'bottom', label: 'Base', Icon: ArrowDownToLine },
];

const HORIZONTALS = [
  { id: 'left', label: 'Esquerda', Icon: ArrowLeftToLine },
  { id: 'center', label: 'Centro', Icon: AlignHorizontalJustifyCenter },
  { id: 'right', label: 'Direita', Icon: ArrowRightToLine },
];

// Width as a % of the output image — kept in sync with the backend bounds.
const SIZES = [
  { id: 10, label: 'Pequena (10%)', Icon: Scaling },
  { id: 20, label: 'Média (20%)', Icon: Scaling },
  { id: 30, label: 'Grande (30%)', Icon: Scaling },
  { id: 45, label: 'Extra grande (45%)', Icon: Scaling },
];

// Quick-pick colours for the recolor filter (real-estate marks are usually
// monochrome). Any other colour is reachable via the native picker.
const COLOR_PRESETS = ['#ffffff', '#000000'];
const DEFAULT_FILTER_COLOR = '#ffffff';

export function WatermarkField({ disabled }) {
  const inputRef = useRef(null);
  const {
    watermarkFile,
    watermarkPreview,
    setWatermarkFile,
    watermarkVertical,
    setWatermarkVertical,
    watermarkHorizontal,
    setWatermarkHorizontal,
    watermarkSize,
    setWatermarkSize,
    watermarkOpacity,
    setWatermarkOpacity,
    watermarkColor,
    setWatermarkColor,
  } = useStagingStore();

  const colorEnabled = !!watermarkColor;

  const pick = (files) => {
    const file = files?.[0];
    if (file && file.type === 'image/png') setWatermarkFile(file);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <Stamp className="h-4 w-4" /> Marca d'água{' '}
        <span className="font-normal text-muted-foreground">(opcional)</span>
      </Label>

      {watermarkPreview ? (
        <div className="group relative overflow-hidden rounded-md border border-border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
          <img
            src={watermarkPreview}
            alt="Marca d'água"
            className="mx-auto max-h-28 w-auto object-contain p-2"
          />
          {!disabled && (
            <Button
              variant="utility"
              size="sm"
              onClick={() => setWatermarkFile(null)}
              className="absolute right-2 top-2"
            >
              <X className="h-4 w-4" /> Remover
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm transition-colors hover:border-primary disabled:opacity-50"
        >
          <span className="font-medium">Enviar PNG da marca d'água</span>
          <span className="text-muted-foreground">
            Use um PNG com fundo transparente para o melhor resultado.
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />

      {watermarkFile && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vertical</Label>
              <CardSelect
                options={VERTICALS}
                value={watermarkVertical}
                onChange={setWatermarkVertical}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Horizontal</Label>
              <CardSelect
                options={HORIZONTALS}
                value={watermarkHorizontal}
                onChange={setWatermarkHorizontal}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tamanho</Label>
            <CardSelect
              options={SIZES}
              value={watermarkSize}
              onChange={setWatermarkSize}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Opacidade</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{watermarkOpacity}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
              disabled={disabled}
              className="w-full accent-primary disabled:opacity-50"
              aria-label="Opacidade da marca d'água"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Filtro de cor</Label>
              <Switch
                checked={colorEnabled}
                onCheckedChange={(on) => setWatermarkColor(on ? DEFAULT_FILTER_COLOR : null)}
                disabled={disabled}
                aria-label="Ativar filtro de cor"
              />
            </div>
            {colorEnabled && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={watermarkColor}
                  onChange={(e) => setWatermarkColor(e.target.value)}
                  disabled={disabled}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5 disabled:opacity-50"
                  aria-label="Cor da marca d'água"
                />
                <span className="text-xs uppercase tabular-nums text-muted-foreground">
                  {watermarkColor}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWatermarkColor(c)}
                      disabled={disabled}
                      aria-label={`Cor ${c}`}
                      className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                        watermarkColor?.toLowerCase() === c
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Recolore a marca mantendo o formato — útil para deixá-la branca ou preta sobre a foto.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Aplicada localmente sobre o resultado — não usa a IA e não gera custo extra.
          </p>
        </div>
      )}
    </div>
  );
}
