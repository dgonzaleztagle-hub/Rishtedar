import { notFound } from 'next/navigation'
import { validateBranchToken } from '@/lib/staff-tokens'
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

  if (!token || !(await validateBranchToken(branch, token))) {
    notFound()
  }

  return <StaffScannerPage branch={branch} token={token} />
}
