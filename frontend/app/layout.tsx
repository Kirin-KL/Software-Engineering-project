import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'КнигаЪ - Библиотека книг',
  description: 'Онлайн-библиотека с возможностью обмена книгами и отзывами',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
