import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

const BUCKET = 'promotional-banners'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max: ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const year = new Date().getFullYear()
    const filename = `${year}/${crypto.randomUUID()}.${ext}`

    // Upload to Supabase Storage
    const supabase = await createAdminClient()

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)

    return NextResponse.json(
      { asset_url: data.publicUrl },
      { status: 200 }
    )
  } catch (err) {
    console.error('[banner upload]', err)
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
