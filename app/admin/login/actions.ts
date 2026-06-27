'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminLogin, adminLogout } from '@/lib/admin/auth'

export interface AdminLoginState {
  errors: Record<string, string>
}

export async function adminLoginAction(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
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

  const result = await adminLogin(email, password)

  if (result.error) {
    return { errors: { form: result.error } }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function adminLogoutAction(): Promise<void> {
  await adminLogout()
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}

export async function adminLoginServerAction(email: string, password: string): Promise<{ error?: string }> {
  const result = await adminLogin(email, password)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath('/', 'layout')
  return {}
}