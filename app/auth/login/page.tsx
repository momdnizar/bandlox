'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import type { LoginState } from '@/lib/actions/auth'

const initialState: LoginState = {
  errors: {},
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
          Sign In
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Welcome back to Bandlox.
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
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="john@example.com"
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
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />
            {state?.errors?.password && (
              <p className="mt-1.5 text-xs text-red-400">
                {state.errors.password}
              </p>
            )}
          </div>

          {/* Form error */}
          {state?.errors?.form && (
            <p className="text-xs text-red-400">{state.errors.form}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Signing In\u2026' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
          >
            Create One
          </Link>
        </p>
      </div>
    </div>
  )
}