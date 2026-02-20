#!/usr/bin/env python3
"""
Generate a PM-friendly report from snapshot prompts and responses, then zip it.

Creates a zip containing index.html (one page per prompt: prompt, inputs, old output vs new output
for comparison, with code blocks syntax-highlighted) plus copies of input files and response
snapshots. PM unzips and opens index.html in a browser.

Usage:
  uv run python scripts/generate_snapshot_report.py [--source snapshots/temp]
  [--compare-with snapshots/approved] [--output snapshot-report.zip]
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import yaml

# Project root is parent of scripts/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = PROJECT_ROOT / "snapshots"
PROMPTS_PATH = SNAPSHOTS_DIR / "prompts.yaml"

# Fenced code block: optional language, then content until closing ```
FENCE_RE = re.compile(r"^```(\w*)\s*\n(.*?)^```", re.MULTILINE | re.DOTALL)


def load_prompts() -> list[dict]:
    """Load prompt suite from prompts.yaml."""
    if not PROMPTS_PATH.exists():
        return []
    with open(PROMPTS_PATH) as f:
        data = yaml.safe_load(f)
    return data.get("prompts") or []


def resolve_path(relative_path: str) -> Path:
    """Resolve a path from prompts.yaml (relative to snapshots/) to an absolute path."""
    return (SNAPSHOTS_DIR / relative_path).resolve()


def escape_html(s: str) -> str:
    return html.escape(s, quote=True)


def parse_snapshot_md(content: str) -> dict:  # noqa: C901
    """
    Parse .snapshot.md into structured sections.
    Returns dict: status, reply_blocks (list of {lang, code}), protocol_content_raw, received_files, fake.
    """
    result = {
        "status": None,
        "reply_blocks": [],
        "protocol_content_raw": None,
        "received_files": None,
        "fake": None,
    }
    # Status line
    status_m = re.search(r"\*\*Status:\*\*\s*(\d+)", content)
    if status_m:
        result["status"] = status_m.group(1)
    # Sections by ##
    parts = re.split(r"\n##\s+", content)
    for part in parts[1:]:
        if "\n" not in part:
            continue
        first_line, _, body = part.partition("\n")
        header = first_line.strip().lower()
        body = body.strip()
        if header == "reply":
            # Split reply into fenced blocks and text
            pos = 0
            for m in FENCE_RE.finditer(body):
                if m.start() > pos:
                    text = body[pos : m.start()].strip()
                    if text:
                        result["reply_blocks"].append({"lang": "text", "code": text})
                result["reply_blocks"].append({"lang": m.group(1) or "text", "code": m.group(2).rstrip()})
                pos = m.end()
            if pos < len(body):
                text = body[pos:].strip()
                if text:
                    result["reply_blocks"].append({"lang": "text", "code": text})
        elif header == "protocol content":
            # Often body is ```json\n...\n```; extract inner content for highlighting
            json_m = re.match(r"^```\w*\s*\n(.*)```\s*$", body, re.DOTALL)
            result["protocol_content_raw"] = json_m.group(1).strip() if json_m else body
        elif header == "received files":
            result["received_files"] = body
    fake_m = re.search(r"\*\*fake:\*\*\s*(True|False)", content, re.I)
    if fake_m:
        result["fake"] = fake_m.group(1)
    return result


def render_snapshot_html(parsed: dict) -> str:
    """Render parsed snapshot as HTML with code blocks ready for highlight.js."""
    out = []
    if parsed.get("status") is not None:
        out.append(f'<p class="snapshot-meta"><strong>Status:</strong> {escape_html(parsed["status"])}')
        if parsed.get("fake") is not None:
            out.append(f" <strong>fake:</strong> {escape_html(parsed['fake'])}")
        out.append("</p>")
    for block in parsed.get("reply_blocks", []):
        lang = (block["lang"] or "text").strip()
        code = block["code"]
        if lang == "text":
            out.append(f'<pre class="snapshot-text">{escape_html(code)}</pre>')
        else:
            cls = f"language-{lang}" if lang else ""
            out.append(f'<pre><code class="{escape_html(cls)}">{escape_html(code)}</code></pre>')
    if parsed.get("protocol_content_raw"):
        out.append('<p class="snapshot-section-label"><strong>Protocol content</strong></p>')
        out.append('<pre><code class="language-json">' + escape_html(parsed["protocol_content_raw"]) + "</code></pre>")
    if parsed.get("received_files"):
        out.append('<p class="snapshot-section-label"><strong>Received files</strong></p>')
        out.append(f"<p>{escape_html(parsed['received_files'])}</p>")
    return "\n".join(out)


def build_index_html(
    prompts: list[dict],
    old_dir: str,
    new_dir: str,
    input_dir: str,
    old_contents: dict[str, str],
    new_contents: dict[str, str],
    input_links: dict[str, list[tuple[str, str]]],
) -> str:
    """Build index.html with one section per prompt: prompt, inputs, old output, new output (compare)."""
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sections = []
    for entry in prompts:
        pid = entry["id"]
        slug = entry["slug"]
        description = entry.get("description") or ""
        message = (entry.get("message") or "").strip()
        snapshot_name = f"{pid}_{slug}.snapshot.md"
        old_path = f"{old_dir}/{snapshot_name}"
        new_path = f"{new_dir}/{snapshot_name}"
        old_raw = old_contents.get(snapshot_name, "")
        new_raw = new_contents.get(snapshot_name, "")
        old_parsed = parse_snapshot_md(old_raw) if old_raw else None
        new_parsed = parse_snapshot_md(new_raw) if new_raw else None
        inputs = input_links.get(pid, [])

        inputs_html = ""
        if inputs:
            links = " ".join(f'<a href="{escape_html(rel_path)}">{escape_html(label)}</a>' for label, rel_path in inputs)
            inputs_html = f"<p><strong>Inputs:</strong> {links}</p>"

        old_html = render_snapshot_html(old_parsed) if old_parsed else '<p class="no-snapshot">No previous snapshot</p>'
        new_html = render_snapshot_html(new_parsed) if new_parsed else '<p class="no-snapshot">No new snapshot</p>'

        sections.append(
            f"""
<section class="prompt-block" id="prompt-{escape_html(pid)}">
  <h2>{escape_html(pid)} {escape_html(slug)}</h2>
  {f'<p class="description">{escape_html(description)}</p>' if description else ""}
  <p><strong>Prompt</strong></p>
  <pre class="prompt">{escape_html(message)}</pre>
  {inputs_html}
  <details class="output-collapse">
    <summary>Output (expand to compare old vs new)</summary>
    <div class="compare-row">
      <div class="output-col">
        <p><strong>Old output</strong> <a href="{escape_html(old_path)}">{escape_html(snapshot_name)}</a></p>
        <div class="output-body">{old_html}</div>
      </div>
      <div class="output-col">
        <p><strong>New output</strong> <a href="{escape_html(new_path)}">{escape_html(snapshot_name)}</a></p>
        <div class="output-body">{new_html}</div>
      </div>
    </div>
  </details>
</section>
"""
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpentronsAI Snapshot Report</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" crossorigin="anonymous">
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; }}
    h1 {{ margin-top: 0; }}
    .output-collapse {{ margin-top: 0.5rem; }}
    .output-collapse summary {{ cursor: pointer; font-weight: 600; }}
    .meta {{ color: #666; margin-bottom: 2rem; }}
    .prompt-block {{ border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }}
    .prompt-block h2 {{ margin-top: 0; font-size: 1.2rem; }}
    .description {{ color: #555; margin-bottom: 0.5rem; }}
    pre {{ margin: 0.5rem 0; overflow-x: auto; font-size: 0.85rem; }}
    pre.prompt {{ background: #f0f4ff; padding: 0.75rem; border-left: 3px solid #069; white-space: pre-wrap; }}
    pre.snapshot-text {{ background: #f5f5f5; padding: 0.5rem; white-space: pre-wrap; }}
    .output-body pre {{ padding: 0.5rem; }}
    .output-body pre code {{ padding: 0; }}
    .compare-row {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; }}
    @media (max-width: 768px) {{ .compare-row {{ grid-template-columns: 1fr; }} }}
    .output-col {{ border: 1px solid #eee; border-radius: 6px; padding: 0.75rem; background: #fafafa; }}
    .output-col p {{ margin: 0 0 0.5rem 0; }}
    .snapshot-meta {{ margin: 0.25rem 0; font-size: 0.9rem; color: #555; }}
    .snapshot-section-label {{ margin: 0.5rem 0 0.25rem 0; }}
    .no-snapshot {{ color: #999; font-style: italic; }}
    a {{ color: #069; }}
  </style>
</head>
<body>
  <h1>OpentronsAI Snapshot Report</h1>
  <p class="meta">Generated {date_str}. Unzip and open this file in a browser. Old = approved, New = temp.</p>
  {"".join(sections)}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" crossorigin="anonymous"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>
"""


def main() -> int:  # noqa: C901
    parser = argparse.ArgumentParser(
        description="Generate a zip with index.html report (prompt, inputs, old vs new output, syntax-highlighted) for PM."
    )
    parser.add_argument(
        "--source",
        default=str(SNAPSHOTS_DIR / "temp"),
        help="Directory for NEW snapshots (default: snapshots/temp)",
    )
    parser.add_argument(
        "--compare-with",
        default=str(SNAPSHOTS_DIR / "approved"),
        help="Directory for OLD snapshots to compare (default: snapshots/approved)",
    )
    parser.add_argument(
        "--output",
        default="snapshot-report.zip",
        help="Output zip path (default: snapshot-report.zip)",
    )
    args = parser.parse_args()

    source_dir = Path(args.source)
    compare_dir = Path(args.compare_with)
    if not source_dir.is_absolute():
        source_dir = (PROJECT_ROOT / source_dir).resolve()
    if not compare_dir.is_absolute():
        compare_dir = (PROJECT_ROOT / compare_dir).resolve()
    if not source_dir.exists():
        print(f"Error: source (new) directory not found: {source_dir}", file=sys.stderr)
        return 1
    if not compare_dir.exists():
        print(f"Error: compare-with (old) directory not found: {compare_dir}", file=sys.stderr)
        return 1

    prompts = load_prompts()
    if not prompts:
        print("Error: no prompts in prompts.yaml", file=sys.stderr)
        return 1

    old_dir = "responses/old"
    new_dir = "responses/new"
    input_dir = "inputs"
    old_contents: dict[str, str] = {}
    new_contents: dict[str, str] = {}
    input_links: dict[str, list[tuple[str, str]]] = {}

    with tempfile.TemporaryDirectory(prefix="snapshot-report-") as report_dir:
        report_path = Path(report_dir)
        (report_path / "responses" / "old").mkdir(parents=True)
        (report_path / "responses" / "new").mkdir(parents=True)
        (report_path / input_dir).mkdir(parents=True)

        for entry in prompts:
            pid = entry["id"]
            slug = entry["slug"]
            snapshot_name = f"{pid}_{slug}.snapshot.md"
            for label, dir_path, contents in (
                ("old", compare_dir, old_contents),
                ("new", source_dir, new_contents),
            ):
                src = dir_path / snapshot_name
                if src.exists():
                    content = src.read_text(encoding="utf-8")
                    contents[snapshot_name] = content
                    dest = report_path / "responses" / label / snapshot_name
                    shutil.copy2(src, dest)

        for entry in prompts:
            pid = entry["id"]
            links: list[tuple[str, str]] = []
            if "protocol_file" in entry:
                src = resolve_path(entry["protocol_file"])
                if src.exists():
                    base = src.name
                    dest_name = f"{pid}_{base}"
                    dest = report_path / input_dir / dest_name
                    shutil.copy2(src, dest)
                    links.append((base, f"{input_dir}/{dest_name}"))
            if "attachments" in entry:
                for rel in entry["attachments"]:
                    src = resolve_path(rel)
                    if src.exists():
                        base = src.name
                        dest_name = f"{pid}_{base}"
                        dest = report_path / input_dir / dest_name
                        shutil.copy2(src, dest)
                        links.append((base, f"{input_dir}/{dest_name}"))
            if links:
                input_links[pid] = links

        index_html = build_index_html(prompts, old_dir, new_dir, input_dir, old_contents, new_contents, input_links)
        (report_path / "index.html").write_text(index_html, encoding="utf-8")

        out_path = Path(args.output)
        if not out_path.is_absolute():
            out_path = PROJECT_ROOT / out_path
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in report_path.rglob("*"):
                if f.is_file():
                    arcname = f.relative_to(report_path)
                    zf.write(f, arcname)

    print(f"Report written to {out_path}")
    print("Unzip and open index.html in a browser. Old = approved, New = temp.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
