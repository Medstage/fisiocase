-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('ORTOPEDIA', 'NEUROLOGIA', 'CARDIORRESPIRATORIA', 'ESPORTIVA', 'GERONTOLOGIA', 'PEDIATRIA', 'UROGINECOLOGIA', 'REUMATOLOGIA');

-- CreateEnum
CREATE TYPE "Dificuldade" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL');

-- CreateEnum
CREATE TYPE "TipoPaciente" AS ENUM ('ADULTO', 'IDOSO', 'PEDIATRICO', 'GESTANTE', 'ATLETA');

-- CreateEnum
CREATE TYPE "FocoClinico" AS ENUM ('AVALIACAO', 'DIAGNOSTICO', 'CONDUTA', 'REABILITACAO', 'PREVENCAO');

-- CreateEnum
CREATE TYPE "StatusCaso" AS ENUM ('RASCUNHO', 'PUBLICADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "instituicao" TEXT,
    "semestre" INTEGER,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "nivel" TEXT NOT NULL DEFAULT 'Iniciante',
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "xpAtual" INTEGER NOT NULL DEFAULT 0,
    "sequenciaAtual" INTEGER NOT NULL DEFAULT 0,
    "maiorSequencia" INTEGER NOT NULL DEFAULT 0,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "area" "Area" NOT NULL,
    "dificuldade" "Dificuldade" NOT NULL,
    "tipoPaciente" "TipoPaciente" NOT NULL,
    "focoClinico" "FocoClinico" NOT NULL,
    "identificacao" JSONB NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "historiaDoencaAtual" TEXT NOT NULL,
    "historicoPatologico" JSONB NOT NULL,
    "exameFisico" JSONB NOT NULL,
    "examesComplementares" JSONB NOT NULL,
    "respostaEsperada" TEXT NOT NULL,
    "criteriosAvaliacao" JSONB NOT NULL,
    "xpRecompensa" INTEGER NOT NULL DEFAULT 160,
    "status" "StatusCaso" NOT NULL DEFAULT 'RASCUNHO',
    "totalResolucoes" INTEGER NOT NULL DEFAULT 0,
    "mediaAcerto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autorId" TEXT,

    CONSTRAINT "Caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "nota" INTEGER,
    "feedback" JSONB,
    "tempoGasto" INTEGER NOT NULL DEFAULT 0,
    "xpGanho" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conquista" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "xpRecompensa" INTEGER NOT NULL DEFAULT 0,
    "requisito" JSONB NOT NULL,

    CONSTRAINT "Conquista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConquista" (
    "id" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,

    CONSTRAINT "UserConquista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Missao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "xpRecompensa" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL,
    "meta" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Missao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMissao" (
    "id" TEXT NOT NULL,
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "missaoId" TEXT NOT NULL,

    CONSTRAINT "UserMissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Caso_area_dificuldade_status_idx" ON "Caso"("area", "dificuldade", "status");

-- CreateIndex
CREATE INDEX "Resposta_userId_idx" ON "Resposta"("userId");

-- CreateIndex
CREATE INDEX "Resposta_casoId_idx" ON "Resposta"("casoId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConquista_userId_conquistaId_key" ON "UserConquista"("userId", "conquistaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMissao_userId_missaoId_key" ON "UserMissao"("userId", "missaoId");

-- CreateIndex
CREATE INDEX "Notificacao_userId_idx" ON "Notificacao"("userId");

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConquista" ADD CONSTRAINT "UserConquista_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConquista" ADD CONSTRAINT "UserConquista_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "Conquista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissao" ADD CONSTRAINT "UserMissao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissao" ADD CONSTRAINT "UserMissao_missaoId_fkey" FOREIGN KEY ("missaoId") REFERENCES "Missao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
