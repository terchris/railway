---
sidebar_position: 5
---

# Documentation

How to add or edit pages on this site.

## Where Docs Live

The Docusaurus site lives under **`website/`** in the repo root. It is independent of the Next.js app and ships with its own `package.json`.

```
website/
├── docs/                # Markdown sources for the documentation tree
│   ├── index.md         # Site landing page
│   ├── ai-developer/    # AI coding assistant workflow guides
│   └── contributors/    # This guide
├── blog/                # Blog posts (newest first)
├── src/
│   ├── client-modules/  # Page-load hooks (mermaid-zoom lives here)
│   ├── css/             # Global CSS
│   └── pages/           # Custom React pages (index redirects to /docs/)
├── docusaurus.config.ts # Site config — title, plugins, themes, navbar
└── sidebars.ts          # Auto-generated sidebar from the docs tree
```

## Run the Docs Site Locally

```bash
cd website
npm install        # first time only
npm run start      # dev server with hot reload
npm run build      # production build — must pass before merge
```

## Authoring Rules

- **Use MDX-style comments** (`{/* like this */}`) — HTML comments (`<!-- ... -->`) break the strict MDX parser.
- **Mermaid diagrams** are supported via the `theme-mermaid` plugin — write them as fenced ` ```mermaid ` blocks. Click any rendered diagram to enlarge it (handled by `src/client-modules/mermaid-zoom.ts`).
- **Frontmatter is required** on every page — at minimum `sidebar_position` if you care about ordering. See existing pages for examples.
- **Local search** is provided by `@easyops-cn/docusaurus-search-local`. It indexes at build time, so new pages appear after the next `npm run build`.

## Adding a New Section

1. Create a new folder under `website/docs/` (e.g. `website/docs/architecture/`).
2. Add an `_category_.json` to control the sidebar label and position:
   ```json
   {
     "label": "Architecture",
     "position": 10,
     "link": { "type": "doc", "id": "architecture/index" }
   }
   ```
3. Add `index.md` for the section landing page.
4. Run `npm run build` to verify the site compiles.

## Adding a Blog Post

Create a file under `website/blog/` named `YYYY-MM-DD-slug.md`:

```markdown
---
slug: my-post
title: My Post
authors: []
tags: []
---

Lead paragraph that shows up on the blog index.

{/* truncate */}

Full body of the post — only the part before `{/* truncate */}` appears on the index.
```

## Conventions

- Reference other docs with **relative links** (`./getting-started.md`, `../ai-developer/WORKFLOW.md`) — `onBrokenLinks: 'throw'` will fail the build on any 404.
- Put screenshots and other binary assets under `website/static/img/`. Reference them with `/img/filename.png`.
- Keep doc PRs separate from code PRs when feasible — easier to review.
