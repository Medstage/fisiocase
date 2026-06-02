'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import {
  type CasoTurma,
  type RespostaTurma,
  type TurmaProfessor,
  tempoRelativo,
} from '@/components/professor/utils';

interface TurmasResp { origem: string; turmas: TurmaProfessor[] }
interface CasosResp { casos: CasoTurma[] }
interface RespostasResp { respostas: RespostaTurma[] }

export default function CorrecoesUnificadasPage() {
  // 1. Turmas do professor.
  const turmasQ = useQuery({
    queryKey: ['prof-turmas'],
    queryFn: async () => (await api.get('/api/turmas/minhas')).data as TurmasResp,
  });
  const turmas = turmasQ.data?.turmas ?? [];

  // 2. Casos por turma.
  const casosPorTurma = useQueries({
    queries: turmas.map((t) => ({
      queryKey: ['prof-turma-casos', t.id],
      queryFn: async () => {
        const data = (await api.get(`/api/turmas/${t.id}/casos`)).data as CasosResp;
        return { turma: t, casos: data.casos };
      },
      enabled: !!t.id,
    })),
  });

  const casosPlanos = casosPorTurma.flatMap((q) =>
    q.data ? q.data.casos.filter((c) => c.status !== 'RASCUNHO').map((c) => ({ caso: c, turma: q.data!.turma })) : [],
  );

  // 3. Respostas dos casos.
  const respostasPorCaso = useQueries({
    queries: casosPlanos.map(({ caso, turma }) => ({
      queryKey: ['prof-corrigir-resp', turma.id, caso.id],
      queryFn: async () => {
        const data = (await api.get(`/api/turmas/${turma.id}/casos/${caso.id}/respostas`)).data as RespostasResp;
        return { turma, caso, respostas: data.respostas };
      },
      enabled: !!caso.id,
    })),
  });

  const pendentes = useMemo(() => {
    const out: Array<RespostaTurma & { turma: TurmaProfessor; caso: CasoTurma }> = [];
    for (const q of respostasPorCaso) {
      if (!q.data) continue;
      for (const r of q.data.respostas) {
        if (r.status === 'PENDENTE') out.push({ ...r, turma: q.data.turma, caso: q.data.caso });
      }
    }
    return out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [respostasPorCaso]);

  const carregando =
    turmasQ.isLoading ||
    casosPorTurma.some((q) => q.isLoading) ||
    respostasPorCaso.some((q) => q.isLoading);

  return (
    <ProfessorGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-1">Correções pendentes</h1>
        <p className="text-neutral-600 mb-8">
          Fila unificada de respostas aguardando correção em todas as suas turmas.
        </p>

        {carregando ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando fila...
          </div>
        ) : pendentes.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
            Nenhuma correção pendente. Tudo em dia!
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-neutral-600 mb-3">
              {pendentes.length} resposta(s) aguardando
            </p>
            <div className="border border-border rounded bg-card divide-y divide-neutral-200">
              {pendentes.map((r) => (
                <div key={r.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                    {r.aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{r.aluno.nome}</p>
                    <p className="text-xs text-neutral-600 truncate">
                      {r.caso.titulo} · {r.turma.nome}
                    </p>
                  </div>
                  <span className="hidden sm:inline text-xs text-neutral-600 shrink-0">
                    {tempoRelativo(r.createdAt)}
                  </span>
                  <Link href={`/professor/turmas/${r.turma.id}/casos/${r.caso.id}/corrigir/${r.id}`}>
                    <Button size="sm">Corrigir agora</Button>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </ProfessorGuard>
  );
}
