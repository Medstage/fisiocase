'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Users, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingInput } from '@/components/ui/floating-input';

interface TurmaListaItem {
  id: string;
  nome: string;
  descricao?: string | null;
  codigo: string;
  professor: { id?: string; nome: string; avatarUrl?: string | null };
  _count: { membros: number; casos: number };
}

interface TurmasResp {
  origem: 'aluno' | 'professor';
  turmas: TurmaListaItem[];
}

interface EntrarResp {
  message: string;
  turma: TurmaListaItem;
}

function inicial(nome?: string) {
  return (nome ?? '?').trim().charAt(0).toUpperCase() || '?';
}

export default function TurmasPage() {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Mostra mensagem vinda de outra tela (ex: após sair de uma turma).
  useEffect(() => {
    try {
      const flash = sessionStorage.getItem('fc_turmas_flash');
      if (flash) {
        setAviso(flash);
        sessionStorage.removeItem('fc_turmas_flash');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['turmas-minhas'],
    queryFn: async () => (await api.get('/api/turmas/minhas')).data as TurmasResp,
  });

  const entrar = useMutation({
    mutationFn: async () =>
      (await api.post('/api/turmas/entrar', { codigo: codigo.trim().toUpperCase() })).data as EntrarResp,
    onSuccess: (resp) => {
      setErro(null);
      setAviso(resp.message || 'Você entrou na turma!');
      setCodigo('');
      qc.invalidateQueries({ queryKey: ['turmas-minhas'] });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { error?: string } } } | null)?.response?.data?.error ??
        'Não conseguimos entrar na turma. Confira o código.';
      setErro(msg);
      setAviso(null);
    },
  });

  const turmas = data?.turmas ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <header className="mb-8 border-b border-black pb-4">
        <p className="text-xs uppercase tracking-widest text-neutral-600">Aprendizado em grupo</p>
        <h1 className="text-2xl font-bold">Minhas turmas</h1>
      </header>

      {/* Mensagens */}
      {aviso && (
        <div className="mb-6 border border-green border-l-4 rounded p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green shrink-0 mt-0.5" />
          <p className="text-sm">{aviso}</p>
        </div>
      )}

      {/* Entrar em uma turma */}
      <section className="mb-10 border border-black rounded p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-1">Entrar em uma turma</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Cole o código de 6 caracteres compartilhado pelo seu professor.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.trim().length !== 6) {
              setErro('O código deve ter 6 caracteres.');
              setAviso(null);
              return;
            }
            entrar.mutate();
          }}
        >
          <div className="flex-1">
            <FloatingInput
              id="codigo-turma"
              label="Código (6 caracteres)"
              value={codigo}
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              className="uppercase tracking-widest font-bold"
            />
          </div>
          <Button type="submit" disabled={entrar.isPending || codigo.trim().length !== 6}>
            {entrar.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
        {erro && <p className="text-sm text-destructive font-bold mt-3">{erro}</p>}
      </section>

      {/* Lista de turmas */}
      <section>
        <h2 className="text-lg font-bold mb-4">Turmas em que você participa</h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando turmas...
          </div>
        ) : turmas.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 border border-black rounded-full flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto">
              Você não está em nenhuma turma. Peça o código ao seu professor para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map((t) => (
              <motion.div
                key={t.id}
                whileHover={{ borderColor: '#0F4D0F', y: -2 }}
                transition={{ duration: 0.2 }}
                className="border border-black rounded p-6 bg-white flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                    {inicial(t.professor?.nome)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold truncate">{t.nome}</h3>
                    <p className="text-xs text-neutral-600 truncate">
                      Prof. {t.professor?.nome ?? '—'}
                    </p>
                  </div>
                </div>

                {t.descricao && (
                  <p className="text-sm text-neutral-700 leading-relaxed line-clamp-3">
                    {t.descricao}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge>
                    <BookOpen className="h-3 w-3 mr-1" /> {t._count?.casos ?? 0} casos
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" /> {t._count?.membros ?? 0} alunos
                  </Badge>
                </div>

                <Link
                  href={`/turmas/${t.id}`}
                  className="inline-flex items-center justify-between gap-2 mt-2 border-t border-black pt-4 text-sm font-bold uppercase tracking-wider hover:text-green transition-colors"
                >
                  Ver turma <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
