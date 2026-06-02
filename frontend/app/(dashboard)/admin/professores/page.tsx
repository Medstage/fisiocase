'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X, UserMinus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-input';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';

interface Professor {
  id: string;
  nome: string;
  email: string;
  instituicao: string | null;
  createdAt: string;
  totalTurmas: number;
  totalAlunos: number;
}

interface UsuarioBusca {
  id: string;
  nome: string;
  email: string;
  role: 'USER' | 'PROFESSOR' | 'ADMIN';
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminProfessoresPage() {
  const qc = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [modoModal, setModoModal] = useState<'promover' | 'criar'>('promover');
  const [revogarAlvo, setRevogarAlvo] = useState<Professor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-professores'],
    queryFn: async () => (await api.get('/api/admin/professores')).data as { professores: Professor[] },
  });

  const revogar = useMutation({
    mutationFn: async (id: string) => (await api.put(`/api/admin/professores/${id}/revogar`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-professores'] });
      setRevogarAlvo(null);
    },
  });

  const professores = data?.professores ?? [];

  return (
    <AdminGuard>
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gerenciar professores</h1>
        <Button onClick={() => { setModoModal('promover'); setModalAberto(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar professor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : professores.length === 0 ? (
        <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
          Nenhum professor cadastrado ainda.
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_180px_120px_120px_120px_100px] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-neutral-600 font-bold">
            <span>Nome / Email</span>
            <span>Instituição</span>
            <span className="text-center">Turmas</span>
            <span className="text-center">Alunos</span>
            <span>Criado em</span>
            <span></span>
          </div>
          <div className="divide-y divide-neutral-200">
            <AnimatePresence>
              {professores.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-[1fr_180px_120px_120px_120px_100px] gap-2 items-center px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{p.nome}</p>
                    <p className="text-xs text-neutral-600 truncate">{p.email}</p>
                  </div>
                  <span className="truncate text-xs">{p.instituicao ?? '—'}</span>
                  <span className="text-center font-bold">{p.totalTurmas}</span>
                  <span className="text-center">{p.totalAlunos}</span>
                  <span className="text-xs text-neutral-600">{formatarData(p.createdAt)}</span>
                  <button
                    onClick={() => setRevogarAlvo(p)}
                    className="inline-flex items-center gap-1 border border-destructive text-destructive px-2 h-8 rounded text-xs font-bold hover:bg-destructive hover:text-background transition-colors"
                  >
                    <UserMinus className="h-3 w-3" /> Revogar
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {modalAberto && (
        <AdicionarModal
          modo={modoModal}
          setModo={setModoModal}
          onClose={() => setModalAberto(false)}
          onSucesso={() => {
            qc.invalidateQueries({ queryKey: ['admin-professores'] });
            setModalAberto(false);
          }}
        />
      )}

      {revogarAlvo && (
        <div
          onClick={() => setRevogarAlvo(null)}
          className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold mb-2">Revogar acesso de professor</h3>
            <p className="text-sm text-neutral-600 mb-4">
              <strong>{revogarAlvo.nome}</strong> voltará a ser usuário comum. As turmas e respostas serão preservadas.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRevogarAlvo(null)} disabled={revogar.isPending}>
                Cancelar
              </Button>
              <Button onClick={() => revogar.mutate(revogarAlvo.id)} disabled={revogar.isPending} className="gap-2">
                {revogar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                Revogar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminGuard>
  );
}

function AdicionarModal({
  modo,
  setModo,
  onClose,
  onSucesso,
}: {
  modo: 'promover' | 'criar';
  setModo: (m: 'promover' | 'criar') => void;
  onClose: () => void;
  onSucesso: () => void;
}) {
  const [emailBusca, setEmailBusca] = useState('');
  const [selecionado, setSelecionado] = useState<UsuarioBusca | null>(null);
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', instituicao: '' });
  const [erro, setErro] = useState('');

  const buscaQ = useQuery({
    queryKey: ['admin-buscar-usuarios', emailBusca],
    queryFn: async () =>
      (await api.get(`/api/admin/usuarios/buscar?email=${encodeURIComponent(emailBusca)}`)).data as {
        usuarios: UsuarioBusca[];
      },
    enabled: modo === 'promover' && emailBusca.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (modo === 'promover') {
        if (!selecionado) throw new Error('Selecione um usuário.');
        return (await api.post('/api/admin/professores', { userId: selecionado.id })).data;
      }
      return (await api.post('/api/admin/professores', novo)).data;
    },
    onSuccess: () => onSucesso(),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Não foi possível.';
      setErro(msg);
    },
  });

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4">
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded p-6 max-w-md w-full"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold">Adicionar professor</h3>
          <button onClick={onClose} className="p-1 border border-border rounded hover:bg-foreground hover:text-background">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 border border-border rounded p-1">
          <button
            type="button"
            onClick={() => setModo('promover')}
            className={`flex-1 px-3 h-9 text-xs font-bold uppercase rounded ${modo === 'promover' ? 'bg-foreground text-background' : ''}`}
          >
            Promover existente
          </button>
          <button
            type="button"
            onClick={() => setModo('criar')}
            className={`flex-1 px-3 h-9 text-xs font-bold uppercase rounded ${modo === 'criar' ? 'bg-foreground text-background' : ''}`}
          >
            Criar novo
          </button>
        </div>

        {modo === 'promover' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border border-border rounded px-3 h-10">
              <Search className="h-4 w-4 text-neutral-600" />
              <input
                value={emailBusca}
                onChange={(e) => { setEmailBusca(e.target.value); setSelecionado(null); }}
                placeholder="Buscar por email..."
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
            {emailBusca.length >= 2 && (
              <div className="border border-border rounded max-h-48 overflow-y-auto">
                {buscaQ.isLoading ? (
                  <p className="p-3 text-sm text-neutral-500">Buscando...</p>
                ) : (buscaQ.data?.usuarios ?? []).length === 0 ? (
                  <p className="p-3 text-sm text-neutral-500">Nenhum usuário encontrado.</p>
                ) : (
                  (buscaQ.data?.usuarios ?? []).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelecionado(u)}
                      className={`block w-full text-left px-3 py-2 border-b border-neutral-200 hover:bg-neutral-100 ${selecionado?.id === u.id ? 'bg-neutral-100' : ''}`}
                    >
                      <p className="font-bold text-sm">{u.nome}</p>
                      <p className="text-xs text-neutral-600">{u.email} · {u.role}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <FloatingInput id="prof-nome" label="Nome completo" required value={novo.nome} onChange={(e) => setNovo((v) => ({ ...v, nome: e.target.value }))} />
            <FloatingInput id="prof-email" type="email" label="Email" required value={novo.email} onChange={(e) => setNovo((v) => ({ ...v, email: e.target.value }))} />
            <FloatingInput id="prof-senha" type="text" label="Senha temporária" required value={novo.senha} onChange={(e) => setNovo((v) => ({ ...v, senha: e.target.value }))} />
            <FloatingInput id="prof-inst" label="Instituição" value={novo.instituicao} onChange={(e) => setNovo((v) => ({ ...v, instituicao: e.target.value }))} />
          </div>
        )}

        {erro && <p className="text-sm text-destructive font-bold mt-3">{erro}</p>}

        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1"
            onClick={() => { setErro(''); mutation.mutate(); }}
            disabled={mutation.isPending || (modo === 'promover' && !selecionado) || (modo === 'criar' && (!novo.nome || !novo.email || !novo.senha))}
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : modo === 'promover' ? 'Promover' : 'Criar'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
