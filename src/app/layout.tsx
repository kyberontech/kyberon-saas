// src/app/layout.tsx
// Layout raiz — envolve todas as páginas

import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Kyberon – True Guardian',
  description: 'Plataforma IoT de monitoramento industrial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-ky-bg text-ky-text font-body antialiased">
        {children}
      </body>
    </html>
  )
}
