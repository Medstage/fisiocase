import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/login`, {
            email: credentials.email,
            senha: credentials.senha,
          });
          if (data?.token && data?.user) {
            return {
              id: data.user.id,
              name: data.user.nome,
              email: data.user.email,
              backendToken: data.token,
              usuario: data.user,
            } as unknown as { id: string };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { backendToken: string; usuario: Record<string, unknown> };
        (token as Record<string, unknown>).backendToken = u.backendToken;
        (token as Record<string, unknown>).usuario = u.usuario;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as Record<string, unknown>;
      const s = session as unknown as Record<string, unknown>;
      s.accessToken = t.backendToken;
      s.usuario = t.usuario;
      return session;
    },
  },
};
