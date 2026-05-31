'use client';

import { cn } from '@/lib/utils';

export interface Opcao<T extends string> {
  value: T;
  label: string;
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Opcao<T>[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-3">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'px-4 h-10 rounded border border-black text-sm transition-all active:scale-[0.98]',
              value === o.value ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
