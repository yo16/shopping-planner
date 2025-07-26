import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'お買い物プランナー',
  description: '買い物リストを簡単に作成・送信',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}