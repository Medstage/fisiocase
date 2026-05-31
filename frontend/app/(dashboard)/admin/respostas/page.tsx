'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AREA_LABEL } from '@/lib/constants';
import type { Area, Dificuldade, Usuario } from '@/types';

interface RespostaAdmin {
  id: string;
  nota: number | null;
  createdAt: string;
  user: { id: string; nome: string; email: string };
  caso: { id: string; titulo: string; area: Area; dificuldade: Dificuldade } | null;
}

interface RespostasResp {
  respostas: RespostaAdmin[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

export default function RespostasAdminPage() {
  const { data: session } = useSession();
  const habilitado = (session as { usuario?: Usuario } | null)?.usuario?.role === 'ADMIN';
  const [page, setPage] = useState(1);
  const [area, setArea] = useState<Area | ''>('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-respostas', page, area],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (area) params.set('area', area);
      return (await api.get(`/api/respostas/admin/todas?${params}`)).data as RespostasResp;
    },
    enabled: habilitado,
    placeholderData: keepPreviousData,
  });

  const respostas = data?.respostas ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <AdminGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-2">Respostas</h1>
        <p className="text-neutral-600 mb-8">{total} resposta(s) enviada(s).</p>

        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-3">Filtrar por área</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setArea('');
                setPage(1);
              }}
              className={`px-4 h-9 rounded border border-black text-xs transition-all active:scale-[0.98] ${
                area === '' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Todas
            </button>
            {(Object.keys(AREA_LABEL) as Area[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setArea(a);
                  setPage(1);
                }}
                className={`px-4 h-9 rounded border border-black text-xs transition-all active:scale-[0.98] ${
                  area === a ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                {AREA_LABEL[a]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando respostas...
          </div>
        ) : respostas.length === 0 ? (
          <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
            Nenhuma resposta encontrada.
          </div>
        ) : (
          <>
            <div className="border border-black rounded bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black text-left text-xs uppercase tracking-wider text-neutral-600">
                    <th className="p-4 font-bold">Aluno</th>
                    <th className="p-4 font-bold">Caso</th>
                    <th className="p-4 font-bold">Área</th>
                    <th className="p-4 font-bold">Nota</th>
                    <th className="p-4 font-bold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {respostas.map((r) => (
                    <tr key={r.id}>
                      <td className="p-4">
                        <div className="font-bold">{r.user.nome}</div>
                        <div className="text-xs text-neutral-600">{r.user.email}</div>
                      </td>
                      <td className="p-4 max-w-xs">{r.caso?.titulo ?? '—'}</td>
                      <td className="p-4">{r.caso ? AREA_LABEL[r.caso.area] ?? r.caso.area : '—'}</td>
                      <td className="p-4">
                        {r.nota != null ? (
                          <Badge variant={r.nota >= 7 ? 'green' : 'solid'}>{r.nota.toLocaleString('pt-BR')}</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-4 text-neutral-600">
                        {new Date(r.createdAt).toLocaleDateString('pt-BR')}
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
