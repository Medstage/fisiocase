'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { FloatingInput } from '@/components/ui/floating-input';
import { Button } from '@/components/ui/button';

/** Toggle simples (checkbox estilizado) no padrão flat. */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors ${
          checked ? 'bg-green' : 'bg-card'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
            checked ? 'left-[22px] bg-card' : 'left-0.5 bg-foreground'
          }`}
        />
      </button>
    </label>
  );
}

export default function ConfiguracoesPage() {
  // --- Senha ---
  const [senha, setSenha] = useState({ senhaAtual: '', novaSenha: '' });
  const [senhaMsg, setSenhaMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // --- Notificações ---
  const [notif, setNotif] = useState({ email: true, novidades: false });
  const [notifMsg, setNotifMsg] = useState('');
  const [salvandoNotif, setSalvandoNotif] = useState(false);

  // --- Privacidade ---
  const [priv, setPriv] = useState({ perfilPublico: true, mostrarNoRanking: true });
  const [privMsg, setPrivMsg] = useState('');
  const [salvandoPriv, setSalvandoPriv] = useState(false);

  // --- Excluir conta ---
  const [modalAberto, setModalAberto] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [erroExclusao, setErroExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault();
    setSenhaMsg(null);
    setSalvandoSenha(true);
    try {
      await api.put('/api/configuracoes/senha', senha);
      setSenha({ senhaAtual: '', novaSenha: '' });
      setSenhaMsg({ tipo: 'ok', texto: 'Senha atualizada com sucesso.' });
    } catch (err) {
      const texto =
        axios.isAxiosError(err) && err.response?.status === 401
          ? 'Senha atual incorreta.'
          : 'Não foi possível alterar a senha.';
      setSenhaMsg({ tipo: 'erro', texto });
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function salvarNotif() {
    setNotifMsg('');
    setSalvandoNotif(true);
    try {
      await api.put('/api/configuracoes/notificacoes', notif);
      setNotifMsg('Preferências de notificação salvas.');
    } catch {
      setNotifMsg('Não foi possível salvar.');
    } finally {
      setSalvandoNotif(false);
    }
  }

  async function salvarPriv() {
    setPrivMsg('');
    setSalvandoPriv(true);
    try {
      await api.put('/api/configuracoes/privacidade', priv);
      setPrivMsg('Preferências de privacidade salvas.');
    } catch {
      setPrivMsg('Não foi possível salvar.');
    } finally {
      setSalvandoPriv(false);
    }
  }

  async function excluirConta(e: React.FormEvent) {
    e.preventDefault();
    setErroExclusao('');
    setExcluindo(true);
    try {
      await api.delete('/api/configuracoes/conta', { data: { senha: senhaExclusao } });
      await signOut({ callbackUrl: '/login' });
    } catch (err) {
      const texto =
        axios.isAxiosError(err) && err.response?.status === 401
          ? 'Senha incorreta.'
          : 'Não foi possível excluir a conta.';
      setErroExclusao(texto);
      setExcluindo(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h1 className="text-2xl font-bold mb-8">Configurações</h1>

      <div className="max-w-2xl space-y-8">
        {/* Senha */}
        <section className="border border-border rounded p-6 bg-card">
          <h2 className="text-lg font-bold mb-1">Senha</h2>
          <p className="text-sm text-neutral-600 mb-6">Atualize sua senha de acesso.</p>
          <form onSubmit={salvarSenha} className="space-y-6">
            <FloatingInput
              id="senhaAtual"
              type="password"
              label="Senha atual"
              required
              value={senha.senhaAtual}
              onChange={(e) => setSenha((s) => ({ ...s, senhaAtual: e.target.value }))}
            />
            <FloatingInput
              id="novaSenha"
              type="password"
              label="Nova senha (mín. 6 caracteres)"
              required
              minLength={6}
              value={senha.novaSenha}
              onChange={(e) => setSenha((s) => ({ ...s, novaSenha: e.target.value }))}
            />
            {senhaMsg && (
              <p className={`text-sm font-bold ${senhaMsg.tipo === 'ok' ? 'text-green' : 'text-destructive'}`}>
                {senhaMsg.texto}
              </p>
            )}
            <Button type="submit" disabled={salvandoSenha}>
              {salvandoSenha ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Alterar senha'}
            </Button>
          </form>
        </section>

        {/* Notificações */}
        <section className="border border-border rounded p-6 bg-card">
          <h2 className="text-lg font-bold mb-1">Notificações</h2>
          <p className="text-sm text-neutral-600 mb-6">Escolha como deseja ser avisado.</p>
          <div className="space-y-4">
            <Toggle label="Notificações por e-mail" checked={notif.email} onChange={(v) => setNotif((n) => ({ ...n, email: v }))} />
            <Toggle label="Novidades e atualizações" checked={notif.novidades} onChange={(v) => setNotif((n) => ({ ...n, novidades: v }))} />
          </div>
          {notifMsg && <p className="text-sm text-green font-bold mt-4">{notifMsg}</p>}
          <div className="mt-6">
            <Button type="button" variant="outline" onClick={salvarNotif} disabled={salvandoNotif}>
              {salvandoNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </section>

        {/* Privacidade */}
        <section className="border border-border rounded p-6 bg-card">
          <h2 className="text-lg font-bold mb-1">Privacidade</h2>
          <p className="text-sm text-neutral-600 mb-6">Controle a visibilidade do seu perfil.</p>
          <div className="space-y-4">
            <Toggle label="Perfil público" checked={priv.perfilPublico} onChange={(v) => setPriv((p) => ({ ...p, perfilPublico: v }))} />
            <Toggle label="Aparecer no ranking" checked={priv.mostrarNoRanking} onChange={(v) => setPriv((p) => ({ ...p, mostrarNoRanking: v }))} />
          </div>
          {privMsg && <p className="text-sm text-green font-bold mt-4">{privMsg}</p>}
          <div className="mt-6">
            <Button type="button" variant="outline" onClick={salvarPriv} disabled={salvandoPriv}>
              {salvandoPriv ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </section>

        {/* Excluir conta */}
        <section className="border border-border rounded p-6 bg-card">
          <h2 className="text-lg font-bold mb-1">Excluir conta</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Esta ação é permanente e remove todos os seus dados. Não pode ser desfeita.
          </p>
          <Button
            type="button"
            onClick={() => {
              setSenhaExclusao('');
              setErroExclusao('');
              setModalAberto(true);
            }}
            className="bg-destructive text-background border-destructive hover:bg-card hover:text-destructive"
          >
            Excluir minha conta
          </Button>
        </section>
      </div>

      {/* Modal de confirmação de exclusão (inline) */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md border border-border rounded bg-card p-6"
          >
            <h3 className="text-lg font-bold mb-1">Confirmar exclusão</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Digite sua senha para confirmar a exclusão permanente da conta.
            </p>
            <form onSubmit={excluirConta} className="space-y-6">
              <FloatingInput
                id="senhaExclusao"
                type="password"
                label="Senha"
                required
                value={senhaExclusao}
                onChange={(e) => setSenhaExclusao(e.target.value)}
              />
              {erroExclusao && <p className="text-sm text-destructive font-bold">{erroExclusao}</p>}
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={excluindo}
                  className="bg-destructive text-background border-destructive hover:bg-card hover:text-destructive"
                >
                  {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir conta'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)} disabled={excluindo}>
                  Cancelar
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
