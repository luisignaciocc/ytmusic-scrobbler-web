import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getCookie() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "luisignacioccp@gmail.com" },
      select: { ytmusicCookie: true }
    });
    
    if (user?.ytmusicCookie) {
      console.log(user.ytmusicCookie);
    } else {
      console.error("No cookie found");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getCookie();