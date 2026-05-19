#!/usr/bin/env node
/**
 * Builds one short (≈30–45s) promo video per role, embedded on the matching
 * role-hub page under /docs/users/. Wide format (1920×1080) only — these are
 * for in-docs embeds, not social-media verticals. Captions are Norwegian to
 * match the user-doc tree. Uses ffmpeg-static (no system ffmpeg required).
 *
 *   npm run video:promo
 *
 * Outputs (one per role, served alongside the rest of the docs assets):
 *   website/static/img/promo/railway-promo-public-wizard.mp4
 *   website/static/img/promo/railway-promo-full-admin.mp4
 *   website/static/img/promo/railway-promo-registrations-admin.mp4
 *   website/static/img/promo/railway-promo-content-editor.mp4
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import ffmpegStatic from "ffmpeg-static"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const shotDir = path.join(root, "website", "static", "img", "screenshots")
const outDir = path.join(root, "website", "static", "img", "promo")
const tmpDir = path.join(root, "website", ".video-build")

const ffmpeg = ffmpegStatic
if (!ffmpeg || !fs.existsSync(ffmpeg)) {
  console.error("Missing ffmpeg-static binary. Run: npm install")
  process.exit(1)
}

/** Per-slide duration after the intro, in seconds. */
const SLIDE_SEC = 5
const INTRO_SEC = 4

/**
 * One entry per role. Each `slides` array gets prepended with the role's
 * intro slide automatically (built from `intro_lines`). Norwegian captions —
 * match the voice of the user-doc tree under /docs/users/.
 */
const ROLES = {
  "public-wizard": {
    intro_lines: [
      "Slik melder du deg på",
      "Påmelding for nye frivillige og medlemmer.",
    ],
    slides: [
      {
        image: "rwg-pub-home.png",
        lines: ["Forsiden. Kort introduksjon — klikk Neste for å starte."],
      },
      {
        image: "rwg-pub-wizard-activities.png",
        lines: ["Velg aktiviteter du er interessert i."],
      },
      {
        image: "rwg-pub-wizard-about.png",
        lines: ["Fyll ut navn, e-post, telefon, språk og medlemsstatus."],
      },
      {
        image: "rwg-pub-wizard-confirmation.png",
        lines: ["Sjekk oppsummeringen, godta samtykket, og send inn."],
      },
      {
        image: "rwg-pub-thank-you.png",
        lines: ["Bekreftelse — administrator tar kontakt innen kort tid."],
      },
      {
        image: "rwg-pub-thank-you-membership.png",
        lines: ["Som medlem får du i tillegg informasjon om betaling."],
      },
    ],
  },
  "full-admin": {
    intro_lines: [
      "Full administrator",
      "Alle administrasjonsflater, alle kapabiliteter.",
    ],
    slides: [
      {
        image: "rwg-adm-login.png",
        lines: ["Velg «Full administrator» i rollevelgeren."],
      },
      {
        image: "rwg-adm-overview.png",
        lines: ["Oversiktssiden — KPI-er, varsler og snarveier."],
      },
      {
        image: "rwg-adm-registrations.png",
        lines: ["Påmeldingslisten — alle frivillige og medlemmer."],
      },
      {
        image: "rwg-adm-registration-detail.png",
        lines: ["Detaljvisning — bekreft, slett, eksporter."],
      },
      {
        image: "rwg-adm-activities.png",
        lines: ["Aktiviteter — administrer det offentlige skjemaet."],
      },
      {
        image: "rwg-adm-text-content.png",
        lines: ["Tekstinnhold — all tekst skjemaet viser brukerne."],
      },
      {
        image: "rwg-adm-app-log.png",
        lines: ["App-logg — operasjonelle hendelser og varsler."],
      },
    ],
  },
  "registrations-admin": {
    intro_lines: [
      "Påmeldingsadministrator",
      "Du tar imot påmeldingene og behandler dem.",
    ],
    slides: [
      {
        image: "rwg-adm-login.png",
        lines: ["Velg «Påmeldingsadministrator» i rollevelgeren."],
      },
      {
        image: "rwg-adm-overview.png",
        lines: ["Oversiktssiden — sammendrag og snarveier."],
      },
      {
        image: "rwg-adm-registrations.png",
        lines: ["Påmeldingslisten — bla, søk, eksporter."],
      },
      {
        image: "rwg-adm-registration-detail.png",
        lines: ["Detaljvisning — bekreft eller slett påmeldinger."],
      },
    ],
  },
  "content-editor": {
    intro_lines: [
      "Innholdsredaktør",
      "Du redigerer det publikum ser på skjemaet.",
    ],
    slides: [
      {
        image: "rwg-adm-login.png",
        lines: ["Velg «Innholdsredaktør» i rollevelgeren."],
      },
      {
        image: "rwg-adm-overview.png",
        lines: ["Oversiktssiden — du ser kun innholdsrelaterte kort."],
      },
      {
        image: "rwg-adm-activities.png",
        lines: ["Aktiviteter — det publikum kan velge."],
      },
      {
        image: "rwg-adm-text-content.png",
        lines: ["Tekstinnhold — all tekst skjemaet bruker."],
      },
      {
        image: "rwg-adm-eval-questions.png",
        lines: ["Evalueringsspørsmål — hva vi spør de frivillige om."],
      },
      {
        image: "rwg-adm-languages.png",
        lines: ["Språk frivillige kan velge."],
      },
    ],
  },
}

/** Materialise the full slide list for a role (intro + body slides). */
function slidesForRole(roleId) {
  const r = ROLES[roleId]
  if (!r) throw new Error(`Unknown role: ${roleId}`)
  return [
    { image: null, sec: INTRO_SEC, lines: r.intro_lines },
    ...r.slides.map((s) => ({ ...s, sec: SLIDE_SEC })),
  ]
}


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

/** Reserved bottom-strip height (px) for captions, per orientation.
 *  Captions sit inside the strip on a clean brand-coloured background —
 *  they never overlay the screenshot itself. */
function captionStripHeight(frameW) {
  return frameW <= 1080 ? 480 : 240
}

/** Brand colour for the strip + the screenshot's letterbox padding.
 *  Matches the intro slide colour (0x0f172a, dark navy). */
const STRIP_COLOR = "0x0f172a"

function encodeBodySlideVideo(concatPath, outPath, w, h) {
  const stripH = captionStripHeight(w)
  const imgH = h - stripH
  // 1. Scale screenshot to fit in (w × imgH), preserving aspect ratio.
  // 2. Pad to full frame (w × h): top-left at (0,0), bottom strip becomes
  //    solid STRIP_COLOR (where captions will burn).
  const vf =
    `scale=w=${w}:h=${imgH}:force_original_aspect_ratio=decrease,` +
    `pad=${w}:${h}:(${w}-iw)/2:(${imgH}-ih)/2:color=${STRIP_COLOR},` +
    `setsar=1,fps=30,format=yuv420p`

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

/** Simple SRT built from a per-role slide list (intro + body slides). */
function buildSrt(slides) {
  let t = 0
  let idx = 1
  let s = ""
  for (const slide of slides) {
    const start = t
    t += slide.sec
    const body = slide.lines.join("\n")
    s += `${idx++}\n${fmtTs(start)} --> ${fmtTs(t)}\n${body}\n\n`
  }
  return { srt: s, totalSec: t }
}

function burnSubtitles(inVideo, outVideo, styleW, srtPath) {
  // Captions sit inside the reserved bottom strip (no overlap with screenshot
  // pixels), vertically centred. Font size auto-tunes to width so that a
  // future vertical variant (≤1080) gets thumb-readable captions.
  const fontSize = styleW <= 1080 ? 42 : 32
  const stripH = captionStripHeight(styleW)
  // MarginV in ASS = distance from the bottom edge of the frame to the
  // bottom of the text block. Centring the text vertically inside stripH
  // means MarginV ≈ (stripH - textH) / 2; assume ~2 lines so textH ≈ 2.4×fontSize.
  const marginV = Math.round((stripH - 2.4 * fontSize) / 2)
  const subPath = subtitlePathArg(srtPath)
  // BorderStyle=1 (outline only, no box), Outline=0 (clean text on the
  // solid strip — no shadow needed since there's no busy content behind).
  const vf =
    `subtitles=${subPath}:force_style='` +
    `FontName=Arial,FontSize=${fontSize},Bold=1,` +
    `BorderStyle=1,Outline=0,` +
    `PrimaryColour=&H00FFFFFF,` +
    `Alignment=2,MarginV=${marginV},` +
    `MarginL=80,MarginR=80'`

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

/** Build one wide MP4 for a role. */
function buildRoleVideo(roleId) {
  const w = 1920
  const h = 1080
  console.log(`\n━━ Building ${roleId} (${w}x${h}) ━━`)
  const introPath = path.join(tmpDir, `intro-${roleId}.mp4`)
  const bodyPath = path.join(tmpDir, `body-${roleId}.mp4`)
  const mergedPath = path.join(tmpDir, `merged-${roleId}.mp4`)
  const srtPath = path.join(tmpDir, `captions-${roleId}.srt`)
  const outputPath = path.join(outDir, `railway-promo-${roleId}.mp4`)

  const allSlides = slidesForRole(roleId)
  const { srt, totalSec } = buildSrt(allSlides)
  fs.writeFileSync(srtPath, srt, "utf8")
  console.log(`  captions: ${Math.round(totalSec)}s`)

  const imageSlides = allSlides.filter((s) => s.image)
  const concatPath = buildFfconcat(imageSlides)

  encodeIntro(introPath, w, h)
  encodeBodySlideVideo(concatPath, bodyPath, w, h)
  concatTwoVideos(introPath, bodyPath, mergedPath)
  burnSubtitles(mergedPath, outputPath, w, srtPath)
  const st = fs.statSync(outputPath)
  console.log(`Wrote ${outputPath} (${(st.size / 1e6).toFixed(1)} MB)`)
}

function main() {
  ensureDir(tmpDir)
  ensureDir(outDir)
  for (const roleId of Object.keys(ROLES)) {
    buildRoleVideo(roleId)
  }
  console.log("\nDone.")
}

main()
