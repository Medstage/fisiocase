import { TrendingUp } from 'lucide-react';

/** Painel direito (escuro) das telas de auth — branding + métricas, fiel ao Stitch. */
export function AuthBranding() {
  return (
    <div className="hidden md:flex w-1/2 bg-foreground p-8 flex-col justify-between relative overflow-hidden">
      {/* Grid sutil de fundo (sem blur/gradiente, conforme flat design) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex-grow flex flex-col justify-center">
        <p className="text-background text-2xl font-bold max-w-sm leading-snug">
          Treine raciocínio clínico com casos reais gerados por IA.
        </p>
      </div>

      {/* Métricas (bento) */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mt-16">
        <div className="border border-background bg-foreground p-6 rounded flex flex-col transition-transform duration-200 hover:-translate-y-1">
          <span className="text-2xl font-bold text-green-light mb-2">2.400+</span>
          <span className="text-sm text-neutral-300">casos disponíveis</span>
        </div>
        <div className="border border-background bg-foreground p-6 rounded flex flex-col transition-transform duration-200 hover:-translate-y-1">
          <span className="text-2xl font-bold text-green-light mb-2">1.800</span>
          <span className="text-sm text-neutral-300">alunos ativos</span>
        </div>
        <div className="col-span-2 border border-background bg-foreground p-6 rounded transition-transform duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-2xl font-bold text-green-light mb-2">94%</span>
              <span className="text-sm text-neutral-300">de aprovação</span>
            </div>
            <TrendingUp className="h-12 w-12 text-neutral-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
