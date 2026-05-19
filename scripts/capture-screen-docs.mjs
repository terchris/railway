#!/usr/bin/env node
/**
 * Capture full-page screenshots into website/static/img/screenshots/ for documentation.
 * Requires: Next running (default http://localhost:3010). For admin pages the server must allow
 * GET /api/admin/bootstrap-session (development or ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1 on the server),
 * with POSTGREST_ADMIN_JWT / POSTGREST_STAFF_JWT_UIS verifying against JWT_SECRET.
 *
 * Usage: npm run docs:screens
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const outDir = path.join(root, "website", "static", "img", "screenshots")

const BASE = (process.env.APP_URL ?? "http://localhost:3010").replace(/\/$/, "")

fs.mkdirSync(outDir, { recursive: true })

/**
 * @param {import('playwright').Page} page
 * @param {string} id
 */
async function shot(page, id) {
  const file = path.join(outDir, `${id}.png`)
  try {
    await page.waitForTimeout(450)
    await page.screenshot({ path: file, fullPage: true })
    console.log("ok ", id)
  } catch (e) {
    console.error("fail", id, e instanceof Error ? e.message : e)
  }
}

/**
 * @param {import('playwright').Page} page
 * @param {string} urlPath
 */
async function goto(page, urlPath) {
  const url = urlPath.startsWith("http") ? urlPath : `${BASE}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 })
}

/**
 * @param {import('playwright').Page} page
 * @param {(href: string) => boolean} test
 */
async function gotoFirstMatchingHref(page, test) {
  const links = page.locator('a[href^="/"]')
  const n = await links.count()
  for (let i = 0; i < n; i++) {
    const h = await links.nth(i).getAttribute("href")
    if (h && test(h)) {
      await goto(page, h)
      return true
    }
  }
  return false
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  // —— Public —— //
  await goto(page, "/")
  await shot(page, "rwg-pub-home")

  await goto(page, "/thank-you")
  await shot(page, "rwg-pub-thank-you")

  await goto(page, "/thank-you?complete-membership=true")
  await shot(page, "rwg-pub-thank-you-membership")

  // Wizard steps (Norwegian UI). The intro step is the landing page itself
  // (`/`), already captured as rwg-pub-home above — no separate "intro" shot.
  // Step order matches src/components/form/persist.ts: intro → activities →
  // about → confirmation. Each step except intro has form validation that
  // blocks "Neste" until requirements are met, so we fill enough fields to
  // advance after each capture.
  await goto(page, "/")
  await page.getByRole("button", { name: "Neste" }).click()

  // Activities step: capture, then pick the first activity checkbox so the
  // form lets us advance (canLeaveActivities requires at least one activity
  // OR a positive no_selected_activity_option_id; the "ikke aktuelt" default
  // radio sets the value to null, so it doesn't satisfy the check).
  await shot(page, "rwg-pub-wizard-activities")
  await page.getByRole("checkbox").first().click()
  await page.getByRole("button", { name: "Neste" }).click()
  // Wait for the about step to render before continuing.
  await page.waitForSelector("#name", { timeout: 10000 })

  // About step: capture, then fill all required fields before next.
  await shot(page, "rwg-pub-wizard-about")
  await page.fill("#name", "Test Bruker")
  await page.fill("#email", "test@example.com")
  await page.fill("#phone", "12345678")
  await page.getByRole("checkbox").first().click() // first language
  await page.getByRole("radio").first().click() // first membership status
  // Answer every evaluation question with a <select> (pick option index 1 —
  // option 0 is usually the empty/placeholder).
  const evalSelects = await page.locator("select").all()
  for (const sel of evalSelects) {
    const opts = await sel.locator("option").all()
    if (opts.length > 1) {
      const val = await opts[1].getAttribute("value")
      if (val) await sel.selectOption(val)
    }
  }
  await page.getByRole("button", { name: "Neste" }).click()
  // Wait for the confirmation step's submit button before capturing — proves
  // we actually advanced past the about step's validation.
  await page.getByRole("button", { name: "Send inn registrering" }).waitFor({ timeout: 10000 })
  await shot(page, "rwg-pub-wizard-confirmation")

  // Admin login form
  await goto(page, "/admin/login?manual=1")
  await shot(page, "rwg-adm-login")

  // Admin session (server-side cookie via redirect)
  await goto(page, "/api/admin/bootstrap-session")
  await page.waitForTimeout(800)
  const adminOk = page.url().includes("/admin") && !page.url().includes("/login")

  if (!adminOk) {
    console.warn(
      "[docs:screens] Admin bootstrap failed (server needs JWT env + bootstrap-session allowed). Saving placeholder only.",
    )
    await shot(page, "rwg-adm-bootstrap-failed")
    await browser.close()
    return
  }

  const adminShots = [
    ["rwg-adm-overview", "/admin"],
    ["rwg-adm-registrations", "/admin/registrations"],
    ["rwg-adm-activities", "/admin/activities"],
    ["rwg-adm-activities-new", "/admin/activities/new"],
    ["rwg-adm-additional-activities", "/admin/additional-activities"],
    ["rwg-adm-activity-categories", "/admin/activity-categories"],
    ["rwg-adm-activity-settings", "/admin/activity-settings"],
    ["rwg-adm-activities-text", "/admin/activities-text"],
    ["rwg-adm-text-content", "/admin/text-content"],
    ["rwg-adm-print-manuscript", "/admin/print/manuscript"],
    ["rwg-adm-print-form", "/admin/print/form"],
    ["rwg-adm-skemadata", "/admin/skemadata"],
    ["rwg-adm-app-log", "/admin/app-log"],
    ["rwg-adm-staff", "/admin/staff"],
    ["rwg-adm-eval-questions", "/admin/evaluation/questions"],
    ["rwg-adm-eval-options", "/admin/evaluation/options"],
    ["rwg-adm-languages", "/admin/languages"],
    ["rwg-adm-membership-statuses", "/admin/membership-statuses"],
    ["rwg-adm-membership-options", "/admin/membership-options"],
    ["rwg-adm-no-selected-options", "/admin/no-selected-options"],
  ]

  for (const [id, p] of adminShots) {
    await goto(page, p)
    await shot(page, id)
  }

  await goto(page, "/admin/registrations")
  const regOk = await gotoFirstMatchingHref(page, (h) => /^\/admin\/registrations\/\d+$/.test(h))
  if (regOk) await shot(page, "rwg-adm-registration-detail")

  await goto(page, "/admin/activities")
  const actOk = await gotoFirstMatchingHref(page, (h) => /^\/admin\/activities\/\d+$/.test(h))
  if (actOk) await shot(page, "rwg-adm-activity-detail")

  const detailRuns = [
    ["/admin/evaluation/questions", "rwg-adm-eval-question-detail", /^\/admin\/evaluation\/questions\/\d+$/],
    ["/admin/evaluation/options", "rwg-adm-eval-option-detail", /^\/admin\/evaluation\/options\/\d+$/],
    ["/admin/languages", "rwg-adm-language-detail", /^\/admin\/languages\/\d+$/],
    ["/admin/membership-statuses", "rwg-adm-membership-status-detail", /^\/admin\/membership-statuses\/\d+$/],
    ["/admin/membership-options", "rwg-adm-membership-option-detail", /^\/admin\/membership-options\/\d+$/],
    ["/admin/no-selected-options", "rwg-adm-no-selected-option-detail", /^\/admin\/no-selected-options\/\d+$/],
  ]

  for (const [listPath, sid, rex] of detailRuns) {
    await goto(page, listPath)
    const ok = await gotoFirstMatchingHref(page, (h) => rex.test(h))
    if (ok) await shot(page, sid)
  }

  await browser.close()
  console.log("Done —", outDir)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
