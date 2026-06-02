'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { conquistaIcone } from '@/lib/conquistas';

interface ConquistaLite {
  id: string;
  titulo: string;
  descricao?: string;
  icone?: string;
  xpRecompensa?: number;
}

export function ConquistaUnlocked({ conquistas, onClose }: { conquistas: ConquistaLite[]; onClose?: () => void }) {
  const [idx, setIdx] = useState(0);
  const queryClient = useQueryClient();
  const notificadosRef = useRef<Set<string>>(new Set());

  // Marca a conquista como notificada no backend assim que entra na tela.
  // Idempotente: se já tem notificadoEm, o backend ignora.
  useEffect(() => {
    const atual = conquistas[idx];
    if (!atual || notificadosRef.current.has(atual.id)) return;
    notificadosRef.current.add(atual.id);
    api
      .patch(`/api/conquistas/${atual.id}/notificar`)
      .catch(() => {
        /* falha aqui não bloqueia UI; usuário ainda pode avançar */
      });
  }, [idx, conquistas]);

  if (!conquistas || conquistas.length === 0) return null;

  const atual = conquistas[idx];
  const { Icon, cor } = conquistaIcone(atual.icone);

  function avancar() {
    if (idx < conquistas.length - 1) {
      setIdx((i) => i + 1);
    } else {
      // Após todas as conquistas vistas: invalida cache pra refletir notificadoEm.
      queryClient.invalidateQueries({ queryKey: ['conquistas'] });
      queryClient.invalidateQueries({ queryKey: ['rank-conquistas'] });
      onClose?.();
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-foreground/60 flex items-center justify-center p-4 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={avancar}
      >
        <motion.div
          key={atual.id}
          className="relative bg-card border border-border rounded p-8 max-w-sm w-full text-center"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Ícone + raios + confete colorido */}
          <div className="relative mx-auto mb-6 h-32 w-32 flex items-center justify-center">
            {/* Raios pulsando */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={`ray-${i}`}
                className="absolute left-1/2 top-1/2 h-4 w-0.5 bg-primary"
                style={{ transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateY(-52px)` }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4, delay: i * 0.03 }}
              />
            ))}
            {/* Confete colorido caindo de cima */}
            {Array.from({ length: 16 }).map((_, i) => {
              const cores = ['bg-amber-400', 'bg-rose-400', 'bg-sky-400', 'bg-violet-400', 'bg-emerald-400', 'bg-pink-400'];
              const corConfete = cores[i % cores.length];
              const angulo = (i / 16) * 360 + Math.random() * 20;
              const distancia = 90 + Math.random() * 30;
              return (
                <motion.span
                  key={`conf-${i}`}
                  className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-sm ${corConfete}`}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos((angulo * Math.PI) / 180) * distancia,
                    y: Math.sin((angulo * Math.PI) / 180) * distancia,
                    opacity: 0,
                    rotate: 360,
                  }}
                  transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
                />
              );
            })}
            {/* Ícone central */}
            <motion.div
              className={`relative z-10 h-20 w-20 rounded-full border-2 border-primary bg-card flex items-center justify-center ${cor}`}
              initial={{ rotate: -25, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            >
              <Icon className="h-10 w-10" />
            </motion.div>
          </div>

          <p className="text-xs uppercase tracking-widest text-neutral-600 mb-1">Conquista desbloqueada</p>
          <h3 className="text-xl font-bold mb-2">{atual.titulo}</h3>
          {atual.descricao && <p className="text-sm text-neutral-600 mb-4">{atual.descricao}</p>}
          {atual.xpRecompensa ? (
            <span className="inline-flex items-center bg-foreground text-background rounded px-3 h-8 text-sm font-bold">+{atual.xpRecompensa} XP</span>
          ) : null}
          <p className="text-xs text-neutral-400 mt-6">
            {conquistas.length > 1 ? `${idx + 1} de ${conquistas.length} · ` : ''}Toque para continuar
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
