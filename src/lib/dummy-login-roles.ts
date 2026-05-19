import { KNOWN_CAPABILITY_GROUPS } from "@/lib/staff-jwt-caps"

export type RoleKind = "pg-role" | "session-profile"

export type RoleProfile = {
  id: string
  label: string
  description: string
  kind: RoleKind
  sessionRole: "anon" | "authenticated" | null
  capabilities: readonly string[] | null
  disabled: boolean
  disabledReason?: string
}

type Cap = (typeof KNOWN_CAPABILITY_GROUPS)[number]

function caps(...c: Cap[]): readonly Cap[] {
  return c
}

export const DUMMY_LOGIN_ROLES: readonly RoleProfile[] = [
  {
    id: "railway_owner",
    label: "railway_owner",
    description: "Owner of objects in the railway and auth schemas.",
    kind: "pg-role",
    sessionRole: null,
    capabilities: null,
    disabled: true,
    disabledReason: "Owns DDL / SECURITY DEFINER functions — not a session role.",
  },
  {
    id: "anon",
    label: "anon",
    description: "Offentlig PostgREST-økt. Sletter admin-cookien.",
    kind: "session-profile",
    sessionRole: "anon",
    capabilities: null,
    disabled: false,
  },
  {
    id: "authenticated_full_admin",
    label: "Full admin",
    description: "authenticated with the admin capability (treated as all caps).",
    kind: "session-profile",
    sessionRole: "authenticated",
    capabilities: caps("admin"),
    disabled: false,
  },
  {
    id: "authenticated_registrations",
    label: "Registrations admin",
    description: "authenticated with registrations:read and registrations:write only.",
    kind: "session-profile",
    sessionRole: "authenticated",
    capabilities: caps("registrations:read", "registrations:write"),
    disabled: false,
  },
  {
    id: "authenticated_content",
    label: "Content editor",
    description: "authenticated with content:read and content:write only.",
    kind: "session-profile",
    sessionRole: "authenticated",
    capabilities: caps("content:read", "content:write"),
    disabled: false,
  },
  {
    id: "authenticated_applog",
    label: "App-log viewer",
    description: "authenticated with app_log:read only.",
    kind: "session-profile",
    sessionRole: "authenticated",
    capabilities: caps("app_log:read"),
    disabled: false,
  },
  {
    id: "authenticated_users",
    label: "Users admin",
    description: "authenticated with users:read and users:write only.",
    kind: "session-profile",
    sessionRole: "authenticated",
    capabilities: caps("users:read", "users:write"),
    disabled: false,
  },
  {
    id: "authenticator",
    label: "authenticator",
    description: "Runtime DB user PostgREST connects as.",
    kind: "pg-role",
    sessionRole: null,
    capabilities: null,
    disabled: true,
    disabledReason: "PostgREST runtime connection role — never appears in a user session.",
  },
]

export function findRoleProfile(id: string): RoleProfile | undefined {
  return DUMMY_LOGIN_ROLES.find((p) => p.id === id)
}
