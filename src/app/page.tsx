// src/app/page.tsx
// Redireciona a raiz "/" para o login
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
