import Link from "next/link"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./admin-shared.module.css"

/** Shown when `POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` is unset. */
export function StaffJwtMissing({ title }: { title: string }) {
  return (
    <div className={styles.staffJwtMissing}>
      <h1 className={styles.staffJwtMissingTitle}>{title}</h1>
      <p className={adminStyles.warningBanner}>
        Sett <code className={adminStyles.codeOnLight}>POSTGREST_ADMIN_JWT</code> eller{" "}
        <code className={adminStyles.codeOnLight}>POSTGREST_STAFF_JWT_UIS</code> med en bearer-token som
        har kapabiliteten <code className={adminStyles.codeOnLight}>content:read</code> /
        <code className={adminStyles.codeOnLight}>content:write</code> ·{" "}
        <Link href="/admin" className={adminStyles.actionLink}>
          Tilbake til oversikt
        </Link>
      </p>
    </div>
  )
}
