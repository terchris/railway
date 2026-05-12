import type { PostgrestClient } from "@supabase/postgrest-js"

type SortRow = { id: number; sort_order: number }

function pqFrom(staff: PostgrestClient, table: string) {
  return (
    staff as unknown as {
      from: (t: string) => ReturnType<PostgrestClient["from"]>
    }
  ).from(table)
}

/** Re-index `sort_order` 0…n‑1 after moving one row up/down (same pattern as activity categories). */
export async function nudgeLexicographicSortRows(
  staff: PostgrestClient,
  table: string,
  rowId: number,
  direction: "up" | "down",
): Promise<void> {
  const cid = Math.trunc(Number(rowId))
  if (!Number.isFinite(cid) || cid <= 0) throw new Error("Ugyldig id")

  const { data, error } = await pqFrom(staff, table).select("id,sort_order")

  if (error) throw new Error(error.message)
  const typed = (
    Array.isArray(data)
      ? (data as { id: unknown; sort_order: unknown }[]).map((r) => ({
          id: Number(r.id),
          sort_order: Math.trunc(Number(r.sort_order)),
        }))
      : []
  ).filter((r) => Number.isFinite(r.id) && Number.isFinite(r.sort_order))

  typed.sort((a: SortRow, b: SortRow) =>
    a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.id - b.id,
  )

  const ids = typed.map((r: SortRow) => r.id)
  const idx = ids.indexOf(cid)
  if (idx < 0) throw new Error("Rad ikke funnet")

  const nextIds = [...ids]
  if (direction === "up" && idx > 0) {
    const t = nextIds[idx - 1]
    nextIds[idx - 1] = nextIds[idx]!
    nextIds[idx] = t!
  } else if (direction === "down" && idx < nextIds.length - 1) {
    const t = nextIds[idx]!
    nextIds[idx] = nextIds[idx + 1]!
    nextIds[idx + 1] = t
  }

  for (let i = 0; i < nextIds.length; i++) {
    const { error: uErr } = await pqFrom(staff, table).update({ sort_order: i }).eq("id", nextIds[i])
    if (uErr) throw new Error(uErr.message)
  }
}
