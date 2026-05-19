import styles from "./layout.module.css"

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className={styles.shell}>{children}</div>
}
