#!/usr/bin/env python3
"""Rich, rendered visual diff of the Opentrons docs build between two git refs.

Builds the MkDocs site (``docs/``) at two commits / branches / tags and produces a
**browsable, styled diff** -- the real rendered docs pages (mkdocs-material CSS and
all) with GitHub-style inline ``<ins>`` / ``<del>`` highlighting on the content that
changed. This is meant as a pre-deploy sanity check: confirm that only the changes
you expect show up in the built site, including the API Reference pages, which are
compiled from docstrings in ``api/src/opentrons/``.

Output (a directory, because the pages load the real theme assets):

    <output>/
      report.html     <- summary: counts + links into the rendered diff pages
      site-diff/       <- ref B's full site; changed pages show inline ins/del,
                          added pages are tinted green (browse it like the real docs)
      site-a/          <- ref A's full site; removed pages are tinted red

How it stays faithful to docstrings: ``docs/pyproject.toml`` installs ``opentrons``
and ``opentrons-shared-data`` as editable path deps, so each ref's API Reference is
rebuilt from *that ref's own* ``api/`` source.

Usage
-----
    scripts/docs_visual_diff.py edge my-feature-branch
    scripts/docs_visual_diff.py mkdocs-2025-10-01 edge        # candidate tag vs edge
    scripts/docs_visual_diff.py edge HEAD -o /tmp/docs-diff
    scripts/docs_visual_diff.py --site-a docs/site --site-b /other/site   # skip builds

Requires: git and uv (https://docs.astral.sh/uv/). The script self-bootstraps lxml
via ``uv run --with lxml`` -- no manual environment setup needed.
"""

from __future__ import annotations

import argparse
import html
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Self-bootstrap: we need lxml (for structure-aware HTML diffing). If it's not
# importable, re-exec ourselves under `uv run --with lxml`, which is guaranteed
# present because we also use uv to build the docs.
# ---------------------------------------------------------------------------
try:
    import lxml.html  # noqa: F401
    from lxml.html.diff import htmldiff
except ModuleNotFoundError:
    if os.environ.get("_DVD_BOOTSTRAPPED") == "1":
        sys.exit("lxml import failed even under `uv run --with lxml`.")
    os.environ["_DVD_BOOTSTRAPPED"] = "1"
    os.execvp("uv", ["uv", "run", "--with", "lxml", "--python", "3.12",
                     "python", os.path.abspath(__file__), *sys.argv[1:]])


# The mkdocs-material class wrapping the main page content. We diff only inside
# this element so the identical site-wide chrome (nav/header/footer/search) is
# never part of the diff.
CONTENT_XPATH = (
    "//article[contains(concat(' ', normalize-space(@class), ' '),"
    " ' md-content__inner ')]"
)

# CSS injected into every rendered diff page.
DIFF_CSS = """
ins, ins * { background: #d6f5d6 !important; text-decoration: none !important; }
del, del * { background: #ffd6d6 !important; text-decoration: line-through !important; }
ins img { outline: 3px solid #15803d; }
del img { outline: 3px solid #b91c1c; }
body.dvd-added .md-content__inner { background: linear-gradient(#f0fff4,#f0fff4); }
body.dvd-removed .md-content__inner { background: linear-gradient(#fff5f5,#fff5f5); }
.dvd-banner {
  position: sticky; top: 0; z-index: 100000;
  font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 8px 16px; color: #f8fafc; background: #0f172a;
  border-bottom: 3px solid #334155;
}
.dvd-banner a { color: #93c5fd; text-decoration: none; font-weight: 600; }
.dvd-banner code { background: rgba(255,255,255,.14); padding: 1px 6px; border-radius: 4px; }
.dvd-pill { font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
  padding: 2px 9px; border-radius: 999px; font-size: 11px; }
.dvd-pill.changed { background: #fef3c7; color: #b45309; }
.dvd-pill.added { background: #dcfce7; color: #15803d; }
.dvd-pill.removed { background: #fee2e2; color: #b91c1c; }
.dvd-legend { margin-left: auto; opacity: .85; }
.dvd-legend ins { padding: 0 4px; border-radius: 3px; }
.dvd-legend del { padding: 0 4px; border-radius: 3px; }
.dvd-nav { display: flex; align-items: center; gap: 6px; }
.dvd-nav button { font: inherit; cursor: pointer; border: 1px solid #475569;
  background: #1e293b; color: #e2e8f0; border-radius: 6px; padding: 2px 9px; }
.dvd-nav button:hover:not(:disabled) { background: #334155; }
.dvd-nav button:disabled { opacity: .4; cursor: default; }
#dvd-counter { font-variant-numeric: tabular-nums; min-width: 96px; text-align: center; }
.dvd-active-change { outline: 3px solid #f59e0b !important; outline-offset: 3px;
  border-radius: 4px; scroll-margin-top: 140px; }
"""

# Block-level content elements used to group word-level ins/del into a single
# "change" (paragraph-level granularity). Kept in sync between the Python counter
# (count_changes) and the in-page navigation script (NAV_JS).
BLOCK_SELECTOR = ("p,li,h1,h2,h3,h4,h5,h6,pre,tr,dt,dd,blockquote,"
                  "figcaption,caption,th,td,summary")
BLOCK_TAGS = set(BLOCK_SELECTOR.split(","))

# In-page navigation injected into changed pages: groups ins/del by nearest block
# ancestor (so multiple edits in one paragraph = one change), then wires the
# banner's first/prev/next controls, a live "i / N" counter, and Alt+Arrow keys.
NAV_JS = ("""
(function(){
  var BLOCK="%s";
  var root=document.querySelector('article.md-content__inner')||document.body;
  var marks=Array.prototype.slice.call(root.querySelectorAll('ins,del'));
  var groups=[];
  marks.forEach(function(m){
    var g=m.closest(BLOCK); if(!g||!root.contains(g)) g=m;
    if(groups.indexOf(g)===-1) groups.push(g);
  });
  var N=groups.length, idx=-1;
  var counter=document.getElementById('dvd-counter');
  function fmt(){return (idx<0?'—':(idx+1))+' / '+N+' change'+(N===1?'':'s');}
  function setDisabled(){
    var f=document.querySelector('[data-dvd=first]'),
        p=document.querySelector('[data-dvd=prev]'),
        n=document.querySelector('[data-dvd=next]');
    if(f)f.disabled=N===0; if(p)p.disabled=N===0||idx<=0; if(n)n.disabled=N===0||idx>=N-1;
  }
  function go(i){
    if(N===0) return;
    idx=Math.max(0,Math.min(N-1,i));
    groups.forEach(function(g){g.classList.remove('dvd-active-change');});
    var t=groups[idx]; t.classList.add('dvd-active-change');
    t.scrollIntoView({block:'center',behavior:'smooth'});
    if(counter)counter.textContent=fmt(); setDisabled();
  }
  if(counter)counter.textContent=fmt(); setDisabled();
  function bind(a,fn){var b=document.querySelector('[data-dvd='+a+']');
    if(b)b.addEventListener('click',function(e){e.preventDefault();fn();});}
  bind('first',function(){go(0);});
  bind('prev',function(){go(idx<0?0:idx-1);});
  bind('next',function(){go(idx<0?0:idx+1);});
  document.addEventListener('keydown',function(e){
    if(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;
    if(e.altKey&&e.key==='ArrowDown'){e.preventDefault();go(idx<0?0:idx+1);}
    else if(e.altKey&&e.key==='ArrowUp'){e.preventDefault();go(idx<0?0:idx-1);}
  });
})();
""" % BLOCK_SELECTOR)


# ---------------------------------------------------------------------------
# Building
# ---------------------------------------------------------------------------

def run(cmd: list[str], cwd: Path, env: dict | None = None) -> None:
    print(f"    $ {' '.join(cmd)}  (cwd={cwd})", flush=True)
    subprocess.run(cmd, cwd=cwd, check=True, env=env)


def git_short(repo: Path, ref: str) -> tuple[str, str]:
    full = subprocess.run(
        ["git", "rev-parse", ref], cwd=repo, check=True,
        capture_output=True, text=True).stdout.strip()
    return full, full[:10]


def build_ref(repo: Path, ref: str, sha: str, dest: Path) -> None:
    """Build the docs site for `sha` in an isolated worktree; copy site to dest."""
    worktrees_root = Path(tempfile.mkdtemp(prefix="docs-diff-wt-"))
    wt = worktrees_root / sha[:10]
    print(f"  • Creating worktree for {ref} ({sha[:10]}) ...", flush=True)
    run(["git", "worktree", "add", "--detach", "--force", str(wt), sha], cwd=repo)
    try:
        docs_dir = wt / "docs"
        print(f"  • Building docs for {ref} (uv run mkdocs build) ...", flush=True)
        env = dict(os.environ)
        env.pop("VIRTUAL_ENV", None)
        env.pop("_DVD_BOOTSTRAPPED", None)
        run(["uv", "run", "mkdocs", "build", "-f", "./mkdocs.yml"],
            cwd=docs_dir, env=env)
        built = docs_dir / "site"
        if not built.is_dir():
            raise RuntimeError(f"build produced no site/ for {ref}")
        if dest.exists():
            shutil.rmtree(dest)
        print(f"  • Copying site -> {dest}", flush=True)
        shutil.copytree(built, dest)
    finally:
        print(f"  • Removing worktree {wt}", flush=True)
        subprocess.run(["git", "worktree", "remove", "--force", str(wt)],
                       cwd=repo, check=False)
        shutil.rmtree(worktrees_root, ignore_errors=True)


# ---------------------------------------------------------------------------
# HTML helpers
# ---------------------------------------------------------------------------

def article_of(root):
    arts = root.xpath(CONTENT_XPATH)
    return arts[0] if arts else None


def inner_html(el) -> str:
    parts = [el.text or ""]
    for child in el:
        parts.append(lxml.html.tostring(child, encoding="unicode"))
    return "".join(parts)


def set_inner_html(el, markup: str) -> None:
    el.text = None
    for child in list(el):
        el.remove(child)
    wrapper = lxml.html.fragment_fromstring(markup, create_parent="div")
    el.text = wrapper.text
    for child in wrapper:
        el.append(child)


def rel_to_report(rel_html: str) -> str:
    """Relative href from a page back up to report.html."""
    depth = rel_html.count("/") + 1  # +1 for the site-* dir itself
    return "../" * depth + "report.html"


def count_changes(merged_markup: str) -> int:
    """Count paragraph-level changes: distinct block elements containing an
    ins/del (matching the grouping the in-page nav uses)."""
    frag = lxml.html.fragment_fromstring(merged_markup, create_parent="div")
    seen: list = []
    for mark in frag.iter("ins", "del"):
        group = mark
        for anc in mark.iterancestors():
            if anc is frag:
                break
            if anc.tag in BLOCK_TAGS:
                group = anc
                break
        if not any(group is g for g in seen):
            seen.append(group)
    return len(seen)


def banner_markup(status: str, ref_a: str, ref_b: str, back_href: str) -> str:
    legend = ('<span class="dvd-legend">'
              '<del>removed</del> <ins>added</ins></span>')
    nav = ""
    if status == "changed":
        nav = (
            '<span class="dvd-nav">'
            '<button data-dvd="first" title="Jump to first change">⤓ first</button>'
            '<button data-dvd="prev" title="Previous change (Alt+↑)">‹ prev</button>'
            '<span id="dvd-counter">—</span>'
            '<button data-dvd="next" title="Next change (Alt+↓)">next ›</button>'
            '</span>'
        )
    return (
        f'<div class="dvd-banner">'
        f'<span class="dvd-pill {status}">{status}</span>'
        f'<span>docs diff &nbsp;<code>{html.escape(ref_a)}</code> → '
        f'<code>{html.escape(ref_b)}</code></span>'
        f'{nav}'
        f'<a href="{html.escape(back_href)}">↩ back to summary</a>'
        f'{legend}</div>'
    )


def decorate_page(path: Path, status: str, merged_inner: str | None,
                  ref_a: str, ref_b: str, rel_html: str) -> None:
    """Rewrite a built page in place: inject diff CSS, a banner, and (for changed
    pages) the merged ins/del article content; tint added/removed pages."""
    root = lxml.html.parse(str(path)).getroot()

    if merged_inner is not None:
        art = article_of(root)
        if art is not None:
            set_inner_html(art, merged_inner)

    head = root.head
    if head is not None:
        style = lxml.html.fragment_fromstring(f"<style>{DIFF_CSS}</style>")
        head.append(style)

    body = root.body
    if body is not None:
        body.set("class", (body.get("class", "") + f" dvd-{status}").strip())
        banner = lxml.html.fragment_fromstring(
            banner_markup(status, ref_a, ref_b, rel_to_report(rel_html)))
        body.insert(0, banner)
        if status == "changed":
            script = lxml.html.fragment_fromstring(f"<script>{NAV_JS}</script>")
            body.append(script)

    path.write_text(
        lxml.html.tostring(root, encoding="unicode", doctype="<!DOCTYPE html>"),
        encoding="utf-8")


# ---------------------------------------------------------------------------
# Diffing
# ---------------------------------------------------------------------------

class PageResult:
    __slots__ = ("key", "rel", "status", "changes", "ins", "dele", "title", "href")

    def __init__(self, key, rel, status, changes, ins, dele, title, href):
        self.key, self.rel, self.status, self.changes = key, rel, status, changes
        self.ins, self.dele, self.title, self.href = ins, dele, title, href


def page_key(rel_html: str) -> str:
    if rel_html.endswith("/index.html"):
        return rel_html[: -len("/index.html")]
    if rel_html == "index.html":
        return "(home)"
    if rel_html.endswith(".html"):
        return rel_html[: -len(".html")]
    return rel_html


def collect(site: Path) -> dict[str, Path]:
    return {str(p.relative_to(site)): p for p in sorted(site.rglob("*.html"))}


def title_of(path: Path) -> str:
    try:
        root = lxml.html.parse(str(path)).getroot()
        t = root.find(".//title")
        if t is not None and t.text:
            return t.text.split(" - ")[0].strip()
    except Exception:
        pass
    return ""


def diff_sites(site_a: Path, site_diff: Path, ref_a: str, ref_b: str) -> list[PageResult]:
    pages_a = collect(site_a)
    pages_b = collect(site_diff)   # site_diff currently == pristine B
    results: list[PageResult] = []

    for rel in sorted(set(pages_a) | set(pages_b)):
        in_a, in_b = rel in pages_a, rel in pages_b
        key = page_key(rel)

        if in_a and in_b:
            root_a = lxml.html.parse(str(pages_a[rel])).getroot()
            root_b = lxml.html.parse(str(pages_b[rel])).getroot()
            art_a, art_b = article_of(root_a), article_of(root_b)
            inner_a = inner_html(art_a) if art_a is not None else ""
            inner_b = inner_html(art_b) if art_b is not None else ""
            if inner_a == inner_b:
                continue  # unchanged
            merged = htmldiff(inner_a, inner_b)
            decorate_page(pages_b[rel], "changed", merged, ref_a, ref_b, rel)
            results.append(PageResult(
                key, rel, "changed", count_changes(merged),
                merged.count("<ins"), merged.count("<del"),
                title_of(pages_b[rel]), f"site-diff/{rel}"))
        elif in_b:  # added
            decorate_page(pages_b[rel], "added", None, ref_a, ref_b, rel)
            results.append(PageResult(
                key, rel, "added", 0, 0, 0, title_of(pages_b[rel]), f"site-diff/{rel}"))
        else:  # removed -> decorate the A copy (its assets are co-located)
            decorate_page(pages_a[rel], "removed", None, ref_a, ref_b, rel)
            results.append(PageResult(
                key, rel, "removed", 0, 0, 0, title_of(pages_a[rel]), f"site-a/{rel}"))

    return results


# ---------------------------------------------------------------------------
# Summary report
# ---------------------------------------------------------------------------

STATUS_ORDER = {"changed": 0, "added": 1, "removed": 2}
BADGE = {
    "changed": ("changed", "#b45309", "#fef3c7"),
    "added": ("added", "#15803d", "#dcfce7"),
    "removed": ("removed", "#b91c1c", "#fee2e2"),
}


def render_summary(results: list[PageResult], meta: dict, total_pages: int) -> str:
    def badge(s):
        label, fg, bg = BADGE[s]
        return f'<span class="badge" style="color:{fg};background:{bg}">{label}</span>'

    shown = sorted(results, key=lambda r: (STATUS_ORDER[r.status], r.key))
    n = {s: sum(1 for r in results if r.status == s) for s in BADGE}

    rows = []
    for r in shown:
        if r.status == "changed":
            detail = []
            if r.ins:
                detail.append(f'<span class="plus">+{r.ins}</span>')
            if r.dele:
                detail.append(f'<span class="minus">−{r.dele}</span>')
            delta = (f'<b>{r.changes}</b> change{"" if r.changes == 1 else "s"}'
                     + (f' <span class="sub">{" ".join(detail)}</span>' if detail else ''))
        else:
            delta = "—"
        rows.append(
            f'<tr><td>{badge(r.status)}</td>'
            f'<td><a href="{html.escape(r.href)}" target="_blank">'
            f'<code>{html.escape(r.key)}</code></a>'
            f'<div class="ttl">{html.escape(r.title)}</div></td>'
            f'<td class="delta">{delta}</td></tr>')

    a, b = meta["ref_a"], meta["ref_b"]
    table = ("<table class='summary'>" + "".join(rows) + "</table>" if rows else
             "<div class='empty'>✅ No content differences found between the two builds.</div>")
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Docs visual diff: {html.escape(a["ref"])} → {html.escape(b["ref"])}</title>
<style>
* {{ box-sizing: border-box; }}
body {{ font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 0; color: #0f172a; background: #f8fafc; }}
header {{ background: #0f172a; color: #f8fafc; padding: 20px 28px; }}
header h1 {{ margin: 0 0 6px; font-size: 19px; }}
header .refs {{ font-size: 13px; opacity: .88; }}
header code {{ background: rgba(255,255,255,.12); padding: 1px 6px; border-radius: 4px; }}
main {{ max-width: 980px; margin: 0 auto; padding: 24px 20px 80px; }}
.cards {{ display: flex; gap: 12px; flex-wrap: wrap; margin: 0 0 24px; }}
.card {{ flex: 1; min-width: 110px; background: #fff; border: 1px solid #e2e8f0;
         border-radius: 10px; padding: 14px 16px; }}
.card .n {{ font-size: 26px; font-weight: 700; }}
.card .l {{ font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }}
.note {{ color: #64748b; font-size: 13px; margin: -8px 0 20px; }}
.badge {{ font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
          text-transform: uppercase; letter-spacing: .03em; }}
table.summary {{ width: 100%; border-collapse: collapse; background: #fff;
                 border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }}
table.summary td {{ padding: 9px 12px; border-top: 1px solid #f1f5f9; vertical-align: top; }}
table.summary tr:first-child td {{ border-top: 0; }}
table.summary .ttl {{ color: #64748b; font-size: 12px; margin-top: 2px; }}
.delta {{ white-space: nowrap; font-variant-numeric: tabular-nums; font-size: 12px; }}
.delta .sub {{ color: #94a3b8; margin-left: 6px; }}
.plus {{ color: #15803d; font-weight: 600; }} .minus {{ color: #b91c1c; font-weight: 600; }}
.empty {{ color: #475569; padding: 40px; text-align: center; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 10px; }}
code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
</style></head>
<body>
<header>
  <h1>Docs visual diff</h1>
  <div class="refs"><b>A</b> <code>{html.escape(a["ref"])}</code> @ <code>{a["short"]}</code>
    &nbsp;→&nbsp; <b>B</b> <code>{html.escape(b["ref"])}</code> @ <code>{b["short"]}</code></div>
  <div class="refs" style="margin-top:6px">Rendered content diff · shared nav/header/footer excluded</div>
</header>
<main>
  <div class="cards">
    <div class="card"><div class="n" style="color:#b45309">{n["changed"]}</div><div class="l">Changed</div></div>
    <div class="card"><div class="n" style="color:#15803d">{n["added"]}</div><div class="l">Added</div></div>
    <div class="card"><div class="n" style="color:#b91c1c">{n["removed"]}</div><div class="l">Removed</div></div>
    <div class="card"><div class="n">{total_pages}</div><div class="l">Total pages</div></div>
  </div>
  <p class="note">Click a page to open its fully rendered diff (real docs styling, with
    inline <span style="background:#d6f5d6">additions</span> and
    <span style="background:#ffd6d6;text-decoration:line-through">deletions</span>).</p>
  {table}
</main>
</body></html>'''


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Rich rendered diff of the Opentrons docs build between two refs.",
        formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("ref_a", nargs="?", help="Base ref (branch/tag/commit).")
    ap.add_argument("ref_b", nargs="?", help="Compare ref (branch/tag/commit).")
    ap.add_argument("--site-a", help="Pre-built site dir for A (skips building A).")
    ap.add_argument("--site-b", help="Pre-built site dir for B (skips building B).")
    ap.add_argument("-o", "--output", default="docs-visual-diff-report",
                    help="Output directory (default: ./docs-visual-diff-report).")
    args = ap.parse_args()

    repo = Path(subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], cwd=Path(__file__).resolve().parent,
        check=True, capture_output=True, text=True).stdout.strip())

    out = Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    site_a_dir = out / "site-a"
    site_diff_dir = out / "site-diff"   # starts as pristine B, decorated in place

    def prep(side: str, ref: str | None, prebuilt: str | None, dest: Path):
        if prebuilt:
            src = Path(prebuilt).resolve()
            if not src.is_dir():
                sys.exit(f"--site-{side} is not a directory: {src}")
            if src != dest:
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(src, dest)
            return {"ref": src.name, "short": "prebuilt"}
        if not ref:
            sys.exit(f"Provide ref_{side} or --site-{side}.")
        full, short = git_short(repo, ref)
        build_ref(repo, ref, full, dest)
        return {"ref": ref, "short": short}

    print(f"Repo: {repo}\nOutput: {out}\n")
    print("== Side A ==")
    meta_a = prep("a", args.ref_a, args.site_a, site_a_dir)
    print("\n== Side B ==")
    meta_b = prep("b", args.ref_b, args.site_b, site_diff_dir)

    print("\n== Diffing & rendering ==")
    total_pages = len(collect(site_diff_dir))
    results = diff_sites(site_a_dir, site_diff_dir, meta_a["ref"], meta_b["ref"])
    print(f"  {total_pages} pages compared, {len(results)} with differences.")

    report = render_summary(results, {"ref_a": meta_a, "ref_b": meta_b}, total_pages)
    report_path = out / "report.html"
    report_path.write_text(report, encoding="utf-8")

    print(f"\n✅ Report written to: {report_path}")
    print(f"   Open it with:  open {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
