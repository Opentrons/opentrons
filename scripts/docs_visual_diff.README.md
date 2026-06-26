# Docs visual diff

`docs_visual_diff.py` builds the Opentrons docs site (`docs/`) at **two git refs**
(branches, tags, or commits) and produces a **browsable, rendered diff** — the real
docs pages, with mkdocs-material styling intact, showing GitHub-style inline
additions and deletions on the content that changed.

It's meant as a pre-deploy sanity check: before pushing a `mkdocs*` / `docs@*` tag,
confirm that only the changes you expect show up in the built site — including the
API Reference pages, which are compiled from docstrings in `api/src/opentrons/`.

## What you get

The tool writes an **output directory** (not a single file — the pages load the real
theme CSS/JS/images):

```
<output>/
  report.html     summary: per-page change counts, expandable excerpts, and links
  site-diff/       ref B's full site. Changed pages show inline ins/del; added
                   pages are tinted green. Browse it like the real docs site.
  site-a/          ref A's full site. Removed pages are tinted red.
```

`report.html` lists each changed page as an accordion: expand it to preview just the
changed paragraphs (with the inline additions/deletions) without leaving the report,
or click `↗` to open the full rendered page.

- **Changed** pages: the page's content is the merge of A and B with inline
  `<ins>` (green) and `<del>` (red strikethrough) markers, rendered with the real
  theme — links, code, tables, admonitions, and docstring formatting all preserved.
- **Added** / **removed** pages render fully styled with a green / red tint and a banner.
- Every diff page gets a sticky banner (status, the two refs, a "back to summary" link).
  On changed pages the banner also has **change navigation** — a paragraph-level
  count and **first / prev / next** buttons (or `Alt`+`↑`/`↓`) that jump between
  changes and outline the current one, so edits buried in long API reference pages
  are easy to find. The summary lists the change count per page.

## How it works

1. For each ref, it creates a detached **git worktree** (your working tree is never
   touched) and runs `uv run mkdocs build` in `docs/`. Because `docs/pyproject.toml`
   installs `opentrons` and `opentrons-shared-data` as **editable path deps**, each
   build's API Reference is generated from *that ref's own* `api/` source — so
   docstring edits diff just like Markdown edits.
2. For every page it extracts the main `<article class="md-content__inner">` region
   (deliberately **excluding** the site-wide nav, header, footer, and search so they
   don't appear as noise) and diffs the two versions with `lxml.html.diff.htmldiff`,
   which inserts `<ins>`/`<del>` while preserving the surrounding markup.
3. It rewrites the affected pages in place (in `site-diff` / `site-a`), injects the
   diff highlight CSS and banner, and writes the top-level `report.html` summary.

## Requirements

- `git` and [`uv`](https://docs.astral.sh/uv/) on your PATH.
- Network access on the first run (uv downloads the docs deps and `lxml`; later runs
  reuse the uv cache).
- The script **self-bootstraps `lxml`** by re-executing itself under
  `uv run --with lxml` — no manual environment setup.

## Usage

```bash
# No args: compare the latest deployed docs (newest mkdocs-* tag) to HEAD
scripts/docs_visual_diff.py

# Compare two refs. Builds both, diffs, writes ./docs-visual-diff-report/
scripts/docs_visual_diff.py edge my-feature-branch

# Compare a candidate deploy tag against edge
scripts/docs_visual_diff.py mkdocs-2025-10-01 edge

# Choose the output directory
scripts/docs_visual_diff.py edge HEAD -o /tmp/docs-diff

# Skip building — diff two site/ dirs you already built
scripts/docs_visual_diff.py --site-a docs/site --site-b /some/other/site
```

When it finishes it prints the report path; open it in a browser
(`open docs-visual-diff-report/report.html`) and click through to each changed page.

## Notes & caveats

- **Build time.** It builds the full monorepo site twice. The first build also resolves
  and downloads dependencies, so expect a few minutes; later runs are faster.
- **Output is a directory.** The rendered pages need their co-located theme assets, so
  the result can't be a single standalone HTML file. To share it, zip the output dir.
- **Old refs.** Each worktree builds with *its own* `uv.lock` and docs config, so the
  tool faithfully reproduces how that commit would have built — but a ref whose docs
  build was actually broken will fail to build here too (the error is surfaced).
- **Content, not pixels.** This diffs rendered *content* (with full styling), which is
  the right signal for "did the docs wording / API reference change." It does not flag
  pure CSS/theme changes that leave the content identical. If the mkdocs-material theme
  ever renames the `md-content__inner` content class, update `CONTENT_XPATH` in the script.
- Output lands in `docs-visual-diff-report/` by default — already covered by a
  `.gitignore` rule; use `-o` to point elsewhere.
