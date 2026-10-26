"""Extract Python code snippets from MkDocs Markdown source.

A deterministic line scanner rather than a Markdown-AST parser: the docs use
``pymdownx.tabbed`` (``=== "Flex"`` / ``=== "OT-2"``), whose 4-space tab
indentation a CommonMark parser reads as an indented code block. The fenced
```python``` blocks and their tab indentation are rigidly consistent across the
corpus, so scanning lines directly is both simpler and more robust here.

Each discovered block becomes a :class:`Snippet` carrying enough context
(file, 1-indexed start line, enclosing tab, nearest heading, and any
``<!-- test: ... -->`` markers) for classification and readable test IDs.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


# Opening fence: 3+ backticks, optional indent, info string starting with the
# language. We only collect python/py blocks; other languages are ignored.
_FENCE_OPEN = re.compile(r"^(?P<indent>[ \t]*)(?P<ticks>`{3,})[ \t]*(?P<lang>[A-Za-z0-9_+-]+)?")
# Tab marker: `=== "Flex"` (content-tabs). Indent is captured to know when the
# tab's content block ends (a dedent back to <= the marker's indent).
_TAB = re.compile(r'^(?P<indent>[ \t]*)===[ \t]+"(?P<label>[^"]+)"')
# ATX heading; trailing `{ #anchor ... }` attr-list is stripped for the title.
_HEADING = re.compile(r"^(?P<hashes>#{1,6})[ \t]+(?P<text>.*?)[ \t]*$")
_HEADING_ATTR = re.compile(r"\s*\{[^}]*\}\s*$")
# Inline test directive, e.g. `<!-- test: skip -->` or `<!-- test: robot=ot2 -->`.
_MARKER = re.compile(r"<!--\s*test:\s*(?P<body>.*?)\s*-->")

_PYTHON_LANGS = {"python", "py"}


@dataclass
class Snippet:
    """One extracted ```python``` block plus its Markdown context."""

    path: Path
    """Absolute path to the source ``.md`` file."""
    rel_path: str
    """Path relative to the docs root, for readable IDs."""
    start_line: int
    """1-indexed line of the opening fence."""
    code: str
    """Raw snippet source, dedented, before macro rendering."""
    tab: str | None = None
    """Enclosing content-tab label (``Flex`` / ``OT-2``), or ``None``."""
    heading: str | None = None
    """Nearest preceding heading text, for IDs."""
    markers: list[str] = field(default_factory=list)
    """Raw tokens parsed from a ``<!-- test: ... -->`` comment above the fence."""

    @property
    def location(self) -> str:
        """``rel_path:line`` — clickable, and included in failure messages."""
        return f"{self.rel_path}:{self.start_line}"


def _parse_markers(lines: list[str], fence_index: int) -> list[str]:
    """Collect test directive tokens from the comment(s) just above a fence.

    Scans upward over at most a few immediately-preceding lines, allowing one
    blank line between the comment and the fence. Tokens are whitespace- or
    comma-separated (``skip``, ``syntax-only``, ``raises``, ``continue-previous``,
    ``robot=flex``).
    """
    tokens: list[str] = []
    seen_blank = False
    for j in range(fence_index - 1, max(-1, fence_index - 4), -1):
        raw = lines[j].strip()
        if not raw:
            if seen_blank:
                break
            seen_blank = True
            continue
        match = _MARKER.search(raw)
        if match:
            body = match.group("body")
            tokens = [t for t in re.split(r"[,\s]+", body) if t]
            break
        # A non-blank, non-marker line ends the lookback.
        break
    return tokens


def extract_snippets(md_path: Path, docs_root: Path) -> list[Snippet]:
    """Extract every ```python``` snippet from a single Markdown file."""
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    snippets: list[Snippet] = []
    current_tab: str | None = None
    tab_indent: int | None = None
    heading: str | None = None

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        tab_match = _TAB.match(line)
        if tab_match:
            current_tab = tab_match.group("label")
            tab_indent = len(tab_match.group("indent"))
            i += 1
            continue

        # A dedent back to (or past) the tab marker's indent ends the tab.
        if stripped and current_tab is not None and tab_indent is not None:
            indent = len(line) - len(line.lstrip())
            if indent <= tab_indent:
                current_tab = None
                tab_indent = None

        heading_match = _HEADING.match(line)
        if heading_match:
            title = _HEADING_ATTR.sub("", heading_match.group("text")).strip()
            heading = title or None
            i += 1
            continue

        fence = _FENCE_OPEN.match(line)
        if fence:
            indent = fence.group("indent")
            ticks = fence.group("ticks")
            lang = (fence.group("lang") or "").lower()
            # Match the closing fence: same indent, same-or-more backticks, nothing else.
            close = re.compile(rf"^{re.escape(indent)}`{{{len(ticks)},}}[ \t]*$")
            body: list[str] = []
            start = i
            i += 1
            while i < n and not close.match(lines[i]):
                body.append(lines[i])
                i += 1
            # i now points at the closing fence (or EOF); advance past it.
            i += 1
            if lang in _PYTHON_LANGS:
                indent_len = len(indent)
                code = "\n".join(
                    ln[indent_len:] if ln[:indent_len].strip() == "" else ln
                    for ln in body
                )
                snippets.append(
                    Snippet(
                        path=md_path,
                        rel_path=str(md_path.relative_to(docs_root)),
                        start_line=start + 1,
                        code=code,
                        tab=current_tab,
                        heading=heading,
                        markers=_parse_markers(lines, start),
                    )
                )
            continue

        i += 1

    return snippets


def discover_snippets(roots: list[Path], docs_root: Path) -> list[Snippet]:
    """Find and extract every ```python``` snippet under the given roots.

    ``roots`` are directories (or files) to scan; ``docs_root`` is the base for
    computing relative paths in IDs. Results are sorted by path then line for
    stable, deterministic pytest parametrization ordering.
    """
    md_files: list[Path] = []
    for root in roots:
        if root.is_file():
            md_files.append(root)
        else:
            md_files.extend(sorted(root.rglob("*.md")))

    snippets: list[Snippet] = []
    for md in md_files:
        snippets.extend(extract_snippets(md, docs_root))
    snippets.sort(key=lambda s: (s.rel_path, s.start_line))
    return snippets
