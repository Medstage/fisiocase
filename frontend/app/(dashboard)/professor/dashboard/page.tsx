'use client';

import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Trophy, ClipboardCheck, BarChart3, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import {
  type TurmaProfessor,
  type CasoTurma,
  type RespostaTurma,
  tempoRelativo,
} from '@/components/professor/utils';

interface TurmasResp {
  origem: 'professor' | 'aluno';
  turmas: TurmaProfessor[];
}
interface CasosResp {
  casos: CasoTurma[];
}
interface RespostasResp {
  respostas: RespostaTurma[];
}

export default function ProfessorDashboardPage() {
  // 1. Turmas do professor.
  const turmasQ = useQuery({
    queryKey: ['prof-turmas'],
    queryFn: async () => (await api.get('/api/turmas/minhas')).data as TurmasResp,
  });
  const turmas = turmasQ.data?.turmas ?? [];

  // 2. Pra cada turma, buscar casos (paralelo).
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

  type CasoComTurma = CasoTurma & { _turma: TurmaProfessor };
  const todosCasos: CasoComTurma[] = casosPorTurma.flatMap((q) =>
    q.data ? q.data.casos.map((c) => ({ ...c, _turma: q.data!.turma })) : [],
  );

  // 3. Pra cada caso PUBLICADO/ENCERRADO, buscar respostas (paralelo).
  const respostasPorCaso = useQueries({
    queries: todosCasos
      .filter((c) => c.status !== 'RASCUNHO')
      .map((c) => ({
        queryKey: ['prof-respostas', c.turmaId, c.id],
        queryFn: async () => {
          const data = (
            await api.get(`/api/turmas/${c.turmaId}/casos/${c.id}/respostas`)
          ).data as RespostasResp;
          return { casoTurma: c, respostas: data.respostas };
        },
        enabled: !!c.id,
      })),
  });

  const carregando = turmasQ.isLoading || casosPorTurma.some((q) => q.isLoading);

  // 4. Agregações de métricas.
  const totalTurmas = turmas.length;
  const totalAlunos = turmas.reduce((sum, t) => sum + (t._count?.membros ?? 0), 0);

  type RespostaContexto = RespostaTurma & {
    _ctx: { casoTurma: CasoComTurma; respostas: RespostaTurma[] };
  };
  const todasRespostas: RespostaContexto[] = respostasPorCaso.flatMap((q) =>
    q.data ? q.data.respostas.map((r) => ({ ...r, _ctx: q.data! })) : [],
  );
  const pendentes = todasRespostas.filter((r) => r.status === 'PENDENTE');
  const corrigidas = todasRespostas.filter((r) => r.status === 'CORRIGIDO' && r.notaProfessor != null);
  const mediaGeral =
    corrigidas.length === 0
      ? 0
      : corrigidas.reduce((s, r) => s + (r.notaProfessor ?? 0), 0) / corrigidas.length;

  // 5. 5 pendentes mais antigas (cronologicamente).
  const filaPendentes = pendentes
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 5)
    .map((r) => ({
      resposta: r,
      turma: r._ctx.casoTurma._turma,
      casoTurma: r._ctx.casoTurma,
    }));

  // 6. Pra cada turma, % de alunos que responderam o último caso PUBLICADO.
  const atividadePorTurma = turmas.map((t) => {
    const casosT = todosCasos.filter((c) => c.turmaId === t.id && c.status !== 'RASCUNHO');
    const ultimoCaso = casosT
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!ultimoCaso) return { turma: t, pct: 0, ultimoCaso: null as CasoTurma | null, qtdRespostas: 0 };
    const respostasC =
      respostasPorCaso.find((q) => q.data?.casoTurma.id === ultimoCaso.id)?.data?.respostas ?? [];
    const alunosUnicos = new Set(respostasC.map((r) => r.aluno.id));
    const total = t._count?.membros ?? 0;
    const pct = total > 0 ? Math.round((alunosUnicos.size / total) * 100) : 0;
    return { turma: t, pct, ultimoCaso, qtdRespostas: alunosUnicos.size };
  });

  return (
    <ProfessorGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-1">Painel do professor</h1>
        <p className="text-neutral-600 mb-8">Visão geral das suas turmas e correções.</p>

        {carregando ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados...
          </div>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                label="Turmas ativas"
                value={totalTurmas}
                icon={Users}
                iconColor="text-blue-500"
                format={false}
              />
              <MetricCard
                label="Total de alunos"
                value={totalAlunos}
                icon={Trophy}
                iconColor="text-yellow-500"
                format={false}
              />
              <MetricCard
                label="Correções pendentes"
                value={pendentes.length}
                icon={ClipboardCheck}
                iconColor={pendentes.length > 0 ? 'text-orange-500' : 'text-neutral-600'}
                format={false}
              />
              <MetricCard
                label="Média geral"
                value={Math.round(mediaGeral * 10) / 10}
                icon={BarChart3}
                iconColor="text-green"
                format={false}
                suffix="/10"
              />
            </div>

            {/* Conteúdo: pendentes + atividade */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Correções pendentes</h2>
                  {pendentes.length > 5 && (
                    <Link href="/professor/correcoes" className="text-xs font-bold underline underline-offset-4">
                      Ver todas ({pendentes.length})
                    </Link>
                  )}
                </div>

                {filaPendentes.length === 0 ? (
                  <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
                    Sem correções pendentes no momento.
                  </div>
                ) : (
                  <div className="border border-black rounded bg-white divide-y divide-neutral-200">
                    {filaPendentes.map(({ resposta, turma, casoTurma }) => (
                      <div key={resposta.id} className="p-4 flex items-center gap-4">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                          {resposta.aluno.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{resposta.aluno.nome}</p>
                          <p className="text-xs text-neutral-600 truncate">
                            {casoTurma.titulo} · {turma.nome}
                          </p>
                        </div>
                        <span className="hidden sm:inline text-xs text-neutral-600 shrink-0">
                          {tempoRelativo(resposta.createdAt)}
                        </span>
                        <Link
                          href={`/professor/turmas/${turma.id}/casos/${casoTurma.id}/corrigir/${resposta.id}`}
                        >
                          <Button size="sm">Corrigir agora</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside>
                <h2 className="text-lg font-bold mb-4">Atividade das turmas</h2>
                {turmas.length === 0 ? (
                  <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
                    Você ainda não tem turmas.{' '}
                    <Link href="/professor/turmas" className="font-bold text-black underline">
                      Criar agora
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="space-y-4">
                    {atividadePorTurma.map(({ turma, pct, ultimoCaso, qtdRespostas }) => (
                      <Link
                        key={turma.id}
                        href={`/professor/turmas/${turma.id}`}
                        className="block border border-black rounded p-4 bg-white hover:border-green transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-bold truncate">{turma.nome}</p>
                            <p className="text-xs text-neutral-600 truncate">
                              {ultimoCaso ? ultimoCaso.titulo : 'Sem casos publicados'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 mt-1 shrink-0" />
                        </div>
                        <div className="h-2 border border-black rounded overflow-hidden">
                          <motion.div
                            className="h-full bg-green"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <p className="text-[11px] text-neutral-600 mt-1">
                          {qtdRespostas}/{turma._count?.membros ?? 0} alunos responderam ({pct}%)
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </motion.div>
    </ProfessorGuard>
  );
}
