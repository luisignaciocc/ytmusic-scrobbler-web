import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        password: {
          label: "Password",
          type: "password",
          placeholder: "********",
        },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.password) {
          return null;
        }
        if (process.env.NEXT_ADMIN_PASSWORD === credentials.password) {
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
