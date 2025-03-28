/*
  Warnings:

  - You are about to drop the column `ytmusicAuthorization` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ytmusicPageId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ytmusicVisitorData` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "ytmusicAuthorization",
DROP COLUMN "ytmusicPageId",
DROP COLUMN "ytmusicVisitorData";
