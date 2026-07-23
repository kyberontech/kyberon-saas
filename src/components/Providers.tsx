'use client'
// src/components/Providers.tsx — SessionProvider do NextAuth + conexão MQTT
// compartilhada (CardsMqttProvider) para o client side
import { SessionProvider } from 'next-auth/react'
import { CardsMqttProvider } from '@/lib/CardsMqttContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CardsMqttProvider>{children}</CardsMqttProvider>
    </SessionProvider>
  )
}
