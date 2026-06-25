# Docs visual diff

`docs_visual_diff.py` builds the Opentrons docs site (`docs/`) at **two git refs**
(branches, tags, or commits), then produces a single, self-contained, browser-viewable
HTML report of every page whose **rendered content** changed between them.

It's meant as a pre-deploy sanity check: before pushing a `mkdocs*` / `docs@*` tag,
confirm that only the changes you expect show up in the built site — including the
API Reference pages, which are compiled from docstrings in `api/src/opentrons/`.

## How it works

1. For each ref, it creates a detached **git worktree** (your working tree is never
   touched) and runs `uv run mkdocs build` inside `docs/`. Because `docs/pyproject.toml`
   installs `opentrons` and `opentrons-shared-data` as **editable path deps**, each
   build's API Reference is generated from *that ref's own* `api/` source — so docstring
   edits diff just like Markdown edits.
2. It copies each build's `site/` output into the report's output dir (`site-a/`, `site-b/`).
3. For every `.html` page it extracts the visible content of the main
   `<article class="md-content__inner">` region — deliberately **excluding** the
   site-wide nav, header, footer, and search box so they don't show up as noise on
   every page.
4. It diffs the two builds page-by-page and writes `report.html`: summary counts,
   a table of added / removed / changed pages, and a side-by-side, word-highlighted
   diff for each changed page (with links to open the actual rendered page in each build).

## Requirements

- `git` and [`uv`](https://docs.astral.sh/uv/) on your PATH.
- Network access on first run (uv downloads the docs dependencies; subsequent runs
  reuse the uv cache).
- No extra Python packages — the script is pure stdlib.

## Usage

```bash
# Compare two refs. Builds both, diffs, writes ./docs-visual-diff-report/report.html
scripts/docs_visual_diff.py edge my-feature-branch

# Compare a candidate deploy tag against what's live-ish on edge
scripts/docs_visual_diff.py mkdocs-2025-10-01 edge

# Choose the output directory
scripts/docs_visual_diff.py edge HEAD -o /tmp/docs-diff

# Skip building — diff two site/ dirs you already built
scripts/docs_visual_diff.py --site-a docs/site --site-b /some/other/site

# Only keep report.html (deletes the copied site dirs; "open in A/B" links won't work)
scripts/docs_visual_diff.py edge HEAD --prune-sites
```

When it finishes it prints the report path; open it in a browser
(`open docs-visual-diff-report/report.html`).

## Notes & caveats

- **Build time.** It builds the full monorepo site twice. The first build also resolves
  and downloads dependencies, so expect a few minutes; later runs are faster.
- **Old refs.** Each worktree builds with *its own* `uv.lock` and docs config, so the
  tool faithfully reproduces how that commit would have built — but a ref whose docs
  build was actually broken will fail to build here too (the error is surfaced).
- **Content, not pixels.** This diffs rendered text/structure, which is the right signal
  for "did the docs wording/API reference change." It does **not** catch pure CSS/layout
  changes. (The extractor targets `md-content__inner`; if the mkdocs-material theme
  changes that class name, update `CONTENT_CLASS` in the script.)
- Output is written under `docs-visual-diff-report/` by default — add that to a
  `.gitignore` or use `-o` to point somewhere outside the repo if you don't want it tracked.
```
