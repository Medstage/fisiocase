'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X, Copy, Check, Search, UserMinus, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingInput } from '@/components/ui/floating-input';
import { ProfessorGuard } from '@/components/professor/ProfessorGuard';
import {
  type CasoTurma,
  type MembroTurma,
  type RespostaTurma,
  type StatusCasoTurma,
  tempoRelativo,
  statusCasoLabel,
} from '@/components/professor/utils';
import type { Caso } from '@/types';

type Tab = 'casos' | 'alunos' | 'pendentes';

interface TurmaDetalhe {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  professor?: { id: string; nome: string };
}
interface CasosResp { casos: CasoTurma[] }
interface MembrosResp { membros: MembroTurma[] }
interface RespostasResp { respostas: RespostaTurma[] }
interface CasosPlataformaResp { casos: Caso[]; total: number }

function StatusBadge({ status }: { status: StatusCasoTurma }) {
  const variant = status === 'PUBLICADO' ? 'green' : status === 'ENCERRADO' ? 'solid' : 'outline';
  return <Badge variant={variant}>{statusCasoLabel(status)}</Badge>;
}

export default function TurmaDetalhePage() {
  const params = useParams<{ id: string }>();
  const turmaId = params.id;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('casos');

  const turmaQ = useQuery({
    queryKey: ['prof-turma', turmaId],
    queryFn: async () => (await api.get(`/api/turmas/${turmaId}`)).data as TurmaDetalhe,
  });
  const casosQ = useQuery({
    queryKey: ['prof-turma-casos', turmaId],
    queryFn: async () => (await api.get(`/api/turmas/${turmaId}/casos`)).data as CasosResp,
  });
  const membrosQ = useQuery({
    queryKey: ['prof-turma-membros', turmaId],
    queryFn: async () => (await api.get(`/api/turmas/${turmaId}/membros`)).data as MembrosResp,
    enabled: tab === 'alunos',
  });

  const casos = casosQ.data?.casos ?? [];
  const casosPublicados = casos.filter((c) => c.status !== 'RASCUNHO');

  // Pendentes: buscar respostas dos casos PUBLICADOS/ENCERRADOS e filtrar PENDENTE.
  const respostasQ = useQueries({
    queries: casosPublicados.map((c) => ({
      queryKey: ['prof-turma-resp', turmaId, c.id],
      queryFn: async () => {
        const data = (await api.get(`/api/turmas/${turmaId}/casos/${c.id}/respostas`)).data as RespostasResp;
        return { casoTurma: c, respostas: data.respostas };
      },
      enabled: tab === 'pendentes',
    })),
  });
  const respostasPendentes = useMemo(() => {
    const out: Array<Omit<RespostaTurma, 'casoTurma'> & { casoTurma: CasoTurma }> = [];
    for (const q of respostasQ) {
      if (!q.data) continue;
      for (const r of q.data.respostas) {
        if (r.status === 'PENDENTE') out.push({ ...r, casoTurma: q.data.casoTurma });
      }
    }
    return out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [respostasQ]);

  // Mutations: publicar, encerrar.
  const publicar = useMutation({
    mutationFn: async (casoTurmaId: string) =>
      (await api.put(`/api/turmas/${turmaId}/casos/${casoTurmaId}/publicar`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prof-turma-casos', turmaId] }),
  });
  const encerrar = useMutation({
    mutationFn: async (casoTurmaId: string) =>
      (await api.put(`/api/turmas/${turmaId}/casos/${casoTurmaId}/encerrar`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prof-turma-casos', turmaId] }),
  });
  const reabrir = useMutation({
    mutationFn: async (casoTurmaId: string) =>
      (await api.put(`/api/turmas/${turmaId}/casos/${casoTurmaId}/reabrir`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prof-turma-casos', turmaId] }),
  });
  const grupos = useMemo(() => {
    const ativos: typeof casos = [];
    const encerrados: typeof casos = [];
    const rascunhos: typeof casos = [];
    for (const c of casos) {
      if (c.status === 'PUBLICADO') ativos.push(c);
      else if (c.status === 'ENCERRADO') encerrados.push(c);
      else rascunhos.push(c);
    }
    return { ativos, encerrados, rascunhos };
  }, [casos]);

  // Modal novo caso.
  const [novoCasoAberto, setNovoCasoAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [casoSelecionadoId, setCasoSelecionadoId] = useState<string | null>(null);
  const [tituloOverride, setTituloOverride] = useState('');
  const [prazo, setPrazo] = useState('');
  const [erroNovo, setErroNovo] = useState('');

  const casosPlataformaQ = useQuery({
    queryKey: ['prof-casos-plataforma', busca],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'PUBLICADO', limit: '50' });
      return (await api.get(`/api/casos?${params}`)).data as CasosPlataformaResp;
    },
    enabled: novoCasoAberto,
  });
  const casosPlataforma = (casosPlataformaQ.data?.casos ?? []).filter((c) =>
    busca.trim() ? c.titulo.toLowerCase().includes(busca.trim().toLowerCase()) : true,
  );

  const [removerAlvo, setRemoverAlvo] = useState<MembroTurma | null>(null);
  const removerMembroMut = useMutation({
    mutationFn: async (userId: string) =>
      (await api.delete(`/api/turmas/${turmaId}/membros/${userId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prof-turma-membros', turmaId] });
      setRemoverAlvo(null);
    },
  });

  const adicionarCaso = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { casoId: casoSelecionadoId };
      if (tituloOverride.trim()) payload.titulo = tituloOverride.trim();
      if (prazo) payload.prazo = new Date(prazo).toISOString();
      return (await api.post(`/api/turmas/${turmaId}/casos`, payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prof-turma-casos', turmaId] });
      setNovoCasoAberto(false);
      setCasoSelecionadoId(null);
      setTituloOverride('');
      setPrazo('');
      setBusca('');
    },
    onError: () => setErroNovo('Não foi possível adicionar o caso. Tente novamente.'),
  });

  const turma = turmaQ.data;
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const copiarCodigo = () => {
    if (!turma?.codigo) return;
    navigator.clipboard.writeText(turma.codigo);
    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 1500);
  };

  const Aba = ({ id, label, count }: { id: Tab; label: string; count?: number }) => (
    <button
      onClick={() => setTab(id)}
      className={cn(
        'px-1 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2',
        tab === id ? 'border-green text-foreground' : 'border-transparent text-neutral-500 hover:text-foreground',
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="inline-flex items-center justify-center text-[10px] font-bold h-4 min-w-4 px-1 rounded bg-foreground text-background">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <ProfessorGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="mb-4">
          <Link href="/professor/turmas">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Minhas turmas
            </Button>
          </Link>
        </div>

        {turmaQ.isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando turma...
          </div>
        ) : !turma ? (
          <p className="text-sm text-neutral-500">Turma não encontrada.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">{turma.nome}</h1>
                {turma.descricao && <p className="text-neutral-600">{turma.descricao}</p>}
              </div>
              <button
                type="button"
                onClick={copiarCodigo}
                title="Clique para copiar"
                className="inline-flex items-center gap-2 rounded bg-foreground text-background font-bold tracking-widest text-sm px-3 py-2"
              >
                Código: {turma.codigo}
                {codigoCopiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex gap-6 border-b border-border mb-6 overflow-x-auto">
              <Aba id="casos" label="Casos" count={casos.length} />
              <Aba id="alunos" label="Alunos" count={turma ? membrosQ.data?.membros.length : undefined} />
              <Aba id="pendentes" label="Correções pendentes" count={respostasPendentes.length} />
            </div>

            {/* ABA: CASOS */}
            {tab === 'casos' && (
              <div>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => { setErroNovo(''); setNovoCasoAberto(true); }}>
                    <Plus className="h-4 w-4" /> Novo caso
                  </Button>
                </div>
                {casosQ.isLoading ? (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando casos...
                  </div>
                ) : casos.length === 0 ? (
                  <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
                    Nenhum caso ainda. Clique em &quot;Novo caso&quot; para adicionar.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {grupos.ativos.length > 0 && (
                      <SecaoCasos
                        titulo="Casos ativos"
                        casos={grupos.ativos}
                        renderAcoes={(c) => (
                          <>
                            <Button variant="outline" size="sm" disabled={encerrar.isPending} onClick={() => encerrar.mutate(c.id)}>
                              Encerrar
                            </Button>
                            <Link href={`/professor/turmas/${turmaId}/casos/${c.id}`}>
                              <Button size="sm">Ver respostas</Button>
                            </Link>
                          </>
                        )}
                      />
                    )}
                    {grupos.encerrados.length > 0 && (
                      <SecaoCasos
                        titulo="Casos encerrados"
                        casos={grupos.encerrados}
                        opaco
                        renderAcoes={(c) => (
                          <>
                            <Button variant="outline" size="sm" disabled={reabrir.isPending} onClick={() => reabrir.mutate(c.id)}>
                              Reabrir caso
                            </Button>
                            <Link href={`/professor/turmas/${turmaId}/casos/${c.id}`}>
                              <Button size="sm">Ver respostas</Button>
                            </Link>
                          </>
                        )}
                      />
                    )}
                    {grupos.rascunhos.length > 0 && (
                      <SecaoCasos
                        titulo="Rascunhos"
                        casos={grupos.rascunhos}
                        renderAcoes={(c) => (
                          <Button variant="green" size="sm" disabled={publicar.isPending} onClick={() => publicar.mutate(c.id)}>
                            Publicar
                          </Button>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ABA: ALUNOS */}
            {tab === 'alunos' && (
              <div>
                {membrosQ.isLoading ? (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando alunos...
                  </div>
                ) : !membrosQ.data?.membros.length ? (
                  <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
                    Ainda não há alunos nesta turma.
                  </div>
                ) : (
                  <div className="border border-border rounded bg-card overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-neutral-600">
                          <th className="p-4 font-bold">Aluno</th>
                          <th className="p-4 font-bold">Casos resolvidos</th>
                          <th className="p-4 font-bold">Média de notas</th>
                          <th className="p-4 font-bold">Última atividade</th>
                          <th className="p-4 font-bold"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {membrosQ.data.membros.map((m) => (
                          <tr key={m.id}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                                  {m.nome.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold">{m.nome}</span>
                              </div>
                            </td>
                            <td className="p-4 tabular-nums">{m.casosResolvidos}</td>
                            <td className="p-4 tabular-nums">
                              {m.casosResolvidos > 0 ? m.mediaNotas.toFixed(1) : '—'}
                            </td>
                            <td className="p-4 text-neutral-600">
                              {m.ultimaAtividade ? tempoRelativo(m.ultimaAtividade) : '—'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setRemoverAlvo(m)}
                                aria-label="Remover aluno"
                                className="inline-flex items-center gap-1 border border-destructive text-destructive px-2 h-8 rounded text-xs font-bold hover:bg-destructive hover:text-background transition-colors"
                              >
                                <UserMinus className="h-3 w-3" /> Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ABA: PENDENTES */}
            {tab === 'pendentes' && (
              <div>
                {respostasQ.some((q) => q.isLoading) ? (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando respostas...
                  </div>
                ) : respostasPendentes.length === 0 ? (
                  <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
                    Sem correções pendentes.
                  </div>
                ) : (
                  <div className="border border-border rounded bg-card divide-y divide-neutral-200">
                    {respostasPendentes.map((r) => (
                      <div key={r.id} className="p-4 flex items-center gap-4">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                          {r.aluno.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{r.aluno.nome}</p>
                          <p className="text-xs text-neutral-600 truncate">{r.casoTurma.titulo}</p>
                        </div>
                        <span className="hidden sm:inline text-xs text-neutral-600 shrink-0">
                          {tempoRelativo(r.createdAt)}
                        </span>
                        <Link href={`/professor/turmas/${turmaId}/casos/${r.casoTurma.id}/corrigir/${r.id}`}>
                          <Button size="sm">Corrigir</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal novo caso */}
        <AnimatePresence>
          {novoCasoAberto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
              onClick={() => setNovoCasoAberto(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Adicionar caso à turma</h2>
                  <button onClick={() => setNovoCasoAberto(false)} aria-label="Fechar">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-neutral-600 mb-4">
                  Escolha um caso já publicado na plataforma. Ele será criado como rascunho na turma.
                </p>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar caso por título..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full border border-border rounded h-11 pl-10 pr-4 text-sm outline-none focus:border-brand transition-colors"
                  />
                </div>

                <div className="border border-border rounded mb-4 max-h-60 overflow-y-auto divide-y divide-neutral-200">
                  {casosPlataformaQ.isLoading ? (
                    <div className="p-4 text-sm text-neutral-600 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando casos...
                    </div>
                  ) : casosPlataforma.length === 0 ? (
                    <p className="p-4 text-sm text-neutral-500">Nenhum caso encontrado.</p>
                  ) : (
                    casosPlataforma.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCasoSelecionadoId(c.id)}
                        className={cn(
                          'w-full text-left p-3 transition-colors hover:bg-neutral-100',
                          casoSelecionadoId === c.id && 'bg-foreground text-background hover:bg-foreground',
                        )}
                      >
                        <p className="font-bold text-sm">{c.titulo}</p>
                        <p className={cn('text-xs', casoSelecionadoId === c.id ? 'text-background/70' : 'text-neutral-600')}>
                          {c.area} · {c.dificuldade}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <FloatingInput
                    id="titulo-override"
                    label="Título (opcional — sobrescreve o original)"
                    value={tituloOverride}
                    onChange={(e) => setTituloOverride(e.target.value)}
                  />
                  <div>
                    <label htmlFor="prazo" className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                      Prazo (opcional)
                    </label>
                    <input
                      id="prazo"
                      type="datetime-local"
                      value={prazo}
                      onChange={(e) => setPrazo(e.target.value)}
                      className="w-full border border-border rounded h-11 px-4 text-sm outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>

                {erroNovo && <p className="text-sm text-destructive font-bold mb-3">{erroNovo}</p>}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setNovoCasoAberto(false)}>Cancelar</Button>
                  <Button
                    size="sm"
                    disabled={!casoSelecionadoId || adicionarCaso.isPending}
                    onClick={() => { setErroNovo(''); adicionarCaso.mutate(); }}
                  >
                    {adicionarCaso.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Adicionando...</>
                    ) : (
                      'Adicionar caso'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: confirmar remoção de aluno */}
        <AnimatePresence>
          {removerAlvo && (
            <motion.div
              key="rem-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRemoverAlvo(null)}
              className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-bold mb-2">Remover aluno</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Remover <strong>{removerAlvo.nome}</strong> da turma? O histórico de respostas será preservado.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setRemoverAlvo(null)} disabled={removerMembroMut.isPending}>
                    Cancelar
                  </Button>
                  <Button onClick={() => removerMembroMut.mutate(removerAlvo.id)} disabled={removerMembroMut.isPending} className="gap-2">
                    {removerMembroMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                    Confirmar remoção
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

function SecaoCasos({
  titulo,
  casos,
  renderAcoes,
  opaco,
}: {
  titulo: string;
  casos: CasoTurma[];
  renderAcoes: (c: CasoTurma) => React.ReactNode;
  opaco?: boolean;
}) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-widest text-neutral-600 font-bold mb-3 pb-2 border-b border-border">
        {titulo} · {casos.length}
      </h3>
      <div className={cn('border border-border rounded bg-card divide-y divide-neutral-200', opaco && 'opacity-70')}>
        {casos.map((c) => (
          <div key={c.id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{c.titulo}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600 flex-wrap">
                <StatusBadge status={c.status} />
                {c._count && c._count.respostas > 0 && (
                  <span>{c._count.respostas} resposta{c._count.respostas === 1 ? '' : 's'}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">{renderAcoes(c)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
