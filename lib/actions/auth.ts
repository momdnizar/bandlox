'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface SignupState {
  errors: Record<string, string>
  success?: boolean
}

export interface LoginState {
  errors: Record<string, string>
}

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validation
  const errors: Record<string, string> = {}

  if (!name || name.trim().length === 0) {
    errors.name = 'Full name is required.'
  }

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.trim(),
      },
    },
  })

  if (error) {
    return {
      errors: {
        form: error.message,
      },
    }
  }

  revalidatePath('/', 'layout')
  return { errors: {}, success: true }
}

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validation
  const errors: Record<string, string> = {}

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required.'
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required.'
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      errors: {
        form: 'Invalid email or password.',
      },
    }
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}