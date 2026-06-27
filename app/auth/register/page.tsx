'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/lib/actions/auth'
import type { SignupState } from '@/lib/actions/auth'

const initialState: SignupState = {
  errors: {},
  success: false,
}

export default function RegisterPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(signup, initialState)

  if (state?.success) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
            Check Your Email
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            We've sent a confirmation link. Please check your email to
            activate your account.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block text-sm uppercase tracking-[0.2em] text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Register for a Bandlox account.
        </p>

        <form action={action} className="mt-8 space-y-5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="John Doe"
            />
            {state?.errors?.name && (
              <p className="mt-1.5 text-xs text-red-400">{state.errors.name}</p>
            )}
          </div>

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
              autoComplete="new-password"
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
            />
            {state?.errors?.password && (
              <p className="mt-1.5 text-xs text-red-400">
                {state.errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
            />
            {state?.errors?.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400">
                {state.errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Form error (e.g. duplicate email) */}
          {state?.errors?.form && (
            <p className="text-xs text-red-400">{state.errors.form}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Creating Account\u2026' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}