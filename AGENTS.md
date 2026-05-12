<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Data access (hard rule)

**Data is only ever accessed over HTTP through PostgREST.** No `DATABASE_URL` in this app, no relational DB drivers or ORMs in `app/` or `src/`. Use `POSTGREST_URL` + JWT via `src/lib/postgrest.ts` or `fetch`. The SQL under `db/` is a **UIS schema bundle** for PostgREST — Next.js never runs it or opens a datastore socket.
