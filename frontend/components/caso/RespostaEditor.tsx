'use client';

import { useEffect, useRef } from 'react';

export function RespostaEditor({
  value,
  onChange,
  disabled,
  placeholder = 'Descreva sua conduta clínica: avaliação, diagnóstico cinético-funcional, objetivos e plano de tratamento...',
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 220)}px`;
    }
  }, [value]);

  return (
    <div className="border border-black rounded bg-white transition-colors focus-within:border-green">
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 outline-none resize-none text-sm bg-transparent min-h-[220px] disabled:opacity-60"
      />
      <div className="flex justify-end px-4 py-2 border-t border-neutral-200 text-xs text-neutral-600">
        {value.length} caracteres
      </div>
    </div>
  );
}
