'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { FloatingInput } from '@/components/ui/floating-input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const res = await signIn('credentials', { email, senha, redirect: false });
    setCarregando(false);
    if (res?.error) {
      setErro('E-mail ou senha inválidos.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.02em]">FisioCase</h1>
        <h2 className="text-xl font-bold mt-6">Bem-vindo de volta.</h2>
        <p className="text-sm text-neutral-600 mt-1">Pratique casos clínicos reais com IA.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <FloatingInput id="email" type="email" label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <FloatingInput
          id="senha"
          type={mostrarSenha ? 'text' : 'password'}
          label="Senha"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        >
          <button type="button" aria-label="Mostrar/ocultar senha" onClick={() => setMostrarSenha((v) => !v)} className="px-3 text-neutral-600 hover:text-foreground">
            {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </FloatingInput>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="h-4 w-4 border-border rounded-sm accent-green" />
            <span className="text-sm text-neutral-600 group-hover:text-foreground transition-colors">Lembrar de mim</span>
          </label>
          <Link href="/recuperar-senha" className="text-sm text-neutral-600 hover:text-foreground underline decoration-1 underline-offset-4 transition-colors">
            Esqueceu a senha?
          </Link>
        </div>

        {erro && <p className="text-sm text-destructive font-bold">{erro}</p>}

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-600">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-foreground font-bold hover:underline underline-offset-4">
            Criar agora
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
