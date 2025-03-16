/*
  Warnings:

  - You are about to drop the column `googleAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleIdToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleTokenExpires` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleAccessToken",
DROP COLUMN "googleId",
DROP COLUMN "googleIdToken",
DROP COLUMN "googleRefreshToken",
DROP COLUMN "googleTokenExpires",
ADD COLUMN     "ytmusicAuthUser" TEXT,
ADD COLUMN     "ytmusicCookie" TEXT,
ADD COLUMN     "ytmusicOrigin" TEXT DEFAULT 'https://music.youtube.com';
