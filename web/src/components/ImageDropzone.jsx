import { useCallback, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageDropzone({ preview, onSelect, onClear, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (file && ACCEPT.includes(file.type)) onSelect(file);
    },
    [onSelect]
  );

  if (preview) {
    return (
      <div className="group relative overflow-hidden rounded-lg border border-border">
        <img src={preview} alt="preview" className="max-h-[420px] w-full object-contain bg-secondary" />
        {!disabled && (
          <Button
            variant="utility"
            size="sm"
            onClick={onClear}
            className="absolute right-3 top-3"
          >
            <X className="h-4 w-4" /> Trocar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        'flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 text-center transition-colors',
        dragging && 'border-primary bg-primary/5'
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border">
        <Upload className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium">Arraste uma foto do ambiente vazio</p>
        <p className="text-sm text-muted-foreground">ou clique para selecionar — JPG, PNG ou WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
