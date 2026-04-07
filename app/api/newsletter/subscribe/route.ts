import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    let email: string | null = null
    let firstName: string | null = null
    let birthday: string | null = null
    let preferredLocalId: string | null = null

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = body.email
      firstName = body.firstName
      birthday = body.birthday
      preferredLocalId = body.preferredLocalId
    } else {
      const form = await req.formData()
      email = form.get('email') as string
      firstName = form.get('firstName') as string | null
      birthday = form.get('birthday') as string | null
      preferredLocalId = form.get('preferredLocalId') as string | null
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from('subscribers').upsert(
      {
        email: email.toLowerCase().trim(),
        first_name: firstName || null,
        birthday: birthday || null,
        preferred_local_id: preferredLocalId || null,
        is_active: true,
        source: 'website',
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )

    if (error) throw error

    // Send welcome email
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'hola@rishtedar.cl',
        to: email,
        subject: `Bienvenido/a al círculo Rishtedar${firstName ? `, ${firstName}` : ''}!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #faf7f0;">
            <p style="color: #c9952a; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Rishtedar Circle</p>
            <h1 style="font-style: italic; font-weight: 300; color: #1a1209; font-size: 32px; margin: 8px 0 16px;">
              ¡Bienvenido/a${firstName ? `, ${firstName}` : ''}!
            </h1>
            <p style="color: #6b5240; font-size: 15px; line-height: 1.7;">
              Ya eres parte del círculo Rishtedar. Pronto recibirás promociones exclusivas,
              adelantos de nuevos platos y beneficios especiales en tu cumpleaños.
            </p>
            <div style="margin: 32px 0; background: white; border: 1px solid #e4d8d1; padding: 20px;">
              <p style="color: #1a1209; font-size: 14px; margin: 0;">
                Recuerda que puedes pedir delivery directamente desde nuestro sitio, sin intermediarios,
                con la mejor experiencia de pago.
              </p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/menu"
              style="display: inline-block; background: #91226f; color: white; padding: 14px 32px;
              text-decoration: none; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">
              Ver menú →
            </a>
            <p style="color: #c9952a; font-style: italic; font-size: 24px; margin-top: 40px;">Rishtedar</p>
          </div>
        `,
      }).catch(console.error)
    }

    // Redirect back if form submission
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/?subscribed=1', req.url))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[newsletter/subscribe]', error)
    return NextResponse.json({ error: 'Error al suscribirse' }, { status: 500 })
  }
}
