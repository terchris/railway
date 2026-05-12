export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="flex min-h-full flex-1 flex-col bg-zinc-50">{children}</div>
}
