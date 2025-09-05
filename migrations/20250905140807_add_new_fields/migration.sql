-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "maxArrayPosition" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isFirstTimeReady" BOOLEAN NOT NULL DEFAULT false;
