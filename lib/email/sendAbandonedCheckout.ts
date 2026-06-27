import { Resend } from 'resend'
import AbandonedCheckout from '@/emails/AbandonedCheckout'

/**
 * Lazily initialise the Resend client so missing env vars don't crash
 * the module at import time (they'll fail only when an email is sent).
 */
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured. Set it in your environment variables.'
    )
  }
  return new Resend(apiKey)
}

function getFromEmail(): string {
  const from = process.env.FROM_EMAIL
  if (!from) {
    throw new Error(
      'FROM_EMAIL is not configured. Set it in your environment variables.'
    )
  }
  return from
}

export interface AbandonedCheckoutItemInput {
  image: string
  title: string
  variant: string | null
  quantity: number
  price: number
}

export interface SendAbandonedCheckoutParams {
  orderId: string
  customerName: string
  customerEmail: string
  items: AbandonedCheckoutItemInput[]
  subtotal: number
  total: number
  recoveryLink: string
}

export type SendAbandonedCheckoutResult =
  | { success: true; emailId: string }
  | { success: false; error: string }

/**
 * Send an abandoned checkout recovery email to the customer.
 *
 * This function is resilient — failures are logged but never thrown.
 * The caller (cron job) should NOT block on email failures.
 */
export async function sendAbandonedCheckout(
  params: SendAbandonedCheckoutParams
): Promise<SendAbandonedCheckoutResult> {
  const { orderId, customerName, customerEmail, items, subtotal, total, recoveryLink } =
    params

  try {
    const resend = getResend()
    const fromEmail = getFromEmail()

    // ── Render the email template to HTML ──
    const emailHtml = AbandonedCheckout({
      customerName,
      customerEmail,
      items,
      subtotal,
      total,
      recoveryLink,
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: 'Complete Your Bandlox Order — Your Items Are Still Available',
      react: emailHtml,
    })

    if (error) {
      console.error(
        `[sendAbandonedCheckout] Failed to send recovery email for order ${orderId}:`,
        error
      )
      return { success: false, error: error.message }
    }

    const emailId = data?.id ?? null
    console.log(
      `[sendAbandonedCheckout] Recovery email sent for order ${orderId} (id: ${emailId})`
    )

    return { success: true, emailId: emailId ?? 'unknown' }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown email error'
    console.error(
      `[sendAbandonedCheckout] Fatal error for order ${orderId}:`,
      error
    )
    return { success: false, error: message }
  }
}