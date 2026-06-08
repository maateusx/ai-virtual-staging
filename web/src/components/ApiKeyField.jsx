import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Gemini API key input, shared by Staging and Video. When the server has no key
// of its own the field is required (BYOK). The reveal toggle and storage notice
// are identical everywhere; only the verb ("processar" vs "gerar") and any extra
// note (e.g. "precisa de acesso ao Veo") differ, so those come in as props.
//
// Props:
//   value, onChange  – controlled string value
//   required         – true when the server has no key (field is mandatory)
//   requiredHint     – sentence shown when required (server has no key)
//   note             – trailing storage/scope sentence (varies per page)
export function ApiKeyField({ value, onChange, required, requiredHint, note }) {
  const [showKey, setShowKey] = useState(false);
  const missing = required && !value.trim();

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <KeyRound className="h-4 w-4" /> Chave da API Gemini{' '}
        {required ? (
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={missing}
          className={`pr-11 ${missing ? 'border-destructive' : ''}`}
        />
        {value && (
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
        {required ? requiredHint : 'Cole sua chave para usar sua própria cota do Gemini (opcional).'}{' '}
        {note}{' '}
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
  );
}
