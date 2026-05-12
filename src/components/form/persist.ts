import type { RegistrationFormValues } from "./schema"

export function honeypotField(): string {
  return (
    typeof process.env.NEXT_PUBLIC_HONEYPOT_FIELD_NAME === "string"
      ? process.env.NEXT_PUBLIC_HONEYPOT_FIELD_NAME.trim()
      : ""
  ) || "billing_email"
}

export type RegistrationStep = "intro" | "activities" | "about" | "confirmation"

export const registrationSteps: RegistrationStep[] = ["intro", "activities", "about", "confirmation"]

const stepLS = "railway_registration_step_v1"
const draftLS = "railway_registration_draft_v1"

export type PersistedFormFields = Omit<RegistrationFormValues, "consentAccepted">

export function readPersistedDraft(): PersistedFormFields | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(draftLS)
    if (!raw) return null
    return JSON.parse(raw) as PersistedFormFields
  } catch {
    return null
  }
}

export function readPersistedStep(): RegistrationStep | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(stepLS)
  if (!raw) return null
  return registrationSteps.includes(raw as RegistrationStep) ? (raw as RegistrationStep) : null
}

export function persistStep(step: RegistrationStep): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(stepLS, step)
}

export function persistDraft(values: PersistedFormFields): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(draftLS, JSON.stringify(values))
}

export function clearRegistrationPersistence(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(stepLS)
  window.localStorage.removeItem(draftLS)
}

export function debounce<TArgs extends unknown[]>(fn: (...a: TArgs) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined
  return (...a: TArgs) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...a), ms)
  }
}
