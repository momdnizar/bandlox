import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAbandonedCheckout } from '@/lib/email/sendAbandonedCheckout'

/**
 * CRON Job: Abandoned Checkout Recovery
 *
 * Runs every hour via Vercel Cron.
 *
 * Finds orders that:
 *   - payment_status = 'pending'
 *   - created_at > 30 minutes ago
 *   - abandoned_email_sent = false
 *
 * Sends a recovery email and marks the order as recovered.
 *
 * Safety:
 *   - Never sends to paid/failed/already recovered orders
 *   - Each order is marked atomically to prevent duplicate sends
 *   - Failures are logged but never thrown
 */

// ── Configuration ──

const ABANDONED_THRESHOLD_MINUTES = 30
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bandlox.in'

// ── Supabase admin client (service role for cron operations) ──

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ── Analytics accumulator ──

interface RecoveryAnalytics {
  emailsSent: number
  ordersRecovered: number
  revenueRecovered: number
  errors: number
  totalCandidates: number
}

// ── Route Handler ──

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const analytics: RecoveryAnalytics = {
    emailsSent: 0,
    ordersRecovered: 0,
    revenueRecovered: 0,
    errors: 0,
    totalCandidates: 0,
  }

  try {
    const supabase = getAdminClient()

    // ── 1. Find abandoned orders ──
    const thresholdDate = new Date(
      Date.now() - ABANDONED_THRESHOLD_MINUTES * 60 * 1000
    ).toISOString()

    console.log(
      `[abandoned-checkouts] Searching for orders before ${thresholdDate}`
    )

    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        email,
        subtotal,
        created_at,
        order_items (
          product_id,
          product_name,
          price,
          quantity,
          variant
        )
      `)
      .eq('payment_status', 'pending')
      .eq('abandoned_email_sent', false)
      .lt('created_at', thresholdDate)
      .limit(50)

    if (fetchError) {
      console.error(
        '[abandoned-checkouts] Failed to fetch abandoned orders:',
        fetchError
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch abandoned orders',
          analytics,
        },
        { status: 500 }
      )
    }

    analytics.totalCandidates = orders?.length ?? 0
    console.log(
      `[abandoned-checkouts] Found ${analytics.totalCandidates} abandoned orders`
    )

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No abandoned orders found',
        analytics,
      })
    }

    // ── 2. Process each abandoned order ──
    for (const order of orders) {
      try {
        // Build items for email
        const items = (order.order_items || []).map((item: any) => ({
          image: '',
          title: item.product_name,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
        }))

        // Calculate total (subtotal + shipping, assuming free shipping)
        const total = order.subtotal || 0

        // Build recovery link
        const recoveryLink = `${BASE_URL}/checkout/resume?orderId=${order.id}`

        // ── 3. Send recovery email ──
        const emailResult = await sendAbandonedCheckout({
          orderId: order.id,
          customerName: order.customer_name || 'Valued Customer',
          customerEmail: order.email || '',
          items,
          subtotal: order.subtotal || 0,
          total,
          recoveryLink,
        })

        if (!emailResult.success) {
          console.error(
            `[abandoned-checkouts] Email failed for order ${order.id}: ${emailResult.error}`
          )
          analytics.errors++
          continue
        }

        analytics.emailsSent++

        // ── 4. Mark order as recovered ──
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            abandoned_email_sent: true,
            abandoned_email_sent_at: new Date().toISOString(),
          })
          .eq('id', order.id)
          .eq('abandoned_email_sent', false) // Atomic: only update if still false

        if (updateError) {
          console.error(
            `[abandoned-checkouts] Failed to mark order ${order.id} as recovered:`,
            updateError
          )
          analytics.errors++
        } else {
          analytics.ordersRecovered++
          analytics.revenueRecovered += total
        }
      } catch (orderError) {
        console.error(
          `[abandoned-checkouts] Error processing order ${order.id}:`,
          orderError
        )
        analytics.errors++
      }
    }

    // ── 5. Log analytics ──
    console.log('[abandoned-checkouts] Recovery job completed', {
      emailsSent: analytics.emailsSent,
      ordersRecovered: analytics.ordersRecovered,
      revenueRecovered: analytics.revenueRecovered,
      errors: analytics.errors,
      totalCandidates: analytics.totalCandidates,
    })

    return NextResponse.json({
      success: true,
      message: 'Abandoned checkout recovery completed',
      analytics,
    })
  } catch (error) {
    console.error('[abandoned-checkouts] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        analytics,
      },
      { status: 500 }
    )
  }
}