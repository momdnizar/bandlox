'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { adminLogoutAction } from './login/actions'
import type { AdminRole } from '@/lib/admin/types'

interface AdminHeaderProps {
  email: string
  role: AdminRole
}

export default function AdminHeader({ email, role }: AdminHeaderProps) {
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await adminLogoutAction()
    })
  }

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm font-bold tracking-[0.1em] uppercase text-white">
          Bandlox
        </Link>
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
          {role.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View Store
        </Link>
        <span className="text-xs text-zinc-500 hidden sm:inline">{email}</span>
        <button
          onClick={handleLogout}
          disabled={pending}
          className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        >
          {pending ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </header>
  )
}