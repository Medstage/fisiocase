import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// GET /api/historico — lista unificada de Resposta + RespostaTurma do aluno logado.
export const listar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filtroOrigem = req.query.origem as string | undefined; // IA | LIVRE | TURMA

  const [respostas, respostasTurma] = await Promise.all([
    prisma.resposta.findMany({
      where: { userId: user!.id },
      include: { caso: { select: { id: true, titulo: true, area: true, dificuldade: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.respostaTurma.findMany({
      where: { alunoId: user!.id },
      include: {
        casoTurma: {
          include: {
            caso: { select: { id: true, titulo: true, area: true, dificuldade: true } },
            turma: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  type ItemHistorico = {
    id: string;
    tipo: 'caso' | 'turma';
    origem: 'IA' | 'LIVRE' | 'TURMA';
    caso: { id: string; titulo: string; area: string; dificuldade: string };
    nota: number | null;
    xpGanho: number;
    tempoGasto: number;
    status: 'CORRIGIDO' | 'PENDENTE';
    createdAt: Date;
    turma: { id: string; nome: string } | null;
    casoTurmaId: string | null;
  };

  const todos: ItemHistorico[] = [
    ...respostas.map<ItemHistorico>((r) => ({
      id: r.id,
      tipo: 'caso',
      origem: r.origem === 'LIVRE' ? 'LIVRE' : 'IA',
      caso: r.caso,
      nota: r.nota,
      xpGanho: r.xpGanho,
      tempoGasto: r.tempoGasto,
      status: 'CORRIGIDO',
      createdAt: r.createdAt,
      turma: null,
      casoTurmaId: null,
    })),
    ...respostasTurma.map<ItemHistorico>((rt) => ({
      id: rt.id,
      tipo: 'turma',
      origem: 'TURMA',
      caso: rt.casoTurma.caso,
      // Nota 0-10 convertida pra escala 0-100 pra apresentação consistente.
      nota: rt.notaProfessor !== null ? Math.round((rt.notaProfessor / 10) * 100) : null,
      xpGanho: rt.xpGanho ?? 0,
      tempoGasto: 0,
      status: rt.status,
      createdAt: rt.createdAt,
      turma: rt.casoTurma.turma,
      casoTurmaId: rt.casoTurmaId,
    })),
  ];

  const filtrados = filtroOrigem ? todos.filter((i) => i.origem === filtroOrigem) : todos;
  filtrados.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = filtrados.length;
  const itens = filtrados.slice((page - 1) * limit, page * limit);

  res.json({ itens, total, page, limit });
};
