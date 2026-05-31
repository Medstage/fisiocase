'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CasoViewer } from '@/components/caso/CasoViewer';
import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import { notaParaXpPreview, type RespostaTurma } from '@/components/professor/utils';
import type { Caso } from '@/types';

interface RespostaDetalhe extends Omit<RespostaTurma, 'casoTurma'> {
  conteudo: string;
  casoTurma: {
    id: string;
    turmaId: string;
    titulo: string;
    caso: Caso;
    turma: { nome: string; professorId: string };
  };
}

export default function CorrigirPage() {
  const params = useParams<{ id: string; casoTurmaId: string; respostaId: string }>();
  const turmaId = params.id;
  const casoTurmaId = params.casoTurmaId;
  const respostaId = params.respostaId;
  const router = useRouter();
  const qc = useQueryClient();

  const respostaQ = useQuery({
    queryKey: ['prof-resposta', respostaId],
    queryFn: async () =>
      (
        await api.get(
          `/api/turmas/${turmaId}/casos/${casoTurmaId}/respostas/${respostaId}`,
        )
      ).data as RespostaDetalhe,
  });

  const resposta = respostaQ.data;
  const jaCorrigida = resposta?.status === 'CORRIGIDO';

  // Form state.
  const [feedback, setFeedback] = useState('');
  const [nota, setNota] = useState<string>('');
  const [erro, setErro] = useState('');

  // Quando carrega resposta já corrigida, popula com valores salvos.
  useEffect(() => {
    if (resposta && jaCorrigida) {
      setFeedback(resposta.feedbackProfessor ?? '');
      setNota(resposta.notaProfessor != null ? String(resposta.notaProfessor) : '');
    }
  }, [resposta, jaCorrigida]);

  // Auto-resize do textarea.
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = 'auto';
    taRef.current.style.height = `${taRef.current.scrollHeight}px`;
  }, [feedback]);

  const notaNum = Number(nota);
  const notaValida = nota !== '' && !Number.isNaN(notaNum) && notaNum >= 0 && notaNum <= 10;
  const feedbackValido = feedback.trim().length >= 10;
  const xpPreview = notaValida ? notaParaXpPreview(notaNum) : 0;

  const corrigir = useMutation({
    mutationFn: async () => {
      return (
        await api.put(
          `/api/turmas/${turmaId}/casos/${casoTurmaId}/respostas/${respostaId}/corrigir`,
          { nota: notaNum, feedback: feedback.trim() },
        )
      ).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prof-caso-turma-resp', turmaId, casoTurmaId] });
      qc.invalidateQueries({ queryKey: ['prof-turmas'] });
      qc.invalidateQueries({ queryKey: ['prof-resposta', respostaId] });
      router.push(`/professor/turmas/${turmaId}/casos/${casoTurmaId}?correcao=sucesso`);
    },
    onError: () => setErro('Não foi possível salvar a correção. Verifique os dados e tente novamente.'),
  });

  const salvar = () => {
    setErro('');
    if (!notaValida) {
      setErro('Informe uma nota entre 0 e 10.');
      return;
    }
    if (!feedbackValido) {
      setErro('Escreva um feedback de no mínimo 10 caracteres.');
      return;
    }
    const ok = window.confirm('Confirma a correção? Não poderá ser editada depois.');
    if (!ok) return;
    corrigir.mutate();
  };

  return (
    <ProfessorGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="mb-4">
          <Link href={`/professor/turmas/${turmaId}/casos/${casoTurmaId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar à lista de respostas
            </Button>
          </Link>
        </div>

        {respostaQ.isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando resposta...
          </div>
        ) : !resposta ? (
          <p className="text-sm text-neutral-500">Resposta não encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna esquerda: caso clínico */}
            <div>
              <CasoViewer caso={resposta.casoTurma.caso} />
            </div>

            {/* Coluna direita: correção (sticky) */}
            <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
              <div className="border border-black rounded p-5 bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                    {resposta.aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{resposta.aluno.nome}</p>
                    <p className="text-xs text-neutral-600">
                      {resposta.casoTurma.turma.nome} · enviado em{' '}
                      {new Date(resposta.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-black rounded p-5 bg-white">
                <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Resposta do aluno
                </h3>
                <p className="text-sm whitespace-pre-line leading-relaxed">{resposta.conteudo}</p>
              </div>

              {jaCorrigida && (
                <div className="border border-green rounded p-4 bg-white flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green shrink-0" />
                  <span className="font-bold">Resposta já corrigida.</span>
                  <span className="ml-auto">
                    <Badge variant="green">Nota {resposta.notaProfessor?.toFixed(1)}</Badge>
                  </span>
                </div>
              )}

              <div className="border border-black rounded p-5 bg-white space-y-4">
                <div>
                  <label htmlFor="feedback" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Feedback para o aluno
                  </label>
                  <textarea
                    id="feedback"
                    ref={taRef}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={jaCorrigida}
                    placeholder="Explique os acertos, pontos de melhoria e referências..."
                    className="w-full border border-black rounded p-3 text-sm bg-white outline-none focus:border-green transition-colors resize-none min-h-[160px] disabled:bg-neutral-50"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {feedback.trim().length} caracteres (mínimo 10)
                  </p>
                </div>

                <div>
                  <label htmlFor="nota" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Nota (0 a 10)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="nota"
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={notaValida ? notaNum : 0}
                      disabled={jaCorrigida}
                      onChange={(e) => setNota(e.target.value)}
                      className="flex-1 accent-black"
                    />
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={nota}
                      disabled={jaCorrigida}
                      onChange={(e) => setNota(e.target.value)}
                      className="w-20 border border-black rounded h-10 px-3 text-sm tabular-nums outline-none focus:border-green transition-colors disabled:bg-neutral-50"
                    />
                  </div>
                </div>

                <div className="border border-black rounded p-3 bg-neutral-50 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-neutral-600">XP que será concedido</span>
                  <span className="font-bold tabular-nums">
                    {xpPreview > 0 ? `+${xpPreview} XP` : '—'}
                  </span>
                </div>

                {erro && <p className="text-sm text-red-600 font-bold">{erro}</p>}

                {!jaCorrigida && (
                  <Button
                    className="w-full"
                    disabled={!notaValida || !feedbackValido || corrigir.isPending}
                    onClick={salvar}
                  >
                    {corrigir.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                      'Salvar correção'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ProfessorGuard>
  );
}
