/**
 * Cloudinary upload utility for Bandlox admin.
 *
 * Provides client-side upload via unsigned upload preset
 * and server-side signature generation if needed.
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''

export interface CloudinaryResult {
  url: string
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
}

/**
 * Upload a single file to Cloudinary using an unsigned upload preset.
 *
 * This is called from the browser. The upload preset must allow
 * unsigned uploads in your Cloudinary dashboard.
 */
export async function uploadToCloudinary(
  file: File,
  folder = 'bandlox/products'
): Promise<CloudinaryResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  return res.json()
}

/**
 * Delete an image from Cloudinary by public_id.
 * Requires the server-side API key/secret, so we proxy through our API.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const res = await fetch('/api/admin/cloudinary/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id: publicId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Delete failed' }))
    throw new Error(err.error || 'Failed to delete image')
  }
}