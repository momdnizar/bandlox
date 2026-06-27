import { Resend } from 'resend'
import OrderConfirmation from '@/emails/OrderConfirmation'

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

function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL
}

export interface OrderItemInput {
  image: string
  title: string
  variant: string | null
  quantity: number
  price: number
}

export interface SendOrderConfirmationParams {
  orderId: string
  orderNumber: string
  orderDate: string
  paymentStatus: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  items: OrderItemInput[]
  subtotal: number
  shipping: number
  total: number
}

type SendResult =
  | { success: true; customerEmailId: string | null; adminEmailId: string | null }
  | { success: false; error: string }

/**
 * Send an order confirmation email to the customer and optionally an
 * admin notification email.
 *
 * This function is resilient — failures are logged but never thrown.
 * The caller (payment verification flow) should NOT block on email
 * failures.
 */
export async function sendOrderConfirmation(
  params: SendOrderConfirmationParams
): Promise<SendResult> {
  const {
    orderNumber,
    orderDate,
    paymentStatus,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingPostalCode,
    items,
    subtotal,
    shipping,
    total,
  } = params

  try {
    const resend = getResend()
    const fromEmail = getFromEmail()

    // ── Render the email template to HTML ──
    const emailHtml = OrderConfirmation({
      orderNumber,
      orderDate,
      paymentStatus,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPostalCode,
      items,
      subtotal,
      shipping,
      total,
    })

    // ── 1. Send customer confirmation ──
    let customerEmailId: string | null = null

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: customerEmail,
        subject: `Your Bandlox Order ${orderNumber} is Confirmed`,
        react: emailHtml,
      })

      if (error) {
        console.error(
          `[sendOrderConfirmation] Failed to send customer email for order ${orderNumber}:`,
          error
        )
      } else {
        customerEmailId = data?.id ?? null
        console.log(
          `[sendOrderConfirmation] Customer email sent for order ${orderNumber} (id: ${customerEmailId})`
        )
      }
    } catch (customerError) {
      console.error(
        `[sendOrderConfirmation] Exception sending customer email for order ${orderNumber}:`,
        customerError
      )
    }

    // ── 2. Send admin notification (optional) ──
    let adminEmailId: string | null = null
    const adminEmail = getAdminEmail()

    if (adminEmail) {
      try {
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject: `[Admin] New Bandlox Order — ${orderNumber}`,
          html: `
            <div style="font-family: sans-serif; padding: 24px; max-width: 500px;">
              <h2 style="margin: 0 0 16px;">New Order Received</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #666;">Order</td><td style="padding: 8px 0; font-weight: 600;">${orderNumber}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0; font-weight: 600;">${customerName}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${customerEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="padding: 8px 0; font-weight: 600;">₹${total.toLocaleString('en-IN')}</td></tr>
              </table>
            </div>
          `,
        })

        if (error) {
          console.error(
            `[sendOrderConfirmation] Failed to send admin email for order ${orderNumber}:`,
            error
          )
        } else {
          adminEmailId = data?.id ?? null
          console.log(
            `[sendOrderConfirmation] Admin email sent for order ${orderNumber} (id: ${adminEmailId})`
          )
        }
      } catch (adminError) {
        console.error(
          `[sendOrderConfirmation] Exception sending admin email for order ${orderNumber}:`,
          adminError
        )
      }
    }

    return {
      success: true,
      customerEmailId,
      adminEmailId,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown email error'
    console.error(
      `[sendOrderConfirmation] Fatal error for order ${orderNumber}:`,
      error
    )
    return {
      success: false,
      error: message,
    }
  }
}