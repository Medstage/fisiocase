'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Search, X, CheckCircle2, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AREA_LABEL, DIFICULDADE_LABEL, TIPO_PACIENTE_LABEL, FOCO_LABEL } from '@/lib/constants';
import type { Area, Dificuldade, TipoPaciente, FocoClinico, Caso } from '@/types';

const SELECT_CLS =
  'appearance-none border border-border rounded pl-3 pr-9 h-10 text-sm bg-card cursor-pointer focus:outline-none focus:border-brand transition-colors w-full';
const SELECT_SM_CLS =
  'appearance-none border border-border rounded pl-3 pr-9 h-9 text-xs font-bold uppercase bg-card cursor-pointer focus:outline-none focus:border-brand transition-colors';

function SelectWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground" />
    </div>
  );
}

interface CasoPublicado extends Caso {
  jaResolvido: boolean;
  tentativas: number;
  minhaMelhorNota: number | null;
}

type Ordem = 'recentes' | 'resolvidos' | 'melhor_avaliados' | 'mais_dificeis';

export function EscolherCaso() {
  const router = useRouter();
  const [area, setArea] = useState<Area | ''>('');
  const [dificuldade, setDificuldade] = useState<Dificuldade | ''>('');
  const [tipoPaciente, setTipoPaciente] = useState<TipoPaciente | ''>('');
  const [focoClinico, setFocoClinico] = useState<FocoClinico | ''>('');
  const [busca, setBusca] = useState('');
  const [ordenar, setOrdenar] = useState<Ordem>('recentes');
  const [ocultarResolvidos, setOcultarResolvidos] = useState(false);
  const [confirmar, setConfirmar] = useState<CasoPublicado | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['casos-publicados', area, dificuldade, tipoPaciente, focoClinico, ordenar, ocultarResolvidos, busca],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (area) qs.set('area', area);
      if (dificuldade) qs.set('dificuldade', dificuldade);
      if (tipoPaciente) qs.set('tipoPaciente', tipoPaciente);
      if (focoClinico) qs.set('focoClinico', focoClinico);
      if (busca.trim()) qs.set('busca', busca.trim());
      qs.set('ordenar', ordenar);
      qs.set('ocultarResolvidos', String(ocultarResolvidos));
      qs.set('limit', '40');
      return (await api.get(`/api/casos/publicados?${qs}`)).data as { casos: CasoPublicado[]; total: number };
    },
  });

  const casos = data?.casos ?? [];

  return (
    <div>
      {/* Filtros */}
      <div className="border border-border rounded p-4 mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 border border-border rounded px-3 h-10">
          <Search className="h-4 w-4 text-neutral-600" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SelectWrap>
            <select value={area} onChange={(e) => setArea(e.target.value as Area | '')} className={SELECT_CLS}>
              <option value="">Todas as áreas</option>
              {(Object.entries(AREA_LABEL) as [Area, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </SelectWrap>
          <SelectWrap>
            <select value={dificuldade} onChange={(e) => setDificuldade(e.target.value as Dificuldade | '')} className={SELECT_CLS}>
              <option value="">Toda dificuldade</option>
              {(Object.entries(DIFICULDADE_LABEL) as [Dificuldade, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </SelectWrap>
          <SelectWrap>
            <select value={tipoPaciente} onChange={(e) => setTipoPaciente(e.target.value as TipoPaciente | '')} className={SELECT_CLS}>
              <option value="">Todo paciente</option>
              {(Object.entries(TIPO_PACIENTE_LABEL) as [TipoPaciente, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </SelectWrap>
          <SelectWrap>
            <select value={focoClinico} onChange={(e) => setFocoClinico(e.target.value as FocoClinico | '')} className={SELECT_CLS}>
              <option value="">Todo foco</option>
              {(Object.entries(FOCO_LABEL) as [FocoClinico, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </SelectWrap>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SelectWrap>
            <select value={ordenar} onChange={(e) => setOrdenar(e.target.value as Ordem)} className={SELECT_SM_CLS}>
              <option value="recentes">Mais recentes</option>
              <option value="resolvidos">Mais resolvidos</option>
              <option value="melhor_avaliados">Melhor avaliados</option>
              <option value="mais_dificeis">Mais difíceis</option>
            </select>
          </SelectWrap>
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={ocultarResolvidos} onChange={(e) => setOcultarResolvidos(e.target.checked)} className="h-4 w-4 accent-green" />
            Ocultar já resolvidos
          </label>
          <span className="text-xs text-neutral-500 ml-auto">{data?.total ?? 0} casos</span>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando casos...
        </div>
      ) : casos.length === 0 ? (
        <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
          Nenhum caso encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {casos.map((c) => (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => setConfirmar(c)}
              whileHover={{ borderColor: 'hsl(var(--primary))', y: -2 }}
              transition={{ duration: 0.2 }}
              className="border border-border rounded p-4 bg-card text-left flex flex-col gap-3"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <Badge>{AREA_LABEL[c.area]}</Badge>
                <DificuldadeBadge dificuldade={c.dificuldade} />
                <Badge>{TIPO_PACIENTE_LABEL[c.tipoPaciente]}</Badge>
                {c.jaResolvido && (
                  <span className="inline-flex items-center gap-1 rounded border border-green text-green-dark bg-green-soft px-2 h-5 text-xs font-bold">
                    <CheckCircle2 className="h-3 w-3" /> Já resolvido · melhor {c.minhaMelhorNota ?? 0}/100
                  </span>
                )}
              </div>
              <p className="font-bold">{c.titulo}</p>
              <div className="flex items-center justify-between text-xs text-neutral-600 mt-auto">
                <span className="font-bold text-green">+{c.xpRecompensa} XP</span>
                <span>{c.totalResolucoes} resoluções · média {Math.round(c.mediaAcerto)}/100</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmar && (
        <div
          onClick={() => setConfirmar(null)}
          className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded p-6 max-w-md w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-600">Iniciar caso</p>
                <h3 className="text-lg font-bold">{confirmar.titulo}</h3>
              </div>
              <button onClick={() => setConfirmar(null)} className="p-1 border border-border rounded hover:bg-foreground hover:text-background">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{AREA_LABEL[confirmar.area]}</Badge>
              <DificuldadeBadge dificuldade={confirmar.dificuldade} />
              <Badge>{TIPO_PACIENTE_LABEL[confirmar.tipoPaciente]}</Badge>
            </div>
            <p className="text-sm text-neutral-600 mb-2 line-clamp-3">{confirmar.queixaPrincipal}</p>
            <p className="text-sm font-bold text-green mb-6">+{confirmar.xpRecompensa} XP em jogo</p>
            {confirmar.jaResolvido && (
              <p className="text-xs text-amber-700 mb-4">
                Você já resolveu esse caso {confirmar.tentativas} vez{confirmar.tentativas !== 1 ? 'es' : ''}. Nova tentativa será salva separadamente.
              </p>
            )}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => router.push(`/caso/${confirmar.id}`)}>
                Iniciar caso
              </Button>
              <Button variant="outline" onClick={() => setConfirmar(null)}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
