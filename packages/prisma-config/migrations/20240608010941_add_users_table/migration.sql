-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "googleAccessToken" TEXT NOT NULL,
    "googleRefreshToken" TEXT,
    "googleTokenExpires" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
