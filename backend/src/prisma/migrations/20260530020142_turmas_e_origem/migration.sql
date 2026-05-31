-- CreateEnum
CREATE TYPE "OrigemResposta" AS ENUM ('IA', 'TURMA', 'LIVRE');

-- CreateEnum
CREATE TYPE "StatusCasoTurma" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "StatusRespostaTurma" AS ENUM ('PENDENTE', 'CORRIGIDO');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PROFESSOR';

-- AlterTable
ALTER TABLE "Resposta" ADD COLUMN     "origem" "OrigemResposta" NOT NULL DEFAULT 'IA';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "codigoInstitucional" TEXT;

-- CreateTable
CREATE TABLE "Turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "codigo" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaMembro" (
    "id" TEXT NOT NULL,
    "entradaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turmaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TurmaMembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasoTurma" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" TIMESTAMP(3),
    "status" "StatusCasoTurma" NOT NULL DEFAULT 'RASCUNHO',
    "publicadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turmaId" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "CasoTurma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaTurma" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" "StatusRespostaTurma" NOT NULL DEFAULT 'PENDENTE',
    "notaProfessor" DOUBLE PRECISION,
    "feedbackProfessor" TEXT,
    "xpGanho" INTEGER,
    "corrigidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "casoTurmaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,

    CONSTRAINT "RespostaTurma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Turma_codigo_key" ON "Turma"("codigo");

-- CreateIndex
CREATE INDEX "Turma_professorId_idx" ON "Turma"("professorId");

-- CreateIndex
CREATE INDEX "Turma_codigo_idx" ON "Turma"("codigo");

-- CreateIndex
CREATE INDEX "TurmaMembro_userId_idx" ON "TurmaMembro"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaMembro_turmaId_userId_key" ON "TurmaMembro"("turmaId", "userId");

-- CreateIndex
CREATE INDEX "CasoTurma_turmaId_idx" ON "CasoTurma"("turmaId");

-- CreateIndex
CREATE INDEX "CasoTurma_casoId_idx" ON "CasoTurma"("casoId");

-- CreateIndex
CREATE INDEX "RespostaTurma_casoTurmaId_idx" ON "RespostaTurma"("casoTurmaId");

-- CreateIndex
CREATE INDEX "RespostaTurma_alunoId_idx" ON "RespostaTurma"("alunoId");

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaMembro" ADD CONSTRAINT "TurmaMembro_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaMembro" ADD CONSTRAINT "TurmaMembro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoTurma" ADD CONSTRAINT "CasoTurma_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoTurma" ADD CONSTRAINT "CasoTurma_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoTurma" ADD CONSTRAINT "CasoTurma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaTurma" ADD CONSTRAINT "RespostaTurma_casoTurmaId_fkey" FOREIGN KEY ("casoTurmaId") REFERENCES "CasoTurma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaTurma" ADD CONSTRAINT "RespostaTurma_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
