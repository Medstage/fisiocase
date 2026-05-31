'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Accordion({
  titulo,
  children,
  defaultOpen = false,
}: {
  titulo: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-black rounded bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex justify-between items-center text-left hover:bg-neutral-100 transition-colors"
      >
        <span className="text-base font-bold">{titulo}</span>
        <ChevronDown className={cn('h-5 w-5 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-black text-sm">{children}</div>}
    </div>
  );
}
