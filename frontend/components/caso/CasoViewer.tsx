import { FileText } from 'lucide-react';
import { Accordion } from './Accordion';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { AREA_LABEL, TIPO_PACIENTE_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Caso } from '@/types';

const VITAIS: { k: string; label: string }[] = [
  { k: 'pa', label: 'PA' },
  { k: 'fc', label: 'FC' },
  { k: 'fr', label: 'FR' },
  { k: 'spo2', label: 'SpO₂' },
];

export function CasoViewer({ caso }: { caso: Caso }) {
  const id = (caso.identificacao ?? {}) as unknown as Record<string, unknown>;
  const ex = (caso.exameFisico ?? {}) as unknown as Record<string, unknown>;
  const hist = Array.isArray(caso.historicoPatologico) ? caso.historicoPatologico : [];
  const exames = Array.isArray(caso.examesComplementares) ? caso.examesComplementares : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho do caso */}
      <div className="flex flex-col gap-2 pb-4 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-600">Caso clínico</span>
        <h1 className="text-2xl font-bold">{caso.titulo}</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge>{AREA_LABEL[caso.area]}</Badge>
          <DificuldadeBadge dificuldade={caso.dificuldade} />
          <Badge>{TIPO_PACIENTE_LABEL[caso.tipoPaciente]}</Badge>
        </div>
      </div>

      <Accordion titulo="Identificação" defaultOpen>
        <dl className="space-y-1">
          {Object.entries(id).map(([k, v]) => (
            <p key={k}>
              <strong className="capitalize">{k}:</strong> {String(v)}
            </p>
          ))}
        </dl>
      </Accordion>

      <Accordion titulo="Queixa principal">
        <blockquote className="italic border-l-4 border-border pl-4 py-1 leading-relaxed">
          “{caso.queixaPrincipal}”
        </blockquote>
      </Accordion>

      <Accordion titulo="História da doença atual">
        <p className="whitespace-pre-line leading-relaxed">{caso.historiaDoencaAtual}</p>
      </Accordion>

      {hist.length > 0 && (
        <Accordion titulo="Histórico patológico">
          <ul className="list-disc list-inside space-y-1">
            {hist.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Accordion>
      )}

      <Accordion titulo="Exame físico">
        <div className="grid grid-cols-2 border border-border rounded overflow-hidden mb-3">
          {VITAIS.map((v, i) => (
            <div
              key={v.k}
              className={cn(
                'p-3 flex flex-col gap-1',
                i % 2 === 0 && 'border-r border-border',
                i < 2 && 'border-b border-border',
              )}
            >
              <span className="text-xs font-bold text-neutral-600 uppercase">{v.label}</span>
              <span>{ex[v.k] ? String(ex[v.k]) : '—'}</span>
            </div>
          ))}
        </div>
        {ex.achados ? <p className="leading-relaxed">{String(ex.achados)}</p> : null}
      </Accordion>

      {exames.length > 0 && (
        <Accordion titulo="Exames complementares">
          <div className="space-y-3">
            {exames.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase">{e.tipo}</p>
                  <p className="mt-1">{e.resultado}</p>
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  );
}
