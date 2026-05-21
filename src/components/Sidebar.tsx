'use client'
// src/components/Sidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MENU LATERAL — aparece em todas as páginas protegidas
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Bell, BarChart2, Settings, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { KtgLogo } from '@/components/ui/ktgLogo'

// Itens do menu
const NAV = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/alarmes',      label: 'Alarmes',         icon: Bell            },
  { href: '/relatorios',   label: 'Relatórios',      icon: BarChart2       },
  { href: '/configuracoes',label: 'Configurações',   icon: Settings        },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [userName, setUserName] = useState('Usuário')
  const [userEmail, setUserEmail] = useState('')

  // Lê o usuário simulado do sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ky_user')
      if (stored) {
        const u = JSON.parse(stored)
        setUserName(u.name  ?? 'Usuário')
        setUserEmail(u.email ?? '')
      }
    } catch { /* ignora */ }
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('ky_user')
    router.push('/login')
  }

  // Iniciais para o avatar
  const initials = userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className="w-[200px] bg-ky-panel border-r border-ky-border flex flex-col flex-shrink-0">

      {/* ── Topo: Logo ── */}
      <div className="px-4 py-4 border-b border-ky-border">
        <div className="flex items-center gap-2">
          <KtgLogo/>
          <div>
            <p className="font-head font-bold text-base tracking-[2px] text-ky-primary leading-none">
              KYBERON
            </p>
            <p className="text-[9px] tracking-[2px] text-ky-muted uppercase mt-0.5">
              True Guardian
            </p>
          </div>
        </div>
      </div>

      {/* ── Navegação ── */}
      <nav className="flex-1 py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium
                border-l-2 transition-all select-none
                ${active
                  ? 'border-ky-primary text-ky-primary bg-ky-primary/10'
                  : 'border-transparent text-ky-muted hover:text-ky-text hover:bg-white/5'
                }
              `}
            >
              <Icon size={15}/>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Rodapé: Usuário + Sair ── */}
      <div className="px-4 py-3 border-t border-ky-border flex items-center gap-2">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-ky-bg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
        >
          {initials}
        </div>
        {/* Nome */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-ky-text truncate">{userName}</p>
          <p className="text-[9px] text-ky-muted truncate">{userEmail}</p>
        </div>
        {/* Sair */}
        <button
          onClick={handleLogout}
          title="Sair"
          className="text-ky-muted hover:text-ky-red transition-colors"
        >
          <LogOut size={14}/>
        </button>
      </div>
    </aside>
  )
}
