'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Users, FileText, Copy, Check, X, Trash2, Archive, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import type { TurmaProfessor } from '@/components/professor/utils';

interface TurmasResp {
  origem: 'professor' | 'aluno';
  turmas: TurmaProfessor[];
}

function CodigoBadge({ codigo, large = false }: { codigo: string; large?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copiar}
      title="Clique para copiar"
      className={`inline-flex items-center gap-2 rounded bg-foreground text-background font-bold tracking-widest ${
        large ? 'text-2xl px-6 py-3' : 'text-sm px-3 py-1.5'
      }`}
    >
      {codigo}
      {copiado ? <Check className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} /> : <Copy className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} />}
    </button>
  );
}

export default function ProfessorTurmasPage() {
  const qc = useQueryClient();
  const [criarAberto, setCriarAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [turmaCriada, setTurmaCriada] = useState<TurmaProfessor | null>(null);

  const [excluirAlvo, setExcluirAlvo] = useState<TurmaProfessor | null>(null);
  const [confirmacaoNome, setConfirmacaoNome] = useState('');
  const [arquivadasAbertas, setArquivadasAbertas] = useState(false);

  const turmasQ = useQuery({
    queryKey: ['prof-turmas'],
    queryFn: async () => (await api.get('/api/turmas/minhas')).data as TurmasResp,
  });

  const arquivadasQ = useQuery({
    queryKey: ['prof-turmas-arquivadas'],
    queryFn: async () => (await api.get('/api/turmas/minhas?arquivadas=true')).data as TurmasResp,
    enabled: arquivadasAbertas,
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/turmas/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prof-turmas'] });
      qc.invalidateQueries({ queryKey: ['prof-turmas-arquivadas'] });
      setExcluirAlvo(null);
      setConfirmacaoNome('');
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      return (await api.post('/api/turmas', { nome, descricao })).data as TurmaProfessor;
    },
    onSuccess: (turma) => {
      setTurmaCriada(turma);
      setCriarAberto(false);
      setNome('');
      setDescricao('');
      qc.invalidateQueries({ queryKey: ['prof-turmas'] });
    },
    onError: () => setErro('Não foi possível criar a turma. Tente novamente.'),
  });

  const turmas = turmasQ.data?.turmas ?? [];

  return (
    <ProfessorGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">Minhas turmas</h1>
            <p className="text-neutral-600">Gerencie suas turmas e compartilhe o código de acesso.</p>
          </div>
          <Button onClick={() => { setErro(''); setCriarAberto(true); }}>
            <Plus className="h-4 w-4" /> Nova turma
          </Button>
        </div>

        {turmasQ.isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando turmas...
          </div>
        ) : turmas.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-10 text-center">
            <p className="text-sm text-neutral-500 mb-4">Você ainda não criou nenhuma turma.</p>
            <Button onClick={() => setCriarAberto(true)}>
              <Plus className="h-4 w-4" /> Criar primeira turma
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map((t) => (
              <motion.div
                key={t.id}
                whileHover={{ borderColor: '#0F4D0F', y: -2 }}
                transition={{ duration: 0.2 }}
                className="border border-border rounded p-5 bg-card flex flex-col"
              >
                <h3 className="text-lg font-bold mb-1">{t.nome}</h3>
                {t.descricao && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{t.descricao}</p>
                )}
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">Código de acesso</p>
                  <CodigoBadge codigo={t.codigo} />
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-600 mb-4">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {t._count?.membros ?? 0} alunos
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {t._count?.casos ?? 0} casos
                  </span>
                </div>
                <div className="mt-auto flex gap-2">
                  <Link href={`/professor/turmas/${t.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Ver turma</Button>
                  </Link>
                  <button
                    onClick={() => { setExcluirAlvo(t); setConfirmacaoNome(''); }}
                    aria-label="Excluir turma"
                    className="inline-flex items-center justify-center border border-destructive text-destructive h-9 w-9 rounded hover:bg-destructive hover:text-background transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Seção arquivadas */}
        <div className="mt-10 border-t border-border pt-6">
          <button
            onClick={() => setArquivadasAbertas((v) => !v)}
            className="w-full flex items-center justify-between text-left py-2"
          >
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-600">
              <Archive className="h-4 w-4" /> Turmas arquivadas
            </span>
            <ChevronDown className={`h-5 w-5 transition-transform ${arquivadasAbertas ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {arquivadasAbertas && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  {arquivadasQ.isLoading ? (
                    <div className="flex items-center gap-2 text-neutral-600 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando arquivadas...
                    </div>
                  ) : (arquivadasQ.data?.turmas ?? []).length === 0 ? (
                    <p className="text-sm text-neutral-500">Nenhuma turma arquivada.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                      {(arquivadasQ.data?.turmas ?? []).map((t) => (
                        <div key={t.id} className="border border-border rounded p-5 bg-neutral-50 flex flex-col">
                          <span className="inline-block border border-border rounded px-2 py-0.5 text-[10px] font-bold uppercase mb-2 w-max">Arquivada</span>
                          <h3 className="text-lg font-bold mb-1">{t.nome}</h3>
                          {t.descricao && <p className="text-sm text-neutral-600 line-clamp-2">{t.descricao}</p>}
                          <p className="text-xs text-neutral-500 mt-2">Código: {t.codigo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal: criar */}
        <AnimatePresence>
          {criarAberto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
              onClick={() => setCriarAberto(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded w-full max-w-md p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Nova turma</h2>
                  <button onClick={() => setCriarAberto(false)} aria-label="Fechar">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <FloatingInput
                    id="nova-turma-nome"
                    label="Nome da turma"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <FloatingInput
                    id="nova-turma-desc"
                    label="Descrição (opcional)"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>
                {erro && <p className="text-sm text-destructive font-bold mb-3">{erro}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setCriarAberto(false)}>Cancelar</Button>
                  <Button
                    size="sm"
                    disabled={nome.trim().length < 2 || criar.isPending}
                    onClick={() => { setErro(''); criar.mutate(); }}
                  >
                    {criar.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
                    ) : (
                      'Criar'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: turma criada com sucesso */}
        <AnimatePresence>
          {turmaCriada && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
              onClick={() => setTurmaCriada(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded w-full max-w-md p-6 text-center"
              >
                <Check className="h-10 w-10 mx-auto text-green mb-2" />
                <h2 className="text-lg font-bold mb-1">Turma criada</h2>
                <p className="text-sm text-neutral-600 mb-6">
                  Compartilhe o código abaixo com seus alunos para que eles entrem na turma.
                </p>
                <div className="mb-6 flex justify-center">
                  <CodigoBadge codigo={turmaCriada.codigo} large />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setTurmaCriada(null)}>Fechar</Button>
                  <Link href={`/professor/turmas/${turmaCriada.id}`}>
                    <Button size="sm">Abrir turma</Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: confirmar exclusão de turma */}
        <AnimatePresence>
          {excluirAlvo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setExcluirAlvo(null); setConfirmacaoNome(''); }}
              className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-bold mb-2">Excluir turma</h3>
                <div className="bg-yellow-50 border border-yellow-500 rounded p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-bold">
                    Esta ação não pode ser desfeita. Todos os dados da turma serão arquivados.
                  </p>
                </div>
                <p className="text-sm text-neutral-600 mb-3">
                  Digite o nome da turma <strong>&quot;{excluirAlvo.nome}&quot;</strong> para confirmar:
                </p>
                <FloatingInput
                  id="confirm-nome"
                  label="Nome da turma"
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                />
                <div className="flex gap-3 justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => { setExcluirAlvo(null); setConfirmacaoNome(''); }}
                    disabled={excluir.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => excluir.mutate(excluirAlvo.id)}
                    disabled={excluir.isPending || confirmacaoNome.trim() !== excluirAlvo.nome.trim()}
                    className="gap-2"
                  >
                    {excluir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Excluir permanentemente
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ProfessorGuard>
  );
}
