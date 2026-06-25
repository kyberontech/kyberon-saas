'use client'
// src/components/Sidebar.tsx — menu lateral com navegação baseada em perfil
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Bell, BarChart2, Settings,
  LogOut, Menu, X, Users, FileText, User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { KtgLogo } from '@/components/ui/ktgLogo'

type NavItem = {
  href:    string
  label:   string
  icon:    React.ElementType
  roles?:  string[]   // undefined = todos os perfis autenticados
}

const NAV: NavItem[] = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard                              },
  { href: '/alarmes',       label: 'Alarmes',        icon: Bell,    roles: ['ADMINISTRADOR','SUPERVISOR'] },
  { href: '/relatorios',    label: 'Relatórios',     icon: BarChart2, roles: ['ADMINISTRADOR','SUPERVISOR'] },
  { href: '/configuracoes', label: 'Configurações',  icon: Settings,  roles: ['ADMINISTRADOR','SUPERVISOR'] },
  { href: '/usuarios',      label: 'Usuários',       icon: Users,     roles: ['ADMINISTRADOR']              },
  { href: '/logs',          label: 'Logs',           icon: FileText,  roles: ['ADMINISTRADOR']              },
  { href: '/perfil',        label: 'Perfil',         icon: User                                         },
]

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR:    'Supervisor',
  USUARIO:       'Usuário',
}

export default function Sidebar() {
  const pathname        = usePathname()
  const router          = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const role      = session?.user?.role  ?? ''
  const userName  = session?.user?.name  ?? 'Usuário'
  const userEmail = session?.user?.email ?? ''

  const visibleNav = NAV.filter(item =>
    !item.roles || item.roles.includes(role)
  )

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleLogout() {
    signOut({ callbackUrl: '/login' })
  }

  const initials = userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-ky-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KtgLogo/>
          <div>
            <p className="font-head font-bold text-base tracking-[2px] text-ky-primary leading-none">KYBERON</p>
            <p className="text-[9px] tracking-[2px] text-ky-muted uppercase mt-0.5">True Guardian</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-ky-muted hover:text-ky-text p-1" aria-label="Fechar menu">
          <X size={18}/>
        </button>
      </div>

      {/* Cliente / Tenant */}
      {session?.user?.tenantName && (
        <div className="px-4 py-2 border-b border-ky-border/50">
          <p className="text-[8px] text-ky-muted uppercase tracking-widest">Cliente</p>
          <p className="text-[11px] text-ky-primary font-semibold truncate">{session.user.tenantName}</p>
        </div>
      )}

      <nav className="flex-1 py-3">
        {visibleNav.map(({ href, label, icon: Icon }) => {
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

      <div className="px-4 py-3 border-t border-ky-border flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-ky-bg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-ky-text truncate">{userName}</p>
          <p className="text-[9px] text-ky-muted truncate">{ROLE_LABEL[role] ?? role}</p>
        </div>
        <button onClick={handleLogout} title="Sair" className="text-ky-muted hover:text-ky-red transition-colors p-1">
          <LogOut size={14}/>
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden md:flex w-[200px] bg-ky-panel border-r border-ky-border flex-col flex-shrink-0">
        <SidebarContent/>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-ky-panel border-b border-ky-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(true)} className="text-ky-muted hover:text-ky-primary transition-colors" aria-label="Abrir menu">
          <Menu size={20}/>
        </button>
        <KtgLogo/>
        <span className="font-head font-bold text-sm tracking-[2px] text-ky-primary">KYBERON</span>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
      )}

      <aside className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-ky-panel border-r border-ky-border flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent/>
      </aside>
    </>
  )
}
