import { AdminLoginForm } from "@/components/admin/login-form"

export default function AdminLoginPage() {
  const configured = !!process.env.ADMIN_PASSWORD?.trim()

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {!configured ? (
        <p className="mb-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Sett <code className="rounded bg-white px-1">ADMIN_PASSWORD</code> og{" "}
          <code className="rounded bg-white px-1">ADMIN_COOKIE_SECRET</code> i{" "}
          <code className="rounded bg-white px-1">.env</code> og start appen på nytt.
        </p>
      ) : null}
      <AdminLoginForm />
      <p className="mt-10 max-w-md text-center text-xs text-zinc-500">
        Dette er en forenklet app-passord-login. Full JWT- og kapabilitetsintegrasjon (08-auth)
        erstatter denne seinere for produksjon.
      </p>
    </main>
  )
}
