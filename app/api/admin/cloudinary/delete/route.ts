import { NextResponse } from 'next/server'
import cloudinary from 'cloudinary'
import { verifyAdminRequest, checkApiPermission } from '@/lib/admin/api-auth'

// Configure Cloudinary with server-side credentials
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    // RBAC: require media:delete permission (admin+)
    const auth = await verifyAdminRequest(request)
    if (!auth.authenticated) return auth.response
    if (!checkApiPermission(auth.role, 'media:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { public_id } = await request.json()

    if (!public_id) {
      return NextResponse.json({ error: 'public_id is required' }, { status: 400 })
    }

    const result = await cloudinary.v2.uploader.destroy(public_id)

    if (result.result !== 'ok') {
      console.error('[cloudinary/delete] Failed to delete:', result)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[cloudinary/delete] Error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}