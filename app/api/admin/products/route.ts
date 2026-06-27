import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminRequest, checkApiPermission } from '@/lib/admin/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/admin/products
 *
 * List all products for the admin panel.
 * Requires: products:read permission (admin+)
 */
export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'products:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/products] List error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: products ?? [] }, { status: 200 })
  } catch (error) {
    console.error('[admin/products] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products
 *
 * Create a new product.
 * Requires: products:create permission (admin+)
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'products:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('products')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[admin/products] Create error:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    console.error('[admin/products] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/products
 *
 * Update an existing product.
 * Requires: products:update permission (admin+)
 */
export async function PATCH(request: Request) {
  try {
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'products:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Product id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/products] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data }, { status: 200 })
  } catch (error) {
    console.error('[admin/products] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/products
 *
 * Delete a product.
 * Requires: products:delete permission (admin+)
 */
export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'products:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[admin/products] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[admin/products] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}