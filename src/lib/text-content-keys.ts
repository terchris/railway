/** Keys matching `railway.text_content` (singleton `id = true`), minus `updated_at`. */
export const TEXT_CONTENT_GROUPS: {
  title: string
  fields: { key: string; label: string; multiline?: boolean }[]
}[] = [
  {
    title: "Side",
    fields: [{ key: "content_page_title", label: "Sidetittel (HTML-side)" }],
  },
  {
    title: "Etter innsending (takk)",
    fields: [
      { key: "content_submitted_page_title", label: "Tittel" },
      { key: "content_submitted_title", label: "Hovedoverskrift" },
      { key: "content_submitted_text", label: "Brødtekst", multiline: true },
    ],
  },
  {
    title: "Intro",
    fields: [
      { key: "content_intro_title", label: "Tittel" },
      { key: "content_intro_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Aktivitetsteg",
    fields: [
      { key: "content_activities_title", label: "Tittel" },
      { key: "content_activities_text", label: "Intro", multiline: true },
      { key: "content_activity_categories_text", label: "Over kategoriblokkene", multiline: true },
      { key: "content_activities_footnote", label: "Fotnote", multiline: true },
    ],
  },
  {
    title: "Ingen aktivitet valgt",
    fields: [
      { key: "content_no_selected_activity_title", label: "Tittel" },
      { key: "content_no_selected_activity_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Om deg",
    fields: [
      { key: "content_about_you_title", label: "Tittel" },
      { key: "content_about_you_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Kontakt",
    fields: [
      { key: "content_contact_information_title", label: "Tittel" },
      { key: "content_contact_information_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Språk",
    fields: [
      { key: "content_language_title", label: "Tittel" },
      { key: "content_language_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Medlemskap",
    fields: [
      { key: "content_membership_title", label: "Tittel" },
      { key: "content_membership_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Bekreftelse (før send)",
    fields: [
      { key: "content_confirmation_title", label: "Tittel" },
      { key: "content_confirmation_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Bekreftelse uten valgt aktivitet",
    fields: [
      { key: "content_no_selected_activity_confirmation_title", label: "Tittel" },
      { key: "content_no_selected_activity_confirmation_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Bekreftelse valgte aktiviteter",
    fields: [
      { key: "content_selected_activities_confirmation_title", label: "Tittel" },
      { key: "content_selected_activities_confirmation_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Kommentar",
    fields: [
      { key: "content_comment_title", label: "Tittel" },
      { key: "content_comment_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Evaluering",
    fields: [
      { key: "content_evaluation_title", label: "Tittel" },
      { key: "content_evaluation_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Samtykke",
    fields: [
      { key: "content_consent_title", label: "Tittel" },
      { key: "content_consent_text", label: "Tekst", multiline: true },
    ],
  },
  {
    title: "Bli medlem (takk)",
    fields: [
      { key: "content_become_member_title", label: "Tittel" },
      { key: "content_become_member_text", label: "Tekst", multiline: true },
      { key: "content_become_member_footnote", label: "Fotnote", multiline: true },
    ],
  },
]

export const ALL_TEXT_CONTENT_KEYS = TEXT_CONTENT_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
