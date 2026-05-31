export type Role = 'USER' | 'PROFESSOR' | 'ADMIN';
export type Area =
  | 'ORTOPEDIA'
  | 'NEUROLOGIA'
  | 'CARDIORRESPIRATORIA'
  | 'ESPORTIVA'
  | 'GERONTOLOGIA'
  | 'PEDIATRIA'
  | 'UROGINECOLOGIA'
  | 'REUMATOLOGIA';
export type Dificuldade = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type TipoPaciente = 'ADULTO' | 'IDOSO' | 'PEDIATRICO' | 'GESTANTE' | 'ATLETA';
export type FocoClinico = 'AVALIACAO' | 'DIAGNOSTICO' | 'CONDUTA' | 'REABILITACAO' | 'PREVENCAO';
export type StatusCaso = 'RASCUNHO' | 'PUBLICADO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  instituicao?: string | null;
  semestre?: number | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: Role;
  nivel: string;
  xpTotal: number;
  xpAtual: number;
  sequenciaAtual: number;
  maiorSequencia: number;
}

export interface IdentificacaoPaciente {
  nome: string;
  idade: number | string;
  sexo: string;
  profissao: string;
  estadoCivil: string;
}

export interface Caso {
  id: string;
  titulo: string;
  area: Area;
  dificuldade: Dificuldade;
  tipoPaciente: TipoPaciente;
  focoClinico: FocoClinico;
  identificacao: IdentificacaoPaciente;
  queixaPrincipal: string;
  historiaDoencaAtual: string;
  historicoPatologico: string[];
  exameFisico: Record<string, string>;
  examesComplementares: Array<{ tipo: string; resultado: string }>;
  respostaEsperada: string;
  xpRecompensa: number;
  status: StatusCaso;
  totalResolucoes: number;
  mediaAcerto: number;
  createdAt: string;
}

export interface AvaliacaoFeedback {
  nota: number;
  acertos: string[];
  melhorias: string[];
  explicacaoClinica: string;
  recursosEstudo: string[];
}

export interface Resposta {
  id: string;
  conteudo: string;
  nota: number | null;
  feedback: AvaliacaoFeedback | null;
  tempoGasto: number;
  xpGanho: number;
  createdAt: string;
  caso?: Caso;
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  xpRecompensa: number;
  desbloqueada?: boolean;
  unlockedAt?: string | null;
}
