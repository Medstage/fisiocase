'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Target, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notificacao {
  id: string;
  titulo: string;
  descricao: string;
  lida: boolean;
  createdAt: string;
}
interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  progresso: number;
  meta: number;
  completedAt: string | null;
}

function tempoRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Notificações reais do banco
  const notifQ = useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => (await api.get('/api/notificacoes')).data as { notificacoes: Notificacao[]; naoLidas: number },
    refetchInterval: 30_000,
  });

  // Missões diárias — MESMA queryKey usada na aba Ranking pra compartilhar cache.
  // Ver: app/(dashboard)/ranking/page.tsx
  const missoesQ = useQuery({
    queryKey: ['missoes-diarias'],
    queryFn: async () => (await api.get('/api/missoes/diarias')).data as { missoes: Missao[] },
    refetchInterval: 30_000,
  });

  const marcarTodasLidas = useMutation({
    mutationFn: async () => (await api.put('/api/notificacoes/marcar-todas-lidas')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const marcarLida = useMutation({
    mutationFn: async (id: string) => (await api.put(`/api/notificacoes/${id}/marcar-lida`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const notificacoes = notifQ.data?.notificacoes ?? [];
  const naoLidas = notifQ.data?.naoLidas ?? 0;
  const missoesPendentes = (missoesQ.data?.missoes ?? []).filter((m) => !m.completedAt);
  const totalBadge = naoLidas + missoesPendentes.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificações"
        className="relative h-10 w-10 border border-border rounded flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
      >
        <Bell className="h-4 w-4" />
        {totalBadge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-green text-background text-[10px] font-bold flex items-center justify-center">
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 border border-border rounded bg-card z-50">
          <div className="px-4 h-12 border-b border-border flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-neutral-600 font-bold">Notificações</span>
            {naoLidas > 0 && (
              <button
                onClick={() => marcarTodasLidas.mutate()}
                disabled={marcarTodasLidas.isPending}
                className="text-xs text-neutral-600 hover:text-foreground underline underline-offset-2"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200">
            {/* Notificações reais */}
            {notificacoes.length === 0 && missoesPendentes.length === 0 && (
              <div className="p-4 flex items-center gap-2 text-sm text-neutral-600">
                <CheckCircle2 className="h-4 w-4 text-green" /> Tudo em dia.
              </div>
            )}
            {notificacoes.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.lida && marcarLida.mutate(n.id)}
                className={cn(
                  'w-full p-3 flex gap-3 text-left hover:bg-neutral-50 transition-colors',
                  !n.lida && 'bg-green-soft',
                )}
              >
                <GraduationCap className={cn('h-4 w-4 mt-0.5 shrink-0', !n.lida ? 'text-green' : 'text-neutral-400')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{n.titulo}</p>
                  <p className="text-xs text-neutral-600">{n.descricao}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{tempoRelativo(n.createdAt)}</p>
                </div>
                {!n.lida && <span className="h-2 w-2 rounded-full bg-green mt-1.5 shrink-0" />}
              </button>
            ))}
            {/* Missões pendentes (fallback / extras) */}
            {missoesPendentes.map((m) => (
              <div key={m.id} className="p-3 flex gap-3">
                <Target className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">Missão diária</p>
                  <p className="text-sm font-medium">{m.titulo}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Progresso: {m.progresso}/{m.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
