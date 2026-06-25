#!/usr/bin/env python3
"""Visual diff of the Opentrons docs build output between two git refs.

Builds the MkDocs site (``docs/``) at two commits / branches / tags, extracts the
rendered, visible content of every page (the ``<article class="md-content__inner">``
region, which excludes the shared nav / header / footer), and emits a single
self-contained, browser-viewable HTML report summarizing every page that was
added, removed, or changed between the two builds.

Because ``docs/pyproject.toml`` installs ``opentrons`` as an editable path
dependency of ``../api``, the docstring-driven API Reference pages are rebuilt
from each ref's own ``api/src`` source -- so docstring changes show up in the
diff just like Markdown changes.

Usage
-----
    # Compare two refs (branches, tags, or commit SHAs). Builds both, then diffs.
    scripts/docs_visual_diff.py edge my-feature-branch

    # Compare a deploy tag against edge
    scripts/docs_visual_diff.py mkdocs-2025-10-01 edge

    # Skip building -- diff two already-built site directories
    scripts/docs_visual_diff.py --site-a /path/to/site --site-b /path/to/other/site

    # Keep the per-ref build output dirs around after the run
    scripts/docs_visual_diff.py edge HEAD --keep-builds

The report path is printed at the end; open it in a browser.

Requires: git, uv (https://docs.astral.sh/uv/). Pure Python stdlib otherwise.
"""

from __future__ import annotations

import argparse
import difflib
import html
import os
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# The mkdocs-material class that wraps the main page content. We extract text
# only from inside this element so that the identical site-wide chrome (nav,
# header, footer, search box, table-of-contents sidebar) does not show up as a
# diff on every single page.
CONTENT_CLASS = "md-content__inner"

# Block-level tags after which we force a line break when flattening the article
# to text. This keeps the extracted "lines" aligned with logical content units.
BLOCK_TAGS = {
    "p", "div", "section", "article", "li", "tr", "td", "th", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6", "pre", "blockquote", "dt", "dd",
    "table", "thead", "tbody", "ul", "ol", "dl", "figure", "figcaption",
    "details", "summary",
}

# Tags whose text content we never want to capture.
SKIP_TAGS = {"script", "style"}

# Heading tags, so we can prefix extracted headings with markers for readability.
HEADING_TAGS = {"h1": "# ", "h2": "## ", "h3": "### ", "h4": "#### ",
                "h5": "##### ", "h6": "###### "}


# ---------------------------------------------------------------------------
# HTML content extraction
# ---------------------------------------------------------------------------

class ArticleTextExtractor(HTMLParser):
    """Pull normalized visible text lines out of the page's main content region."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._article_depth = 0          # tag-nesting depth inside the article
        self._in_article = False
        self._article_start_depth = 0
        self._depth = 0
        self._skip_depth = 0             # >0 while inside a SKIP_TAG
        self._title_parts: list[str] = []
        self._in_title = False
        self._cur: list[str] = []        # text fragments for the current line
        self._heading_prefix = ""
        self.lines: list[str] = []
        self.title = ""

    # -- helpers ----------------------------------------------------------
    def _flush(self) -> None:
        text = "".join(self._cur)
        # Normalize whitespace; drop the material "permalink" pilcrow.
        text = " ".join(text.replace("¶", "").split())
        if text:
            self.lines.append(self._heading_prefix + text)
        self._cur = []
        self._heading_prefix = ""

    # -- parser callbacks -------------------------------------------------
    def handle_starttag(self, tag, attrs):  # noqa: D102
        self._depth += 1
        if tag == "title":
            self._in_title = True
            return
        if tag in SKIP_TAGS:
            self._skip_depth += 1
            return
        if not self._in_article:
            attr = dict(attrs)
            classes = attr.get("class", "")
            if CONTENT_CLASS in classes.split():
                self._in_article = True
                self._article_start_depth = self._depth
            return
        # Inside the article.
        if tag in BLOCK_TAGS:
            self._flush()
        if tag in HEADING_TAGS:
            self._heading_prefix = HEADING_TAGS[tag]

    def handle_endtag(self, tag):  # noqa: D102
        if tag == "title":
            self._in_title = False
            self.title = " ".join("".join(self._title_parts).split())
            return
        if tag in SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
            self._depth -= 1
            return
        if self._in_article:
            if tag in BLOCK_TAGS:
                self._flush()
            if self._depth == self._article_start_depth:
                # We've closed the article element itself.
                self._flush()
                self._in_article = False
        self._depth -= 1

    def handle_data(self, data):  # noqa: D102
        if self._in_title:
            self._title_parts.append(data)
            return
        if self._skip_depth > 0:
            return
        if self._in_article:
            self._cur.append(data)


def extract_page(path: Path) -> tuple[str, list[str]]:
    """Return (page title, list of normalized content lines) for an HTML file."""
    parser = ArticleTextExtractor()
    try:
        parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        parser.close()
    except Exception as exc:  # malformed HTML -> empty content, note in title
        return (f"<parse error: {exc}>", [])
    return (parser.title, parser.lines)


# ---------------------------------------------------------------------------
# Site collection & diffing
# ---------------------------------------------------------------------------

@dataclass
class PageDiff:
    key: str                      # relative path, e.g. "python-api/reference/instruments"
    rel_html: str                 # relative path to the .html file
    title_a: str = ""
    title_b: str = ""
    status: str = "unchanged"     # added | removed | changed | unchanged
    added: int = 0
    removed: int = 0
    opcodes: list = field(default_factory=list)  # (tag, a_lines, b_lines) blocks


def collect_html(site_dir: Path) -> dict[str, Path]:
    """Map page-key -> html file path for every .html page under a site dir."""
    pages: dict[str, Path] = {}
    for path in sorted(site_dir.rglob("*.html")):
        rel = path.relative_to(site_dir)
        pages[str(rel)] = path
    return pages


def page_key(rel_html: str) -> str:
    """Human-friendly page key from a relative html path."""
    if rel_html.endswith("/index.html"):
        return rel_html[: -len("/index.html")]
    if rel_html == "index.html":
        return "(home)"
    if rel_html.endswith(".html"):
        return rel_html[: -len(".html")]
    return rel_html


def diff_sites(site_a: Path, site_b: Path) -> list[PageDiff]:
    pages_a = collect_html(site_a)
    pages_b = collect_html(site_b)
    all_rels = sorted(set(pages_a) | set(pages_b))

    results: list[PageDiff] = []
    for rel in all_rels:
        pd = PageDiff(key=page_key(rel), rel_html=rel)
        in_a, in_b = rel in pages_a, rel in pages_b

        title_a, lines_a = extract_page(pages_a[rel]) if in_a else ("", [])
        title_b, lines_b = extract_page(pages_b[rel]) if in_b else ("", [])
        pd.title_a, pd.title_b = title_a, title_b

        if in_a and not in_b:
            pd.status = "removed"
            pd.removed = len(lines_a)
            pd.opcodes = [("delete", lines_a, [])]
        elif in_b and not in_a:
            pd.status = "added"
            pd.added = len(lines_b)
            pd.opcodes = [("insert", [], lines_b)]
        else:
            sm = difflib.SequenceMatcher(a=lines_a, b=lines_b, autojunk=False)
            ops = []
            for tag, i1, i2, j1, j2 in sm.get_opcodes():
                ops.append((tag, lines_a[i1:i2], lines_b[j1:j2]))
                if tag in ("replace", "delete"):
                    pd.removed += i2 - i1
                if tag in ("replace", "insert"):
                    pd.added += j2 - j1
            pd.opcodes = ops
            pd.status = "changed" if (pd.added or pd.removed) else "unchanged"

        results.append(pd)
    return results


# ---------------------------------------------------------------------------
# Building
# ---------------------------------------------------------------------------

def run(cmd: list[str], cwd: Path, env: dict | None = None) -> None:
    print(f"    $ {' '.join(cmd)}  (cwd={cwd})", flush=True)
    subprocess.run(cmd, cwd=cwd, check=True, env=env)


def git_short(repo: Path, ref: str) -> tuple[str, str]:
    """Resolve a ref to (full_sha, short_sha)."""
    full = subprocess.run(
        ["git", "rev-parse", ref], cwd=repo, check=True,
        capture_output=True, text=True,
    ).stdout.strip()
    short = full[:10]
    return full, short


def build_ref(repo: Path, ref: str, sha: str, dest: Path) -> Path:
    """Build the docs site for `sha` in an isolated worktree; copy site to dest."""
    worktrees_root = Path(tempfile.mkdtemp(prefix="docs-diff-wt-"))
    wt = worktrees_root / sha[:10]
    print(f"  • Creating worktree for {ref} ({sha[:10]}) ...", flush=True)
    run(["git", "worktree", "add", "--detach", "--force", str(wt), sha], cwd=repo)
    try:
        docs_dir = wt / "docs"
        print(f"  • Building docs for {ref} (uv run mkdocs build) ...", flush=True)
        # uv auto-creates the venv and syncs from the worktree's uv.lock.
        env = dict(os.environ)
        env.pop("VIRTUAL_ENV", None)  # don't let an active venv leak into uv
        run(["uv", "run", "mkdocs", "build", "-f", "./mkdocs.yml"],
            cwd=docs_dir, env=env)
        built = docs_dir / "site"
        if not built.is_dir():
            raise RuntimeError(f"build produced no site/ for {ref}")
        if dest.exists():
            shutil.rmtree(dest)
        print(f"  • Copying site -> {dest}", flush=True)
        shutil.copytree(built, dest)
        return dest
    finally:
        print(f"  • Removing worktree {wt}", flush=True)
        subprocess.run(["git", "worktree", "remove", "--force", str(wt)],
                       cwd=repo, check=False)
        shutil.rmtree(worktrees_root, ignore_errors=True)


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------

def _wordlevel(a: str, b: str) -> tuple[str, str]:
    """Return (html_a, html_b) with differing words wrapped for highlighting."""
    aw, bw = a.split(" "), b.split(" ")
    sm = difflib.SequenceMatcher(a=aw, b=bw, autojunk=False)
    out_a, out_b = [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        seg_a = html.escape(" ".join(aw[i1:i2]))
        seg_b = html.escape(" ".join(bw[j1:j2]))
        if tag == "equal":
            out_a.append(seg_a)
            out_b.append(seg_b)
        else:
            if seg_a:
                out_a.append(f'<span class="w-del">{seg_a}</span>')
            if seg_b:
                out_b.append(f'<span class="w-ins">{seg_b}</span>')
    return " ".join(out_a), " ".join(out_b)


CONTEXT = 2  # equal lines of context to keep around a change


def render_page_diff(pd: PageDiff) -> str:
    rows: list[str] = []
    n_ops = len(pd.opcodes)
    for idx, (tag, a_lines, b_lines) in enumerate(pd.opcodes):
        if tag == "equal":
            lines = a_lines
            # Collapse long unchanged runs, keep a little context at the edges.
            if len(lines) > 2 * CONTEXT + 1:
                head = lines[:CONTEXT] if idx > 0 else []
                tail = lines[-CONTEXT:] if idx < n_ops - 1 else []
                hidden = len(lines) - len(head) - len(tail)
                for ln in head:
                    rows.append(_row("eq", ln, ln))
                rows.append(
                    f'<tr class="gap"><td colspan="2">··· {hidden} unchanged '
                    f'line{"s" if hidden != 1 else ""} ···</td></tr>')
                for ln in tail:
                    rows.append(_row("eq", ln, ln))
            else:
                for ln in lines:
                    rows.append(_row("eq", ln, ln))
        elif tag == "replace":
            # Pair removed/added lines for word-level highlighting where possible.
            for i in range(max(len(a_lines), len(b_lines))):
                la = a_lines[i] if i < len(a_lines) else None
                lb = b_lines[i] if i < len(b_lines) else None
                if la is not None and lb is not None:
                    ha, hb = _wordlevel(la, lb)
                    rows.append(_row_raw("chg", ha, hb))
                elif la is not None:
                    rows.append(_row("del", la, ""))
                else:
                    rows.append(_row("ins", "", lb))
        elif tag == "delete":
            for ln in a_lines:
                rows.append(_row("del", ln, ""))
        elif tag == "insert":
            for ln in b_lines:
                rows.append(_row("ins", "", ln))
    return "\n".join(rows)


def _row(kind: str, a: str, b: str) -> str:
    return _row_raw(kind, html.escape(a), html.escape(b))


def _row_raw(kind: str, a_html: str, b_html: str) -> str:
    return (f'<tr class="{kind}">'
            f'<td class="ln a">{a_html}</td>'
            f'<td class="ln b">{b_html}</td></tr>')


STATUS_ORDER = {"changed": 0, "added": 1, "removed": 2, "unchanged": 3}
STATUS_BADGE = {
    "changed": ("changed", "#b45309", "#fef3c7"),
    "added": ("added", "#15803d", "#dcfce7"),
    "removed": ("removed", "#b91c1c", "#fee2e2"),
    "unchanged": ("unchanged", "#64748b", "#f1f5f9"),
}


def render_report(diffs: list[PageDiff], meta: dict) -> str:
    changed = [d for d in diffs if d.status == "changed"]
    added = [d for d in diffs if d.status == "added"]
    removed = [d for d in diffs if d.status == "removed"]
    unchanged = [d for d in diffs if d.status == "unchanged"]
    shown = sorted(changed + added + removed,
                   key=lambda d: (STATUS_ORDER[d.status], d.key))

    def badge(status: str) -> str:
        label, fg, bg = STATUS_BADGE[status]
        return (f'<span class="badge" style="color:{fg};background:{bg}">'
                f'{label}</span>')

    # Summary table rows
    summary_rows = []
    for d in shown:
        anchor = "p-" + d.key.replace("/", "-").replace("(", "").replace(")", "")
        delta = []
        if d.added:
            delta.append(f'<span class="plus">+{d.added}</span>')
        if d.removed:
            delta.append(f'<span class="minus">−{d.removed}</span>')
        title = html.escape(d.title_b or d.title_a or "")
        summary_rows.append(
            f'<tr><td>{badge(d.status)}</td>'
            f'<td><a href="#{anchor}"><code>{html.escape(d.key)}</code></a>'
            f'<div class="ttl">{title}</div></td>'
            f'<td class="delta">{" ".join(delta) or "—"}</td></tr>')

    # Per-page detail blocks
    detail_blocks = []
    for d in shown:
        anchor = "p-" + d.key.replace("/", "-").replace("(", "").replace(")", "")
        body = render_page_diff(d)
        links = []
        if d.status != "added":
            links.append(f'<a href="{html.escape(meta["site_a_rel"])}/'
                         f'{html.escape(d.rel_html)}" target="_blank">open in A ↗</a>')
        if d.status != "removed":
            links.append(f'<a href="{html.escape(meta["site_b_rel"])}/'
                         f'{html.escape(d.rel_html)}" target="_blank">open in B ↗</a>')
        detail_blocks.append(f'''
<details id="{anchor}" class="page" {"open" if d.status != "unchanged" else ""}>
  <summary>{badge(d.status)} <code>{html.escape(d.key)}</code>
    <span class="delta">{f'+{d.added} ' if d.added else ''}{f'−{d.removed}' if d.removed else ''}</span>
    <span class="links">{" · ".join(links)}</span>
  </summary>
  <table class="diff"><tbody>
{body}
  </tbody></table>
</details>''')

    a = meta["ref_a"]; b = meta["ref_b"]
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Docs visual diff: {html.escape(a["ref"])} → {html.escape(b["ref"])}</title>
<style>
:root {{ color-scheme: light dark; }}
* {{ box-sizing: border-box; }}
body {{ font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 0; color: #0f172a; background: #f8fafc; }}
header {{ background: #0f172a; color: #f8fafc; padding: 20px 28px; }}
header h1 {{ margin: 0 0 6px; font-size: 19px; }}
header .refs {{ font-size: 13px; opacity: .85; }}
header code {{ background: rgba(255,255,255,.12); padding: 1px 6px; border-radius: 4px; }}
main {{ max-width: 1100px; margin: 0 auto; padding: 24px 20px 80px; }}
.cards {{ display: flex; gap: 12px; flex-wrap: wrap; margin: 0 0 24px; }}
.card {{ flex: 1; min-width: 120px; background: #fff; border: 1px solid #e2e8f0;
         border-radius: 10px; padding: 14px 16px; }}
.card .n {{ font-size: 26px; font-weight: 700; }}
.card .l {{ font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }}
.badge {{ font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
          text-transform: uppercase; letter-spacing: .03em; }}
table.summary {{ width: 100%; border-collapse: collapse; background: #fff;
                 border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 32px; }}
table.summary td {{ padding: 9px 12px; border-top: 1px solid #f1f5f9; vertical-align: top; }}
table.summary tr:first-child td {{ border-top: 0; }}
table.summary .ttl {{ color: #64748b; font-size: 12px; margin-top: 2px; }}
.delta {{ white-space: nowrap; font-variant-numeric: tabular-nums; font-size: 12px; }}
.plus {{ color: #15803d; font-weight: 600; }}
.minus {{ color: #b91c1c; font-weight: 600; }}
details.page {{ background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
                margin-bottom: 14px; overflow: hidden; }}
details.page > summary {{ cursor: pointer; padding: 12px 16px; display: flex;
                          align-items: center; gap: 10px; flex-wrap: wrap; }}
details.page > summary code {{ font-size: 13px; }}
.links {{ margin-left: auto; font-size: 12px; }}
.links a {{ color: #2563eb; text-decoration: none; }}
table.diff {{ width: 100%; border-collapse: collapse; table-layout: fixed;
              font: 12.5px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
table.diff td.ln {{ width: 50%; padding: 2px 12px; vertical-align: top;
                    white-space: pre-wrap; word-break: break-word; border-top: 1px solid #f1f5f9; }}
tr.eq td {{ color: #475569; }}
tr.del td.a {{ background: #fee2e2; }}
tr.del td.b {{ background: #fafafa; }}
tr.ins td.b {{ background: #dcfce7; }}
tr.ins td.a {{ background: #fafafa; }}
tr.chg td.a {{ background: #fff7ed; }}
tr.chg td.b {{ background: #f0fdf4; }}
.w-del {{ background: #fecaca; border-radius: 3px; }}
.w-ins {{ background: #bbf7d0; border-radius: 3px; }}
tr.gap td {{ text-align: center; color: #94a3b8; font-style: italic; padding: 4px;
            background: #f8fafc; font-size: 11px; }}
.empty {{ color: #64748b; padding: 40px; text-align: center; }}
code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
</style></head>
<body>
<header>
  <h1>Docs visual diff</h1>
  <div class="refs"><b>A</b> <code>{html.escape(a["ref"])}</code> @ <code>{a["short"]}</code>
    &nbsp;→&nbsp; <b>B</b> <code>{html.escape(b["ref"])}</code> @ <code>{b["short"]}</code></div>
  <div class="refs" style="margin-top:6px">Scope: {html.escape(meta["scope"])} ·
    Content diff of rendered pages (shared nav/header/footer excluded)</div>
</header>
<main>
  <div class="cards">
    <div class="card"><div class="n" style="color:#b45309">{len(changed)}</div><div class="l">Changed</div></div>
    <div class="card"><div class="n" style="color:#15803d">{len(added)}</div><div class="l">Added</div></div>
    <div class="card"><div class="n" style="color:#b91c1c">{len(removed)}</div><div class="l">Removed</div></div>
    <div class="card"><div class="n" style="color:#64748b">{len(unchanged)}</div><div class="l">Unchanged</div></div>
    <div class="card"><div class="n">{len(diffs)}</div><div class="l">Total pages</div></div>
  </div>
  {"<table class='summary'>" + "".join(summary_rows) + "</table>" if summary_rows
   else "<div class='empty'>✅ No content differences found between the two builds.</div>"}
  {"".join(detail_blocks)}
</main>
</body></html>'''


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Visual content diff of the Opentrons docs build between two refs.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__)
    ap.add_argument("ref_a", nargs="?", help="Base ref (branch/tag/commit).")
    ap.add_argument("ref_b", nargs="?", help="Compare ref (branch/tag/commit).")
    ap.add_argument("--site-a", help="Pre-built site dir for A (skips building A).")
    ap.add_argument("--site-b", help="Pre-built site dir for B (skips building B).")
    ap.add_argument("-o", "--output", default="docs-visual-diff-report",
                    help="Output directory for the report (default: ./docs-visual-diff-report).")
    ap.add_argument("--prune-sites", action="store_true",
                    help="Delete the copied per-ref site dirs after writing the report "
                         "(saves space, but breaks the 'open in A/B' page links).")
    args = ap.parse_args()

    repo = Path(subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], cwd=Path(__file__).resolve().parent,
        check=True, capture_output=True, text=True).stdout.strip())

    out = Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    site_a_dir = out / "site-a"
    site_b_dir = out / "site-b"

    # Resolve refs / sites for A and B.
    def prep(side: str, ref: str | None, prebuilt: str | None, dest: Path):
        if prebuilt:
            src = Path(prebuilt).resolve()
            if not src.is_dir():
                sys.exit(f"--site-{side} is not a directory: {src}")
            label = src.name
            if src != dest:
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(src, dest)
            return {"ref": label, "short": "prebuilt"}, dest
        if not ref:
            sys.exit(f"Provide ref_{side} or --site-{side}.")
        full, short = git_short(repo, ref)
        build_ref(repo, ref, full, dest)
        return {"ref": ref, "short": short}, dest

    print(f"Repo: {repo}")
    print(f"Output: {out}\n")

    print("== Side A ==")
    meta_a, site_a = prep("a", args.ref_a, args.site_a, site_a_dir)
    print("\n== Side B ==")
    meta_b, site_b = prep("b", args.ref_b, args.site_b, site_b_dir)

    print("\n== Diffing rendered content ==")
    diffs = diff_sites(site_a, site_b)
    n_changed = sum(1 for d in diffs if d.status in ("changed", "added", "removed"))
    print(f"  {len(diffs)} pages compared, {n_changed} with differences.")

    meta = {
        "ref_a": meta_a, "ref_b": meta_b,
        "scope": "whole docs site",
        "site_a_rel": "site-a", "site_b_rel": "site-b",
    }
    report = render_report(diffs, meta)
    report_path = out / "report.html"
    report_path.write_text(report, encoding="utf-8")

    # The per-ref site dirs are kept by default because the report's
    # "open in A/B" links point into them. Prune only on explicit request.
    if args.prune_sites:
        for d in (site_a_dir, site_b_dir):
            if d.is_dir() and d not in (Path(args.site_a or "").resolve(),
                                        Path(args.site_b or "").resolve()):
                shutil.rmtree(d, ignore_errors=True)
        print("  (pruned site-a/ and site-b/; 'open in A/B' links will not resolve)")

    print(f"\n✅ Report written to: {report_path}")
    print(f"   Open it with:  open {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
