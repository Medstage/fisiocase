'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import {
  AREA_LABEL,
  DIFICULDADE_LABEL,
  TIPO_PACIENTE_LABEL,
  FOCO_LABEL,
} from '@/lib/constants';
import type { Area, Dificuldade, FocoClinico, TipoPaciente } from '@/types';
import { useCasoWizardStore } from '@/store/casoWizardStore';
import type { TurmaProfessor } from '@/components/professor/utils';

// --------- estilos auxiliares ---------

const textareaCls =
  'w-full border border-black rounded p-4 text-sm bg-white outline-none focus:border-green transition-colors resize-y placeholder:text-neutral-500';

const selectCls =
  'w-full h-12 border border-black rounded px-4 text-sm bg-white outline-none focus:border-green transition-colors appearance-none';

const labelCls = 'block text-xs uppercase tracking-wider text-neutral-600 mb-2';

const SEXOS = ['Masculino', 'Feminino', 'Outro'];
const ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Outro'];
const ESCOLARIDADES = ['Fundamental', 'Médio', 'Superior', 'Pós'];

const PASSOS = [
  { titulo: 'Configuração' },
  { titulo: 'Paciente' },
  { titulo: 'Exame clínico' },
  { titulo: 'Gabarito' },
  { titulo: 'Revisão' },
];

const XP_POR_DIFICULDADE: Record<Dificuldade, number> = {
  FACIL: 150,
  MEDIO: 300,
  DIFICIL: 500,
};

// --------- Stepper ---------

function Stepper({
  step,
  onJump,
}: {
  step: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center">
        {PASSOS.map((p, i) => {
          const concluido = i < step;
          const ativo = i === step;
          const navegavel = i < step;
          return (
            <div key={p.titulo} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => navegavel && onJump(i)}
                disabled={!navegavel}
                aria-label={`Etapa ${i + 1}: ${p.titulo}`}
                className={cn(
                  'relative flex flex-col items-center gap-2 group shrink-0',
                  navegavel && 'cursor-pointer',
                )}
              >
                <span
                  className={cn(
                    'h-9 w-9 rounded-full border flex items-center justify-center text-sm font-bold transition-colors',
                    ativo && 'bg-black text-white border-black',
                    concluido && 'bg-green text-white border-green',
                    !ativo && !concluido && 'bg-neutral-100 text-neutral-500 border-neutral-300',
                  )}
                >
                  {concluido ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-bold whitespace-nowrap',
                    ativo ? 'text-black' : 'text-neutral-500',
                  )}
                >
                  {p.titulo}
                </span>
              </button>
              {i < PASSOS.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 mx-2 -translate-y-2.5 transition-colors',
                    i < step ? 'bg-green' : 'bg-neutral-300',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------- Etapa 1: configuração ---------

function EtapaConfiguracao() {
  const s = useCasoWizardStore();
  const onDificuldade = (d: Dificuldade) => {
    s.set('dificuldade', d);
    if (s.xpRecompensa == null || s.xpRecompensa === 0) {
      s.set('xpRecompensa', XP_POR_DIFICULDADE[d]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <FloatingInput
          id="wz-titulo"
          label="Título do caso"
          value={s.titulo}
          onChange={(e) => s.set('titulo', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="wz-area" className={labelCls}>
            Área
          </label>
          <div className="relative">
            <select
              id="wz-area"
              className={selectCls}
              value={s.area ?? ''}
              onChange={(e) => s.set('area', (e.target.value || null) as Area | null)}
            >
              <option value="">Selecione</option>
              {(Object.entries(AREA_LABEL) as [Area, string][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="wz-dif" className={labelCls}>
            Dificuldade
          </label>
          <div className="relative">
            <select
              id="wz-dif"
              className={selectCls}
              value={s.dificuldade ?? ''}
              onChange={(e) => {
                const v = (e.target.value || null) as Dificuldade | null;
                if (v) onDificuldade(v);
                else s.set('dificuldade', null);
              }}
            >
              <option value="">Selecione</option>
              {(Object.entries(DIFICULDADE_LABEL) as [Dificuldade, string][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="wz-tp" className={labelCls}>
            Tipo de paciente
          </label>
          <div className="relative">
            <select
              id="wz-tp"
              className={selectCls}
              value={s.tipoPaciente ?? ''}
              onChange={(e) =>
                s.set('tipoPaciente', (e.target.value || null) as TipoPaciente | null)
              }
            >
              <option value="">Selecione</option>
              {(Object.entries(TIPO_PACIENTE_LABEL) as [TipoPaciente, string][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="wz-foco" className={labelCls}>
            Foco clínico
          </label>
          <div className="relative">
            <select
              id="wz-foco"
              className={selectCls}
              value={s.focoClinico ?? ''}
              onChange={(e) =>
                s.set('focoClinico', (e.target.value || null) as FocoClinico | null)
              }
            >
              <option value="">Selecione</option>
              {(Object.entries(FOCO_LABEL) as [FocoClinico, string][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="wz-xp" className={labelCls}>
          XP de recompensa (100 a 500)
        </label>
        <input
          id="wz-xp"
          type="number"
          min={100}
          max={500}
          step={10}
          value={s.xpRecompensa ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            s.set('xpRecompensa', v === '' ? null : Number(v));
          }}
          className="w-full h-12 border border-black rounded px-4 text-sm bg-white outline-none focus:border-green transition-colors"
        />
        {s.dificuldade && (
          <p className="text-xs text-neutral-500 mt-2">
            Sugestão para {DIFICULDADE_LABEL[s.dificuldade]}: {XP_POR_DIFICULDADE[s.dificuldade]} XP.
          </p>
        )}
      </div>
    </div>
  );
}

function configuracaoValida(s: ReturnType<typeof useCasoWizardStore.getState>): string | null {
  if (s.titulo.trim().length < 3) return 'Informe um título com pelo menos 3 caracteres.';
  if (!s.area) return 'Selecione a área.';
  if (!s.dificuldade) return 'Selecione a dificuldade.';
  if (!s.tipoPaciente) return 'Selecione o tipo de paciente.';
  if (!s.focoClinico) return 'Selecione o foco clínico.';
  const xp = s.xpRecompensa ?? 0;
  if (xp < 100 || xp > 500) return 'O XP deve estar entre 100 e 500.';
  return null;
}

// --------- Etapa 2: paciente ---------

function EtapaPaciente() {
  const s = useCasoWizardStore();
  const ident = s.identificacao;
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput
            id="id-nome"
            label="Nome"
            value={ident.nome}
            onChange={(e) => s.setIdentificacao('nome', e.target.value)}
          />
          <FloatingInput
            id="id-idade"
            label="Idade"
            type="number"
            min={0}
            value={ident.idade}
            onChange={(e) => s.setIdentificacao('idade', e.target.value)}
          />

          <div>
            <label htmlFor="id-sexo" className={labelCls}>
              Sexo
            </label>
            <div className="relative">
              <select
                id="id-sexo"
                className={selectCls}
                value={ident.sexo}
                onChange={(e) => s.setIdentificacao('sexo', e.target.value)}
              >
                <option value="">Selecione</option>
                {SEXOS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          <FloatingInput
            id="id-prof"
            label="Profissão"
            value={ident.profissao}
            onChange={(e) => s.setIdentificacao('profissao', e.target.value)}
          />

          <div>
            <label htmlFor="id-civ" className={labelCls}>
              Estado civil
            </label>
            <div className="relative">
              <select
                id="id-civ"
                className={selectCls}
                value={ident.estadoCivil}
                onChange={(e) => s.setIdentificacao('estadoCivil', e.target.value)}
              >
                <option value="">Selecione</option>
                {ESTADO_CIVIL.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="id-esc" className={labelCls}>
              Escolaridade
            </label>
            <div className="relative">
              <select
                id="id-esc"
                className={selectCls}
                value={ident.escolaridade}
                onChange={(e) => s.setIdentificacao('escolaridade', e.target.value)}
              >
                <option value="">Selecione</option>
                {ESCOLARIDADES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          <FloatingInput
            id="id-cidade"
            label="Cidade"
            value={ident.cidade}
            onChange={(e) => s.setIdentificacao('cidade', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="qp" className={labelCls}>
          Queixa principal
        </label>
        <textarea
          id="qp"
          rows={3}
          className={textareaCls}
          placeholder="Descreva em poucas palavras o motivo da consulta..."
          value={s.queixaPrincipal}
          onChange={(e) => s.set('queixaPrincipal', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="hda" className={labelCls}>
          História da doença atual
        </label>
        <textarea
          id="hda"
          rows={5}
          className={textareaCls}
          placeholder="Início dos sintomas, evolução, fatores agravantes e atenuantes..."
          value={s.historiaDoencaAtual}
          onChange={(e) => s.set('historiaDoencaAtual', e.target.value)}
        />
      </div>
    </div>
  );
}

function pacienteValido(s: ReturnType<typeof useCasoWizardStore.getState>): string | null {
  const i = s.identificacao;
  if (!i.nome.trim()) return 'Informe o nome do paciente.';
  if (!i.idade.toString().trim()) return 'Informe a idade.';
  if (!i.sexo) return 'Selecione o sexo.';
  if (!s.queixaPrincipal.trim()) return 'Descreva a queixa principal.';
  if (!s.historiaDoencaAtual.trim()) return 'Descreva a história da doença atual.';
  return null;
}

// --------- Etapa 3: exame clínico ---------

function EtapaExame() {
  const s = useCasoWizardStore();
  const [novoHistorico, setNovoHistorico] = useState('');
  const ef = s.exameFisico;

  const adicionarHistorico = () => {
    if (!novoHistorico.trim()) return;
    s.addHistoricoItem(novoHistorico);
    setNovoHistorico('');
  };

  return (
    <div className="space-y-10">
      {/* Histórico patológico */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-3">
          Histórico patológico
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoHistorico}
            onChange={(e) => setNovoHistorico(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                adicionarHistorico();
              }
            }}
            placeholder="Ex.: Hipertensão arterial sistêmica"
            className="flex-1 h-11 border border-black rounded px-4 text-sm bg-white outline-none focus:border-green transition-colors"
          />
          <Button type="button" variant="outline" size="default" onClick={adicionarHistorico}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {s.historicoPatologico.map((item, i) => (
              <motion.div
                key={`${item}-${i}`}
                initial={{ opacity: 0, x: -8, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-between border border-black rounded px-4 py-2 text-sm bg-white"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => s.removeHistoricoItem(i)}
                  aria-label="Remover"
                  className="text-neutral-600 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {s.historicoPatologico.length === 0 && (
            <p className="text-xs text-neutral-500">Nenhum item adicionado.</p>
          )}
        </div>
      </div>

      {/* Exame físico */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-3">Exame físico</h3>
        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            id="ef-pa"
            label="PA"
            placeholder="120x80 mmHg"
            value={ef.pa}
            onChange={(e) => s.setExameFisico('pa', e.target.value)}
          />
          <FloatingInput
            id="ef-fc"
            label="FC"
            placeholder="78 bpm"
            value={ef.fc}
            onChange={(e) => s.setExameFisico('fc', e.target.value)}
          />
          <FloatingInput
            id="ef-fr"
            label="FR"
            placeholder="16 irpm"
            value={ef.fr}
            onChange={(e) => s.setExameFisico('fr', e.target.value)}
          />
          <FloatingInput
            id="ef-spo2"
            label="SpO2"
            placeholder="98%"
            value={ef.spo2}
            onChange={(e) => s.setExameFisico('spo2', e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="ef-ach" className={labelCls}>
            Achados do exame segmentar
          </label>
          <textarea
            id="ef-ach"
            rows={4}
            className={textareaCls}
            placeholder="Inspeção, palpação, ADM, força, testes especiais..."
            value={ef.achados}
            onChange={(e) => s.setExameFisico('achados', e.target.value)}
          />
        </div>
      </div>

      {/* Exames complementares */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-neutral-600">
            Exames complementares
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={() => s.addExame()}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {s.examesComplementares.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col sm:flex-row gap-3 items-stretch"
              >
                <FloatingInput
                  id={`ex-tipo-${i}`}
                  label="Tipo"
                  className="sm:w-1/3"
                  value={ex.tipo}
                  onChange={(e) => s.setExame(i, { tipo: e.target.value })}
                />
                <FloatingInput
                  id={`ex-res-${i}`}
                  label="Resultado"
                  value={ex.resultado}
                  onChange={(e) => s.setExame(i, { resultado: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remover exame"
                  onClick={() => s.removeExame(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          {s.examesComplementares.length === 0 && (
            <p className="text-xs text-neutral-500">Nenhum exame adicionado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Exame não tem campos rigidamente obrigatórios (alguns casos não terão
// exame físico completo nem complementares). Apenas avança.
function exameValido(_s: ReturnType<typeof useCasoWizardStore.getState>): string | null {
  return null;
}

// --------- Etapa 4: gabarito ---------

function EtapaGabarito() {
  const s = useCasoWizardStore();
  const total = s.criteriosAvaliacao.reduce((acc, c) => acc + (Number(c.peso) || 0), 0);
  const totalOk = total === 100;
  const charCount = s.respostaEsperada.length;
  const minChars = 200;

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="resp" className="text-xs uppercase tracking-wider text-neutral-600">
            Resposta esperada
          </label>
          <span
            className={cn(
              'text-xs',
              charCount >= minChars ? 'text-green' : 'text-neutral-500',
            )}
          >
            {charCount}/{minChars} caracteres
          </span>
        </div>
        <textarea
          id="resp"
          rows={8}
          className={textareaCls}
          placeholder="Descreva o raciocínio clínico esperado, hipóteses, conduta..."
          value={s.respostaEsperada}
          onChange={(e) => s.set('respostaEsperada', e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-neutral-600">
            Critérios de avaliação
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={() => s.addCriterio()}>
            <Plus className="h-4 w-4" /> Adicionar critério
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {s.criteriosAvaliacao.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col sm:flex-row gap-3 items-stretch"
              >
                <FloatingInput
                  id={`cr-desc-${i}`}
                  label="Descrição"
                  className="sm:flex-1"
                  value={c.descricao}
                  onChange={(e) => s.setCriterio(i, { descricao: e.target.value })}
                />
                <div className="sm:w-36">
                  <FloatingInput
                    id={`cr-peso-${i}`}
                    label="Peso (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={c.peso || ''}
                    onChange={(e) =>
                      s.setCriterio(i, { peso: e.target.value === '' ? 0 : Number(e.target.value) })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remover critério"
                  onClick={() => s.removeCriterio(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {s.criteriosAvaliacao.length === 0 && (
            <p className="text-xs text-neutral-500">Adicione ao menos um critério.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black pt-3">
          <span className="text-xs uppercase tracking-wider text-neutral-600">
            Total dos pesos
          </span>
          <span
            className={cn(
              'text-lg font-bold',
              totalOk ? 'text-green' : 'text-destructive',
            )}
          >
            {total}%
          </span>
        </div>
        {!totalOk && s.criteriosAvaliacao.length > 0 && (
          <p className="text-xs text-destructive mt-1">
            A soma dos pesos precisa ser exatamente 100% para avançar.
          </p>
        )}
      </div>
    </div>
  );
}

function gabaritoValido(s: ReturnType<typeof useCasoWizardStore.getState>): string | null {
  if (s.respostaEsperada.trim().length < 200) {
    return 'A resposta esperada precisa ter pelo menos 200 caracteres.';
  }
  if (s.criteriosAvaliacao.length === 0) return 'Adicione pelo menos um critério.';
  if (s.criteriosAvaliacao.some((c) => !c.descricao.trim())) {
    return 'Preencha a descrição de todos os critérios.';
  }
  const total = s.criteriosAvaliacao.reduce((acc, c) => acc + (Number(c.peso) || 0), 0);
  if (total !== 100) return 'A soma dos pesos deve ser exatamente 100%.';
  return null;
}

// --------- Etapa 5: revisão ---------

function SecaoRevisao({
  titulo,
  onEditar,
  children,
  defaultOpen = false,
}: {
  titulo: string;
  onEditar: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-black rounded bg-white">
      <div className="w-full p-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <span className="text-base font-bold">{titulo}</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onEditar}
          className="ml-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-black text-sm">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LinhaInfo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-b-0 border-neutral-200">
      <span className="text-xs uppercase tracking-wider text-neutral-500">{label}</span>
      <span className="col-span-2 text-sm">{valor || <em className="text-neutral-400">—</em>}</span>
    </div>
  );
}

function EtapaRevisao({ modo }: { modo: 'admin' | 'professor' }) {
  const s = useCasoWizardStore();

  const turmasQ = useQuery({
    queryKey: ['prof-turmas-wizard'],
    queryFn: async () =>
      (await api.get('/api/turmas/minhas')).data as { turmas: TurmaProfessor[] },
    enabled: modo === 'professor',
  });

  const turmasAtivas = useMemo(
    () => (turmasQ.data?.turmas ?? []).filter((t) => t.ativa),
    [turmasQ.data],
  );

  return (
    <div className="space-y-4">
      <SecaoRevisao titulo="Configuração" defaultOpen onEditar={() => s.setStep(0)}>
        <LinhaInfo label="Título" valor={s.titulo} />
        <LinhaInfo label="Área" valor={s.area ? AREA_LABEL[s.area] : ''} />
        <LinhaInfo
          label="Dificuldade"
          valor={s.dificuldade ? DIFICULDADE_LABEL[s.dificuldade] : ''}
        />
        <LinhaInfo
          label="Tipo de paciente"
          valor={s.tipoPaciente ? TIPO_PACIENTE_LABEL[s.tipoPaciente] : ''}
        />
        <LinhaInfo label="Foco clínico" valor={s.focoClinico ? FOCO_LABEL[s.focoClinico] : ''} />
        <LinhaInfo label="XP" valor={s.xpRecompensa ?? ''} />
      </SecaoRevisao>

      <SecaoRevisao titulo="Identificação e queixa" onEditar={() => s.setStep(1)}>
        <LinhaInfo label="Nome" valor={s.identificacao.nome} />
        <LinhaInfo label="Idade" valor={s.identificacao.idade} />
        <LinhaInfo label="Sexo" valor={s.identificacao.sexo} />
        <LinhaInfo label="Profissão" valor={s.identificacao.profissao} />
        <LinhaInfo label="Estado civil" valor={s.identificacao.estadoCivil} />
        <LinhaInfo label="Escolaridade" valor={s.identificacao.escolaridade} />
        <LinhaInfo label="Cidade" valor={s.identificacao.cidade} />
        <LinhaInfo label="Queixa principal" valor={s.queixaPrincipal} />
        <LinhaInfo label="História atual" valor={s.historiaDoencaAtual} />
      </SecaoRevisao>

      <SecaoRevisao titulo="Exame clínico" onEditar={() => s.setStep(2)}>
        <LinhaInfo
          label="Histórico patológico"
          valor={
            s.historicoPatologico.length ? (
              <ul className="list-disc pl-4">
                {s.historicoPatologico.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            ) : (
              ''
            )
          }
        />
        <LinhaInfo label="PA" valor={s.exameFisico.pa} />
        <LinhaInfo label="FC" valor={s.exameFisico.fc} />
        <LinhaInfo label="FR" valor={s.exameFisico.fr} />
        <LinhaInfo label="SpO2" valor={s.exameFisico.spo2} />
        <LinhaInfo label="Achados" valor={s.exameFisico.achados} />
        <LinhaInfo
          label="Complementares"
          valor={
            s.examesComplementares.length ? (
              <ul className="space-y-1">
                {s.examesComplementares.map((e, i) => (
                  <li key={i}>
                    <strong>{e.tipo}:</strong> {e.resultado}
                  </li>
                ))}
              </ul>
            ) : (
              ''
            )
          }
        />
      </SecaoRevisao>

      <SecaoRevisao titulo="Gabarito" onEditar={() => s.setStep(3)}>
        <LinhaInfo label="Resposta esperada" valor={s.respostaEsperada} />
        <LinhaInfo
          label="Critérios"
          valor={
            s.criteriosAvaliacao.length ? (
              <ul className="space-y-1">
                {s.criteriosAvaliacao.map((c, i) => (
                  <li key={i}>
                    <strong>{c.peso}%</strong> — {c.descricao}
                  </li>
                ))}
              </ul>
            ) : (
              ''
            )
          }
        />
      </SecaoRevisao>

      {/* Publicação */}
      <div className="border border-black rounded bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold mb-3">Publicação</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => s.set('publicar', true)}
              className={cn(
                'flex-1 h-11 rounded border border-black text-sm font-bold transition-colors',
                s.publicar ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100',
              )}
            >
              Publicar imediatamente
            </button>
            <button
              type="button"
              onClick={() => s.set('publicar', false)}
              className={cn(
                'flex-1 h-11 rounded border border-black text-sm font-bold transition-colors',
                !s.publicar ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100',
              )}
            >
              Salvar como rascunho
            </button>
          </div>
        </div>

        {modo === 'professor' && (
          <div>
            <label htmlFor="wz-turma" className={labelCls}>
              Publicar em qual turma (opcional)
            </label>
            <div className="relative">
              <select
                id="wz-turma"
                className={selectCls}
                value={s.turmaIdAlvo ?? ''}
                onChange={(e) => s.set('turmaIdAlvo', e.target.value || null)}
              >
                <option value="">Nenhuma turma específica</option>
                {turmasAtivas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
            {turmasQ.isLoading && (
              <p className="text-xs text-neutral-500 mt-2">Carregando turmas...</p>
            )}
          </div>
        )}

        {modo === 'admin' && (
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <span className="text-sm">Disponível para todos os professores</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-green">
              <Check className="h-3.5 w-3.5" /> Sim
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// --------- Wizard principal ---------

export function WizardCriarCaso({ modo }: { modo: 'admin' | 'professor' }) {
  const router = useRouter();
  const s = useCasoWizardStore();
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // Reseta o store sempre que o componente é montado em uma sessão nova
  // de criação. Evita carregar dados antigos quando o usuário volta.
  useEffect(() => {
    s.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = useMutation({
    mutationFn: async () => {
      const state = useCasoWizardStore.getState();
      const payload = {
        titulo: state.titulo.trim(),
        area: state.area,
        dificuldade: state.dificuldade,
        tipoPaciente: state.tipoPaciente,
        focoClinico: state.focoClinico,
        identificacao: {
          nome: state.identificacao.nome,
          idade: state.identificacao.idade,
          sexo: state.identificacao.sexo,
          profissao: state.identificacao.profissao,
          estadoCivil: state.identificacao.estadoCivil,
          escolaridade: state.identificacao.escolaridade,
          cidade: state.identificacao.cidade,
        },
        queixaPrincipal: state.queixaPrincipal,
        historiaDoencaAtual: state.historiaDoencaAtual,
        historicoPatologico: state.historicoPatologico,
        exameFisico: { ...state.exameFisico },
        examesComplementares: state.examesComplementares.filter(
          (e) => e.tipo.trim() || e.resultado.trim(),
        ),
        respostaEsperada: state.respostaEsperada,
        criteriosAvaliacao: state.criteriosAvaliacao.map((c) => ({
          descricao: c.descricao,
          peso: Number(c.peso),
        })),
        xpRecompensa: state.xpRecompensa ?? undefined,
        status: state.publicar ? 'PUBLICADO' : 'RASCUNHO',
      };

      const { data } = await api.post('/api/casos', payload);
      // Se professor escolheu uma turma, publica também (CasoTurma)
      if (modo === 'professor' && state.turmaIdAlvo && data?.id) {
        try {
          const ct = await api.post(`/api/turmas/${state.turmaIdAlvo}/casos`, {
            casoId: data.id,
            titulo: state.titulo,
          });
          // Se o professor escolheu "Publicar imediatamente", também publica o CasoTurma
          if (state.publicar && ct.data?.id) {
            await api.put(`/api/turmas/${state.turmaIdAlvo}/casos/${ct.data.id}/publicar`);
          }
        } catch (e) {
          // Não falha o fluxo — o caso já foi criado. Apenas registra.
          // eslint-disable-next-line no-console
          console.warn('Caso criado, mas falhou ao vincular à turma:', e);
        }
      }
      return data;
    },
    onSuccess: () => {
      setSucesso(true);
      setTimeout(() => {
        useCasoWizardStore.getState().reset();
        router.push(modo === 'admin' ? '/admin/gerenciar-casos' : '/professor/turmas');
      }, 1200);
    },
    onError: (e: unknown) => {
      const apiMsg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErro(apiMsg ?? 'Não foi possível salvar o caso. Verifique os dados e tente novamente.');
    },
  });

  const validarEtapaAtual = (): string | null => {
    if (s.step === 0) return configuracaoValida(s);
    if (s.step === 1) return pacienteValido(s);
    if (s.step === 2) return exameValido(s);
    if (s.step === 3) return gabaritoValido(s);
    return null;
  };

  const proxima = () => {
    const msg = validarEtapaAtual();
    if (msg) {
      setErro(msg);
      return;
    }
    setErro('');
    s.setStep(s.step + 1);
  };

  const voltar = () => {
    setErro('');
    s.setStep(s.step - 1);
  };

  const onSalvar = () => {
    // Re-valida todas as etapas críticas antes de gravar.
    const validacoes = [configuracaoValida, pacienteValido, gabaritoValido];
    for (const fn of validacoes) {
      const msg = fn(s);
      if (msg) {
        setErro(msg);
        return;
      }
    }
    setErro('');
    salvar.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl"
    >
      <h1 className="text-2xl font-bold mb-2">Criar caso clínico</h1>
      <p className="text-neutral-600 mb-8">
        Fluxo guiado em cinco etapas para cadastrar um caso completo.
      </p>

      <Stepper step={s.step} onJump={(i) => s.setStep(i)} />

      <AnimatePresence mode="wait">
        <motion.div
          key={s.step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {s.step === 0 && <EtapaConfiguracao />}
          {s.step === 1 && <EtapaPaciente />}
          {s.step === 2 && <EtapaExame />}
          {s.step === 3 && <EtapaGabarito />}
          {s.step === 4 && <EtapaRevisao modo={modo} />}
        </motion.div>
      </AnimatePresence>

      {erro && (
        <p className="text-sm text-destructive font-bold mt-6" role="alert">
          {erro}
        </p>
      )}

      <AnimatePresence>
        {sucesso && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-6 border border-green text-green rounded p-4 flex items-center gap-2 text-sm font-bold"
          >
            <Check className="h-5 w-5" /> Caso salvo com sucesso. Redirecionando...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between gap-3">
        {s.step > 0 ? (
          <Button type="button" variant="outline" onClick={voltar} disabled={salvar.isPending}>
            Voltar
          </Button>
        ) : (
          <span />
        )}

        {s.step < PASSOS.length - 1 ? (
          <Button type="button" onClick={proxima}>
            Próxima etapa
          </Button>
        ) : (
          <Button type="button" onClick={onSalvar} disabled={salvar.isPending || sucesso}>
            {salvar.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar caso'
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
