import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

// Anexa o token do backend (vindo da sessão NextAuth) em cada requisição client-side.
api.interceptors.request.use(async (config) => {
  const session = (await getSession()) as { accessToken?: string } | null;
  const token = session?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tratamento global de 401: limpa sessão e redireciona pro login.
let redirecionando = false;
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== 'undefined' && !redirecionando) {
      // Evita disparar 401 em chamadas da própria rota de login.
      const url = String(error?.config?.url ?? '');
      if (!url.includes('/auth/login')) {
        redirecionando = true;
        try {
          await signOut({ redirect: false });
        } catch {
          /* ignore */
        }
        window.location.href = '/login?expirado=1';
      }
    }
    return Promise.reject(error);
  },
);
