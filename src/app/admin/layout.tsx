// src/app/admin/layout.tsx — layout da área do super admin
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <AdminSidebar/>
      {children}
    </div>
  )
}
