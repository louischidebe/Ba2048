import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers" // ✅ our global provider wrapper

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "2048 on Base",
  description: "Play 2048 and earn on Base blockchain",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} bg-background text-foreground min-h-screen`}
      >
        {/* ✅ Nest Wagmi + RainbowKit + Query Providers */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
