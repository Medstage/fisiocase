'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, User, Gauge, ClipboardList, ArrowRight, ArrowLeft, X, Sparkles, Library } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AREA_LABEL, TIPO_PACIENTE_LABEL, FOCO_LABEL } from '@/lib/constants';
import { EscolherCaso } from '@/components/caso/EscolherCaso';
import type { Area, Dificuldade, TipoPaciente, FocoClinico, Caso } from '@/types';

const AREAS = Object.entries(AREA_LABEL) as [Area, string][];
const TIPOS = Object.entries(TIPO_PACIENTE_LABEL) as [TipoPaciente, string][];
const FOCOS = Object.entries(FOCO_LABEL) as [FocoClinico, string][];
const DIFICULDADES: { value: Dificuldade; label: string; desc: string }[] = [
  { value: 'FACIL', label: 'Fácil', desc: 'Casos diretos com diagnósticos claros e protocolos padrão.' },
  { value: 'MEDIO', label: 'Médio', desc: 'Comorbidades moderadas e necessidade de adaptação do plano.' },
  { value: 'DIFICIL', label: 'Difícil', desc: 'Quadros complexos, múltiplas variáveis e risco clínico elevado.' },
];

const PASSOS = [
  { titulo: 'Área de Atuação', icon: Stethoscope },
  { titulo: 'Tipo de Paciente', icon: User },
  { titulo: 'Nível de Dificuldade', icon: Gauge },
  { titulo: 'Foco Clínico', icon: ClipboardList },
] as const;

type Aba = 'gerar' | 'escolher';

function Chip({ selected, onClick, children, full }: { selected: boolean; onClick: () => void; children: React.ReactNode; full?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border border-black rounded px-4 py-3 text-sm font-bold uppercase tracking-wide text-left transition-all active:scale-[0.98]',
        full && 'w-full sm:w-[calc(50%-4px)]',
        selected ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100',
      )}
    >
      {children}
    </button>
  );
}

function LoaderView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] border border-black rounded p-12">
      <h3 className="text-2xl font-bold text-center mb-8">Sintetizando dados clínicos...</h3>
      <div className="w-full max-w-[400px] space-y-4">
        <div className="h-6 border border-black rounded animate-pulse" />
        <div className="h-3 w-3/4 border border-black rounded animate-pulse" style={{ animationDelay: '0.15s' }} />
        <div className="h-3 w-5/6 border border-black rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="flex gap-4 pt-4">
          <div className="h-10 w-1/2 border border-black rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="h-10 w-1/2 border border-black rounded animate-pulse" style={{ animationDelay: '0.25s' }} />
        </div>
      </div>
    </div>
  );
}

function WizardIA() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [dificuldade, setDificuldade] = useState<Dificuldade | null>(null);
  const [tipoPaciente, setTipoPaciente] = useState<TipoPaciente | null>(null);
  const [focoClinico, setFocoClinico] = useState<FocoClinico | null>(null);
  const [erro, setErro] = useState('');

  const gerar = useMutation({
    mutationFn: async () =>
      (await api.post('/api/casos/gerar', { area, dificuldade, tipoPaciente, focoClinico })).data as Caso,
    onSuccess: (caso) => router.push(`/caso/${caso.id}`),
    onError: (e: unknown) => {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setErro(status === 503 ? 'A IA ainda não está configurada — defina a ANTHROPIC_API_KEY no backend (.env).' : 'Não foi possível gerar o caso. Tente novamente.');
    },
  });

  function avancar() {
    setTimeout(() => setStep((s) => Math.min(3, s + 1)), 140);
  }
  const valorAtual = [area, tipoPaciente, dificuldade, focoClinico][step];
  const Icon = PASSOS[step].icon;

  if (gerar.isPending) return <LoaderView />;

  return (
    <div>
      <div className="mb-8 flex gap-2">
        {PASSOS.map((_, i) => (
          <div key={i} className={cn('h-1.5 flex-1 rounded transition-colors', i <= step ? 'bg-green' : 'bg-neutral-200')} />
        ))}
      </div>

      <div className="min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Icon className="h-5 w-5" /> {PASSOS[step].titulo}
            </h2>

            {step === 0 && (
              <div className="flex flex-wrap gap-2">
                {AREAS.map(([v, l]) => (
                  <Chip key={v} selected={area === v} onClick={() => { setArea(v); avancar(); }}>{l}</Chip>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="flex flex-wrap gap-2">
                {TIPOS.map(([v, l]) => (
                  <Chip key={v} selected={tipoPaciente === v} onClick={() => { setTipoPaciente(v); avancar(); }}>{l}</Chip>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-2">
                {DIFICULDADES.map((d) => {
                  const sel = dificuldade === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => { setDificuldade(d.value); avancar(); }}
                      className={cn('border border-black rounded p-4 text-left transition-all active:scale-[0.99] flex flex-col gap-1', sel ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100')}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide">{d.label}</span>
                      <span className={cn('text-sm', sel ? 'text-neutral-300' : 'text-neutral-600')}>{d.desc}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {step === 3 && (
              <div className="flex flex-wrap gap-2">
                {FOCOS.map(([v, l]) => (
                  <Chip key={v} full selected={focoClinico === v} onClick={() => setFocoClinico(v)}>{l}</Chip>
                ))}
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {erro && <p className="text-sm text-destructive font-bold mt-4">{erro}</p>}

      <div className="border-t border-black pt-6 mt-6 flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={!valorAtual} className="gap-2">
            Próximo <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => { setErro(''); gerar.mutate(); }} disabled={!focoClinico} className="tracking-widest px-8">
            Gerar caso clínico <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NovoCasoPage() {
  const [aba, setAba] = useState<Aba>('gerar');

  const Aba = ({ id, label, Icon }: { id: Aba; label: string; Icon: typeof Sparkles }) => (
    <button
      onClick={() => setAba(id)}
      className={cn(
        'inline-flex items-center gap-2 px-1 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors',
        aba === id ? 'border-green text-black' : 'border-transparent text-neutral-500 hover:text-black',
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn(aba === 'gerar' ? 'max-w-3xl mx-auto' : 'max-w-6xl mx-auto')}>
      <header className="mb-6 pb-4 border-b border-black flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em]">Novo caso clínico</h1>
          <p className="text-sm text-neutral-600 mt-1">
            {aba === 'gerar' ? 'A IA gera um caso original com seus filtros.' : 'Escolha um caso já publicado para resolver.'}
          </p>
        </div>
        <Link href="/dashboard" aria-label="Voltar" className="border border-black p-2 hover:bg-black hover:text-white transition-colors rounded shrink-0">
          <X className="h-5 w-5" />
        </Link>
      </header>

      <nav className="flex gap-6 mb-6 border-b border-black">
        <Aba id="gerar" label="Gerar com IA" Icon={Sparkles} />
        <Aba id="escolher" label="Escolher caso" Icon={Library} />
      </nav>

      {aba === 'gerar' ? <WizardIA /> : <EscolherCaso />}
    </motion.div>
  );
}
