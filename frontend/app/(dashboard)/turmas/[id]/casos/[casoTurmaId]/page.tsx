'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Info, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CasoViewer } from '@/components/caso/CasoViewer';
import { RespostaEditor } from '@/components/caso/RespostaEditor';
import { Button } from '@/components/ui/button';
import type { Caso } from '@/types';

type StatusCasoTurma = 'RASCUNHO' | 'PUBLICADO' | 'ENCERRADO';
type StatusRespostaTurma = 'PENDENTE' | 'CORRIGIDO';

interface CasoTurmaDetalheResp {
  casoTurma: {
    id: string;
    titulo: string;
    descricao?: string | null;
    status: StatusCasoTurma;
    prazo?: string | null;
    turma: { id: string; nome: string; professor: { nome: string; avatarUrl?: string | null } };
    caso: Caso;
  };
  minhaResposta: {
    id: string;
    status: StatusRespostaTurma;
    notaProfessor: number | null;
  } | null;
}

export default function ResolverCasoTurmaPage() {
  const { id, casoTurmaId } = useParams<{ id: string; casoTurmaId: string }>();
  const router = useRouter();
  const [conteudo, setConteudo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['turma-caso', id, casoTurmaId],
    queryFn: async () =>
      (await api.get(`/api/turmas/${id}/casos/${casoTurmaId}`)).data as CasoTurmaDetalheResp,
    enabled: !!id && !!casoTurmaId,
  });

  const enviar = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/api/turmas/${id}/casos/${casoTurmaId}/responder`, { conteudo })
      ).data,
    onSuccess: () => {
      try {
        sessionStorage.setItem(
          'fc_turmas_flash',
          'Resposta enviada! Aguarde a correção do seu professor.',
        );
      } catch {
        /* ignore */
      }
      router.push(`/turmas/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando caso...
      </div>
    );
  }

  if (!data) return <p>Caso não encontrado.</p>;

  const { casoTurma, minhaResposta } = data;
  const jaEnviou = !!minhaResposta;
  const pendente = minhaResposta?.status === 'PENDENTE';
  const encerrado = casoTurma.status === 'ENCERRADO';
  const desabilitado = jaEnviou || encerrado || enviar.isPending;
  const erroStatus = (enviar.error as { response?: { status?: number; data?: { error?: string } } } | null)
    ?.response;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <header className="mb-6 flex items-center gap-4">
        <Link
          href={`/turmas/${id}`}
          aria-label="Voltar para turma"
          className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors rounded"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-600">
            Caso da turma — {casoTurma.turma?.nome ?? '—'}
          </p>
          <h1 className="text-xl font-bold truncate">{casoTurma.titulo}</h1>
        </div>
      </header>

      {/* Aviso para resposta já enviada */}
      {jaEnviou && (
        <div className="mb-4 border border-border border-l-4 border-l-amber-500 rounded p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm">
            {pendente
              ? 'Você já enviou sua resposta. Aguarde a correção do professor.'
              : 'Esta resposta já foi corrigida. Consulte o feedback na página da turma.'}
          </p>
        </div>
      )}

      {encerrado && !jaEnviou && (
        <div className="mb-4 border border-border border-l-4 border-l-neutral-400 rounded p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-neutral-500 shrink-0 mt-0.5" />
          <p className="text-sm">Este caso foi encerrado pelo professor e não aceita mais respostas.</p>
        </div>
      )}

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] border border-border rounded overflow-hidden min-h-[calc(100vh-12rem)]">
        {/* Painel esquerdo: detalhes do caso */}
        <div className="border-b lg:border-b-0 lg:border-r border-border p-6 overflow-y-auto">
          <CasoViewer caso={casoTurma.caso} />
        </div>

        {/* Painel direito: resposta */}
        <div className="flex flex-col">
          <div className="h-14 shrink-0 border-b border-border flex items-center justify-between px-6">
            <h2 className="text-lg font-bold">Sua resposta</h2>
            <span className="text-xs uppercase tracking-wider text-neutral-600">
              Correção manual do professor
            </span>
          </div>

          <div className="flex-1 p-6">
            <RespostaEditor
              value={conteudo}
              onChange={setConteudo}
              disabled={desabilitado}
              placeholder="Descreva sua avaliação, diagnóstico cinético-funcional, objetivos e plano de tratamento. Seu professor lerá e dará o feedback."
            />

            {enviar.isError && (
              <p className="text-sm text-destructive font-bold mt-3">
                {erroStatus?.data?.error ?? 'Erro ao enviar resposta. Tente novamente.'}
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-border p-6 flex justify-between items-center gap-4">
            <span className="text-sm text-neutral-600">
              {jaEnviou ? (
                <span className="inline-flex items-center gap-2 text-green font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Resposta enviada
                </span>
              ) : (
                'Sem IA — seu professor lê e corrige manualmente.'
              )}
            </span>
            <Button
              disabled={desabilitado || conteudo.trim().length < 10}
              onClick={() => enviar.mutate()}
            >
              {enviar.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                'Enviar resposta'
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
