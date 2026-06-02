'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import axios from 'axios';
import { AuthShell } from '@/components/layout/AuthShell';
import { FloatingInput } from '@/components/ui/floating-input';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', instituicao: '', semestre: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  function set(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        instituicao: form.instituicao || undefined,
        semestre: form.semestre ? Number(form.semestre) : undefined,
      });
      const res = await signIn('credentials', { email: form.email, senha: form.senha, redirect: false });
      setCarregando(false);
      if (res?.error) {
        router.push('/login');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setCarregando(false);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setErro('Este e-mail já está cadastrado.');
      } else {
        setErro('Não foi possível concluir o cadastro. Verifique os dados.');
      }
    }
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.02em]">FisioCase</h1>
        <h2 className="text-xl font-bold mt-6">Criar conta</h2>
        <p className="text-sm text-neutral-600 mt-1">Comece a praticar casos clínicos hoje.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <FloatingInput id="nome" label="Nome completo" required value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        <FloatingInput id="email" type="email" label="Email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        <FloatingInput id="senha" type="password" label="Senha (mín. 6 caracteres)" required value={form.senha} onChange={(e) => set('senha', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput id="instituicao" label="Instituição" value={form.instituicao} onChange={(e) => set('instituicao', e.target.value)} />
          <FloatingInput id="semestre" type="number" label="Semestre" value={form.semestre} onChange={(e) => set('semestre', e.target.value)} />
        </div>

        {erro && <p className="text-sm text-destructive font-bold">{erro}</p>}

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-600">
          Já tem conta?{' '}
          <Link href="/login" className="text-foreground font-bold hover:underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
