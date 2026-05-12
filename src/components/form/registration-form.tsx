"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import type { RegistrationBundle } from "@/lib/public-form/bundle"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  buildRpcPayload,
  registrationEmptyValues,
  validateRegistrationSubmit,
  type RegistrationFormValues,
  type SubmitPayloadRpc,
} from "@/components/form/schema"
import {
  clearRegistrationPersistence,
  debounce,
  honeypotField,
  persistDraft,
  persistStep,
  readPersistedDraft,
  readPersistedStep,
  registrationSteps,
  type PersistedFormFields,
  type RegistrationStep,
} from "@/components/form/persist"
import { cn } from "@/lib/utils"

type Props = { bundle: RegistrationBundle }

function hydrateValues(bundle: RegistrationBundle, persisted: PersistedFormFields | null): RegistrationFormValues {
  const v: RegistrationFormValues = {
    ...registrationEmptyValues,
    ...(persisted ?? {}),
    consentAccepted: false,
  }
  for (const q of bundle.evaluationQuestions) {
    const k = String(q.id)
    v.evaluation[k] = v.evaluation[k] ?? ""
  }
  return v
}

function persistSnapshot(values: RegistrationFormValues): PersistedFormFields {
  const { consentAccepted, ...rest } = values
  void consentAccepted
  return rest
}

function activityLabel(bundle: RegistrationBundle, id: number): string | null {
  for (const grp of [...bundle.primaryCategories, ...bundle.additionalCategories]) {
    const hit = grp.activities.find((a) => a.id === id)
    if (hit) return `${grp.category.name} — ${hit.name}`
  }
  return null
}

function preventAccidentalSubmit(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return
  const target = e.target as HTMLElement
  if (target instanceof HTMLButtonElement) return
  if (target instanceof HTMLTextAreaElement) return
  if (target instanceof HTMLSelectElement) return
  if (target instanceof HTMLInputElement) {
    if (target.type === "submit" || target.type === "button") return
    e.preventDefault()
  }
}

export function RegistrationForm({ bundle }: Props) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState<RegistrationStep>("intro")
  const [honeypot, setHoneypot] = useState("")
  const [topError, setTopError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const methods = useForm<RegistrationFormValues>({
    defaultValues: registrationEmptyValues,
    mode: "onChange",
  })

  const { control, watch, reset, setValue, getValues } = methods

  useEffect(() => {
    const persistedForm = readPersistedDraft()
    const persistedStep = readPersistedStep()
    reset(hydrateValues(bundle, persistedForm))
    setStep(persistedStep && registrationSteps.includes(persistedStep) ? persistedStep : "intro")
    setHydrated(true)
  }, [bundle, reset])

  const debSave = useMemo(
    () =>
      debounce(() => {
        persistDraft(persistSnapshot(getValues()))
        persistStep(step)
      }, 500),
    [step, getValues],
  )

  useEffect(() => {
    // RHF subscribe: autosave draft; React Compiler intentionally skips optimizing `watch`-based subscriptions.
    // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() subscription is the supported pattern here
    const sub = watch(() => {
      if (hydrated) debSave()
    })
    return () => sub.unsubscribe()
  }, [watch, hydrated, debSave])

  useEffect(() => {
    if (hydrated) persistStep(step)
  }, [step, hydrated])

  const vals = watch()
  const acts = vals.primary_activity_ids.length + vals.additional_activity_ids.length
  const selectionLimit = bundle.activitySelectionLimit
  const limitPrimary = selectionLimit > 0

  const toggleId = (
    field: "primary_activity_ids" | "additional_activity_ids",
    id: number,
    on: boolean,
  ) => {
    const prev = getValues(field)
    let next = on ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id)
    if (field === "primary_activity_ids" && limitPrimary && selectionLimit !== undefined && on) {
      if (next.length > selectionLimit)
        next = next.slice(0, selectionLimit)
    }
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
    setTopError(null)
    if ((field === "primary_activity_ids" || field === "additional_activity_ids") && next.length > 0) {
      setValue("no_selected_activity_option_id", null)
      setValue("no_selected_activity_input", "")
    }
  }

  const stepIndex = registrationSteps.indexOf(step)

  const canLeaveActivities =
    vals.primary_activity_ids.length + vals.additional_activity_ids.length > 0 ||
    !!vals.no_selected_activity_option_id

  const evaluationComplete = (): boolean =>
    bundle.evaluationQuestions.every((q) => (vals.evaluation[String(q.id)] ?? "").trim().length > 0)

  const canLeaveAbout =
    vals.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email.trim()) &&
    vals.phone.trim().length >= 6 &&
    vals.membership_status_id > 0 &&
    vals.language_ids.length >= 1 &&
    evaluationComplete()

  const goNext = useCallback(async () => {
    setTopError(null)
    if (step === "activities") {
      if (!canLeaveActivities) {
        setTopError("Velg aktiviteter eller et alternativ dersom du ikke ønsker aktivitet.")
        return
      }
      const optIdNs = vals.no_selected_activity_option_id
      const optNs =
        optIdNs !== null
          ? bundle.noSelectedActivityOptions.find((o) => o.id === optIdNs)
          : undefined
      if (
        vals.primary_activity_ids.length + vals.additional_activity_ids.length === 0 &&
        optNs?.has_input_field &&
        !vals.no_selected_activity_input.trim()
      ) {
        setTopError("Tekstfeltet for «ingen aktivitet» må fylles ut.")
        return
      }
      setStep("about")
      return
    }

    if (step === "about") {
      if (!canLeaveAbout) {
        setTopError(
          "Fyll ut påkrevde felt (navn, e-post, telefon, språk, medlemskapsstatus og evaluering).",
        )
        return
      }
      setStep("confirmation")
    }
  }, [step, vals, bundle, canLeaveActivities, canLeaveAbout])

  const goBack = () => {
    setTopError(null)
    const i = registrationSteps.indexOf(step)
    if (i > 0) setStep(registrationSteps[i - 1]!)
  }

  const submit = methods.handleSubmit(async () => {
    setTopError(null)
    const snapshot = getValues()
    const ok = validateRegistrationSubmit(snapshot, bundle)
    if (!ok.success) {
      setTopError(ok.error.issues.map((e) => e.message).join("\n"))
      return
    }
    const rpc: SubmitPayloadRpc = buildRpcPayload(bundle, snapshot)
    setSubmitting(true)
    try {
      const hpKey = honeypotField()
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration: rpc,
          [hpKey]: honeypot,
        }),
      })
      const data = (await res.json()) as {
        redirect?: string
        error?: string
      }
      if (!res.ok) {
        setTopError(data.error ?? "Innsending feilet.")
        setSubmitting(false)
        return
      }
      if (typeof data.redirect === "string") {
        clearRegistrationPersistence()
        router.push(data.redirect)
      }
    } catch {
      setTopError("Nettverksfeil — prøv igjen.")
    } finally {
      setSubmitting(false)
    }
  })

  if (!hydrated) {
    return (
      <div className="py-24 text-center text-sm text-zinc-500">
        Laster skjema…
      </div>
    )
  }

  const t = bundle.text

  return (
    <form
      className="mx-auto max-w-2xl px-6 py-12"
      onKeyDown={preventAccidentalSubmit}
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Honeypot — stay empty for humans */}
      <div className="absolute -left-[2000px] h-px w-px overflow-hidden opacity-0" aria-hidden>
        <label htmlFor={honeypotField()} className="sr-only">
          Company
        </label>
        <Input
          id={honeypotField()}
          name={honeypotField()}
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Step pills */}
      <ol className="mb-10 flex gap-2 text-xs font-medium text-zinc-500">
        {registrationSteps.map((s, idx) => (
          <li
            key={s}
            className={cn(
              "rounded-full px-3 py-1 capitalize",
              step === s ? "bg-red-700 text-white" : "bg-zinc-100",
              idx <= stepIndex ? "opacity-100" : "opacity-45",
            )}
          >
            {idx + 1}. {s}
          </li>
        ))}
      </ol>

      {topError ? (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          {topError}
        </Alert>
      ) : null}

      {step === "intro" && (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t.content_intro_title ?? "Introduksjon"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 prose prose-neutral max-w-none text-zinc-700">
            {/* Editorial HTML comes from curated PostgREST `text_content` payload. */}
            <div dangerouslySetInnerHTML={{ __html: t.content_intro_text ?? "<p>.</p>" }} />
          </CardContent>
        </Card>
      )}

      {step === "activities" && (
        <div className="space-y-8">
          <header>
            <h2 className="text-2xl font-semibold text-zinc-900">
              {t.content_activities_title ?? "Velg aktiviteter"}
            </h2>
            {t.content_activities_text ? (
              <div
                className="mt-2 max-w-prose text-zinc-600 prose prose-sm"
                dangerouslySetInnerHTML={{ __html: t.content_activities_text }}
              />
            ) : null}
            {bundle.activitySelectionLimit === 1 ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Du kan velge <strong>én</strong> hovedaktivitet og øvrige aktiviteter i egne blokker der det finnes tilleggslister.
              </p>
            ) : null}
          </header>

          {bundle.primaryCategories.map(({ category, activities }) => (
            <Card key={`p-${category.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {activities.map((a) => {
                  const sel = vals.primary_activity_ids.includes(a.id)
                  const disabled =
                    limitPrimary &&
                    !sel &&
                    vals.primary_activity_ids.length >= selectionLimit
                  return (
                    <label key={a.id} className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={sel}
                        disabled={disabled}
                        onCheckedChange={(c) => toggleId("primary_activity_ids", a.id, c === true)}
                      />
                      <span className="space-y-1">
                        <span className="font-medium text-zinc-900">{a.name}</span>
                        {a.info ? (
                          <Collapsible>
                            <CollapsibleTrigger type="button" className="text-xs text-red-700 underline">
                              Mer informasjon
                            </CollapsibleTrigger>
                            <CollapsibleContent className="max-w-prose pt-2 text-xs text-zinc-600 prose prose-neutral">
                              {a.info}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : null}
                      </span>
                    </label>
                  )
                })}
              </CardContent>
            </Card>
          ))}

          {bundle.additionalCategories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{t.content_activity_categories_text ?? "Flere aktiviteter"}</h3>
              {bundle.additionalCategories.map(({ category, activities }) => (
                <Card key={`add-${category.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {activities.map((a) => (
                      <label key={a.id} className="flex items-start gap-3 text-sm">
                        <Checkbox
                          checked={vals.additional_activity_ids.includes(a.id)}
                          onCheckedChange={(c) =>
                            toggleId("additional_activity_ids", a.id, c === true)
                          }
                        />
                        <span className="font-medium text-zinc-900">{a.name}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {acts === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t.content_no_selected_activity_title}</CardTitle>
                {t.content_no_selected_activity_text ? (
                  <div className="prose prose-sm text-zinc-600">{t.content_no_selected_activity_text}</div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup
                  value={vals.no_selected_activity_option_id?.toString() ?? "none"}
                  onValueChange={(v) =>
                    setValue(
                      "no_selected_activity_option_id",
                      v === "none" ? null : Number(v),
                      { shouldDirty: true },
                    )
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="nosel-none" value="none" />
                    <Label htmlFor="nosel-none">(ikke aktuelt — jeg planlegger aktivitet senere)</Label>
                  </div>
                  {bundle.noSelectedActivityOptions.map((o) => (
                    <div key={o.id} className="flex items-start gap-2">
                      <RadioGroupItem id={`nosel-${o.id}`} value={String(o.id)} />
                      <div className="space-y-1">
                        <Label htmlFor={`nosel-${o.id}`}>{o.label}</Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {(() => {
                  const nsId = vals.no_selected_activity_option_id
                  const opt =
                    nsId !== null
                      ? bundle.noSelectedActivityOptions.find((o) => o.id === nsId)
                      : undefined
                  return opt?.has_input_field ? (
                    <div className="space-y-2">
                      <Label htmlFor="no-act-input">{opt.input_field_label}</Label>
                      {opt.input_field_info ? (
                        <p className="text-xs text-zinc-500">{opt.input_field_info}</p>
                      ) : null}
                      <Textarea id="no-act-input" {...methods.register("no_selected_activity_input")} />
                    </div>
                  ) : null
                })()}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {step === "about" && (
        <div className="flex flex-col gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t.content_contact_information_title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Navn</Label>
                <Input id="name" {...methods.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" {...methods.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...methods.register("phone")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="comment">{t.content_comment_title}</Label>
                {t.content_comment_text ? (
                  <p
                    className="text-xs text-zinc-500 prose prose-neutral"
                    dangerouslySetInnerHTML={{ __html: t.content_comment_text }}
                  />
                ) : null}
                <Textarea id="comment" {...methods.register("comment")} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">{t.content_language_title}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {bundle.languages.map((l) => {
                const sel = vals.language_ids.includes(l.id)
                return (
                  <label key={l.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={sel}
                      onCheckedChange={(checked) => {
                        const next =
                          checked === true
                            ? [...new Set([...vals.language_ids, l.id])]
                            : vals.language_ids.filter((x) => x !== l.id)
                        setValue("language_ids", next, { shouldDirty: true })
                      }}
                    />
                    <span>{l.name}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">{t.content_membership_title}</h2>
            {t.content_membership_text ? (
              <div className="prose prose-sm mb-4 max-w-none" dangerouslySetInnerHTML={{ __html: t.content_membership_text }} />
            ) : null}
            <Controller
              name="membership_status_id"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value === 0 ? "" : field.value.toString()}
                  onValueChange={(v) => field.onChange(Number(v))}
                  className="flex flex-col gap-2"
                >
                  {bundle.membershipStatuses.map((m) => (
                    <div key={m.id} className="flex items-start gap-2">
                      <RadioGroupItem id={`member-${m.id}`} value={String(m.id)} />
                      <Label htmlFor={`member-${m.id}`}>{m.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold">{t.content_evaluation_title}</h2>
            {t.content_evaluation_text ? (
              <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: t.content_evaluation_text }} />
            ) : null}
            {bundle.evaluationQuestions.map((q) =>
              q.question_type === "select" ? (
                <div key={q.id} className="space-y-2">
                  <Label>{q.label}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                    value={vals.evaluation[String(q.id)] ?? ""}
                    onChange={(e) =>
                      setValue(
                        "evaluation",
                        { ...getValues("evaluation"), [String(q.id)]: e.target.value },
                        { shouldDirty: true },
                      )
                    }
                  >
                    <option value="">Velg …</option>
                    {bundle.evaluationOptionsAll.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={`ev-${q.id}`}>{q.label}</Label>
                  <Textarea
                    id={`ev-${q.id}`}
                    value={vals.evaluation[String(q.id)] ?? ""}
                    onChange={(e) =>
                      setValue(
                        "evaluation",
                        { ...getValues("evaluation"), [String(q.id)]: e.target.value },
                        { shouldDirty: true },
                      )
                    }
                  />
                </div>
              ),
            )}
          </section>
        </div>
      )}

      {step === "confirmation" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">{t.content_confirmation_title}</h2>
          {t.content_confirmation_text ? (
            <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: t.content_confirmation_text }} />
          ) : null}
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
            <li>
              <strong>Navn:</strong> {vals.name || "–"}
            </li>
            <li>
              <strong>E-post:</strong> {vals.email || "–"}
            </li>
            <li>
              <strong>Telefon:</strong> {vals.phone || "–"}
            </li>
          </ul>
          <section>
            <h3 className="font-semibold">Aktiviteter</h3>
            {acts === 0 && vals.no_selected_activity_option_id !== null ? (
              <p className="text-sm text-zinc-600">
                {bundle.noSelectedActivityOptions.find((o) => o.id === vals.no_selected_activity_option_id)
                  ?.label ?? "(ingen aktivitet)"}
              </p>
            ) : (
              <ul className="mt-2 list-disc pl-6 text-sm text-zinc-700">
                {vals.primary_activity_ids.map((id) => (
                  <li key={`p-${id}`}>{activityLabel(bundle, id) ?? id}</li>
                ))}
                {vals.additional_activity_ids.map((id) => (
                  <li key={`a-${id}`}>{activityLabel(bundle, id) ?? id}</li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="font-semibold">Samtykke</h3>
            {t.content_consent_title ? <p className="text-sm font-medium">{t.content_consent_title}</p> : null}
            <div className="prose prose-sm max-w-none pb-4" dangerouslySetInnerHTML={{ __html: t.content_consent_text ?? "" }} />
            <Controller
              name="consentAccepted"
              control={control}
              render={({ field }) => (
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                  <span>Jeg godtar teksten over og vil sende inn registreringen.</span>
                </label>
              )}
            />
          </section>
          <noscript>
            <Alert variant="destructive">
              JavaScript må være slått på for å sende dette skjemaet (<code>/public-form</code> beslutning § no-JS).
            </Alert>
          </noscript>
        </div>
      )}

      <footer className="mt-14 flex flex-wrap items-center gap-4">
        <Button type="button" variant="secondary" onClick={goBack} disabled={step === "intro"}>
          Tilbake
        </Button>
        {step !== "confirmation" ? (
          <Button
            type="button"
            onClick={() => {
              void (async () => {
                if (step === "intro") setStep("activities")
                else await goNext()
              })()
            }}
          >
            Neste
          </Button>
        ) : (
          <Button type="button" disabled={submitting} onClick={() => void submit()}>
            {submitting ? "Sender inn…" : "Send inn registrering"}
          </Button>
        )}
      </footer>
    </form>
  )
}
