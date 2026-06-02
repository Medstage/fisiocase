'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Lock, CheckCircle2, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { NIVEIS, progressoNivel } from '@/lib/constants';
import { conquistaIcone } from '@/lib/conquistas';
import type { Usuario, Conquista } from '@/types';

type Tab = 'global' | 'semanal' | 'amigos';

interface RankRow {
  posicao: number;
  id: string;
  nome: string;
  nivel?: string;
  xpTotal?: number;
  xpSemana?: number;
  casosResolvidos?: number;
  sequenciaAtual?: number;
}
interface Missao {
  id: string;
  titulo: string;
  progresso: number;
  meta: number;
  completedAt: string | null;
}

function Inicial({ nome, sou }: { nome: string; sou?: boolean }) {
  return (
    <span className={cn('h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold', sou ? 'bg-background text-foreground' : 'bg-foreground text-background')}>
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}

function LinhaRank({ row, sou, mostrarCasos }: { row: RankRow; sou: boolean; mostrarCasos: boolean }) {
  return (
    <div className={cn('grid grid-cols-[40px_1fr_90px] sm:grid-cols-[48px_1fr_120px_100px_90px] items-center gap-2 px-4 py-3', sou && 'bg-foreground text-background')}>
      <span className="font-bold flex items-center justify-center">
        {row.posicao <= 3 ? <Medal className="h-5 w-5" /> : row.posicao}
      </span>
      <span className="flex items-center gap-3 min-w-0">
        <Inicial nome={row.nome} sou={sou} />
        <span className="truncate font-bold">{sou ? `${row.nome} (Você)` : row.nome}</span>
        {row.sequenciaAtual && row.sequenciaAtual > 0 ? (
          <span
            title={`${row.sequenciaAtual} dias consecutivos`}
            className={cn('inline-flex items-center gap-0.5 text-[11px] font-bold shrink-0', sou ? 'text-background' : 'text-warning')}
          >
            <Flame className="h-3 w-3" fill="currentColor" strokeWidth={1.5} />
            {row.sequenciaAtual}
          </span>
        ) : null}
      </span>
      <span className="hidden sm:flex justify-center">
        {row.nivel ? (
          sou ? <span className="text-xs border border-background rounded px-2 py-0.5">{row.nivel}</span> : <Badge>{row.nivel}</Badge>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </span>
      <span className="hidden sm:block text-center tabular-nums">{mostrarCasos ? row.casosResolvidos ?? '—' : '—'}</span>
      <span className="text-right font-bold tabular-nums">{(row.xpTotal ?? row.xpSemana ?? 0).toLocaleString('pt-BR')}</span>
    </div>
  );
}

export default function RankingPage() {
  const { data: session } = useSession();
  const usuario = (session as { usuario?: Usuario } | null)?.usuario;
  const [tab, setTab] = useState<Tab>('global');

  const global = useQuery({
    queryKey: ['rank-global'],
    queryFn: async () => (await api.get('/api/ranking/global?limit=20')).data as { ranking: RankRow[]; total: number },
  });
  const semanal = useQuery({
    queryKey: ['rank-semanal'],
    queryFn: async () => (await api.get('/api/ranking/semanal')).data as { ranking: RankRow[] },
  });
  const posicao = useQuery({
    queryKey: ['rank-posicao'],
    queryFn: async () => (await api.get('/api/ranking/posicao')).data as { posicao: number; xpTotal: number; total: number },
  });
  // MESMA queryKey usada pelo NotificationsBell pra compartilhar cache (Bug 2).
  const missoesQ = useQuery({
    queryKey: ['missoes-diarias'],
    queryFn: async () => (await api.get('/api/missoes/diarias')).data as { missoes: Missao[] },
  });
  const conquistasQ = useQuery({
    queryKey: ['rank-conquistas'],
    queryFn: async () => (await api.get('/api/conquistas')).data as { conquistas: Conquista[] },
  });

  const linhas: RankRow[] = tab === 'global' ? global.data?.ranking ?? [] : tab === 'semanal' ? semanal.data?.ranking ?? [] : [];
  const meId = usuario?.id;
  const naLista = linhas.some((l) => l.id === meId);
  const missoes = missoesQ.data?.missoes ?? [];
  const conquistas = conquistasQ.data?.conquistas ?? [];
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada);
  const prog = progressoNivel(usuario?.xpTotal ?? 0);
  const idxAtual = NIVEIS.findIndex((n) => n.nome === prog.nivel);

  const Aba = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={cn('px-1 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors', tab === id ? 'border-green text-foreground' : 'border-transparent text-neutral-500 hover:text-foreground')}
    >
      {label}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h1 className="text-2xl font-bold mb-1">Ranking e Gamificação</h1>
      <p className="text-neutral-600 mb-8">Veja sua posição entre os estudantes.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border rounded p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-green shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-600">Sua posição geral</p>
                <p className="text-3xl font-bold">
                  #{posicao.data?.posicao ?? '—'} <span className="text-base font-normal text-neutral-600">de {posicao.data?.total ?? '—'}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-neutral-600">Total XP</p>
              <p className="text-3xl font-bold">{(usuario?.xpTotal ?? 0).toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="flex gap-6 border-b border-border">
            <Aba id="global" label="Global" />
            <Aba id="semanal" label="Semanal" />
            <Aba id="amigos" label="Amigos" />
          </div>

          {tab === 'amigos' ? (
            <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
              Ranking entre amigos chega em breve.
            </div>
          ) : (
            <div className="border border-border rounded overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_90px] sm:grid-cols-[48px_1fr_120px_100px_90px] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-neutral-600 font-bold">
                <span className="text-center">#</span>
                <span>Estudante</span>
                <span className="hidden sm:block text-center">Nível</span>
                <span className="hidden sm:block text-center">{tab === 'global' ? 'Casos' : ''}</span>
                <span className="text-right">XP</span>
              </div>
              <div className="divide-y divide-neutral-200">
                {linhas.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">Sem dados ainda.</p>}
                {linhas.map((row) => (
                  <LinhaRank key={row.id} row={row} sou={row.id === meId} mostrarCasos={tab === 'global'} />
                ))}
                {tab === 'global' && !naLista && posicao.data && usuario && (
                  <>
                    <div className="px-4 py-2 text-center text-neutral-400">···</div>
                    <LinhaRank
                      row={{ posicao: posicao.data.posicao, id: usuario.id, nome: usuario.nome, nivel: usuario.nivel, xpTotal: usuario.xpTotal }}
                      sou
                      mostrarCasos
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border border-border rounded p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Missões diárias</h3>
            <ul className="space-y-3">
              {missoes.length === 0 && <li className="text-sm text-neutral-500">Sem missões hoje.</li>}
              {missoes.map((m) => {
                const ok = !!m.completedAt || m.progresso >= m.meta;
                return (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <span className={cn('mt-0.5 h-4 w-4 shrink-0 border border-border rounded-sm flex items-center justify-center', ok && 'bg-green border-green')}>
                      {ok && <CheckCircle2 className="h-3 w-3 text-background" />}
                    </span>
                    <span className={cn(ok && 'line-through text-neutral-400')}>{m.titulo}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border border-border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">Suas conquistas</h3>
              <span className="text-xs font-bold text-neutral-600">
                {desbloqueadas.length}/{conquistas.length || '—'}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
              {conquistas.slice(0, 8).map((c) => {
                const { Icon, cor } = conquistaIcone(c.icone);
                return (
                  <div
                    key={c.id}
                    title={c.titulo}
                    className={cn('aspect-square border rounded flex items-center justify-center', c.desbloqueada ? `border-border ${cor}` : 'border-neutral-300 text-neutral-300')}
                  >
                    {c.desbloqueada ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                );
              })}
            </div>
            <a href="/conquistas" className="block mt-4 text-xs font-bold underline underline-offset-4">
              Ver todas
            </a>
          </div>

          <div className="border border-border rounded p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Sistema de níveis</h3>
            <div className="space-y-4">
              {NIVEIS.map((n, i) => {
                const completo = i < idxAtual;
                const atual = i === idxAtual;
                const bloqueado = i > idxAtual;
                const pct = completo ? 100 : atual ? prog.pct : 0;
                return (
                  <div key={n.nome} className={cn(bloqueado && 'opacity-40')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold flex items-center gap-1">
                        {bloqueado && <Lock className="h-3 w-3" />} {n.nome}
                      </span>
                      {atual && <span className="text-xs text-neutral-600">{(usuario?.xpTotal ?? 0).toLocaleString('pt-BR')} XP</span>}
                    </div>
                    <div className="h-2 border border-border rounded overflow-hidden">
                      <div className="h-full bg-green" style={{ width: `${pct}%` }} />
                    </div>
                    {atual && prog.proximo && (
                      <p className="text-[11px] text-neutral-600 mt-1">Faltam {prog.faltam.toLocaleString('pt-BR')} XP para {prog.proximo}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
