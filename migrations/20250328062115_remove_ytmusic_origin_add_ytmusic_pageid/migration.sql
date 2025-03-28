/*
  Warnings:

  - You are about to drop the column `ytmusicOrigin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "ytmusicOrigin",
ADD COLUMN     "ytmusicPageId" TEXT;
