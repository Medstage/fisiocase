import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { Usuario } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const usuario = (session as { usuario?: Partial<Usuario> }).usuario;
  return <DashboardShell usuario={usuario}>{children}</DashboardShell>;
}
