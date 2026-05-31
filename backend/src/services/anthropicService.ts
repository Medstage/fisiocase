import Anthropic from '@anthropic-ai/sdk';
import { env } from '../lib/env';
import type { Area, Dificuldade, TipoPaciente, FocoClinico } from '@prisma/client';

/** Modelo da Anthropic (configurável via env ANTHROPIC_MODEL para controlar custo). */
const MODEL = env.ANTHROPIC_MODEL;

interface HttpError extends Error {
  status?: number;
}

function getClient(): Anthropic {
  const key = env.ANTHROPIC_API_KEY;
  if (!key || key.includes('PREENCHER')) {
    const err: HttpError = new Error(
      'ANTHROPIC_API_KEY não configurada. Preencha a chave no arquivo backend/.env.',
    );
    err.status = 503;
    throw err;
  }
  return new Anthropic({ apiKey: key });
}

// ───────────────────────── Tipos ─────────────────────────
export interface GerarCasoParams {
  area: Area;
  dificuldade: Dificuldade;
  tipoPaciente: TipoPaciente;
  focoClinico: FocoClinico;
}

export interface CasoGerado {
  titulo: string;
  identificacao: {
    nome: string;
    idade: number | string;
    sexo: string;
    profissao: string;
    estadoCivil: string;
  };
  queixaPrincipal: string;
  historiaDoencaAtual: string;
  historicoPatologico: string[];
  exameFisico: { pa?: string; fc?: string; fr?: string; spo2?: string; achados?: string } & Record<
    string,
    unknown
  >;
  examesComplementares: Array<{ tipo: string; resultado: string }>;
  respostaEsperada: string;
}

export interface AvaliacaoIA {
  nota: number;
  acertos: string[];
  melhorias: string[];
  explicacaoClinica: string;
  recursosEstudo: string[];
}

// ───────────────────────── Helpers ─────────────────────────
/** Extrai um objeto JSON de um texto que pode vir cercado por ```json ... ``` ou prosa. */
function extractJson<T>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('A IA não retornou um JSON válido.');
  }
  return JSON.parse(t.slice(start, end + 1)) as T;
}

async function callModel(system: string, userPrompt: string, maxTokens = 2000): Promise<string> {
  const client = getClient();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    // system como array com cache_control reduz custo (persona é estável entre chamadas).
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

// ───────────────────────── Funções públicas ─────────────────────────
const PERSONA_GERACAO =
  'Você é um professor especialista em fisioterapia clínica com 20 anos de experiência. ' +
  'Gere um caso clínico realista e detalhado para um estudante de fisioterapia. O caso deve ser ' +
  'educativo, baseado em situações reais, com dados clínicos precisos e terminologia técnica correta.';

export async function gerarCaso(params: GerarCasoParams): Promise<CasoGerado> {
  const { area, dificuldade, tipoPaciente, focoClinico } = params;
  const userPrompt =
    `Gere um caso clínico de ${area} com dificuldade ${dificuldade} para um paciente ${tipoPaciente} ` +
    `focado em ${focoClinico}. Retorne APENAS um JSON com os campos: titulo, ` +
    `identificacao (objeto com nome fictício, idade, sexo, profissao, estadoCivil), queixaPrincipal, ` +
    `historiaDoencaAtual, historicoPatologico (array de strings), exameFisico (objeto com pa, fc, fr, spo2, achados), ` +
    `examesComplementares (array de objetos com tipo e resultado), respostaEsperada (conduta completa ideal). ` +
    `Não inclua nenhum texto fora do JSON.`;
  const text = await callModel(PERSONA_GERACAO, userPrompt, 2000);
  return extractJson<CasoGerado>(text);
}

const PERSONA_AVALIACAO =
  'Você é um professor especialista em fisioterapia clínica com 20 anos de experiência, avaliando a ' +
  'conduta de um estudante de forma rigorosa, justa e didática, baseada em evidências clínicas.';

export async function avaliarResposta(
  caso: {
    titulo: string;
    queixaPrincipal: string;
    respostaEsperada: string;
    criteriosAvaliacao?: unknown;
  },
  respostaAluno: string,
): Promise<AvaliacaoIA> {
  const criterios = caso.criteriosAvaliacao
    ? `\n\nCRITÉRIOS DE AVALIAÇÃO:\n${JSON.stringify(caso.criteriosAvaliacao)}`
    : '';
  const userPrompt =
    `CASO: ${caso.titulo}\nQueixa principal: ${caso.queixaPrincipal}\n\n` +
    `CONDUTA IDEAL (gabarito):\n${caso.respostaEsperada}${criterios}\n\n` +
    `RESPOSTA DO ALUNO:\n${respostaAluno}\n\n` +
    `Avalie a resposta do aluno comparando com a conduta ideal. Retorne APENAS um JSON com: ` +
    `nota (inteiro de 0 a 100), acertos (array de strings), melhorias (array de strings), ` +
    `explicacaoClinica (string longa e didática), recursosEstudo (array de strings com tópicos/leituras sugeridas). ` +
    `Não inclua nenhum texto fora do JSON.`;
  const text = await callModel(PERSONA_AVALIACAO, userPrompt, 1500);
  const parsed = extractJson<AvaliacaoIA>(text);
  parsed.nota = Math.max(0, Math.min(100, Math.round(Number(parsed.nota) || 0)));
  parsed.acertos = parsed.acertos ?? [];
  parsed.melhorias = parsed.melhorias ?? [];
  parsed.recursosEstudo = parsed.recursosEstudo ?? [];
  parsed.explicacaoClinica = parsed.explicacaoClinica ?? '';
  return parsed;
}
