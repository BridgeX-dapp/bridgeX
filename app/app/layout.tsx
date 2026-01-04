import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { loadCasperClickConfig, loadCasperClientConfig, loadEvmClientConfig } from "@/lib/config"
import { ClientProviders } from "./client-providers"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  title: {
    default: "BridgeX",
    template: "%s · BridgeX",
  },
  description: "Bridge your assets seamlessly across blockchain networks.",
  applicationName: "BridgeX",
  generator: "BridgeX",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/icon.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/img/logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/icon.png"],
  },
  openGraph: {
    title: "BridgeX",
    description: "Bridge your assets seamlessly across blockchain networks.",
    url: "/",
    siteName: "BridgeX",
    images: [
      {
        url: "/img/cover.png",
        width: 1200,
        height: 630,
        alt: "BridgeX cover",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BridgeX",
    description: "Bridge your assets seamlessly across blockchain networks.",
    images: ["/img/cover.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const casperConfig = loadCasperClickConfig()
  const casperClientConfig = loadCasperClientConfig()
  const evmClientConfig = loadEvmClientConfig()

  return (
    <html lang="en" className={`${GeistMono.className} dark`}>
      <body className={`${GeistSans.className} font-sans antialiased`}>
        <ClientProviders
          casperClick={{
            appName: casperConfig.APP_NAME,
            appId: casperConfig.CSPR_CLICK_APP_ID,
            chainName: casperConfig.CASPER_CHAIN_NAME,
          }}
          casperClient={casperClientConfig}
          evmClient={evmClientConfig}
        >
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  )
}
