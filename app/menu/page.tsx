import { redirect } from 'next/navigation'

export default function MenuPage({
  searchParams,
}: {
  searchParams: { local?: string; item?: string }
}) {
  const params = new URLSearchParams()
  if (searchParams.local) params.set('local', searchParams.local)
  if (searchParams.item) params.set('item', searchParams.item)
  const qs = params.toString()
  redirect(`/order${qs ? `?${qs}` : ''}`)
}
