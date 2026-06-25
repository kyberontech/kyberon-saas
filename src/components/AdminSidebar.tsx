'use client'
// src/components/AdminSidebar.tsx — sidebar exclusiva do super admin
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LayoutGrid, Users2, LogOut, Menu, X, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { KtgLogo } from '@/components/ui/ktgLogo'

const NAV = [
  { href: '/admin',        label: 'Visão Geral', icon: LayoutGrid, exact: true },
  { href: '/admin/grupos', label: 'Grupos',       icon: Users2                  },
]

export default function AdminSidebar() {
  const pathname         = usePathname()
  const { data: session } = useSession()
  const [open, setOpen]  = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const userName = session?.user?.name ?? 'Super Admin'

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-ky-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KtgLogo/>
          <div>
            <p className="font-head font-bold text-base tracking-[2px] text-ky-primary leading-none">KYBERON</p>
            <p className="text-[9px] tracking-[2px] text-ky-muted uppercase mt-0.5">Plataforma</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-ky-muted hover:text-ky-text p-1">
          <X size={18}/>
        </button>
      </div>

      {/* Badge super admin */}
      <div className="px-4 py-2 border-b border-ky-border/50">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-ky-primary"/>
          <p className="text-[9px] font-bold text-ky-primary uppercase tracking-widest">Super Admin</p>
        </div>
        <p className="text-[10px] text-ky-muted mt-0.5">Acesso total à plataforma</p>
      </div>

      <nav className="flex-1 py-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-2 transition-all select-none
                ${active
                  ? 'border-ky-primary text-ky-primary bg-ky-primary/10'
                  : 'border-transparent text-ky-muted hover:text-ky-text hover:bg-white/5'
                }`}
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
          {userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-ky-text truncate">{userName}</p>
          <p className="text-[9px] text-ky-muted truncate">{session?.user?.email}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} title="Sair" className="text-ky-muted hover:text-ky-red transition-colors p-1">
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
        <button onClick={() => setOpen(true)} className="text-ky-muted hover:text-ky-primary transition-colors">
          <Menu size={20}/>
        </button>
        <KtgLogo/>
        <span className="font-head font-bold text-sm tracking-[2px] text-ky-primary">KYBERON</span>
        <span className="text-[9px] text-ky-muted ml-1">/ Plataforma</span>
      </div>

      {open && <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>}

      <aside className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-ky-panel border-r border-ky-border flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent/>
      </aside>
    </>
  )
}
