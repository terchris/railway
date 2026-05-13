#!/usr/bin/env node
/**
 * Builds shareable promo videos from doc/screenshots PNGs + burned-in explanatory captions (English).
 * Uses ffmpeg-static (no system ffmpeg required).
 *
 *   npm run video:promo
 *
 * Outputs (next to screenshots):
 *   railway-promo-1920-wide.mp4
 *   railway-promo-1080x1920-vertical.mp4
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import ffmpegStatic from "ffmpeg-static"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const shotDir = path.join(root, "doc", "screenshots")
const tmpDir = path.join(shotDir, ".video-build")

const ffmpeg = ffmpegStatic
if (!ffmpeg || !fs.existsSync(ffmpeg)) {
  console.error("Missing ffmpeg-static binary. Run: npm install")
  process.exit(1)
}

/** Story order: omit duplicate wiz-intro (same as home). Seconds per PNG after intro. */
const SLIDE_SEC = 3.6
const INTRO_SEC = 6

const SLIDES = [
  {
    image: null,
    sec: INTRO_SEC,
    lines: [
      "Oslo Red Cross — volunteer registration (demo)",
      "A new Next.js app: public signup wizard plus a staff admin behind PostgREST, JWT capabilities, and RLS.",
    ],
  },
  {
    image: "rwg-pub-home.png",
    sec: SLIDE_SEC,
    lines: [
      "Volunteers land on this guided signup — the funnel is split into clear steps so people do not abandon halfway.",
    ],
  },
  {
    image: "rwg-pub-wizard-activities.png",
    sec: SLIDE_SEC,
    lines: [
      "Step 2: primary and additional volunteer activities pulled from Postgres — admins control what appears here.",
    ],
  },
  {
    image: "rwg-pub-wizard-about.png",
    sec: SLIDE_SEC,
    lines: ["Step 3: contact details, membership prompts, honeypot spam traps — validated before hitting the database."],
  },
  {
    image: "rwg-pub-wizard-confirmation.png",
    sec: SLIDE_SEC,
    lines: ["Step 4: review and submit. The wizard posts JSON to `/api/registrations`, which forwards to PostgREST `submit_registration`."],
  },
  {
    image: "rwg-pub-thank-you.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Confirmation screen — simple thank-you unless the backend asks for membership follow-up."],
  },
  {
    image: "rwg-pub-thank-you-membership.png",
    sec: SLIDE_SEC - 0.4,
    lines: [
      "Variant thank-you when the flow needs membership options — UX stays in Norwegian for local volunteers.",
    ],
  },
  {
    image: "rwg-adm-login.png",
    sec: SLIDE_SEC,
    lines: ["Staff workspace: JWT-based login (UIS-style tokens). No shared password cookies — the session JWT matches PostgREST."],
  },
  {
    image: "rwg-adm-overview.png",
    sec: SLIDE_SEC,
    lines: ["Admin dashboard: KPI cards, registrations link, alerts from `app_log`, and shortcuts into content tooling."],
  },
  {
    image: "rwg-adm-registrations.png",
    sec: SLIDE_SEC,
    lines: ["Registrations grid: paging, confirmation filters, bulk delete safeguards, CSV export for reporting."],
  },
  {
    image: "rwg-adm-registration-detail.png",
    sec: SLIDE_SEC,
    lines: ["Per-registration inspector: confirms participation, deletes safely, mirrors what RLS allows for that JWT."],
  },
  {
    image: "rwg-adm-activities.png",
    sec: SLIDE_SEC,
    lines: ["Activity catalogue for the signup UI — enable/disable surfaces, reorder via categories, tighten copy."],
  },
  {
    image: "rwg-adm-activities-new.png",
    sec: SLIDE_SEC - 0.3,
    lines: ["Create flow for new volunteering opportunities — admins keep parity with Craft-era field coverage."],
  },
  {
    image: "rwg-adm-activity-detail.png",
    sec: SLIDE_SEC - 0.3,
    lines: ["Edit mode for an activity — quotas, bilingual text snippets, linkage to taxonomy."],
  },
  {
    image: "rwg-adm-additional-activities.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Dedicated view for add-on shifts so coordinators can prune optional programmes quickly."],
  },
  {
    image: "rwg-adm-activity-categories.png",
    sec: SLIDE_SEC - 0.3,
    lines: ["Category ordering translates directly to Postgres `sort_order` — no brittle manual SQL edits."],
  },
  {
    image: "rwg-adm-activity-settings.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Singleton settings: how many picks a volunteer can flag — aligns with UIS activity limits debate."],
  },
  {
    image: "rwg-adm-activities-text.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Microcopy editors for onboarding steps — still structured data, suitable for translators."],
  },
  {
    image: "rwg-adm-text-content.png",
    sec: SLIDE_SEC,
    lines: ["Global `text_content` editing — headings, disclaimers, every string the wizard echoes from PostgREST."],
  },
  {
    image: "rwg-adm-print-manuscript.png",
    sec: SLIDE_SEC,
    lines: ["Print preview for field teams — stylesheet tuned for monochrome volunteers without laptops."],
  },
  {
    image: "rwg-adm-print-form.png",
    sec: SLIDE_SEC,
    lines: ["Paper form export — contingency if digital channels fail during an event ramp-up."],
  },
  {
    image: "rwg-adm-skemadata.png",
    sec: SLIDE_SEC,
    lines: ["Schema-data hub linking membership, evaluations, locales — parity with numbered terchris admin specs."],
  },
  {
    image: "rwg-adm-app-log.png",
    sec: SLIDE_SEC - 0.3,
    lines: ["Operational log — alert flags bubble to dashboards and `/api/health` for UIS monitors."],
  },
  {
    image: "rwg-adm-staff.png",
    sec: SLIDE_SEC,
    lines: ["“My access”: explains JWT scopes in plain language until UIS exposes full `auth.users` CRUD inside Next."],
  },
  {
    image: "rwg-adm-eval-questions.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Evaluation questionnaires — admins manage question bank without redeploying the front-end bundle."],
  },
  {
    image: "rwg-adm-eval-question-detail.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Question authoring — branching metadata stays in Postgres, not scattered JSON blobs."],
  },
  {
    image: "rwg-adm-eval-options.png",
    sec: SLIDE_SEC - 0.4,
    lines: ["Answer options share the same tooling — aligns with relational evaluation schema."],
  },
  {
    image: "rwg-adm-eval-option-detail.png",
    sec: SLIDE_SEC - 0.5,
    lines: ["Option editor — bilingual labels enforced through admin forms."],
  },
  {
    image: "rwg-adm-languages.png",
    sec: SLIDE_SEC - 0.5,
    lines: ["Language rows drive locale pickers throughout the signup journey."],
  },
  {
    image: "rwg-adm-language-detail.png",
    sec: SLIDE_SEC - 0.6,
    lines: ["Per-language knobs — parity with UIS translation workflow expectations."],
  },
  {
    image: "rwg-adm-membership-statuses.png",
    sec: SLIDE_SEC - 0.6,
    lines: ["Membership statuses — underpin conditional questions downstream."],
  },
  {
    image: "rwg-adm-membership-status-detail.png",
    sec: SLIDE_SEC - 0.6,
    lines: ["Status detail tabs — admins keep labels synchronized with Oslo chapter policy."],
  },
  {
    image: "rwg-adm-membership-options.png",
    sec: SLIDE_SEC - 0.5,
    lines: ["Optional membership bundles exposed when the signup RPC decides they are relevant."],
  },
  {
    image: "rwg-adm-membership-option-detail.png",
    sec: SLIDE_SEC - 0.6,
    lines: ["Editing an option preserves referential hooks for registrations analytics."],
  },
  {
    image: "rwg-adm-no-selected-options.png",
    sec: SLIDE_SEC - 0.6,
    lines: ["“No activity picked” presets — admins configure fallback counselling paths."],
  },
  {
    image: "rwg-adm-no-selected-option-detail.png",
    sec: SLIDE_SEC - 0.6,
    lines: ["Detail view for fallback answers — mirrored between Craft legacy and Postgres seeds."],
  },
]

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function encodeIntro(outPath, w, h) {
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=0x0f172a:s=${w}x${h}:r=30`,
      "-t",
      String(INTRO_SEC),
      "-vf",
      `format=yuv420p`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-an",
      outPath,
    ],
    { stdio: "inherit" },
  )
}

function buildFfconcat(imageSlides) {
  const lines = ["ffconcat version 1.0"]
  const abs = []
  for (const s of imageSlides) {
    const fp = path.join(shotDir, s.image ?? "")
    if (!fs.existsSync(fp)) throw new Error(`Missing screenshot ${s.image}`)
    const escaped = fp.replace(/'/g, "'\\''")
    lines.push(`file '${escaped}'`)
    lines.push(`duration ${s.sec}`)
    abs.push(fp)
  }
  const lastImg = abs.at(-1)
  if (!lastImg) throw new Error("No images in slideshow")
  lines.push(`file '${lastImg.replace(/'/g, "'\\''")}'`)
  const concatPath = path.join(tmpDir, "images.concat")
  fs.writeFileSync(concatPath, lines.join("\n"), "utf8")
  return concatPath
}

function encodeBodySlideVideo(concatPath, outPath, w, h) {
  const vf = `scale=w=${w}:h=${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,format=yuv420p`

  execFileSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatPath,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-an",
      outPath,
    ],
    { stdio: "inherit" },
  )
}

function concatTwoVideos(aPath, bPath, outPath) {
  const listPath = path.join(tmpDir, "merge.txt")
  fs.writeFileSync(
    listPath,
    [`file '${aPath.replace(/'/g, "'\\''")}'`, `file '${bPath.replace(/'/g, "'\\''")}'`].join("\n"),
    "utf8",
  )
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-an",
      outPath,
    ],
    { stdio: "inherit" },
  )
}

function fmtTs(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const whole = Math.floor(s)
  const ms = Math.round((s - whole) * 1000)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(whole).padStart(2, "0")},${String(ms).padStart(3, "0")}`
}

/** Simple SRT; English captions readable on mobile. */
function buildSrt() {
  let t = 0
  let idx = 1
  let s = ""
  for (const slide of SLIDES) {
    const start = t
    t += slide.sec
    const body = slide.lines.join("\n")
    s += `${idx++}\n${fmtTs(start)} --> ${fmtTs(t)}\n${body}\n\n`
  }
  return { srt: s, totalSec: t }
}

function burnSubtitles(inVideo, outVideo, styleW) {
  const srtPath = path.join(tmpDir, "captions.srt")
  const { srt } = buildSrt()
  fs.writeFileSync(srtPath, srt, "utf8")
  /** Vertical (narrow width) gets larger captions for thumbs; wide uses slightly smaller blocks */
  const fontSize = styleW <= 1080 ? 42 : 36
  const marginV = styleW <= 1080 ? 200 : 110
  const subPath = subtitlePathArg(srtPath)
  /** force_style tweaks ASS/SRT subtitles filter (bundled FFmpeg default font stacks) */
  const vf = `subtitles=${subPath}:force_style='FontName=Arial,FontSize=${fontSize},Bold=1,Outline=4,OutlineColour=&H99000000,PrimaryColour=&H00FFFFFF,Alignment=2,MarginV=${marginV}'`

  execFileSync(
    ffmpeg,
    ["-y", "-i", inVideo, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", outVideo],
    { stdio: "inherit" },
  )
}

/** Pass filename to subtitles= (absolute, forward slashes). */
function subtitlePathArg(absPath) {
  return path.resolve(absPath).replace(/\\/g, "/")
}

function buildVariant(label, introW, introH, bodyW, bodyH) {
  console.log(`\n━━ Building ${label} (${bodyW}x${bodyH}) ━━`)
  const introPath = path.join(tmpDir, `intro-${label}.mp4`)
  const bodyPath = path.join(tmpDir, `body-${label}.mp4`)
  const mergedPath = path.join(tmpDir, `merged-${label}.mp4`)
  const outputPath = path.join(
    shotDir,
    label.includes("vertical")
      ? "railway-promo-1080x1920-vertical.mp4"
      : "railway-promo-1920-wide.mp4",
  )

  const imageSlides = SLIDES.filter((s) => s.image)
  const concatPath = buildFfconcat(imageSlides)

  encodeIntro(introPath, introW, introH)
  encodeBodySlideVideo(concatPath, bodyPath, bodyW, bodyH)
  concatTwoVideos(introPath, bodyPath, mergedPath)
  burnSubtitles(mergedPath, outputPath, bodyW)
  const st = fs.statSync(outputPath)
  console.log(`Wrote ${outputPath} (${(st.size / 1e6).toFixed(1)} MB)`)
}

function main() {
  ensureDir(tmpDir)
  /** Total runtime hint */
  const { totalSec } = buildSrt()
  console.log(`About ${Math.round(totalSec / 60)} min ${Math.round(totalSec % 60)} s total captions — encoding two variants`)

  /** Wide canvas + intro canvas */
  buildVariant("wide", 1920, 1080, 1920, 1080)
  /** Vertical: body 1080x1920, intro match */
  buildVariant("vertical", 1080, 1920, 1080, 1920)
  console.log("\nDone.")
}

main()
