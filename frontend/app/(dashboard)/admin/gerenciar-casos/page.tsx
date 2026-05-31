'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DificuldadeBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AREA_LABEL } from '@/lib/constants';
import type { Caso, StatusCaso, Usuario } from '@/types';

type CasoAdmin = Caso & {
  autor?: { id: string; nome: string; email: string; role: 'USER' | 'PROFESSOR' | 'ADMIN' } | null;
  origem?: 'plataforma' | 'professor' | 'ia';
};
interface ListaAdmin {
  casos: CasoAdmin[];
  total: number;
}

export default function GerenciarCasosPage() {
  const { data: session } = useSession();
  const habilitado = (session as { usuario?: Usuario } | null)?.usuario?.role === 'ADMIN';
  const qc = useQueryClient();
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-casos'],
    queryFn: async () => (await api.get('/api/casos/admin/lista')).data as ListaAdmin,
    enabled: habilitado,
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusCaso }) =>
      (await api.put(`/api/casos/${id}`, { status })).data as Caso,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-casos'] }),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/casos/${id}`),
    onSuccess: () => {
      setConfirmar(null);
      qc.invalidateQueries({ queryKey: ['admin-casos'] });
    },
  });

  const casos = data?.casos ?? [];

  return (
    <AdminGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-2">Gerenciar casos</h1>
        <p className="text-neutral-600 mb-8">{data?.total ?? 0} caso(s) cadastrado(s).</p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando casos...
          </div>
        ) : casos.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
            Nenhum caso cadastrado.
          </div>
        ) : (
          <div className="border border-black rounded bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left text-xs uppercase tracking-wider text-neutral-600">
                  <th className="p-4 font-bold">Título</th>
                  <th className="p-4 font-bold">Autor / Origem</th>
                  <th className="p-4 font-bold">Área</th>
                  <th className="p-4 font-bold">Dificuldade</th>
                  <th className="p-4 font-bold">Resoluções</th>
                  <th className="p-4 font-bold">Média</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {casos.map((c) => (
                  <tr key={c.id}>
                    <td className="p-4 font-bold max-w-xs">{c.titulo}</td>
                    <td className="p-4 text-xs">
                      {c.autor ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold">{c.autor.nome}</span>
                          <span className="text-neutral-500 uppercase tracking-wider">{c.autor.role}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 uppercase tracking-wider">IA / sistema</span>
                      )}
                    </td>
                    <td className="p-4">{AREA_LABEL[c.area] ?? c.area}</td>
                    <td className="p-4">
                      <DificuldadeBadge dificuldade={c.dificuldade} />
                    </td>
                    <td className="p-4">{c.totalResolucoes ?? 0}</td>
                    <td className="p-4">{(c.mediaAcerto ?? 0).toLocaleString('pt-BR')}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        disabled={atualizarStatus.isPending}
                        onClick={() =>
                          atualizarStatus.mutate({
                            id: c.id,
                            status: c.status === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO',
                          })
                        }
                        title="Alternar status"
                      >
                        <Badge variant={c.status === 'PUBLICADO' ? 'green' : 'outline'}>
                          {c.status === 'PUBLICADO' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      {confirmar === c.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="green"
                            disabled={remover.isPending}
                            onClick={() => remover.mutate(c.id)}
                          >
                            {remover.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmar(null)}>
                            Cancelar
                          </Button>
                        </span>
                      ) : (
                        <Button size="icon" variant="outline" onClick={() => setConfirmar(c.id)} title="Deletar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AdminGuard>
  );
}
