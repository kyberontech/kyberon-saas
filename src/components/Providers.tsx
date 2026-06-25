'use client'
// src/components/Providers.tsx — SessionProvider do NextAuth para o client side
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
