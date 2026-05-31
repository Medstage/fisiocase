'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  LogOut,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { AREA_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Area, Dificuldade, TipoPaciente } from '@/types';

type StatusCasoTurma = 'RASCUNHO' | 'PUBLICADO' | 'ENCERRADO';
type StatusRespostaTurma = 'PENDENTE' | 'CORRIGIDO';

interface MinhaRespostaItem {
  id: string;
  status: StatusRespostaTurma;
  notaProfessor: number | null;
}

interface CasoTurmaListItem {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: StatusCasoTurma;
  prazo?: string | null;
  publicadoEm?: string | null;
  caso: {
    titulo: string;
    area: Area;
    dificuldade: Dificuldade;
    tipoPaciente: TipoPaciente;
  };
  minhaResposta: MinhaRespostaItem | null;
}

interface TurmaDetalhe {
  id: string;
  nome: string;
  descricao?: string | null;
  codigo: string;
  professor: { id: string; nome: string; avatarUrl?: string | null };
  membros: Array<{ userId: string }>;
}

function inicial(nome?: string) {
  return (nome ?? '?').trim().charAt(0).toUpperCase() || '?';
}

function formatarPrazo(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

export default function TurmaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    setConfirmar(false);
  }, [id]);

  const { data: turma, isLoading: turmaLoading } = useQuery({
    queryKey: ['turma', id],
    queryFn: async () => (await api.get(`/api/turmas/${id}`)).data as TurmaDetalhe,
    enabled: !!id,
  });

  const { data: casosData, isLoading: casosLoading } = useQuery({
    queryKey: ['turma-casos', id],
    queryFn: async () =>
      (await api.get(`/api/turmas/${id}/casos`)).data as { casos: CasoTurmaListItem[] },
    enabled: !!id,
  });

  const sair = useMutation({
    mutationFn: async () => (await api.delete(`/api/turmas/${id}/sair`)).data,
    onSuccess: () => {
      try {
        sessionStorage.setItem('fc_turmas_flash', 'Você saiu da turma.');
      } catch {
        /* ignore */
      }
      qc.invalidateQueries({ queryKey: ['turmas-minhas'] });
      router.push('/turmas');
    },
  });

  if (turmaLoading || casosLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando turma...
      </div>
    );
  }
  if (!turma) return <p>Turma não encontrada.</p>;

  const casos = (casosData?.casos ?? []).filter(
    (c) => c.status === 'PUBLICADO' || c.status === 'ENCERRADO',
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <header className="mb-8 border-b border-black pb-4 flex flex-col sm:flex-row sm:items-start gap-4">
        <Link
          href="/turmas"
          aria-label="Voltar para turmas"
          className="border border-black p-2 hover:bg-black hover:text-white transition-colors rounded shrink-0 w-fit"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-600">Turma</p>
          <h1 className="text-2xl font-bold">{turma.nome}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
              {inicial(turma.professor?.nome)}
            </div>
            <span className="text-sm text-neutral-700">
              Prof. {turma.professor?.nome ?? '—'}
            </span>
          </div>
          {turma.descricao && (
            <p className="text-sm text-neutral-700 leading-relaxed mt-3 max-w-2xl">
              {turma.descricao}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {confirmar ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={() => sair.mutate()}
                disabled={sair.isPending}
              >
                {sair.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saindo...
                  </>
                ) : (
                  'Confirmar saída'
                )}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmar(false)} disabled={sair.isPending}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
              onClick={() => setConfirmar(true)}
            >
              <LogOut className="h-4 w-4" /> Sair da turma
            </Button>
          )}
        </div>
      </header>

      {/* Casos */}
      <section>
        <h2 className="text-lg font-bold mb-4">Casos da turma</h2>

        {casos.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 border border-black rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto">
              Nenhum caso publicado ainda. Volte mais tarde para conferir as novidades.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {casos.map((c) => {
              const encerrado = c.status === 'ENCERRADO';
              const prazo = formatarPrazo(c.prazo);
              const resp = c.minhaResposta;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'border border-black rounded p-6 bg-white flex flex-col lg:flex-row lg:items-center gap-4',
                    encerrado && 'opacity-50',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs uppercase tracking-widest text-neutral-600">
                        {encerrado ? 'Encerrado' : 'Publicado'}
                      </p>
                      {prazo && (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                          <Clock className="h-3 w-3" /> Prazo: {prazo}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold">{c.titulo}</h3>
                    {c.descricao && (
                      <p className="text-sm text-neutral-700 mt-1 line-clamp-2">{c.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge>{AREA_LABEL[c.caso.area]}</Badge>
                      <DificuldadeBadge dificuldade={c.caso.dificuldade} />
                    </div>
                  </div>

                  <div className="shrink-0 lg:w-56 flex flex-col items-stretch lg:items-end gap-2">
                    {encerrado ? (
                      <Badge variant="outline">Encerrado</Badge>
                    ) : !resp ? (
                      <Link href={`/turmas/${id}/casos/${c.id}`} className="w-full lg:w-auto">
                        <Button className="w-full lg:w-auto">
                          Resolver agora <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : resp.status === 'PENDENTE' ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-700 bg-amber-50 h-7 px-3"
                      >
                        Aguardando correção
                      </Badge>
                    ) : (
                      <div className="flex flex-col items-stretch lg:items-end gap-2">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-widest text-neutral-600">
                            Nota
                          </p>
                          <p className="text-3xl font-bold text-green leading-tight">
                            {(resp.notaProfessor ?? 0).toFixed(1)}
                            <span className="text-base text-neutral-600">/10</span>
                          </p>
                        </div>
                        <Link
                          href={`/turmas/${id}/casos/${c.id}/feedback`}
                          className="w-full lg:w-auto"
                        >
                          <Button variant="outline" className="w-full lg:w-auto">
                            <CheckCircle2 className="h-4 w-4" /> Ver feedback
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
