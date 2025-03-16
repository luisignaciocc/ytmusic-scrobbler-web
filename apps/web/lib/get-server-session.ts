import { PrismaClient } from "@prisma/client";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user = user;
      }
      if (user?.email) {
        const email = user.email;
        const name = user.name || email.split("@")[0];
        const picture = user.image || "";

        await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name,
            picture,
          },
          update: {
            name,
            picture,
          },
        });
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user = token.user as Session["user"];
      return session;
    },
  },
  theme: {
    colorScheme: "auto",
    brandColor: "#FE344D",
    logo: "https://scrobbler.bocono-labs.com/logo.png",
    buttonText: "Sign in with Google",
  },
} satisfies NextAuthOptions;

export default function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authConfig);
}
