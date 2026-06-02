import { useEffect, useState } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfigStore } from '@/store/configStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ConfigPage() {
  const {
    parameters,
    load,
    error,
    createParameter,
    updateParameter,
    deleteParameter,
    createOption,
    updateOption,
    deleteOption,
  } = useConfigStore();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('single_select');

  const addParameter = async () => {
    if (!newLabel.trim()) return;
    await createParameter({ label: newLabel.trim(), type: newType, order: parameters.length });
    setNewLabel('');
    setNewType('single_select');
    toast.success('Parâmetro criado.');
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-primary" />
        <h1 className="font-display text-3xl font-semibold">Configuração de parâmetros</h1>
      </div>
      <p className="mb-8 text-muted-foreground">
        Defina os parâmetros e opções exibidos na tela de staging. Cada opção carrega
        um <em>fragmento de prompt</em> usado para montar a instrução final.
      </p>

      {/* New parameter */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Novo parâmetro</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Nome</Label>
            <Input
              placeholder="ex.: Estilo de decoração"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addParameter()}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_select">Seleção única</SelectItem>
                <SelectItem value="multi_select">Múltipla escolha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addParameter}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {parameters.map((param) => (
          <ParameterCard
            key={param.id}
            param={param}
            onUpdate={updateParameter}
            onDelete={deleteParameter}
            onCreateOption={createOption}
            onUpdateOption={updateOption}
            onDeleteOption={deleteOption}
          />
        ))}
      </div>
    </div>
  );
}

function ParameterCard({
  param,
  onUpdate,
  onDelete,
  onCreateOption,
  onUpdateOption,
  onDeleteOption,
}) {
  const [label, setLabel] = useState(param.label);
  const [optLabel, setOptLabel] = useState('');
  const [optFragment, setOptFragment] = useState('');

  const saveLabel = () => {
    if (label.trim() && label !== param.label) onUpdate(param.id, { label: label.trim() });
  };

  const addOption = async () => {
    if (!optLabel.trim() || !optFragment.trim()) {
      toast.error('Preencha rótulo e fragmento de prompt.');
      return;
    }
    await onCreateOption(param.id, {
      label: optLabel.trim(),
      prompt_fragment: optFragment.trim(),
    });
    setOptLabel('');
    setOptFragment('');
  };

  return (
    <Card className={param.active ? '' : 'opacity-60'}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          className="max-w-xs border-transparent px-0 text-lg font-semibold focus-visible:border-input focus-visible:px-4"
        />
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {param.type === 'multi_select' ? 'Múltipla' : 'Única'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ativo</span>
            <Switch
              checked={param.active}
              onCheckedChange={(v) => onUpdate(param.id, { active: v })}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(param.id)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {param.options.map((opt) => (
          <OptionRow
            key={opt.id}
            paramId={param.id}
            opt={opt}
            onUpdate={onUpdateOption}
            onDelete={onDeleteOption}
          />
        ))}

        {/* Add option */}
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Rótulo (ex.: Escandinavo)"
            value={optLabel}
            onChange={(e) => setOptLabel(e.target.value)}
            className="sm:w-48"
          />
          <Input
            placeholder="Fragmento de prompt (inglês)"
            value={optFragment}
            onChange={(e) => setOptFragment(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4" /> Opção
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OptionRow({ paramId, opt, onUpdate, onDelete }) {
  const [fragment, setFragment] = useState(opt.prompt_fragment);

  return (
    <div className="flex items-center gap-3 rounded-md bg-secondary/50 px-3 py-2">
      <span className="w-40 shrink-0 truncate text-sm font-medium">{opt.label}</span>
      <Input
        value={fragment}
        onChange={(e) => setFragment(e.target.value)}
        onBlur={() =>
          fragment.trim() &&
          fragment !== opt.prompt_fragment &&
          onUpdate(paramId, opt.id, { prompt_fragment: fragment.trim() })
        }
        className="h-9 flex-1 bg-background text-sm"
      />
      <Switch
        checked={opt.active}
        onCheckedChange={(v) => onUpdate(paramId, opt.id, { active: v })}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(paramId, opt.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
