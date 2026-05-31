'use client';

import { useEffect, useRef, useState } from 'react';

/** Cronômetro de contagem regressiva (mm:ss). Retorna tempo restante, decorrido e controles. */
export function useTimer(initialMinutes = 30, onExpire?: () => void) {
  const total = initialMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(total);
  const [running, setRunning] = useState(true);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [secondsLeft, onExpire]);

  return {
    secondsLeft,
    elapsed: total - secondsLeft,
    running,
    toggle: () => setRunning((r) => !r),
    total,
  };
}
