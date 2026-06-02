'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Bot, GraduationCap, Compass, Clock, Filter, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { AREA_LABEL } from '@/lib/constants';
import type { Area } from '@/types';

type Origem = 'IA' | 'LIVRE' | 'TURMA';

interface ItemHistorico {
  id: string;
  tipo: 'caso' | 'turma';
  origem: Origem;
  caso: { id: string; titulo: string; area: Area; dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL' };
  nota: number | null;
  xpGanho: number;
  tempoGasto: number;
  status: 'CORRIGIDO' | 'PENDENTE';
  createdAt: string;
  turma: { id: string; nome: string } | null;
  casoTurmaId: string | null;
}

const ORIGENS: { value: Origem | 'todas'; label: string; Icon: typeof Bot }[] = [
  { value: 'todas', label: 'Todas', Icon: Filter },
  { value: 'IA', label: 'IA', Icon: Bot },
  { value: 'TURMA', label: 'Turma', Icon: GraduationCap },
  { value: 'LIVRE', label: 'Livre', Icon: Compass },
];

function tempoRelativo(iso: string): string {
  const data = new Date(iso);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTempoGasto(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}min ${sec}s`;
}

function OrigemBadge({ origem, turma }: { origem: Origem; turma: ItemHistorico['turma'] }) {
  const cfg = {
    IA: { label: 'IA', cls: 'bg-purple-100 border-purple-500 text-purple-700', Icon: Bot },
    LIVRE: { label: 'Caso livre', cls: 'bg-blue-100 border-blue-500 text-blue-700', Icon: Compass },
    TURMA: { label: `Turma${turma ? ` — ${turma.nome}` : ''}`, cls: 'bg-green-soft border-green text-green-dark', Icon: GraduationCap },
  }[origem];
  const { Icon } = cfg;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-2 h-5 text-xs font-bold', cfg.cls)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function linkDoItem(item: ItemHistorico): string {
  if (item.tipo === 'turma' && item.turma && item.casoTurmaId) {
    return `/historico/${item.id}?tipo=turma&turmaId=${item.turma.id}&casoTurmaId=${item.casoTurmaId}`;
  }
  return `/historico/${item.id}`;
}

export default function HistoricoPage() {
  const [filtroOrigem, setFiltroOrigem] = useState<Origem | 'todas'>('todas');
  const [filtroArea, setFiltroArea] = useState<Area | 'todas'>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['historico-unificado', filtroOrigem],
    queryFn: async () => {
      const qs = filtroOrigem !== 'todas' ? `?origem=${filtroOrigem}&limit=50` : `?limit=50`;
      return (await api.get(`/api/historico${qs}`)).data as { itens: ItemHistorico[]; total: number };
    },
  });

  const itens = data?.itens ?? [];
  const filtrados = useMemo(
    () => (filtroArea === 'todas' ? itens : itens.filter((i) => i.caso.area === filtroArea)),
    [itens, filtroArea],
  );

  const stats = useMemo(() => {
    const comNota = filtrados.filter((i) => i.nota !== null) as Array<ItemHistorico & { nota: number }>;
    const total = filtrados.length;
    const media = comNota.length ? comNota.reduce((s, i) => s + i.nota, 0) / comNota.length : 0;
    const maior = comNota.length ? Math.max(...comNota.map((i) => i.nota)) : 0;
    const porArea = new Map<Area, { soma: number; n: number }>();
    for (const i of comNota) {
      const e = porArea.get(i.caso.area) ?? { soma: 0, n: 0 };
      e.soma += i.nota;
      e.n += 1;
      porArea.set(i.caso.area, e);
    }
    let melhorArea: Area | null = null;
    let melhorMedia = -1;
    for (const [a, v] of porArea.entries()) {
      const m = v.soma / v.n;
      if (m > melhorMedia) { melhorMedia = m; melhorArea = a; }
    }
    return { total, media: Math.round(media), maior, melhorArea };
  }, [filtrados]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h1 className="text-2xl font-bold mb-1">Histórico</h1>
      <p className="text-neutral-600 mb-8">Veja todos os casos que você resolveu.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-border rounded p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-600">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-600">Média</p>
          <p className="text-2xl font-bold">{stats.media}<span className="text-base text-neutral-500">/100</span></p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-600">Maior nota</p>
          <p className="text-2xl font-bold text-green">{stats.maior}</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-600">Melhor área</p>
          <p className="text-lg font-bold truncate">{stats.melhorArea ? AREA_LABEL[stats.melhorArea] : '—'}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {ORIGENS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFiltroOrigem(value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-9 rounded border border-border text-xs font-bold uppercase transition-all active:scale-[0.98]',
                filtroOrigem === value ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-neutral-100',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value as Area | 'todas')}
            className="appearance-none border border-border rounded pl-3 pr-9 h-9 text-sm bg-card cursor-pointer focus:outline-none focus:border-brand transition-colors"
          >
            <option value="todas">Todas as áreas</option>
            {(Object.entries(AREA_LABEL) as [Area, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground" />
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
          Nenhum caso no histórico com esses filtros ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((item) => {
            const pendente = item.status === 'PENDENTE';
            return (
              <Link key={`${item.tipo}-${item.id}`} href={linkDoItem(item)} className="block">
                <motion.div
                  whileHover={{ borderColor: 'hsl(var(--primary))', y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="border border-border rounded p-4 bg-card"
                >
                  <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge>{AREA_LABEL[item.caso.area]}</Badge>
                      <DificuldadeBadge dificuldade={item.caso.dificuldade} />
                      <OrigemBadge origem={item.origem} turma={item.turma} />
                      {pendente && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-500 bg-amber-50 text-amber-700 px-2 h-5 text-xs font-bold">
                          Aguardando correção
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {pendente ? (
                        <span className="text-sm text-neutral-500">—</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold">{item.nota ?? '—'}</span>
                          <span className="text-sm text-neutral-500">/100</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="font-bold mb-2">{item.caso.titulo}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {tempoRelativo(item.createdAt)}
                    </span>
                    {item.tempoGasto > 0 && <span>{formatTempoGasto(item.tempoGasto)}</span>}
                    {!pendente && <span className="font-bold text-green">+{item.xpGanho} XP</span>}
                    {/* Barra de progresso */}
                    {item.nota !== null && (
                      <div className="flex-1 min-w-[100px] h-1 border border-border rounded overflow-hidden">
                        <div className="h-full bg-green" style={{ width: `${item.nota}%` }} />
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
