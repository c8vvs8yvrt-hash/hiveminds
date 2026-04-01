import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    // Google Sign-In
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    // Email magic link (requires email provider config)
    ...(process.env.EMAIL_SERVER
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || 'HiveMinds <noreply@hiveminds.app>',
          }),
        ]
      : []),
    // Simple email/password for development & easy signup
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
            },
          });
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
        // Fetch tier from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tier: true, usageCount: true, usageResetAt: true },
        });
        if (dbUser) {
          (session.user as { tier?: string }).tier = dbUser.tier;
          (session.user as { usageCount?: number }).usageCount = dbUser.usageCount;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
