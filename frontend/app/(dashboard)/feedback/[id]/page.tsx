'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowUp, BookOpen, Stethoscope, Loader2, ArrowLeft, TrendingUp, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { PontuacaoDisplay } from '@/components/feedback/PontuacaoDisplay';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { ConquistaUnlocked } from '@/components/feedback/ConquistaUnlocked';
import { Button } from '@/components/ui/button';
import { conquistaIcone } from '@/lib/conquistas';
import { progressoNivel } from '@/lib/constants';
import type { Resposta, Usuario } from '@/types';

interface ConquistaLite {
  id: string;
  titulo: string;
  descricao?: string;
  icone?: string;
  xpRecompensa?: number;
}
interface MissaoLite {
  id: string;
  titulo: string;
  xpRecompensa: number;
}
interface Extra {
  conquistas?: ConquistaLite[];
  subiuNivel?: boolean;
  nivelNovo?: string;
  xpGanho?: number;
  missoesCompletadas?: MissaoLite[];
}

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [extra, setExtra] = useState<Extra>({});
  const [mostrarEfeito, setMostrarEfeito] = useState(false);
  const [conquistasParaModal, setConquistasParaModal] = useState<ConquistaLite[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`fc_feedback_${id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Extra;
        setExtra(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [id]);

  const { data: resposta, isLoading } = useQuery({
    queryKey: ['resposta', id],
    queryFn: async () => (await api.get(`/api/respostas/${id}`)).data as Resposta,
    enabled: !!id,
  });
  const { data: perfil } = useQuery({
    queryKey: ['perfil-feedback'],
    queryFn: async () => {
      const { data } = await api.get('/api/perfil');
      return (data?.user ?? data) as Usuario;
    },
  });

  // Estado real das conquistas no servidor (decide quem ainda precisa de modal).
  interface ConquistaServidor {
    id: string;
    desbloqueada?: boolean;
    notificadoEm?: string | null;
  }
  const { data: conquistasServidor } = useQuery({
    queryKey: ['conquistas'],
    queryFn: async () => (await api.get('/api/conquistas')).data as { conquistas: ConquistaServidor[] },
  });

  // Cruzamento: só mostra modal de conquistas (a) que vieram com a submissão
  // E (b) que o servidor confirma como desbloqueadas + ainda não notificadas.
  useEffect(() => {
    if (!extra.conquistas || extra.conquistas.length === 0) return;
    if (!conquistasServidor?.conquistas) return;
    const mapa = new Map(conquistasServidor.conquistas.map((c) => [c.id, c]));
    const pendentes = extra.conquistas.filter((c) => {
      const srv = mapa.get(c.id);
      return srv?.desbloqueada && !srv.notificadoEm;
    });
    if (pendentes.length > 0 && !mostrarEfeito) {
      setConquistasParaModal(pendentes);
      setMostrarEfeito(true);
    }
  }, [extra.conquistas, conquistasServidor, mostrarEfeito]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando feedback...
      </div>
    );
  }
  if (!resposta || !resposta.feedback) return <p>Feedback não encontrado.</p>;

  const fb = resposta.feedback;
  const xp = extra.xpGanho ?? resposta.xpGanho;
  const recursos = fb.recursosEstudo ?? [];
  const conquistas = extra.conquistas ?? [];
  const prog = progressoNivel(perfil?.xpTotal ?? 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto">
      {mostrarEfeito && <ConquistaUnlocked conquistas={conquistasParaModal} onClose={() => setMostrarEfeito(false)} />}

      {/* Header */}
      <header className="mb-8 border-b border-border pb-4 flex items-center gap-4">
        <Link href="/dashboard" aria-label="Voltar" className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors rounded">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-600">Resultado do caso</p>
          <h1 className="text-xl font-bold truncate">{resposta.caso?.titulo ?? 'Caso clínico'}</h1>
        </div>
      </header>

      <div className="space-y-6">
        <PontuacaoDisplay nota={resposta.nota ?? fb.nota ?? 0} xpGanho={xp} />

        {/* Progresso de nível */}
        {perfil && (
          <div className="border border-border rounded p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-sm font-bold">
                <TrendingUp className="h-4 w-4 text-green" /> Nível: {prog.nivel}
              </span>
              <span className="text-xs text-neutral-600">{(perfil.xpTotal ?? 0).toLocaleString('pt-BR')} XP</span>
            </div>
            <div className="h-3 border border-border rounded overflow-hidden">
              <motion.div className="h-full bg-green" initial={{ width: 0 }} animate={{ width: `${prog.pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            {prog.proximo && <p className="text-xs text-neutral-600 mt-2">Faltam {prog.faltam.toLocaleString('pt-BR')} XP para {prog.proximo}</p>}
          </div>
        )}

        {/* Conquistas desbloqueadas */}
        {conquistas.map((c) => {
          const { Icon, cor } = conquistaIcone(c.icone);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border border-l-4 border-l-green rounded p-6 flex items-center gap-4"
            >
              <div className={`h-16 w-16 shrink-0 rounded-full border border-border bg-card flex items-center justify-center ${cor}`}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-neutral-600">Conquista desbloqueada</p>
                <h3 className="text-lg font-bold">{c.titulo}</h3>
                {c.descricao && <p className="text-sm text-neutral-600">{c.descricao}</p>}
              </div>
            </motion.div>
          );
        })}

        {extra.subiuNivel && (
          <div className="border border-green border-l-4 border-l-green rounded p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green" />
            <span className="font-bold">Você subiu de nível: {extra.nivelNovo}!</span>
          </div>
        )}

        {/* Missões diárias completadas */}
        {(extra.missoesCompletadas ?? []).map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border border-l-4 border-l-green rounded p-4 flex items-center gap-3"
          >
            <Target className="h-5 w-5 text-green" />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest text-neutral-600">Missão diária concluída</p>
              <h3 className="text-base font-bold truncate">{m.titulo}</h3>
            </div>
            <span className="bg-foreground text-background rounded px-3 h-7 inline-flex items-center text-xs font-bold shrink-0">
              +{m.xpRecompensa} XP
            </span>
          </motion.div>
        ))}

        {/* Feedback */}
        <FeedbackCard titulo="O que você acertou" icon={CheckCircle2} items={fb.acertos} accent="green" />
        <FeedbackCard titulo="O que pode melhorar" icon={ArrowUp} items={fb.melhorias} accent="black" />
        <FeedbackCard titulo="Explicação clínica completa" icon={Stethoscope} texto={fb.explicacaoClinica} accent="neutral" />
        {recursos.length > 0 && <FeedbackCard titulo="Recursos de estudo" icon={BookOpen} items={recursos} accent="neutral" />}

        {/* Ações */}
        <div className="border-t border-border pt-6 flex flex-wrap gap-4">
          <Link href="/novo-caso">
            <Button>Próximo caso</Button>
          </Link>
          <Link href="/historico">
            <Button variant="outline">Ver histórico</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
