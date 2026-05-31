'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { FloatingInput } from '@/components/ui/floating-input';
import { Button } from '@/components/ui/button';
import type { Usuario } from '@/types';

export default function EditarPerfilPage() {
  const queryClient = useQueryClient();

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil'],
    queryFn: async () => (await api.get('/api/perfil')).data as { user: Usuario },
  });

  const [form, setForm] = useState({ nome: '', bio: '', instituicao: '', semestre: '', avatarUrl: '' });
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const u = perfil?.user;
    if (u) {
      setForm({
        nome: u.nome ?? '',
        bio: u.bio ?? '',
        instituicao: u.instituicao ?? '',
        semestre: u.semestre != null ? String(u.semestre) : '',
        avatarUrl: u.avatarUrl ?? '',
      });
    }
  }, [perfil]);

  function set(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setSucesso(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setSalvando(true);
    try {
      await api.put('/api/perfil', {
        nome: form.nome,
        bio: form.bio,
        instituicao: form.instituicao,
        semestre: form.semestre ? Number(form.semestre) : undefined,
      });
      await api.put('/api/perfil/avatar', { avatarUrl: form.avatarUrl });

      await queryClient.invalidateQueries({ queryKey: ['perfil'] });
      await queryClient.invalidateQueries({ queryKey: ['perfil-estatisticas'] });
      setSucesso(true);
    } catch {
      setErro('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h1 className="text-2xl font-bold mb-8">Editar perfil</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="border border-black rounded p-6 bg-white space-y-6">
          <FloatingInput id="nome" label="Nome completo" required value={form.nome} onChange={(e) => set('nome', e.target.value)} />

          <div className="relative border border-black bg-white rounded transition-colors duration-150 focus-within:border-green">
            <textarea
              id="bio"
              placeholder=" "
              rows={4}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              className="peer block w-full px-4 pb-2 pt-5 text-black bg-transparent border-0 outline-none focus:ring-0 resize-none text-sm"
            />
            <label
              htmlFor="bio"
              className="absolute text-neutral-600 duration-150 transform -translate-y-3 scale-75 top-3.5 z-10 origin-[0] left-4 text-sm pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
            >
              Bio
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingInput id="instituicao" label="Instituição" value={form.instituicao} onChange={(e) => set('instituicao', e.target.value)} />
            <FloatingInput id="semestre" type="number" label="Semestre" value={form.semestre} onChange={(e) => set('semestre', e.target.value)} />
          </div>

          <FloatingInput id="avatarUrl" label="URL do avatar" value={form.avatarUrl} onChange={(e) => set('avatarUrl', e.target.value)} />
        </div>

        {erro && <p className="text-sm text-destructive font-bold">{erro}</p>}
        {sucesso && <p className="text-sm text-green font-bold">Perfil atualizado com sucesso.</p>}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
          <Link href="/perfil">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
