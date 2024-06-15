import NextAuth from "next-auth";

import { authConfig } from "@/helpers/get-server-session";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
