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
          // prompt: "consent", // Uncomment to force the consent screen to appear every time
          access_type: "offline",
          response_type: "code",
          scope:
            "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
        },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.user = user;
      }
      if (account && user) {
        const email = user.email;
        const name = user.name || email?.split("@")[0];
        const googleId = account.providerAccountId;
        const picture = user.image || "";
        const googleAccessToken = account.access_token;
        const googleRefreshToken = account.refresh_token;
        const googleTokenExpires = account.expires_at;
        const googleIdToken = account.id_token;
        if (email && name && googleAccessToken) {
          await prisma.user.upsert({
            where: { email },
            create: {
              email,
              name,
              googleId,
              picture,
              googleAccessToken,
              googleRefreshToken: googleRefreshToken || undefined,
              googleTokenExpires,
              googleIdToken,
            },
            update: {
              name,
              picture,
              googleAccessToken,
              googleTokenExpires,
              googleIdToken,
            },
          });
        }
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
