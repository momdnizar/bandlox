import { Resend } from 'resend'
import ShippingUpdate from '@/emails/ShippingUpdate'

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

export interface SendShippingUpdateParams {
  orderId: string
  orderNumber: string
  status: string
  customerName: string
  customerEmail: string
  trackingNumber?: string | null
  courierName?: string | null
  trackingUrl?: string | null
}

type SendResult =
  | { success: true; emailId: string | null }
  | { success: false; error: string }

/**
 * Send a shipping status update email to the customer.
 * Fires for: Packed, Shipped, Out For Delivery, Delivered
 *
 * Failures are logged but never thrown — the caller should not block.
 */
export async function sendShippingUpdate(
  params: SendShippingUpdateParams
): Promise<SendResult> {
  const {
    orderNumber,
    status,
    customerName,
    customerEmail,
    trackingNumber,
    courierName,
    trackingUrl,
  } = params

  const subjectMap: Record<string, string> = {
    Packed: `Your Bandlox Order ${orderNumber} Has Been Packed`,
    Shipped: `Your Bandlox Order ${orderNumber} Has Been Shipped`,
    'Out For Delivery': `Your Bandlox Order ${orderNumber} Is Out for Delivery`,
    Delivered: `Your Bandlox Order ${orderNumber} Has Been Delivered`,
  }

  const subject =
    subjectMap[status] ?? `Your Bandlox Order ${orderNumber} — ${status}`

  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bandlox.in'}/order-status?order_id=${params.orderId}`

  try {
    const resend = getResend()
    const fromEmail = getFromEmail()

    const emailHtml = ShippingUpdate({
      status,
      orderNumber,
      customerName,
      trackingNumber: trackingNumber ?? undefined,
      courierName: courierName ?? undefined,
      trackingUrl: trackingUrl ?? undefined,
      orderUrl,
    })

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject,
      react: emailHtml,
    })

    if (error) {
      console.error(
        `[sendShippingUpdate] Failed to send ${status} email for order ${orderNumber}:`,
        error
      )
      return { success: false, error: error.message }
    }

    console.log(
      `[sendShippingUpdate] ${status} email sent for order ${orderNumber} (id: ${data?.id})`
    )

    return { success: true, emailId: data?.id ?? null }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown email error'
    console.error(
      `[sendShippingUpdate] Exception sending ${status} email for order ${orderNumber}:`,
      error
    )
    return { success: false, error: message }
  }
}