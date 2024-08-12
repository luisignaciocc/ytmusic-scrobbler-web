import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authPassword = "12345678";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        // No login form needed
      },
      async authorize(credentials, req) {
        if (process.env.NEXT_ADMIN_PASSWORD === authPassword) {
          return {
            id: "1",
            name: "Admin",
          };
        }
        return null;
      },
    }),
  ],
});

export { handler as GET, handler as POST };
