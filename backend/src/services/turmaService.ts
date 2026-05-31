import { prisma } from '../lib/prisma';

/** Converte nota 0–10 (escala professor) em XP, conforme spec. */
export function notaParaXp(nota: number): number {
  if (nota >= 9) return 500;
  if (nota >= 7) return 380;
  if (nota >= 5) return 260;
  if (nota >= 3) return 140;
  return 60;
}

/** Gera código de turma alfanumérico (6 chars, maiúsculo, sem caracteres ambíguos). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I, O, 0, 1
function gerarCodigoCru(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** Gera código único de turma garantindo que não colide. */
export async function gerarCodigoTurma(): Promise<string> {
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const candidato = gerarCodigoCru();
    const existe = await prisma.turma.findUnique({ where: { codigo: candidato }, select: { id: true } });
    if (!existe) return candidato;
  }
  throw new Error('Falha ao gerar código único de turma.');
}
