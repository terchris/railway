# Talk — async UIS ↔ Railway-developer conversation

This folder holds an ongoing async conversation between the **UIS / DB-provisioner side** (where Claude is currently driving the database + PostgREST setup) and the **Railway developer side** (who owns the canonical specs in `terchris/new/`).

It is not code. It is not docs. It is the **decision log + question queue** that keeps the two sides in sync without anyone having to be online at the same time.

## Who reads, who writes

- **`talk.md`** is appended to by whoever has something to say. Each message starts with a clear heading naming the author and a one-line subject (see Format below).
- **DB-Provisioner messages** are written by Claude on the UIS side, driven by Terje. They report what was done, ask for decisions, or flag findings that need the Railway team's input.
- **Railway-developer messages** are written by you (the Railway contributor) when you respond. Free-form prose is fine — bulleted answers to the open questions are even better.

## File layout

- `talk.md` — the active conversation. Newest content at the bottom.
- `talkNN.md` — archived rounds. When `talk.md` gets long (~1000+ lines) it gets renamed to the next number and a fresh `talk.md` is started with a pointer back. (UIS testing uses this rotation pattern; see `helpers/testing/uis1/talk/` for an example archive.)
- `README.md` — this file.

## Message format

Each message is a level-2 heading with author + counter + one-line subject:

```
## DB-Provisioner - Message N — Phase 0 schema.sql draft for review

(body of the message: what was done, open questions, links to files
or commit hashes, expected next action)
```

```
## Railway-Dev - Message N — Answers + one correction

(reply)
```

The counters (`Message 1`, `Message 2`, …) are per-author, not global. They help when referring back to "see DB-Provisioner Message 3" without ambiguity.

If a message surfaces a **finding** (something that has to change), number it `F1`, `F2`, … globally. The format mirrors what UIS testing uses elsewhere on this machine and makes them trivially greppable.

## Why not just GitHub issues / Slack / email

- This folder lives next to the code in the same repo, so the decisions stay with the project even if tooling changes.
- It survives Claude session boundaries — when Terje or Claude picks up tomorrow, the full context is one `cat talk.md` away.
- It's plain Markdown — no auth, no rate limits, no rendering quirks.

The pattern is borrowed from `helpers/testing/uis1/talk/` where it's been load-bearing for the AKS platform work over the last week. Same conventions; smaller scope here (one DB to provision, not a whole platform).

## Related folders / docs

| What | Where |
| ---- | ----- |
| **Canonical specs** (data model, PostgREST, auth) | `../../../oslo-rodekors/railway-main/terchris/new/` |
| **Seed SQL + extraction script** | `../../../oslo-rodekors/railway-main/terchris/sample-data/` |
| **UIS-side deliverables checklist** | `../db/README.md` |
| **UIS ↔ Railway async conversation** | `talk.md` (this folder) |
| **Next.js app code** | `../` (this repo's root) |
| **Repo continuation context** | `../.cursor/CONTINUATION.md` |

## Out of scope for this folder

- Anything that belongs in code: write code instead.
- Anything that belongs in `db/README.md` (spec-shaped facts about what UIS provisions): edit that file instead.
- Anything that belongs in the canonical specs (`terchris/new/`): file a change there.

This folder is specifically for **decisions, questions, and progress updates** that don't have a natural home elsewhere.
