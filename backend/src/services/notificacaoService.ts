import { prisma } from '../lib/prisma';

/** Cria uma notificação para um usuário. */
export async function notificar(userId: string, titulo: string, descricao: string): Promise<void> {
  await prisma.notificacao.create({
    data: { userId, titulo, descricao },
  });
}

/** Notifica todos os membros de uma turma. */
export async function notificarMembrosTurma(turmaId: string, titulo: string, descricao: string): Promise<void> {
  const membros = await prisma.turmaMembro.findMany({ where: { turmaId }, select: { userId: true } });
  if (membros.length === 0) return;
  await prisma.notificacao.createMany({
    data: membros.map((m) => ({ userId: m.userId, titulo, descricao })),
  });
}

/** Notifica o professor de uma turma. */
export async function notificarProfessorDaTurma(turmaId: string, titulo: string, descricao: string): Promise<void> {
  const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { professorId: true } });
  if (!turma) return;
  await notificar(turma.professorId, titulo, descricao);
}
