import type { Metadata } from "next"
import Link from "next/link"

import styles from "./layout.module.css"

export const metadata: Metadata = {
  title: "Admin · Frivilligregistrering",
  description: "Intern oversikt og lister (utkast).",
}

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={styles.shell}>
      <div className={styles.banner}>
        <div className={styles.bannerInner}>
          <span className={styles.bannerLabel}>Administrasjon (utkast)</span>
          <Link href="/" className={styles.bannerLink}>
            Til forsiden
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}
