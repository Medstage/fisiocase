'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import {
  type CasoTurma,
  type RespostaTurma,
  type StatusCasoTurma,
  statusCasoLabel,
} from '@/components/professor/utils';
import { AREA_LABEL } from '@/lib/constants';
import type { Caso } from '@/types';

interface CasoTurmaDetalhe {
  casoTurma: CasoTurma & { caso: Caso };
  minhaResposta: null;
}
interface RespostasResp { respostas: RespostaTurma[] }

function StatusBadge({ status }: { status: StatusCasoTurma }) {
  const variant = status === 'PUBLICADO' ? 'green' : status === 'ENCERRADO' ? 'solid' : 'outline';
  return <Badge variant={variant}>{statusCasoLabel(status)}</Badge>;
}

export default function CasoTurmaProfessorPage() {
  const params = useParams<{ id: string; casoTurmaId: string }>();
  const turmaId = params.id;
  const casoTurmaId = params.casoTurmaId;

  const ctQ = useQuery({
    queryKey: ['prof-caso-turma', turmaId, casoTurmaId],
    queryFn: async () =>
      (await api.get(`/api/turmas/${turmaId}/casos/${casoTurmaId}`)).data as CasoTurmaDetalhe,
  });
  const respostasQ = useQuery({
    queryKey: ['prof-caso-turma-resp', turmaId, casoTurmaId],
    queryFn: async () =>
      (await api.get(`/api/turmas/${turmaId}/casos/${casoTurmaId}/respostas`)).data as RespostasResp,
  });

  const ct = ctQ.data?.casoTurma;
  const respostas = respostasQ.data?.respostas ?? [];
  const pendentes = respostas.filter((r) => r.status === 'PENDENTE').length;
  const corrigidas = respostas.filter((r) => r.status === 'CORRIGIDO').length;

  return (
    <ProfessorGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="mb-4">
          <Link href={`/professor/turmas/${turmaId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar à turma
            </Button>
          </Link>
        </div>

        {ctQ.isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando caso...
          </div>
        ) : !ct ? (
          <p className="text-sm text-neutral-500">Caso não encontrado.</p>
        ) : (
          <>
            {/* Header do caso */}
            <div className="border border-border rounded p-6 bg-card mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-1">Caso da turma</p>
                  <h1 className="text-2xl font-bold mb-2">{ct.titulo}</h1>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={ct.status} />
                    {ct.caso && (
                      <>
                        <Badge>{AREA_LABEL[ct.caso.area]}</Badge>
                        <Badge>{ct.caso.dificuldade}</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-xs uppercase tracking-wider text-neutral-600">Respostas</p>
                  <p className="text-2xl font-bold tabular-nums">{respostas.length}</p>
                  <p className="text-xs text-neutral-600">
                    {pendentes} pendente(s) · {corrigidas} corrigida(s)
                  </p>
                </div>
              </div>
              {ct.descricao && <p className="text-sm text-neutral-700 mt-4">{ct.descricao}</p>}
            </div>

            {/* Tabela de respostas */}
            <h2 className="text-lg font-bold mb-4">Respostas dos alunos</h2>
            {respostasQ.isLoading ? (
              <div className="flex items-center gap-2 text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando respostas...
              </div>
            ) : respostas.length === 0 ? (
              <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
                Nenhum aluno respondeu ainda.
              </div>
            ) : (
              <div className="border border-border rounded bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-neutral-600">
                      <th className="p-4 font-bold">Aluno</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Submissão</th>
                      <th className="p-4 font-bold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {respostas.map((r) => (
                      <tr key={r.id}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                              {r.aluno.nome.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold">{r.aluno.nome}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {r.status === 'PENDENTE' ? (
                            <Badge className="border-amber-500 text-amber-700">Pendente</Badge>
                          ) : (
                            <Badge variant="green">
                              Corrigido · {r.notaProfessor != null ? r.notaProfessor.toFixed(1) : '—'}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-neutral-600">
                          {new Date(r.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/professor/turmas/${turmaId}/casos/${casoTurmaId}/corrigir/${r.id}`}>
                            <Button size="sm" variant={r.status === 'PENDENTE' ? 'default' : 'outline'}>
                              {r.status === 'PENDENTE' ? 'Corrigir' : 'Ver correção'}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </motion.div>
    </ProfessorGuard>
  );
}
