'use client'
// src/components/Sidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MENU LATERAL — responsivo: drawer no mobile, sidebar fixa no desktop
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Bell, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { KtgLogo } from '@/components/ui/ktgLogo'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/alarmes',       label: 'Alarmes',      icon: Bell            },
  { href: '/relatorios',    label: 'Relatórios',   icon: BarChart2       },
  { href: '/configuracoes', label: 'Configurações',icon: Settings        },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [userName,  setUserName]  = useState('Usuário')
  const [userEmail, setUserEmail] = useState('')
  const [open, setOpen] = useState(false)

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

  // Fecha o drawer ao navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloqueia o scroll do body quando o drawer estiver aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleLogout() {
    sessionStorage.removeItem('ky_user')
    router.push('/login')
  }

  const initials = userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // ── Conteúdo interno do menu (reutilizado no mobile e desktop) ─────────────
  const SidebarContent = () => (
    <>
      {/* ── Topo: Logo ── */}
      <div className="px-4 py-4 border-b border-ky-border flex items-center justify-between">
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
        {/* Botão fechar — só aparece no mobile drawer */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-ky-muted hover:text-ky-text p-1"
          aria-label="Fechar menu"
        >
          <X size={18}/>
        </button>
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
                flex items-center gap-3 px-4 py-3 text-sm font-medium
                border-l-2 transition-all select-none
                ${active
                  ? 'border-ky-primary text-ky-primary bg-ky-primary/10'
                  : 'border-transparent text-ky-muted hover:text-ky-text hover:bg-white/5'
                }
              `}
            >
              <Icon size={16}/>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Rodapé: Usuário + Sair ── */}
      <div className="px-4 py-3 border-t border-ky-border flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-ky-bg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-ky-text truncate">{userName}</p>
          <p className="text-[9px] text-ky-muted truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          className="text-ky-muted hover:text-ky-red transition-colors p-1"
        >
          <LogOut size={14}/>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── DESKTOP: sidebar fixa ── */}
      <aside className="hidden md:flex w-[200px] bg-ky-panel border-r border-ky-border flex-col flex-shrink-0">
        <SidebarContent/>
      </aside>

      {/* ── MOBILE: topbar com botão hamburguer ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-ky-panel border-b border-ky-border flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          className="text-ky-muted hover:text-ky-primary transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20}/>
        </button>
        <KtgLogo/>
        <span className="font-head font-bold text-sm tracking-[2px] text-ky-primary">KYBERON</span>
      </div>

      {/* ── MOBILE: overlay escurecido ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── MOBILE: drawer deslizante ── */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 bottom-0 z-50 w-64
          bg-ky-panel border-r border-ky-border flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent/>
      </aside>
    </>
  )
}
