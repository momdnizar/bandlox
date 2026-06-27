'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { adminLoginAction } from './actions'
import type { AdminLoginState } from './actions'

const initialState: AdminLoginState = {
  errors: {},
}

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-black">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-white">
            Bandlox
          </h1>
          <p className="mt-1 text-sm text-zinc-500 tracking-[0.05em] uppercase">
            Admin Panel
          </p>
        </div>

        <h2 className="text-lg font-semibold text-white">Sign In</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your credentials to access the admin panel.
        </p>

        <form action={action} className="mt-8 space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="admin@bandlox.com"
            />
            {state?.errors?.email && (
              <p className="mt-1.5 text-xs text-red-400">
                {state.errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
            />
            {state?.errors?.password && (
              <p className="mt-1.5 text-xs text-red-400">
                {state.errors.password}
              </p>
            )}
          </div>

          {/* Form error */}
          {state?.errors?.form && (
            <div className="bg-red-900/20 border border-red-800 rounded px-4 py-3">
              <p className="text-xs text-red-400">{state.errors.form}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link
            href="/auth/login"
            className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Customer Login
          </Link>
        </p>
      </div>
    </div>
  )
}