"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        picture: true,
        email: true,
        lastFmUsername: true,
        isActive: true,
        lastSuccessfulScrobble: true,
        createdAt: true,
        deletedAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error querying users:", error);
    throw error;
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: !isActive,
      },
    });

    return updatedUser.isActive;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}
