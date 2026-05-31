import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Accent = 'green' | 'black' | 'neutral';

const accents: Record<Accent, { border: string; icon: string }> = {
  green: { border: 'border-l-green', icon: 'text-green' },
  black: { border: 'border-l-black', icon: 'text-black' },
  neutral: { border: 'border-l-neutral-400', icon: 'text-neutral-500' },
};

export function FeedbackCard({
  titulo,
  icon: Icon,
  items,
  texto,
  accent = 'green',
}: {
  titulo: string;
  icon?: LucideIcon;
  items?: string[];
  texto?: string;
  accent?: Accent;
}) {
  const a = accents[accent];
  return (
    <div className={cn('border border-black border-l-4 rounded p-6', a.border)}>
      <h3 className="flex items-center gap-2 text-sm font-bold mb-3">
        {Icon && <Icon className={cn('h-4 w-4', a.icon)} />}
        {titulo}
      </h3>
      {texto && <p className="text-sm leading-relaxed whitespace-pre-line">{texto}</p>}
      {items && items.length > 0 && (
        <ul className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className={cn('shrink-0', a.icon)}>•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
