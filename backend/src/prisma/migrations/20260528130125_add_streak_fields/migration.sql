-- AlterTable
ALTER TABLE "User" ADD COLUMN     "protetoresStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimoAcessoStreak" TIMESTAMP(3);
