'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  ClipboardList,
  Activity,
  FlaskConical,
  BookOpen,
  Check,
  type LucideIcon,
} from 'lucide-react';

interface Etapa {
  Icon: LucideIcon;
  label: string;
  cor: string;
}

const ETAPAS: Etapa[] = [
  { Icon: Stethoscope, label: 'Selecionando paciente e contexto clínico', cor: 'text-sky-500' },
  { Icon: ClipboardList, label: 'Construindo anamnese e história patológica', cor: 'text-violet-500' },
  { Icon: Activity, label: 'Definindo sinais vitais e exame físico', cor: 'text-rose-500' },
  { Icon: FlaskConical, label: 'Solicitando exames complementares', cor: 'text-amber-500' },
  { Icon: BookOpen, label: 'Elaborando conduta esperada e critérios', cor: 'text-emerald-500' },
];

/**
 * Loader animado pra geração de caso clínico pela IA.
 * Mostra etapas progressivas com check verde quando completas. O timing é
 * fake (cada etapa ~3s) — não reflete o estado real do streaming, mas
 * cria a sensação de progresso e disfarça a latência da Anthropic.
 */
export function CasoLoader() {
  const [etapaAtual, setEtapaAtual] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    ETAPAS.forEach((_, idx) => {
      // Cada etapa entra ~2.8s depois da anterior; a última fica girando.
      timers.push(
        setTimeout(() => {
          setEtapaAtual((cur) => Math.max(cur, idx + 1));
        }, (idx + 1) * 2800),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="border border-border rounded p-8 sm:p-12 bg-card min-h-[420px]">
      {/* Header com pulse */}
      <div className="text-center mb-10">
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Stethoscope className="h-7 w-7 text-primary" />
        </motion.div>
        <h3 className="text-xl sm:text-2xl font-bold mb-1">A IA está montando seu caso</h3>
        <p className="text-sm text-muted-foreground">Pode levar alguns segundos. Não recarregue a página.</p>
      </div>

      {/* Lista de etapas */}
      <ol className="max-w-md mx-auto space-y-3">
        {ETAPAS.map((etapa, idx) => {
          const status: 'concluido' | 'rodando' | 'aguardando' =
            idx < etapaAtual ? 'concluido' : idx === etapaAtual ? 'rodando' : 'aguardando';
          const Icon = etapa.Icon;

          return (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{
                opacity: status === 'aguardando' ? 0.35 : 1,
                x: 0,
              }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 border border-border rounded bg-background"
            >
              {/* Ícone da etapa */}
              <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded">
                <AnimatePresence mode="wait">
                  {status === 'concluido' ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      className="h-8 w-8 rounded-full bg-success flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-success-foreground" strokeWidth={3} />
                    </motion.span>
                  ) : status === 'rodando' ? (
                    <motion.span
                      key="rodando"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="h-8 w-8 flex items-center justify-center"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Icon className={`h-5 w-5 ${etapa.cor}`} />
                      </motion.span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="aguardando"
                      className="h-8 w-8 flex items-center justify-center"
                    >
                      <Icon className={`h-5 w-5 ${etapa.cor} opacity-40`} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Label */}
              <span
                className={`text-sm flex-1 ${
                  status === 'concluido'
                    ? 'text-foreground line-through opacity-70'
                    : status === 'rodando'
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground'
                }`}
              >
                {etapa.label}
              </span>

              {/* Spinner discreto na etapa atual */}
              {status === 'rodando' && (
                <motion.span
                  className="h-2 w-2 rounded-full bg-primary shrink-0"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.li>
          );
        })}
      </ol>

      {/* Barra de progresso linear no rodapé */}
      <div className="max-w-md mx-auto mt-8">
        <div className="h-1.5 bg-muted rounded overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-brand to-emerald-400"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, (etapaAtual / ETAPAS.length) * 100 + 10)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
