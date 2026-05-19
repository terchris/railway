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
  evaluationSelectAnswersComplete,
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

import styles from "./registration-form.module.css"

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

function stepPillClass(reached: boolean, current: boolean): string {
  if (current) return styles.stepPillCurrent
  if (reached) return styles.stepPillReached
  return styles.stepPill
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

  const canLeaveAbout =
    vals.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email.trim()) &&
    vals.phone.trim().length >= 6 &&
    vals.membership_status_id > 0 &&
    vals.language_ids.length >= 1 &&
    evaluationSelectAnswersComplete(vals, bundle)

  const showStepError = useCallback((message: string) => {
    setTopError(message)
    requestAnimationFrame(() => {
      document.getElementById("form-top-error")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
  }, [])

  const goNext = useCallback(async () => {
    setTopError(null)
    if (step === "activities") {
      if (!canLeaveActivities) {
        showStepError("Velg aktiviteter eller et alternativ dersom du ikke ønsker aktivitet.")
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
        showStepError("Tekstfeltet for «ingen aktivitet» må fylles ut.")
        return
      }
      setStep("about")
      return
    }

    if (step === "about") {
      if (!canLeaveAbout) {
        const missing: string[] = []
        if (vals.name.trim().length < 2) missing.push("navn (minst 2 tegn)")
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email.trim())) missing.push("gyldig e-post")
        if (vals.phone.trim().length < 6) missing.push("telefon")
        if (vals.language_ids.length < 1) missing.push("minst ett språk")
        if (vals.membership_status_id <= 0) missing.push("medlemskapsstatus")
        if (!evaluationSelectAnswersComplete(vals, bundle))
          missing.push("alle evalueringsspørsmål med nedtrekksliste")
        showStepError(
          missing.length > 0
            ? `Fyll ut: ${missing.join(", ")}.`
            : "Fyll ut påkrevde felt før du går videre.",
        )
        return
      }
      setStep("confirmation")
    }
  }, [step, vals, bundle, canLeaveActivities, canLeaveAbout, showStepError])

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
    return <div className={styles.loading}>Laster skjema…</div>
  }

  const t = bundle.text

  return (
    <form
      className={styles.form}
      onKeyDown={preventAccidentalSubmit}
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Honeypot — stay empty for humans */}
      <div className={styles.honeypot} aria-hidden>
        <label htmlFor={honeypotField()} className={styles.srOnly}>
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
      <ol className={styles.steps}>
        {registrationSteps.map((s, idx) => (
          <li key={s} className={stepPillClass(idx <= stepIndex, step === s)}>
            {idx + 1}. {s}
          </li>
        ))}
      </ol>

      {topError ? (
        <Alert
          id="form-top-error"
          variant="destructive"
          className={styles.topError}
          role="alert"
          tabIndex={-1}
        >
          {topError}
        </Alert>
      ) : null}

      {step === "intro" && (
        <Card className={styles.introCard}>
          <CardHeader>
            <CardTitle className={styles.introTitle}>
              {t.content_intro_title ?? "Introduksjon"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Editorial HTML comes from curated PostgREST `text_content` payload. */}
            <div
              className={styles.editorial}
              dangerouslySetInnerHTML={{ __html: t.content_intro_text ?? "<p>.</p>" }}
            />
          </CardContent>
        </Card>
      )}

      {step === "activities" && (
        <div className={styles.activitiesWrap}>
          <header className={styles.activitiesHeader}>
            <h2 className={styles.activitiesTitle}>
              {t.content_activities_title ?? "Velg aktiviteter"}
            </h2>
            {t.content_activities_text ? (
              <div
                className={styles.editorialSmall}
                dangerouslySetInnerHTML={{ __html: t.content_activities_text }}
              />
            ) : null}
            {bundle.activitySelectionLimit === 1 ? (
              <p className={styles.limitNotice}>
                Du kan velge <strong>én</strong> hovedaktivitet og øvrige aktiviteter i egne blokker der det finnes tilleggslister.
              </p>
            ) : null}
          </header>

          {bundle.primaryCategories.map(({ category, activities }) => (
            <Card key={`p-${category.id}`}>
              <CardHeader className={styles.categoryCardHeader}>
                <CardTitle className={styles.categoryCardTitle}>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.activityList}>
                  {activities.map((a) => {
                    const sel = vals.primary_activity_ids.includes(a.id)
                    const disabled =
                      limitPrimary &&
                      !sel &&
                      vals.primary_activity_ids.length >= selectionLimit
                    return (
                      <label key={a.id} className={styles.activityRow}>
                        <Checkbox
                          checked={sel}
                          disabled={disabled}
                          onCheckedChange={(c) => toggleId("primary_activity_ids", a.id, c === true)}
                        />
                        <span className={styles.activityRowText}>
                          <span className={styles.activityName}>{a.name}</span>
                          {a.info ? (
                            <Collapsible>
                              <CollapsibleTrigger type="button" className={styles.activityInfoTrigger}>
                                Mer informasjon
                              </CollapsibleTrigger>
                              <CollapsibleContent className={styles.activityInfoContent}>
                                {a.info}
                              </CollapsibleContent>
                            </Collapsible>
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {bundle.additionalCategories.length > 0 && (
            <div className={styles.additionalGroup}>
              <h3 className={styles.additionalGroupHeading}>
                {t.content_activity_categories_text ?? "Flere aktiviteter"}
              </h3>
              {bundle.additionalCategories.map(({ category, activities }) => (
                <Card key={`add-${category.id}`}>
                  <CardHeader className={styles.categoryCardHeader}>
                    <CardTitle className={styles.categoryCardTitle}>{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.activityList}>
                      {activities.map((a) => (
                        <label key={a.id} className={styles.activityRow}>
                          <Checkbox
                            checked={vals.additional_activity_ids.includes(a.id)}
                            onCheckedChange={(c) =>
                              toggleId("additional_activity_ids", a.id, c === true)
                            }
                          />
                          <span className={styles.activityName}>{a.name}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {acts === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className={styles.noSelectedTitle}>{t.content_no_selected_activity_title}</CardTitle>
                {t.content_no_selected_activity_text ? (
                  <p className={styles.noSelectedSubtext}>{t.content_no_selected_activity_text}</p>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className={styles.noSelectedContent}>
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
                    <div className={styles.radioRow}>
                      <RadioGroupItem id="nosel-none" value="none" />
                      <Label htmlFor="nosel-none">(ikke aktuelt — jeg planlegger aktivitet senere)</Label>
                    </div>
                    {bundle.noSelectedActivityOptions.map((o) => (
                      <div key={o.id} className={styles.radioRowStart}>
                        <RadioGroupItem id={`nosel-${o.id}`} value={String(o.id)} />
                        <Label htmlFor={`nosel-${o.id}`}>{o.label}</Label>
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
                      <div className={styles.inputBlock}>
                        <Label htmlFor="no-act-input">{opt.input_field_label}</Label>
                        {opt.input_field_info ? (
                          <p className={styles.inputHelp}>{opt.input_field_info}</p>
                        ) : null}
                        <Textarea id="no-act-input" {...methods.register("no_selected_activity_input")} />
                      </div>
                    ) : null
                  })()}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {step === "about" && (
        <div className={styles.aboutWrap}>
          <section className={styles.aboutSection}>
            <h2 className={styles.sectionHeading}>{t.content_contact_information_title}</h2>
            <div className={styles.grid2}>
              <div className={styles.fieldFull}>
                <Label htmlFor="name">Navn</Label>
                <Input id="name" {...methods.register("name")} />
              </div>
              <div className={styles.field}>
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" {...methods.register("email")} />
              </div>
              <div className={styles.field}>
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...methods.register("phone")} />
              </div>
              <div className={styles.fieldFull}>
                <Label htmlFor="comment">{t.content_comment_title}</Label>
                {t.content_comment_text ? (
                  <p
                    className={styles.inputHelp}
                    dangerouslySetInnerHTML={{ __html: t.content_comment_text }}
                  />
                ) : null}
                <Textarea id="comment" {...methods.register("comment")} />
              </div>
            </div>
          </section>

          <section className={styles.aboutSection}>
            <h2 className={styles.sectionHeading}>{t.content_language_title}</h2>
            <div className={styles.grid2}>
              {bundle.languages.map((l) => {
                const sel = vals.language_ids.includes(l.id)
                return (
                  <label key={l.id} className={styles.checkboxRow}>
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

          <section className={styles.aboutSection}>
            <h2 className={styles.sectionHeading}>{t.content_membership_title}</h2>
            {t.content_membership_text ? (
              <div
                className={styles.editorialSmall}
                dangerouslySetInnerHTML={{ __html: t.content_membership_text }}
              />
            ) : null}
            <Controller
              name="membership_status_id"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value === 0 ? "" : field.value.toString()}
                  onValueChange={(v) => field.onChange(Number(v))}
                  className={styles.radioStack}
                >
                  {bundle.membershipStatuses.map((m) => (
                    <div key={m.id} className={styles.radioRowStart}>
                      <RadioGroupItem id={`member-${m.id}`} value={String(m.id)} />
                      <Label htmlFor={`member-${m.id}`}>{m.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
          </section>

          <section className={styles.aboutSection}>
            <h2 className={styles.sectionHeading}>{t.content_evaluation_title}</h2>
            {t.content_evaluation_text ? (
              <div
                className={styles.editorialSmall}
                dangerouslySetInnerHTML={{ __html: t.content_evaluation_text }}
              />
            ) : null}
            {bundle.evaluationQuestions.map((q) =>
              q.question_type === "select" ? (
                <div key={q.id} className={styles.field}>
                  <Label>{q.label}</Label>
                  <select
                    className={styles.select}
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
                <div key={q.id} className={styles.field}>
                  <Label htmlFor={`ev-${q.id}`}>
                    {q.label}
                    <span className={styles.optionalMarker}>(valgfritt)</span>
                  </Label>
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
        <div className={styles.confirmWrap}>
          <h2 className={styles.sectionHeading}>{t.content_confirmation_title}</h2>
          {t.content_confirmation_text ? (
            <div
              className={styles.editorialSmall}
              dangerouslySetInnerHTML={{ __html: t.content_confirmation_text }}
            />
          ) : null}
          <ul className={styles.summaryList}>
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
            <h3 className={styles.summarySectionHeading}>Aktiviteter</h3>
            {acts === 0 && vals.no_selected_activity_option_id !== null ? (
              <p className={styles.summaryEmpty}>
                {bundle.noSelectedActivityOptions.find((o) => o.id === vals.no_selected_activity_option_id)
                  ?.label ?? "(ingen aktivitet)"}
              </p>
            ) : (
              <ul className={styles.summaryItemList}>
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
            <h3 className={styles.summarySectionHeading}>Samtykke</h3>
            {t.content_consent_title ? <p className={styles.consentTitle}>{t.content_consent_title}</p> : null}
            <div
              className={styles.consentText}
              dangerouslySetInnerHTML={{ __html: t.content_consent_text ?? "" }}
            />
            <Controller
              name="consentAccepted"
              control={control}
              render={({ field }) => (
                <label className={styles.checkboxRowStart}>
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

      <footer className={styles.footer}>
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
