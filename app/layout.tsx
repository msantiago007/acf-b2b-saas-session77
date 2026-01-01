import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'B2B SaaS - ML Generated',
  description: 'Multi-tenant B2B SaaS application with ML-guided validation (Session 76)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
