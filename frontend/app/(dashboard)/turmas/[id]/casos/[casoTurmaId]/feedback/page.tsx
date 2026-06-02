'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, MessageSquare, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { Button } from '@/components/ui/button';
import type { Caso } from '@/types';

type StatusCasoTurma = 'RASCUNHO' | 'PUBLICADO' | 'ENCERRADO';
type StatusRespostaTurma = 'PENDENTE' | 'CORRIGIDO';

interface CasoTurmaDetalheResp {
  casoTurma: {
    id: string;
    titulo: string;
    status: StatusCasoTurma;
    turma: { id: string; nome: string; professor: { nome: string; avatarUrl?: string | null } };
    caso: Caso;
  };
  minhaResposta: {
    id: string;
    status: StatusRespostaTurma;
    notaProfessor: number | null;
  } | null;
}

interface RespostaTurmaDetalhe {
  id: string;
  conteudo: string;
  status: StatusRespostaTurma;
  notaProfessor: number | null;
  feedbackProfessor: string | null;
  xpGanho: number;
  corrigidoEm: string | null;
  createdAt: string;
  casoTurma: {
    id: string;
    titulo: string;
    turma: { professorId: string; nome: string };
    caso: Caso;
  };
  aluno: { id: string; nome: string; avatarUrl?: string | null };
}

function inicial(nome?: string) {
  return (nome ?? '?').trim().charAt(0).toUpperCase() || '?';
}

function mensagemNota(nota: number) {
  if (nota >= 9) return 'Excelente conduta clínica!';
  if (nota >= 8) return 'Muito bom — quase lá.';
  if (nota >= 7) return 'Bom, mas há pontos a melhorar.';
  if (nota >= 6) return 'Na média. Revise os conceitos.';
  return 'Precisa reforçar o raciocínio clínico.';
}

export default function FeedbackTurmaPage() {
  const { id, casoTurmaId } = useParams<{ id: string; casoTurmaId: string }>();

  // Primeiro busca o casoTurma pra descobrir o respostaId e ter contexto da turma/caso
  const { data: contexto, isLoading: loadingContexto } = useQuery({
    queryKey: ['turma-caso', id, casoTurmaId],
    queryFn: async () =>
      (await api.get(`/api/turmas/${id}/casos/${casoTurmaId}`)).data as CasoTurmaDetalheResp,
    enabled: !!id && !!casoTurmaId,
  });

  const respostaId = contexto?.minhaResposta?.id;

  const { data: resposta, isLoading: loadingResposta } = useQuery({
    queryKey: ['turma-resposta', id, casoTurmaId, respostaId],
    queryFn: async () =>
      (
        await api.get(`/api/turmas/${id}/casos/${casoTurmaId}/respostas/${respostaId}`)
      ).data as RespostaTurmaDetalhe,
    enabled: !!respostaId,
  });

  if (loadingContexto || loadingResposta) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando feedback...
      </div>
    );
  }

  if (!contexto) return <p>Caso não encontrado.</p>;

  if (!respostaId || !resposta) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-3xl mx-auto"
      >
        <header className="mb-8 border-b border-border pb-4 flex items-center gap-4">
          <Link
            href={`/turmas/${id}`}
            aria-label="Voltar para turma"
            className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-neutral-600">Feedback</p>
            <h1 className="text-xl font-bold truncate">{contexto.casoTurma.titulo}</h1>
          </div>
        </header>
        <p className="text-sm text-neutral-600">
          Você ainda não recebeu feedback para este caso.
        </p>
      </motion.div>
    );
  }

  if (resposta.status !== 'CORRIGIDO') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-3xl mx-auto"
      >
        <header className="mb-8 border-b border-border pb-4 flex items-center gap-4">
          <Link
            href={`/turmas/${id}`}
            aria-label="Voltar para turma"
            className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-neutral-600">Aguardando correção</p>
            <h1 className="text-xl font-bold truncate">{resposta.casoTurma.titulo}</h1>
          </div>
        </header>
        <div className="border border-border border-l-4 border-l-amber-500 rounded p-6">
          <p className="text-sm">
            Sua resposta foi enviada, mas o professor ainda não corrigiu. Volte aqui assim que
            receber a notificação.
          </p>
        </div>
      </motion.div>
    );
  }

  const nota = resposta.notaProfessor ?? 0;
  const professor = contexto.casoTurma.turma?.professor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <header className="mb-8 border-b border-border pb-4 flex items-center gap-4">
        <Link
          href={`/turmas/${id}`}
          aria-label="Voltar para turma"
          className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-600">
            Feedback — {resposta.casoTurma.turma.nome}
          </p>
          <h1 className="text-xl font-bold truncate">{resposta.casoTurma.titulo}</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs">
            {inicial(professor?.nome)}
          </div>
          <span className="text-sm">{professor?.nome ?? 'Professor'}</span>
        </div>
      </header>

      <div className="space-y-6">
        {/* Nota grande */}
        <div className="border border-border rounded p-8 text-center">
          <p className="text-xs uppercase tracking-wider text-neutral-600 mb-2">Sua nota</p>
          <div className="text-6xl font-bold text-green leading-none">
            {nota.toFixed(1)}
            <span className="text-2xl text-neutral-600">/10</span>
          </div>
          <p className="text-sm text-neutral-600 mt-2">{mensagemNota(nota)}</p>

          <div className="mt-6 h-3 border border-border rounded overflow-hidden">
            <motion.div
              className="h-full bg-green"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, nota * 10))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {typeof resposta.xpGanho === 'number' && resposta.xpGanho > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-foreground text-background rounded px-4 h-10 font-bold">
              +{resposta.xpGanho} XP
            </div>
          )}
        </div>

        {/* Feedback do professor */}
        <FeedbackCard
          titulo="Feedback do professor"
          icon={MessageSquare}
          texto={resposta.feedbackProfessor ?? ''}
          accent="green"
        />

        {/* Resposta original */}
        <div className="border border-border rounded p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold mb-3">
            <FileText className="h-4 w-4" /> Sua resposta original
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-line">{resposta.conteudo}</p>
        </div>

        {/* Voltar */}
        <div className="border-t border-border pt-6 flex flex-wrap gap-4">
          <Link href={`/turmas/${id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" /> Voltar para a turma
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
