import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { notebookApi } from "@/features/notebook/notebook.api";


const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  debug: true,

  logger: {
    error(code, metadata) {
      console.error("🔴 [NextAuth Error]", code, metadata);
    },
    warn(code) {
      console.warn("🟡 [NextAuth Warning]", code);
    },
    debug(code, metadata) {
      console.debug("🔵 [NextAuth Debug]", code, metadata);
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      console.log("🟢 [Callback] signIn triggered:", { user, account });

      if (account && user.email && user.name) {
        try {
          console.log("📡 Sending user to backend:", {
            email: user.email,
            name: user.name,
            provider: account.provider,
          });

          await notebookApi.oauthSignIn({
            email: user.email,
            name: user.name,
            provider: account.provider,
          });

          console.log("✅ Backend sign-in success");
          return true;
        } catch (error) {
          console.error("❌ Custom backend sign-in failed:", error);
          return false;
        }
      }

      console.warn("⚠️ Missing account, email, or name in signIn callback");
      return false;
    },

    async jwt({ token, account, user }) {
      console.log("🔑 [Callback] jwt triggered:", { token, account, user });
      if (account && user) {
        token.id = user.id;
      }
      return token;
    },

     async session({ session, token }) {
      console.log("📦 [Callback] session triggered:", { session, token });

      return {
        ...session,
        id: (token as { id?: string }).id,
      };
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
