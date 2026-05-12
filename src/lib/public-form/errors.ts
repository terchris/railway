/** Messages aligned with legacy codes (`06-public-form.md`). */
export const SERVER_ERROR_MESSAGES: Record<string, string> = {
  ACTIVITY_SELECTION_LIMIT_EXCEEDED:
    "For mange aktiviteter ble valgt.\nVelg så mange som det er tillatt, og prøv igjen.",
  INVALID_SUBMIT_DATA:
    "Det er en feil med informasjonen som ble sendt inn.\nPrøv å laste inn siden på nytt, og gå gjennom at alt ser riktig ut.\nKontakt oss hvis problemet vedvarer.",
  SAVE_ERROR:
    "Det skjedde en feil ved lagringen av registreringen.\nVi har tatt vare på informasjonen, og registrerer deg manuelt så snart som mulig.",
}

export function submissionErrorFromPostgrestMessage(message?: string): string {
  const m = message ?? ""
  for (const [code, text] of Object.entries(SERVER_ERROR_MESSAGES)) {
    if (m.includes(code)) return text
  }
  return "Det skjedde en feil ved innsending. Prøv igjen, eller kontakt oss."
}
