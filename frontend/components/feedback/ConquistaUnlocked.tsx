'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (!conquistas || conquistas.length === 0) return null;

  const atual = conquistas[idx];
  const { Icon, cor } = conquistaIcone(atual.icone);

  function avancar() {
    if (idx < conquistas.length - 1) setIdx((i) => i + 1);
    else onClose?.();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={avancar}
      >
        <motion.div
          key={atual.id}
          className="relative bg-white border border-black rounded p-8 max-w-sm w-full text-center"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Ícone + raios */}
          <div className="relative mx-auto mb-6 h-28 w-28 flex items-center justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 h-3 w-0.5 bg-green"
                style={{ transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateY(-48px)` }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4, delay: i * 0.03 }}
              />
            ))}
            <motion.div
              className={`h-20 w-20 rounded-full border-2 border-black bg-white flex items-center justify-center ${cor}`}
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
            <span className="inline-flex items-center bg-black text-white rounded px-3 h-8 text-sm font-bold">+{atual.xpRecompensa} XP</span>
          ) : null}
          <p className="text-xs text-neutral-400 mt-6">
            {conquistas.length > 1 ? `${idx + 1} de ${conquistas.length} · ` : ''}Toque para continuar
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
