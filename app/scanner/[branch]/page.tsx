import { notFound } from 'next/navigation'
import { BRANCH_TOKENS } from '@/lib/staff-tokens'
import { StaffScannerPage } from '@/components/scanner/StaffScannerPage'

interface Props {
  params: Promise<{ branch: string }>
  searchParams: Promise<{ t?: string }>
}

export const metadata = {
  title: 'Escáner Circle · Rishtedar',
  robots: { index: false, follow: false },
}

export default async function ScannerPage({ params, searchParams }: Props) {
  const { branch } = await params
  const { t: token } = await searchParams

  const expectedToken = BRANCH_TOKENS[branch]
  if (!expectedToken || token !== expectedToken) {
    notFound()
  }

  return <StaffScannerPage branch={branch} token={token} />
}
