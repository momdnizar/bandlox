import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidTransition, SHIPPING_EMAIL_STATUSES, type OrderStatus } from '@/lib/orders/order-status'
import { sendShippingUpdate } from '@/lib/email/sendShippingUpdate'
import { verifyAdminRequest, checkApiPermission } from '@/lib/admin/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/admin/orders
 *
 * List orders with optional filtering, search, and pagination.
 * Requires: orders:read permission (staff+)
 *
 * Query params:
 *   page       - page number (default: 1)
 *   page_size  - items per page (default: 20, max: 100)
 *   status     - filter by status
 *   search     - search by customer name, email, or order ID (partial)
 */
export async function GET(request: Request) {
  try {
    // RBAC: require orders:read
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'orders:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('page_size') ?? '20', 10) || 20)
    )
    const statusFilter = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('orders')
      .select(
        `
          id,
          created_at,
          status,
          payment_status,
          subtotal,
          customer_name,
          email,
          tracking_number,
          courier_name,
          tracking_url,
          status_updated_at
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    if (search) {
      const searchPattern = `%${search}%`
      query = query.or(
        `customer_name.ilike.${searchPattern},email.ilike.${searchPattern},id.ilike.${searchPattern}`
      )
    }

    const { data: orders, error, count } = await query

    if (error) {
      console.error('[admin/orders] List error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        orders: orders ?? [],
        total: count ?? 0,
        page,
        page_size: pageSize,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[admin/orders] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/orders
 *
 * Update order status and/or tracking information.
 * Requires: orders:update_status permission (staff+)
 *
 * Body:
 *   order_id        - required
 *   status          - new status (optional)
 *   send_email      - whether to send shipping notification (default: true)
 *   tracking_number - tracking number (optional)
 *   courier_name    - courier name (optional)
 *   tracking_url    - tracking URL (optional)
 */
export async function PATCH(request: Request) {
  try {
    // RBAC: require orders:update_status
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'orders:update_status')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { order_id, status, send_email, tracking_number, courier_name, tracking_url } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      )
    }

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, customer_name, email, tracking_number, courier_name, tracking_url, status_updated_at')
      .eq('id', order_id)
      .single()

    if (fetchError || !order) {
      console.error('[admin/orders] Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {}
    let emailToSend: {
      status: string
      trackingNumber?: string | null
      courierName?: string | null
      trackingUrl?: string | null
    } | null = null

    // Update status if provided
    if (status && status !== order.status) {
      if (!isValidTransition(order.status, status)) {
        return NextResponse.json(
          {
            error: `Invalid transition from "${order.status}" to "${status}"`,
          },
          { status: 400 }
        )
      }

      updates.status = status
      updates.status_updated_at = new Date().toISOString()

      // Determine if we should send an email
      const shouldSendEmail =
        send_email !== false &&
        SHIPPING_EMAIL_STATUSES.includes(status as OrderStatus)

      if (shouldSendEmail) {
        emailToSend = {
          status,
          trackingNumber: tracking_number ?? order.tracking_number,
          courierName: courier_name ?? order.courier_name,
          trackingUrl: tracking_url ?? order.tracking_url,
        }
      }
    }

    // Update tracking info if provided
    if (tracking_number !== undefined) updates.tracking_number = tracking_number
    if (courier_name !== undefined) updates.courier_name = courier_name
    if (tracking_url !== undefined) updates.tracking_url = tracking_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No changes to apply' },
        { status: 200 }
      )
    }

    // Apply updates
    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order_id)

    if (updateError) {
      console.error('[admin/orders] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Send email asynchronously (fire and forget)
    if (emailToSend) {
      const orderNumber = order_id.slice(0, 8).toUpperCase()

      sendShippingUpdate({
        orderId: order_id,
        orderNumber,
        status: emailToSend.status,
        customerName: order.customer_name ?? 'Valued Customer',
        customerEmail: order.email,
        trackingNumber: emailToSend.trackingNumber,
        courierName: emailToSend.courierName,
        trackingUrl: emailToSend.trackingUrl,
      }).catch((err) => {
        console.error(
          `[admin/orders] Failed to send ${emailToSend!.status} email:`,
          err
        )
      })
    }

    return NextResponse.json(
      {
        message: status
          ? `Status updated to "${status}"`
          : 'Tracking information updated',
        email_sent: emailToSend !== null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[admin/orders] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}