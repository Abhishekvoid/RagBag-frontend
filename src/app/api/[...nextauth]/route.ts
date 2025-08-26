

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { notebookApi } from "@/features/notebook/notebook.api"; 

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account && user.email && user.name) {
        try {
         
          await notebookApi.oauthSignIn({
            email: user.email,
            name: user.name,
            provider: account.provider,
          });
          return true; 
        } catch (error) {
          console.error("Custom backend sign-in failed:", error);
          return false; 
        }
      }
      return false;
    },
   
  },
  
});

export { handler as GET, handler as POST }