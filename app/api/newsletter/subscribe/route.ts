import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewsletterWelcomeEmail } from '@/lib/services/notificationService'

export async function POST(req: NextRequest) {
  try {
    let email:           string | null = null
    let firstName:       string | null = null
    let birthday:        string | null = null
    let preferredLocalId: string | null = null

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await req.json()
      email           = body.email
      firstName       = body.firstName
      birthday        = body.birthday
      preferredLocalId = body.preferredLocalId
    } else {
      const form = await req.formData()
      email           = form.get('email') as string
      firstName       = form.get('firstName') as string | null
      birthday        = form.get('birthday') as string | null
      preferredLocalId = form.get('preferredLocalId') as string | null
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { error } = await supabase.from('subscribers').upsert(
      {
        email:              email.toLowerCase().trim(),
        first_name:         firstName || null,
        birthday:           birthday || null,
        preferred_local_id: preferredLocalId || null,
        is_active:          true,
        source:             'website',
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )

    if (error) throw error

    await sendNewsletterWelcomeEmail({ to: email, firstName })

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/?subscribed=1', req.url))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[newsletter/subscribe]', error)
    return NextResponse.json({ error: 'Error al suscribirse' }, { status: 500 })
  }
}
