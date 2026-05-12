# Talk — UIS ↔ Railway (archived)

The long-form async thread that lived here described **UIS operator-side provisioning**. **This Next.js application integrates only over PostgREST** — no datastore clients from `app/` or `src/`.

**Current contract**

- **Developers:** root **`.env.example`** — `POSTGREST_URL`, `POSTGREST_ANON_JWT`, `JWT_SECRET`.
- **Schema / API shape:** **`db/README.md`**, **`db/*.sql`**, and **`terchris/new/`** specs.
- **Seeds / extraction:** **`terchris/sample-data/`** in the investigation repo.

The previous `talk.md` body was removed to avoid contradicting the PostgREST-only rule. Recover it from **git history** if you need the verbatim UIS decision log.
