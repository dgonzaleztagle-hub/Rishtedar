import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

// ─── Defaults ─────────────────────────────────────────────────────────────────
// Usados si la fila de DB está vacía (earn_rules/prizes/tier_benefits = []/[]/{}])

const DEFAULT_EARN_RULES = [
  { id: 'delivery',    label: 'Pedido Delivery / Takeaway', description: 'Puntos otorgados al confirmar un pedido online',           points: 1,   unit: 'por $1.000 CLP', enabled: true  },
  { id: 'visit',       label: 'Visita registrada en local',  description: 'Staff escanea QR del cliente al llegar o al pagar',        points: 100, unit: 'por visita',     enabled: true  },
  { id: 'reservation', label: 'Reserva confirmada',          description: 'Se acreditan al momento de confirmar la reserva',          points: 100, unit: 'fija',           enabled: true  },
  { id: 'birthday',    label: 'Cumpleaños (Gold)',            description: 'Puntos dobles en el mes de cumpleaños — solo nivel Gold',  points: 2,   unit: 'multiplicador',  enabled: true  },
  { id: 'tuesday',     label: 'Martes dobles (Silver)',       description: 'Puntos dobles los martes — nivel Silver y Gold',           points: 2,   unit: 'multiplicador',  enabled: false },
]

const DEFAULT_PRIZES = [
  { rank: 1, label: '1er lugar', description: '20% de descuento en próxima visita' },
  { rank: 2, label: '2do lugar', description: '1 postre gratis'                    },
  { rank: 3, label: '3er lugar', description: '10% de descuento en próxima visita' },
]

const DEFAULT_TIER_BENEFITS = {
  bronze: [
    { icon: '✦', text: '1 punto por cada $1.000 gastado'   },
    { icon: '🎮', text: '1 ficha del Festín por semana'     },
    { icon: '🎂', text: 'Descuento 5% en tu cumpleaños'     },
    { icon: '🎁', text: 'Acceso a promociones exclusivas Circle' },
  ],
  silver: [
    { icon: '✦', text: '1 punto por cada $1.000 gastado'     },
    { icon: '🎮', text: '2 fichas del Festín por semana'      },
    { icon: '🎂', text: 'Descuento 10% en tu cumpleaños'      },
    { icon: '📅', text: 'Reservas con prioridad (hasta 48h antes)' },
    { icon: '🏷️', text: '5% de descuento en pedidos delivery' },
  ],
  gold: [
    { icon: '✦', text: '1 punto por cada $1.000 gastado'      },
    { icon: '🎮', text: '3 fichas del Festín por semana'       },
    { icon: '🎂', text: 'Descuento 15% + postre gratis en cumpleaños' },
    { icon: '👑', text: 'Mesa preferente sin espera'           },
    { icon: '🌟', text: 'Acceso a menús avant-première exclusivos' },
    { icon: '🎉', text: 'Invitaciones a cenas y eventos especiales' },
  ],
}

// ─── GET /api/admin/loyalty-config ───────────────────────────────────────────

export async function GET() {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('loyalty_config')
      .select('id, earn_rules, prizes, tier_benefits, updated_at')
      .limit(1)
      .maybeSingle()

    if (error) throw error

    // Merge DB values with defaults so missing keys are always filled
    const earn_rules    = Array.isArray(data?.earn_rules)    && data.earn_rules.length    > 0 ? data.earn_rules    : DEFAULT_EARN_RULES
    const prizes        = Array.isArray(data?.prizes)        && data.prizes.length        > 0 ? data.prizes        : DEFAULT_PRIZES
    const tier_benefits = data?.tier_benefits && Object.keys(data.tier_benefits).length   > 0 ? data.tier_benefits : DEFAULT_TIER_BENEFITS

    return NextResponse.json({ earn_rules, prizes, tier_benefits, updated_at: data?.updated_at ?? null })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[loyalty-config GET]', detail)
    return NextResponse.json({ error: 'Error al cargar configuración', detail }, { status: 500 })
  }
}

// ─── PUT /api/admin/loyalty-config ───────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const { earn_rules, prizes, tier_benefits } = await req.json()

    if (!earn_rules || !prizes || !tier_benefits) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get existing row id (single-row table)
    const { data: existing } = await supabase
      .from('loyalty_config')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from('loyalty_config')
        .update({ earn_rules, prizes, tier_benefits, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('loyalty_config')
        .insert({ earn_rules, prizes, tier_benefits })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[loyalty-config PUT]', detail)
    return NextResponse.json({ error: 'Error al guardar configuración', detail }, { status: 500 })
  }
}
