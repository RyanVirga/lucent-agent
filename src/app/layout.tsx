import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lucent Agent - Transaction Coordinator',
  description: 'Next generation real estate command center for agents',
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

