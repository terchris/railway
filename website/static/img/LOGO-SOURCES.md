# Logo Sources Reference

Tracks the logos used in the Railway documentation website. Modelled after the [UIS LOGO-SOURCES](https://github.com/helpers-no/urbalurba-infrastructure/blob/main/website/static/img/LOGO-SOURCES.md) — same brand family (SovereignSky), same approach (hand-coded SVG).

## Brand colours

Shared with the SovereignSky family. Use these everywhere instead of inventing new shades:

- **Primary green**: `#3a8f5e`
- **Teal accent**: `#25c2a0`
- **Navy** (reserved, not currently used on the Railway logo): `#1e3a5f`

## Logos in this repo

| File | Use | Notes |
|---|---|---|
| `brand/railway-logo.svg` | Navbar logo + Open Graph card | 100×80 viewBox; two rails + four sleepers; green-to-teal gradient. Hand-coded. |
| `favicon.svg` | Browser tab icon | 32×32 viewBox; simplified to two rails + two sleepers so it stays legible at favicon size. Solid `#3a8f5e`, no gradient. |

Both files are hand-written SVG (no external editor). To tweak, open them in any text editor — they're ~10 lines each. Colours, stroke widths, and positions are inline so changes are obvious in diffs.

## Why a railway-track motif

Railway is the volunteer-registration system; the name is a metaphor for the path a volunteer travels from "interested" to "registered". The track-from-above motif:

- Reads at favicon size (rails + sleepers are still visible at 16×16).
- Distinguishes Railway from the UIS pyramid-of-cubes logo while staying inside the SovereignSky palette.
- Avoids any literal Røde Kors marks — Railway is a tool that Oslo Røde Kors uses, not a Red Cross product.

## Adding a new brand asset

1. Drop the SVG into `static/img/brand/` (or `static/img/` for global assets like `favicon.svg`).
2. Use the colours above; gradients are optional but should stay inside the green→teal range.
3. Reference the file from `docusaurus.config.ts` (`themeConfig.navbar.logo` or `favicon`).
4. Add a row to the table above.
5. Run `npm run build` from `website/` — if the file is missing or the path is wrong, the build fails immediately.

## Future work

- **`.ico` favicon for legacy browsers** — Safari ≤14 and older Edge ignore SVG favicons. The current setup serves SVG only; modern browsers handle this fine. If we need legacy support, generate a multi-resolution `.ico` from `favicon.svg` using `magick convert` or rsvg + ImageMagick.
- **Social-card image** — UIS ships `social-card.jpg` for Open Graph previews. Railway doesn't have one yet; the logo SVG renders OK as a fallback on most platforms.
