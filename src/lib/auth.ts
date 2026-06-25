// src/lib/auth.ts — configuração NextAuth (credenciais + JWT, sem Google)
import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email', type: 'email'    },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where:   { email: credentials.email, active: true },
          include: { tenant: true },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        // SUPER_ADMIN não pertence a nenhum tenant
        return {
          id:         user.id,
          email:      user.email,
          name:       user.name,
          role:       user.role,
          tenantId:   user.tenantId   ?? '',
          tenantName: user.tenant?.name ?? '',
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & { role: string; tenantId: string; tenantName: string }
        token.id         = u.id
        token.role       = u.role
        token.tenantId   = u.tenantId
        token.tenantName = u.tenantName
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id         = token.id         as string
        session.user.role       = token.role       as string
        session.user.tenantId   = token.tenantId   as string
        session.user.tenantName = token.tenantName as string
      }
      return session
    },
  },

  pages:  { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
