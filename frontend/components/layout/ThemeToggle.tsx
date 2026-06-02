'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Botão sol/lua para alternar o tema. Persistência é feita pelo `next-themes`
 * em localStorage. Renderiza um placeholder até o mount pra evitar mismatch SSR.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="relative h-10 w-10 border border-border rounded flex items-center justify-center bg-card hover:bg-accent transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {dark ? <Moon className="h-4 w-4 text-brand" /> : <Sun className="h-4 w-4 text-warning" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
