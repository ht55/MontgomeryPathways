// frontend/app/layout.tsx

import type { Metadata } from "next"
import "@/styles/globals.css"
import { Montserrat } from "next/font/google"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
})

export const metadata: Metadata = {
  title:       "City of Montgomery — City Intelligence",
  description: "Policy simulation and resident opportunity platform for Montgomery, Alabama",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        {children}
      </body>
    </html>
  )
}