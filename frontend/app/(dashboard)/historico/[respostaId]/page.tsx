'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ArrowUp,
  BookOpen,
  Stethoscope,
  Clock,
  RotateCcw,
  GraduationCap,
  Bot,
  Compass,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CasoViewer } from '@/components/caso/CasoViewer';
import { PontuacaoDisplay } from '@/components/feedback/PontuacaoDisplay';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { AREA_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Caso, Resposta, AvaliacaoFeedback } from '@/types';

interface RespostaTurmaDetail {
  id: string;
  conteudo: string;
  status: 'PENDENTE' | 'CORRIGIDO';
  notaProfessor: number | null;
  feedbackProfessor: string | null;
  xpGanho: number | null;
  corrigidoEm: string | null;
  createdAt: string;
  aluno: { id: string; nome: string; avatarUrl: string | null };
  casoTurma: {
    id: string;
    titulo: string;
    caso: Caso;
    turma: { id: string; nome: string; professorId: string };
  };
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatTempoGasto(s: number): string {
  if (!s) return '—';
  return `${Math.floor(s / 60)}min ${s % 60}s`;
}

export default function HistoricoDetalhePage() {
  const { respostaId } = useParams<{ respostaId: string }>();
  const sp = useSearchParams();
  const tipo = (sp.get('tipo') ?? 'caso') as 'caso' | 'turma';
  const turmaId = sp.get('turmaId');
  const casoTurmaId = sp.get('casoTurmaId');

  // Resposta de IA/LIVRE
  const respostaQ = useQuery({
    queryKey: ['historico-detalhe-resposta', respostaId],
    queryFn: async () => (await api.get(`/api/respostas/${respostaId}`)).data as Resposta,
    enabled: tipo === 'caso' && !!respostaId,
  });

  // Resposta de TURMA
  const respostaTurmaQ = useQuery({
    queryKey: ['historico-detalhe-turma', respostaId],
    queryFn: async () =>
      (await api.get(`/api/turmas/${turmaId}/casos/${casoTurmaId}/respostas/${respostaId}`)).data as RespostaTurmaDetail,
    enabled: tipo === 'turma' && !!respostaId && !!turmaId && !!casoTurmaId,
  });

  if (tipo === 'caso' ? respostaQ.isLoading : respostaTurmaQ.isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
      </div>
    );
  }

  // ─── Renderização TURMA ───
  if (tipo === 'turma') {
    const r = respostaTurmaQ.data;
    if (!r) return <p>Resposta não encontrada.</p>;
    const caso = r.casoTurma.caso;
    const pendente = r.status === 'PENDENTE';

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="max-w-4xl">
        <header className="flex items-center gap-3 mb-6 pb-4 border-b border-black">
          <Link href="/historico" aria-label="Voltar" className="border border-black p-2 rounded hover:bg-black hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-neutral-600">
              Histórico / Turma — {r.casoTurma.turma.nome}
            </p>
            <h1 className="text-xl font-bold truncate">{r.casoTurma.titulo}</h1>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge>{AREA_LABEL[caso.area]}</Badge>
          <DificuldadeBadge dificuldade={caso.dificuldade} />
          <span className="inline-flex items-center gap-1 rounded border border-green text-green-dark bg-green-soft px-2 h-5 text-xs font-bold">
            <GraduationCap className="h-3 w-3" /> Caso de turma
          </span>
          <span className="text-xs text-neutral-600 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> Enviado em {formatarData(r.createdAt)}
          </span>
        </div>

        {pendente ? (
          <div className="border border-amber-500 bg-amber-50 rounded p-6 mb-6">
            <p className="text-amber-700 font-bold mb-1">Aguardando correção do professor</p>
            <p className="text-sm text-amber-700">
              Sua resposta foi enviada e está na fila do professor responsável pela turma{' '}
              <strong>{r.casoTurma.turma.nome}</strong>. Você será notificado quando for corrigida.
            </p>
          </div>
        ) : (
          <>
            <div className="border border-black rounded p-8 text-center mb-6">
              <p className="text-xs uppercase tracking-wider text-neutral-600 mb-2">Sua nota</p>
              <div className="text-6xl font-bold">
                {r.notaProfessor?.toFixed(1) ?? '—'}
                <span className="text-2xl text-neutral-600">/10</span>
              </div>
              {r.xpGanho ? (
                <div className="mt-4 inline-flex items-center gap-2 bg-black text-white rounded px-4 h-10 font-bold">
                  +{r.xpGanho} XP
                </div>
              ) : null}
              {r.corrigidoEm && (
                <p className="text-xs text-neutral-500 mt-3">Corrigido em {formatarData(r.corrigidoEm)}</p>
              )}
            </div>

            {r.feedbackProfessor && (
              <div className="mb-6">
                <FeedbackCard titulo="Feedback do professor" texto={r.feedbackProfessor} accent="green" />
              </div>
            )}
          </>
        )}

        <div className="border border-black rounded p-6 mb-6">
          <p className="text-xs uppercase tracking-wider text-neutral-600 mb-2">O que você respondeu</p>
          <p className="text-sm whitespace-pre-line leading-relaxed">{r.conteudo}</p>
        </div>

        <h2 className="text-lg font-bold mb-3">O caso clínico completo</h2>
        <CasoViewer caso={caso} />

        <div className="mt-8 pt-6 border-t border-black">
          <Link href={`/turmas/${r.casoTurma.turma.id}`}>
            <Button variant="outline">Voltar para a turma</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  // ─── Renderização CASO (IA / LIVRE) ───
  const r = respostaQ.data;
  if (!r || !r.caso) return <p>Resposta não encontrada.</p>;
  const caso = r.caso;
  const fb = r.feedback as AvaliacaoFeedback | null;
  const recursos = fb?.recursosEstudo ?? [];
  const origem = r.feedback ? 'IA' : 'LIVRE';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="max-w-4xl">
      <header className="flex items-center gap-3 mb-6 pb-4 border-b border-black">
        <Link href="/historico" aria-label="Voltar" className="border border-black p-2 rounded hover:bg-black hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-600">Histórico / {caso.titulo}</p>
          <h1 className="text-xl font-bold truncate">{caso.titulo}</h1>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Badge>{AREA_LABEL[caso.area]}</Badge>
        <DificuldadeBadge dificuldade={caso.dificuldade} />
        <span className={cn(
          'inline-flex items-center gap-1 rounded border px-2 h-5 text-xs font-bold',
          origem === 'IA' ? 'border-purple-500 text-purple-700 bg-purple-50' : 'border-blue-500 text-blue-700 bg-blue-50',
        )}>
          {origem === 'IA' ? <Bot className="h-3 w-3" /> : <Compass className="h-3 w-3" />} {origem === 'IA' ? 'IA' : 'Caso livre'}
        </span>
        <span className="text-xs text-neutral-600 inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatarData(r.createdAt)}
        </span>
        {r.tempoGasto > 0 && <span className="text-xs text-neutral-600">{formatTempoGasto(r.tempoGasto)}</span>}
      </div>

      <PontuacaoDisplay nota={r.nota ?? 0} xpGanho={r.xpGanho} />

      <div className="border border-black rounded p-6 my-6">
        <p className="text-xs uppercase tracking-wider text-neutral-600 mb-2">O que você respondeu</p>
        <p className="text-sm whitespace-pre-line leading-relaxed">{r.conteudo}</p>
      </div>

      {fb && (
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold">Feedback recebido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeedbackCard titulo="O que você acertou" icon={CheckCircle2} items={fb.acertos ?? []} accent="green" />
            <FeedbackCard titulo="O que pode melhorar" icon={ArrowUp} items={fb.melhorias ?? []} accent="black" />
          </div>
          {fb.explicacaoClinica && (
            <FeedbackCard titulo="Explicação clínica" icon={Stethoscope} texto={fb.explicacaoClinica} accent="neutral" />
          )}
          {recursos.length > 0 && (
            <FeedbackCard titulo="Recursos de estudo" icon={BookOpen} items={recursos} accent="neutral" />
          )}
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">O caso clínico completo</h2>
      <CasoViewer caso={caso} />

      <div className="mt-8 pt-6 border-t border-black flex flex-wrap gap-4">
        <Link href={`/caso/${caso.id}`}>
          <Button className="gap-2">
            <RotateCcw className="h-4 w-4" /> Tentar novamente
          </Button>
        </Link>
        <Link href="/historico">
          <Button variant="outline">Voltar ao histórico</Button>
        </Link>
      </div>
    </motion.div>
  );
}
