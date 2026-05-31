'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { AdminGuard } from '@/components/admin/AdminGuard';
import type { Usuario } from '@/types';

interface UsuarioAdmin extends Usuario {
  bloqueado: boolean;
}

interface UsuariosResp {
  usuarios: UsuarioAdmin[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

export default function UsuariosAdminPage() {
  const { data: session } = useSession();
  const habilitado = (session as { usuario?: Usuario } | null)?.usuario?.role === 'ADMIN';
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [busca, setBusca] = useState('');

  // Debounce simples da busca.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusca(input.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-usuarios', page, busca],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (busca) params.set('busca', busca);
      return (await api.get(`/api/admin/usuarios?${params}`)).data as UsuariosResp;
    },
    enabled: habilitado,
    placeholderData: keepPreviousData,
  });

  const bloquear = useMutation({
    mutationFn: async (id: string) =>
      (await api.put(`/api/admin/usuarios/${id}/bloquear`)).data as { id: string; bloqueado: boolean },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-usuarios'] }),
  });

  const usuarios = data?.usuarios ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <AdminGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-2">Usuários</h1>
        <p className="text-neutral-600 mb-8">{total} usuário(s).</p>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full h-11 pl-11 pr-4 border border-black rounded bg-white text-sm outline-none focus:border-green transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando usuários...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <>
            <div className="border border-black rounded bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black text-left text-xs uppercase tracking-wider text-neutral-600">
                    <th className="p-4 font-bold">Nome</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Nível</th>
                    <th className="p-4 font-bold">XP</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="p-4 font-bold">
                        {u.nome}
                        {u.role === 'ADMIN' && (
                          <Badge variant="solid" className="ml-2">
                            Admin
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-neutral-600">{u.email}</td>
                      <td className="p-4">{u.nivel}</td>
                      <td className="p-4">
                        <AnimatedNumber value={u.xpTotal} />
                      </td>
                      <td className="p-4">
                        {u.bloqueado ? (
                          <Badge variant="solid" className="font-bold">
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge variant="green">Ativo</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant={u.bloqueado ? 'green' : 'outline'}
                          disabled={bloquear.isPending && bloquear.variables === u.id}
                          onClick={() => bloquear.mutate(u.id)}
                        >
                          {bloquear.isPending && bloquear.variables === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.bloqueado ? (
                            'Desbloquear'
                          ) : (
                            'Bloquear'
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-neutral-600">
                Página {page} de {totalPaginas}
                {isFetching && <Loader2 className="inline h-3 w-3 animate-spin ml-2" />}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AdminGuard>
  );
}
