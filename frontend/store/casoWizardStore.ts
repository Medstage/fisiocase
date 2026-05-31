import { create } from 'zustand';
import type { Area, Dificuldade, TipoPaciente, FocoClinico } from '@/types';

// Estado persistido entre as 5 etapas do wizard de criação de caso clínico.
// É um store em memória (não persiste em localStorage) — vive enquanto o usuário
// está no fluxo. `reset()` deve ser chamado após salvar ou cancelar.

export interface IdentificacaoPacienteWizard {
  nome: string;
  idade: string;
  sexo: string;
  profissao: string;
  estadoCivil: string;
  escolaridade: string;
  cidade: string;
}

export interface ExameFisicoWizard {
  pa: string;
  fc: string;
  fr: string;
  spo2: string;
  achados: string;
}

export interface ExameComplementarItem {
  tipo: string;
  resultado: string;
}

export interface CriterioAvaliacaoItem {
  descricao: string;
  peso: number;
}

export interface CasoWizardState {
  // Etapa 1
  titulo: string;
  area: Area | null;
  dificuldade: Dificuldade | null;
  tipoPaciente: TipoPaciente | null;
  focoClinico: FocoClinico | null;
  xpRecompensa: number | null;

  // Etapa 2
  identificacao: IdentificacaoPacienteWizard;
  queixaPrincipal: string;
  historiaDoencaAtual: string;

  // Etapa 3
  historicoPatologico: string[];
  exameFisico: ExameFisicoWizard;
  examesComplementares: ExameComplementarItem[];

  // Etapa 4
  respostaEsperada: string;
  criteriosAvaliacao: CriterioAvaliacaoItem[];

  // Etapa 5
  publicar: boolean;
  turmaIdAlvo: string | null;

  // Navegação
  step: number;

  // Actions
  set: <K extends keyof CasoWizardState>(key: K, value: CasoWizardState[K]) => void;
  setIdentificacao: <K extends keyof IdentificacaoPacienteWizard>(
    key: K,
    value: IdentificacaoPacienteWizard[K],
  ) => void;
  setExameFisico: <K extends keyof ExameFisicoWizard>(key: K, value: ExameFisicoWizard[K]) => void;

  setStep: (step: number) => void;

  addHistoricoItem: (texto: string) => void;
  removeHistoricoItem: (index: number) => void;

  addExame: () => void;
  removeExame: (index: number) => void;
  setExame: (index: number, patch: Partial<ExameComplementarItem>) => void;

  addCriterio: () => void;
  removeCriterio: (index: number) => void;
  setCriterio: (index: number, patch: Partial<CriterioAvaliacaoItem>) => void;

  reset: () => void;
}

const ESTADO_INICIAL: Omit<
  CasoWizardState,
  | 'set'
  | 'setIdentificacao'
  | 'setExameFisico'
  | 'setStep'
  | 'addHistoricoItem'
  | 'removeHistoricoItem'
  | 'addExame'
  | 'removeExame'
  | 'setExame'
  | 'addCriterio'
  | 'removeCriterio'
  | 'setCriterio'
  | 'reset'
> = {
  titulo: '',
  area: null,
  dificuldade: null,
  tipoPaciente: null,
  focoClinico: null,
  xpRecompensa: null,
  identificacao: {
    nome: '',
    idade: '',
    sexo: '',
    profissao: '',
    estadoCivil: '',
    escolaridade: '',
    cidade: '',
  },
  queixaPrincipal: '',
  historiaDoencaAtual: '',
  historicoPatologico: [],
  exameFisico: { pa: '', fc: '', fr: '', spo2: '', achados: '' },
  examesComplementares: [],
  respostaEsperada: '',
  criteriosAvaliacao: [],
  publicar: true,
  turmaIdAlvo: null,
  step: 0,
};

export const useCasoWizardStore = create<CasoWizardState>((set) => ({
  ...ESTADO_INICIAL,

  set: (key, value) => set({ [key]: value } as Partial<CasoWizardState>),

  setIdentificacao: (key, value) =>
    set((s) => ({ identificacao: { ...s.identificacao, [key]: value } })),

  setExameFisico: (key, value) =>
    set((s) => ({ exameFisico: { ...s.exameFisico, [key]: value } })),

  setStep: (step) => set({ step: Math.max(0, Math.min(4, step)) }),

  addHistoricoItem: (texto) =>
    set((s) => {
      const limpo = texto.trim();
      if (!limpo) return s;
      return { historicoPatologico: [...s.historicoPatologico, limpo] };
    }),
  removeHistoricoItem: (index) =>
    set((s) => ({ historicoPatologico: s.historicoPatologico.filter((_, i) => i !== index) })),

  addExame: () =>
    set((s) => ({ examesComplementares: [...s.examesComplementares, { tipo: '', resultado: '' }] })),
  removeExame: (index) =>
    set((s) => ({ examesComplementares: s.examesComplementares.filter((_, i) => i !== index) })),
  setExame: (index, patch) =>
    set((s) => ({
      examesComplementares: s.examesComplementares.map((e, i) =>
        i === index ? { ...e, ...patch } : e,
      ),
    })),

  addCriterio: () =>
    set((s) => ({ criteriosAvaliacao: [...s.criteriosAvaliacao, { descricao: '', peso: 0 }] })),
  removeCriterio: (index) =>
    set((s) => ({ criteriosAvaliacao: s.criteriosAvaliacao.filter((_, i) => i !== index) })),
  setCriterio: (index, patch) =>
    set((s) => ({
      criteriosAvaliacao: s.criteriosAvaliacao.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    })),

  reset: () => set({ ...ESTADO_INICIAL }),
}));
