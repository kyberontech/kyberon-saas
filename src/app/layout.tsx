// src/app/layout.tsx
import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Kyberon – True Guardian',
  description: 'Plataforma IoT de monitoramento industrial',
  icons: {
    icon: '/img/ktg/logo_ktg_2.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-ky-bg text-ky-text font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
