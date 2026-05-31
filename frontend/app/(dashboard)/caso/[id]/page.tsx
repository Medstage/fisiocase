'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Bold, List, Timer as TimerIcon, Pause, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { CasoViewer } from '@/components/caso/CasoViewer';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import type { Caso } from '@/types';

interface RespostaResultado {
  resposta: { id: string };
  conquistas?: unknown[];
  subiuNivel?: boolean;
  nivelNovo?: string;
  xpGanho?: number;
  missoesCompletadas?: Array<{ id: string; titulo: string; xpRecompensa: number }>;
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function CasoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conteudo, setConteudo] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timer = useTimer(15);

  const { data: caso, isLoading } = useQuery({
    queryKey: ['caso', id],
    queryFn: async () => (await api.get(`/api/casos/${id}`)).data as Caso,
    enabled: !!id,
  });

  const enviar = useMutation({
    mutationFn: async () =>
      (await api.post('/api/respostas', { casoId: id, conteudo, tempoGasto: timer.elapsed })).data as RespostaResultado,
    onSuccess: (data) => {
      try {
        sessionStorage.setItem(
          `fc_feedback_${data.resposta.id}`,
          JSON.stringify({
            conquistas: data.conquistas,
            subiuNivel: data.subiuNivel,
            nivelNovo: data.nivelNovo,
            xpGanho: data.xpGanho,
            missoesCompletadas: data.missoesCompletadas,
          }),
        );
      } catch {
        /* ignore */
      }
      router.push(`/feedback/${data.resposta.id}`);
    },
  });

  function wrap(mark: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const next = conteudo.slice(0, s) + mark + conteudo.slice(s, e) + mark + conteudo.slice(e);
    setConteudo(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = s + mark.length;
      ta.selectionEnd = e + mark.length;
    });
  }

  function prefixLista() {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = conteudo.lastIndexOf('\n', s - 1) + 1;
    setConteudo(conteudo.slice(0, lineStart) + '- ' + conteudo.slice(lineStart));
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando caso...
      </div>
    );
  }
  if (!caso) return <p>Caso não encontrado.</p>;

  const erroStatus = (enviar.error as { response?: { status?: number } } | null)?.response?.status;
  const critico = timer.secondsLeft <= 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] border border-black rounded overflow-hidden min-h-[calc(100vh-9rem)]"
    >
      {/* Painel esquerdo: detalhes do caso */}
      <div className="border-b lg:border-b-0 lg:border-r border-black p-6 overflow-y-auto">
        <CasoViewer caso={caso} />
      </div>

      {/* Painel direito: conduta */}
      <div className="flex flex-col">
        <div className="h-14 shrink-0 border-b border-black flex items-center justify-between px-6">
          <h2 className="text-lg font-bold">Sua conduta clínica</h2>
          <div className="flex items-center gap-2 border border-black rounded px-3 h-9">
            <TimerIcon className={cn('h-4 w-4', critico ? 'text-black' : 'text-green')} />
            <motion.span
              animate={critico ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
              transition={critico ? { repeat: Infinity, duration: 1 } : {}}
              className={cn('font-bold tabular-nums w-12 text-center', critico ? 'text-black' : 'text-green')}
            >
              {fmt(timer.secondsLeft)}
            </motion.span>
            <button type="button" onClick={timer.toggle} aria-label={timer.running ? 'Pausar' : 'Retomar'} className="text-neutral-600 hover:text-black">
              {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center gap-1 mb-2 pb-2 border-b border-black">
            <button type="button" onClick={() => wrap('**')} title="Negrito" className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-black hover:bg-neutral-100 rounded">
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" onClick={prefixLista} title="Lista" className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-black hover:bg-neutral-100 rounded">
              <List className="h-4 w-4" />
            </button>
          </div>
          <textarea
            ref={taRef}
            value={conteudo}
            disabled={enviar.isPending}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Descreva sua avaliação, objetivos terapêuticos e plano de tratamento..."
            className="flex-1 w-full resize-none bg-transparent outline-none text-base leading-relaxed placeholder:text-neutral-500 disabled:opacity-60"
          />
          {enviar.isError && (
            <p className="text-sm text-destructive font-bold mt-2">
              {erroStatus === 503 ? 'A IA não está configurada (ANTHROPIC_API_KEY no backend).' : 'Erro ao enviar. Tente novamente.'}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-black p-6 flex justify-between items-center gap-4">
          <span className="text-sm text-neutral-600">{conteudo.length} caracteres</span>
          <Button disabled={conteudo.trim().length < 10 || enviar.isPending} onClick={() => enviar.mutate()}>
            {enviar.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Avaliando...
              </>
            ) : (
              'Enviar resposta'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
